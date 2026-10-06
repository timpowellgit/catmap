begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_table(
  'public',
  'sighting_analysis_jobs',
  'vision analysis jobs are persisted outside the client API'
);

select col_is_pk(
  'public',
  'sighting_analysis_jobs',
  'id',
  'analysis jobs have a stable primary key'
);

select col_is_unique(
  'public',
  'sighting_analysis_jobs',
  'sighting_id',
  'each sighting has at most one analysis job'
);

select has_trigger(
  'public',
  'sightings',
  'enqueue_sighting_analysis',
  'new sightings enqueue vision analysis'
);

select has_function(
  'public',
  'list_active_sightings',
  array['integer', 'timestamp with time zone'],
  'the privacy-safe feed function exists'
);

select is(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.list_active_sightings(integer,timestamp with time zone)'::regprocedure
  ),
  true,
  'the feed function owns its explicit privacy projection'
);

select is(
  (
    select proargnames[3:14]::text
    from pg_proc
    where oid = 'public.list_active_sightings(integer,timestamp with time zone)'::regprocedure
  ),
  array[
      'id',
      'user_id',
      'photo_path',
      'observed_at',
      'public_latitude',
      'public_longitude',
      'notes',
      'primary_color',
      'pattern',
      'points_awarded',
      'rarity_label',
      'created_at'
    ]::text[]::text,
  'the feed cannot return exact coordinates or location accuracy'
);

select is(
  public.snap_coordinate(43.654321),
  43.6525::double precision,
  'positive coordinates are mapped to a 0.005-degree cell center'
);

select is(
  public.snap_coordinate(-79.382456),
  -79.3825::double precision,
  'negative coordinates are mapped to a 0.005-degree cell center'
);

select policies_are(
  'public',
  'sightings',
  array['Users can view their own exact sightings'],
  'direct exact-coordinate reads are owner-only'
);

insert into auth.users (id, email)
values ('11111111-1111-1111-1111-111111111111', 'sighting-test@example.invalid');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

select lives_ok(
  $$
    select public.create_sighting(
      '11111111-1111-1111-1111-111111111111/cat.jpg',
      now() - interval '1 minute',
      43.654321,
      -79.382456,
      25,
      'Healthy orange tabby seen beside the community garden.',
      'Orange',
      'Tabby',
      true
    )
  $$,
  'an authenticated user can create a valid sighting'
);

select is(
  (select count(*) from public.sightings),
  1::bigint,
  'the owner can read their exact sighting'
);

select is(
  (select count(*) from public.list_active_sightings()),
  1::bigint,
  'authenticated users can read the privacy-safe feed'
);

select throws_ok(
  $$
    select public.create_sighting(
      '22222222-2222-2222-2222-222222222222/cat.jpg',
      now(),
      43.65,
      -79.38,
      25
    )
  $$,
  'P0001',
  'photo_path must belong to the authenticated user',
  'sightings cannot reference another user''s photo path'
);

reset role;

select is(
  (select count(*) from public.sighting_analysis_jobs),
  1::bigint,
  'creating a sighting atomically creates one analysis job'
);

select * from finish();

rollback;
