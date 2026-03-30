# Supabase Setup

CatMap uses Supabase for:

- anonymous auth, so every sighting has a stable `user_id`
- private image storage for sighting photos
- a server-side `create_sighting` Postgres function that computes public coordinates and points

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
3. Run the SQL migration from `supabase/migrations/20260330043000_initial_sightings.sql`.

The migration creates:

- `profiles`
- `sightings`
- an auth trigger to create profiles for new users
- a private `sightings` storage bucket
- storage policies scoped to `auth.uid()`
- a `create_sighting(...)` RPC that calculates points and coarse public coordinates

## Current Client Flow

1. The app ensures an anonymous session.
2. The selected photo uploads to the `sightings` bucket under a user-owned path.
3. The app calls the `create_sighting` RPC.
4. The RPC inserts the saved row and returns the persisted sighting.
