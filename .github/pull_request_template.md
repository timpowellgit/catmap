## What changed

<!-- One focused change. Describe the behavior change, not the file list. -->

## Why

<!-- The problem this solves or the roadmap milestone it advances. -->

## How it was tested

<!-- Commands run, and any physical-device checks. -->

- [ ] `npm run check`
- [ ] `npm test`
- [ ] Database tests (`npx supabase db reset && npx supabase test db`) if `supabase/` changed
- [ ] `npx expo-doctor` if dependencies or `app.json` changed

## Risk and rollback

<!-- What can break, and how to undo this safely. -->

## Checklist

- [ ] The change is focused and does not bundle unrelated work.
- [ ] Tests cover the new or changed behavior.
- [ ] Docs are updated when behavior changes.
- [ ] No secrets, credentials, or `.env` files are included.
- [ ] Migrations are reviewed, and generated database types are regenerated if the schema changed.
- [ ] Any new production dependency is confirmed and license-checked.
- [ ] No unrelated `package-lock.json` drift.
