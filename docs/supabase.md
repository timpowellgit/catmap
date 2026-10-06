# Supabase Setup

CatMap uses Supabase for:

- anonymous auth, so every sighting has a stable `user_id`
- private image storage for sighting photos
- a server-side `create_sighting` Postgres function that computes public coordinates and points
- a private analysis-job queue for asynchronous vision matching

## Environment

Create a local `.env` file from `.env.example` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

The app also accepts `EXPO_PUBLIC_SUPABASE_ANON_KEY` or `EXPO_PUBLIC_SUPABASE_KEY` as fallbacks, but `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred name in this repo.

## Dashboard Configuration

1. Create a Supabase project.
2. Enable anonymous sign-ins in Auth.
3. Apply every migration in `supabase/migrations` in timestamp order. With a
   linked CLI project, use `supabase db push` after reviewing the pending plan.

The migration creates:

- `profiles`
- `sightings`
- an auth trigger to create profiles for new users
- a private `sightings` storage bucket
- storage policies scoped to `auth.uid()`
- a `create_sighting(...)` RPC that calculates points and coarse public coordinates

The hardening migration additionally:

- restricts direct sighting reads to the owner, preserving exact coordinates
- exposes active feed rows through `list_active_sightings(...)`, which omits exact coordinates
- validates location ranges, attributes, note length, timestamps, and photo-path ownership
- coarsens public coordinates to the center of a 0.005-degree cell
- atomically enqueues one private vision-analysis job for every sighting

The application does not yet run a vision model. See `docs/vision-matching.md`
for the model-independent processing boundary and benchmark requirements.

## Local Database Checks

The committed Supabase configuration supports a disposable local stack:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase stop
```

`db reset` destroys only the local development database. The database tests
verify the privacy projection, owner-only exact reads, input validation, and
atomic analysis-job enqueueing.

## Current Client Flow

1. The app ensures an anonymous session.
2. The selected photo uploads to the `sightings` bucket under a user-owned path.
3. The app calls the `create_sighting` RPC.
4. The RPC inserts the saved row and returns the persisted sighting.
