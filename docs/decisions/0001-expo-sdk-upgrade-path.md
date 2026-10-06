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

| Step | Expo SDK | React Native | React  | expo-image-picker | expo-location | expo-status-bar |
| ---- | -------- | ------------ | ------ | ----------------- | ------------- | --------------- |
| Now  | 54.0.37  | 0.81.5       | 19.1.0 | ~17.0.11          | ~19.0.8       | ~3.0.9          |
| 1    | 55.0.31  | 0.83.10      | 19.2.0 | ~55.0.24          | ~55.1.14      | ~55.0.6         |
| 2    | 56.0.23  | 0.85.3       | 19.2.3 | ~56.0.25          | ~56.0.26      | ~56.0.4         |
| 3    | 57.0.26  | 0.86.3       | 19.2.3 | ~57.0.20          | ~57.0.20      | ~57.0.1         |

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

- Whether `expo-doctor` or `npm audit` surfaces a new advisory in SDK 55, 56, or
  57 that is not in the current register.
- Whether any native module used later (map, notifications, secure store) needs
  a config-plugin change at a specific SDK boundary. This is resolved per step.
