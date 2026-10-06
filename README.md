# CatMap

CatMap is a mobile app for spotting outdoor cats, scoring unique sightings, and helping owners recover lost cats through the same local sighting network.

## Current Stack

- Expo + React Native + TypeScript
- Supabase Auth, Postgres, and private object storage
- DevBox for local shell setup
- npm for package management

## Getting Started

```bash
devbox shell
npm install
npm start
```

Useful commands:

```bash
npm run check
npm run lint
npm run test
npm run typecheck
npm run format
npm run audit:policy
```

## Continuous Integration

Every pull request and push to `main` runs the workflow in
[.github/workflows/ci.yml](.github/workflows/ci.yml):

- formatting, linting, and type checking (`npm run check`)
- unit tests (`npm test`)
- Expo Doctor (`npx expo-doctor@1.20.4`)
- the dependency advisory policy (`npm run audit:policy`)
- local database migrations and pgTAP security tests
- secret scanning and dependency review

No CI job needs production credentials or calls a paid external provider.

Known npm advisories are tracked with an owner, exposure analysis, mitigation,
and review date in
[config/dependency-advisories.json](config/dependency-advisories.json).
`npm run audit:policy` fails when an advisory is unreviewed, when a tracked
entry no longer applies, or when a review date has passed.

## Supabase Setup

1. Create a Supabase project.
2. Enable anonymous sign-ins in Auth.
3. Apply all files in [supabase/migrations](supabase/migrations) in timestamp order.
4. Copy [.env.example](.env.example) to `.env` and add:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

See [supabase.md](docs/supabase.md) for setup and local database test commands.

## V0 Product Scope

- Create a cat sighting with photo, rough location, and timestamp
- Browse nearby sightings on a map or feed
- Post a missing cat
- Flag a sighting as a possible match
- Notify the owner without exposing precise public locations

## Repo Notes

- Work inside `devbox shell`
- Keep the MVP focused on vertical slices
- Keep computer-vision matches advisory, benchmarked, and subject to human confirmation
- The current app implements the first persisted vertical slice: create a sighting, upload the photo, and save the record through Supabase

See [docs/mvp.md](docs/mvp.md) for the current product baseline.
See [docs/vision-matching.md](docs/vision-matching.md) for the planned open-set cat-matching architecture.
See [docs/production-roadmap.md](docs/production-roadmap.md) for the sequenced path to a secure, AI-assisted production release.
See [docs/decisions/](docs/decisions) for accepted architecture decisions, starting with the [Expo SDK upgrade path](docs/decisions/0001-expo-sdk-upgrade-path.md).
