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
```

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
