# ADR 0002: iOS 27 / UIScene build constraint and Xcode pinning

- Status: Accepted
- Date: 2026-10-06
- Owners: @timpowellgit
- Related: [ADR-0001](0001-expo-sdk-upgrade-path.md)
- Review date: 2027-01-06, or when Expo SDK 58 reaches stable

## Context

The iOS 27 SDK requires apps to adopt the UIKit scene lifecycle. An app built
with the iOS 27 SDK that still uses the legacy app lifecycle aborts at launch:

```
Application failed to launch: UIScene life cycle is required for apps built
with this SDK. (EXC_BREAKPOINT / SIGTRAP)
```

This was reproduced during the SDK 55 verification on an iOS 27 simulator with
Expo SDK 55 (`react-native@0.83.10`) and Xcode 27. The native build and install
succeed; only the launch fails.

Inspecting the official `expo-template-bare-minimum` packages shows where the
fix landed:

| Expo SDK | Template version | iOS lifecycle                                        |
| -------- | ---------------- | ---------------------------------------------------- |
| 55       | 55.0.43          | legacy `window`, no `UIApplicationSceneManifest`     |
| 56       | 56.0.37          | legacy `window`, no `UIApplicationSceneManifest`     |
| 57       | 57.0.28          | legacy `window`, no `UIApplicationSceneManifest`     |
| 58       | 58.0.14          | `SceneDelegate.swift` + `UIApplicationSceneManifest` |

SDK 58's generated `AppDelegate` states that the window is created and React
Native is started by `SceneDelegate` "under the scene-based life cycle
(required by the iOS 27 SDK)". React Native core 0.83 and 0.87 contain no scene
lifecycle adoption, and the Expo backport to SDK 57 (expo/expo#50026) is closed
and not merged. `expo` publishes `57.0.26` as `latest` and `58.0.5` as `next`.

## Decision

1. Build iOS with **Xcode 26 (iOS 26 SDK)**, not Xcode 27, for Expo SDK 55
   through 57.
2. Continue the SDK upgrade path one supported SDK at a time (55 → 56 → 57) per
   ADR-0001. Those steps do not provide iOS 27 support and are taken for their
   other benefits only.
3. Do not adopt Expo SDK 58 until it is stable and the 55 → 57 path is
   complete. SDK 58 is the first SDK that adopts the scene lifecycle and is the
   intended fix for building and running on Xcode 27 / iOS 27.

## Consequences

- iOS development and CI must pin Xcode 26 for SDK 55 through 57.
- iOS 27 simulator and device testing is not possible on an Xcode 27-only
  machine until SDK 58. Xcode 26 is expected to avoid the launch assertion
  because the check is tied to the SDK an app is built against; this has not
  yet been verified on this project because Xcode 26 is not installed here.
- The Xcode 27-specific workarounds discovered during the SDK 55 device
  verification — building React Native from source because CocoaPods does not
  follow the Maven redirect for the prebuilt core, and raising pod deployment
  targets to 15.1 — are not expected to be needed under Xcode 26. They remain
  uncommitted and are captured here for the eventual SDK 58 migration.
- Android is unaffected and continues to build and run under the current JDK
  17 and Android SDK.

## Alternatives considered

1. **Jump to SDK 58 beta now.** Rejected for production safety: it is a
   pre-release, and it skips three supported steps against ADR-0001.
2. **A community custom `SceneDelegate` workaround** (expo/expo#50179).
   Rejected as unofficial and fragile against React Native internals.

## Rollback

Not applicable; this pins a build toolchain rather than changing runtime code.
The Xcode pin is revisited when SDK 58 becomes stable.

## Open questions

- The exact Xcode 26.x version required, and whether SDK 56 or 57 add any other
  Xcode-version requirements.
- Whether SDK 58 reaches stable before an App Store submission that requires
  the iOS 27 SDK, and whether the migration to 58 needs the same prebuild
  workarounds seen under Xcode 27.
