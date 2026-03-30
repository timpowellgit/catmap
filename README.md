# CatMap

CatMap is a mobile app for spotting outdoor cats, scoring unique sightings, and helping owners recover lost cats through the same local sighting network.

## Current Stack

- Expo + React Native + TypeScript
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
```

## Supabase Setup

1. Create a Supabase project.
2. Enable anonymous sign-ins in Auth.
3. Run [20260330043000_initial_sightings.sql](/Users/timpowell/repos/catmap/supabase/migrations/20260330043000_initial_sightings.sql) in the Supabase SQL editor or through the CLI.
4. Copy [.env.example](/Users/timpowell/repos/catmap/.env.example) to `.env` and add:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

See [supabase.md](/Users/timpowell/repos/catmap/docs/supabase.md) for the full setup notes.

## V0 Product Scope

- Create a cat sighting with photo, rough location, and timestamp
- Browse nearby sightings on a map or feed
- Post a missing cat
- Flag a sighting as a possible match
- Notify the owner without exposing precise public locations

## Repo Notes

- Work inside `devbox shell`
- Keep the MVP focused on vertical slices
- Avoid computer-vision features until the manual matching flow works
- The current app implements the first persisted vertical slice: create a sighting, upload the photo, and save the record through Supabase

See [docs/mvp.md](docs/mvp.md) for the current product baseline.
