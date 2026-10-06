# ADR 0001: Expo SDK upgrade path to current stable

- Status: Accepted
- Date: 2026-10-05
- Owners: @timpowellgit
- Roadmap item: milestone M0, decision record 1, "Supported Expo SDK upgrade
  sequence and New Architecture compatibility"
- Review date: 2026-11-05

## Context

CatMap is on Expo SDK 54 (`expo@54.0.37`), React Native 0.81.5, and React
19.1.0. The current stable release is Expo SDK 57 (`expo@57.0.26`). The
production roadmap requires the app to move to the current stable SDK, one
supported SDK at a time, before release workflows, navigation, and account
lifecycle work become release-critical.

`npm audit` currently reports 11 distinct advisories (6 high, 4 moderate, 1
low) in the SDK 54 toolchain. None of them are reachable from the shipped
JavaScript bundle; they live in Node-only build tooling (Metro, Jest, the Expo
CLI, and their transitive dependencies). They are tracked in
`config/dependency-advisories.json` with exposure analysis and a review date.
Upgrading the SDK is the intended way to remove them rather than accepting
them indefinitely.

The app already sets `expo.newArchEnabled: true` in `app.json`, so it runs on
the New Architecture. React Native 0.82 and later are New Architecture only, so
this decision is about keeping the New Architecture working, not about
migrating to it.

## Options considered

1. **Stay on SDK 54.** Lowest short-term effort. Rejected: it keeps known
   advisories in the toolchain, blocks new Expo libraries, and makes the
   eventual jump larger and riskier.
2. **Jump directly from SDK 54 to SDK 57 in one pull request.** Fewer
   pull requests. Rejected: Expo only supports upgrading one SDK at a time, and
   a single jump would combine four sets of native, React, and Metro changes
   into one unreviewable, hard-to-roll-back change. This conflicts with the
   roadmap rule against combining large migrations in one pull request.
3. **Upgrade one supported SDK per pull request (54 → 55 → 56 → 57).**
   Chosen.

## Decision

Upgrade one SDK at a time in four separate, behavior-neutral pull requests,
each ending on a green CI run and a physical-device smoke test:

| Step         | Expo SDK | React Native | React  | expo-image-picker | expo-location | expo-status-bar | Status     |
| ------------ | -------- | ------------ | ------ | ----------------- | ------------- | --------------- | ---------- |
| 0 (baseline) | 54.0.37  | 0.81.5       | 19.1.0 | ~17.0.11          | ~19.0.8       | ~3.0.9          | superseded |
| 1            | 55.0.31  | 0.83.10      | 19.2.0 | ~55.0.24          | ~55.1.14      | ~55.0.6         | landed     |
| 2            | 56.0.23  | 0.85.3       | 19.2.3 | ~56.0.25          | ~56.0.26      | ~56.0.4         | skipped    |
| 3            | 57.0.26  | 0.86.3       | 19.2.3 | ~57.0.20          | ~57.0.20      | ~57.0.1         | landed     |

Versions come from each SDK's `bundledNativeModules.json`. The exact patch
versions are resolved at upgrade time by `npx expo install`, which is the
supported source of truth, not this table.

Each step follows the same procedure:

1. Branch from `main` with only SDK upgrade changes.
2. Run `npx expo install expo@^<sdk> --fix` and `npx expo install --check` to
   align every Expo-managed package to the SDK's supported versions.
3. Run `npx expo-doctor`, `npm run check`, `npm test`, and the local database
   tests.
4. Run the app on one physical iOS device and one physical Android device, and
   exercise the create-sighting flow end to end.
5. Remove any `config/dependency-advisories.json` entries the step resolves,
   and re-run the advisory policy check.
6. Re-record the resulting versions in this ADR's table before the next step.

### Progress log

- **Step 1 (SDK 54 → 55) implemented.** `expo@55.0.31`,
  `react-native@0.83.10`, `react@19.2.0`. `app.json` no longer sets
  `newArchEnabled` or `android.edgeToEdgeEnabled`, because SDK 55 removed both
  properties; New Architecture and edge-to-edge are now always on. The step
  resolved six advisories (two `image-size`, four `postcss`) and introduced
  none, so the advisory register dropped from eleven entries to five. A
  physical-device smoke test is still required before merge.
- **Step 2 (SDK 55 → 56) skipped.** `expo-doctor` reports that SDK 56 ships
  Hermes V1 `250829098.0.10`, which is affected by a known memory regression,
  and Expo recommends SDK 57 instead. Landing SDK 56 would also fail the CI
  Expo Doctor gate, so the project moved straight to SDK 57. This is a
  deliberate, documented deviation from the one-step-at-a-time rule.
- **Step 3 (SDK 55 → 57) implemented.** `expo@57.0.26`,
  `react-native@0.86.3`, `react@19.2.3`. `app.json` dropped the top-level
  `splash` property, which SDK 57 removed from the schema; the assets remain
  and splash configuration will move to the `expo-splash-screen` plugin when
  that dependency is approved. A test toolchain fix was needed: TypeScript 6
  no longer resolves the `node:test` specifier for the existing test file, so
  `@types/node` (22.x) was pinned as an explicit devDependency and the
  compiler now declares `types: ["node"]`. The step resolved one advisory
  (`sprintf-js`), leaving four. iOS builds on Xcode 27 are subject to
  ADR-0002; Android builds and runs.

## Consequences

- Four reviewable pull requests instead of one large, high-risk change.
- The app stays on a supported SDK and gains access to current Expo libraries
  needed for navigation, secure storage, notifications, and image handling.
- Each step is independently revertible by reverting its pull request and
  restoring the previous lockfile.
- Transitive advisories are expected to disappear gradually rather than all at
  once, so the advisory register is pruned as each step lands.
- Native configuration may change between SDKs. Any `app.json` or config-plugin
  change is reviewed as part of the step that requires it.

## Security and privacy impact

The upgrade removes known Node-toolchain advisories, which reduces the risk of
a malicious dependency or crafted asset affecting a developer machine or CI
runner. It does not change device runtime data collection, storage, or
transmission. The M3 requirements for server-side image sanitization and
private originals are unaffected by this decision.

## Operating cost

Low. Each step is a dependency bump plus a device smoke test. No new hosted
service or recurring cost is introduced.

## Rollback

Revert the step's pull request, including `package.json` and
`package-lock.json`, and rebuild. Because steps are sequential, roll back only
the most recent step unless the full sequence is being abandoned. Over-the-air
update compatibility is not yet a concern because release channels do not exist
before milestone M7; the runtime-version policy is defined there.

## Open questions

- Whether `expo-doctor` or `npm audit` surfaces a new advisory in SDK 58 that is
  not in the current register. SDK 55 and 57 introduced none.
- Whether the top-level `splash` migration to the `expo-splash-screen` plugin
  should happen as its own change, and whether the app needs a custom splash at
  all.
- When SDK 58 becomes stable, whether to adopt it for UIScene/iOS 27 support
  (see [ADR-0002](0002-ios-xcode-and-uiscene-constraint.md)), and whether it
  needs the same prebuild workarounds seen under Xcode 27.
- Whether any native module used later (map, notifications, secure store) needs
  a config-plugin change at a specific SDK boundary. This is resolved per step.
