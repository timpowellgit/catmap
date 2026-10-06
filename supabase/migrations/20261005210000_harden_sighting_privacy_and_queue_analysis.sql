alter table public.sightings
  add constraint sightings_exact_latitude_range
    check (exact_latitude between -90 and 90) not valid,
  add constraint sightings_exact_longitude_range
    check (exact_longitude between -180 and 180) not valid,
  add constraint sightings_location_accuracy_range
    check (location_accuracy_meters between 0 and 10000) not valid,
  add constraint sightings_notes_length
    check (char_length(notes) <= 1000) not valid,
  add constraint sightings_primary_color_allowed
    check (
      primary_color is null
      or primary_color in ('Black', 'Orange', 'Gray', 'White', 'Brown', 'Cream', 'Mixed')
    ) not valid,
  add constraint sightings_pattern_allowed
    check (
      pattern is null
      or pattern in ('Solid', 'Tabby', 'Tuxedo', 'Calico', 'Tortoiseshell', 'Spotted', 'Unknown')
    ) not valid;

drop policy if exists "Authenticated users can view active sightings"
on public.sightings;

create policy "Users can view their own exact sightings"
on public.sightings
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.snap_coordinate(value double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select (
    floor(value::numeric / 0.005) * 0.005 + 0.0025
  )::double precision;
$$;

update public.sightings
set
  public_latitude = public.snap_coordinate(exact_latitude),
  public_longitude = public.snap_coordinate(exact_longitude);

create table public.sighting_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  sighting_id uuid not null unique references public.sightings (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text check (last_error is null or char_length(last_error) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sighting_analysis_jobs_available_idx
on public.sighting_analysis_jobs (available_at, created_at)
where status in ('pending', 'failed');

alter table public.sighting_analysis_jobs enable row level security;

revoke all on public.sighting_analysis_jobs from anon, authenticated;

create or replace function public.enqueue_sighting_analysis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.sighting_analysis_jobs (sighting_id)
  values (new.id)
  on conflict (sighting_id) do nothing;

  return new;
end;
$$;

drop trigger if exists enqueue_sighting_analysis on public.sightings;

create trigger enqueue_sighting_analysis
after insert on public.sightings
for each row execute function public.enqueue_sighting_analysis();

insert into public.sighting_analysis_jobs (sighting_id)
select id
from public.sightings
on conflict (sighting_id) do nothing;

create or replace function public.create_sighting(
  photo_path text,
  observed_at timestamptz,
  exact_latitude double precision,
  exact_longitude double precision,
  location_accuracy_meters integer,
  notes text default '',
  primary_color text default null,
  pattern text default null,
  is_outdoor_confirmed boolean default true
)
returns public.sightings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_notes text := regexp_replace(trim(coalesce(notes, '')), '\s+', ' ', 'g');
  computed_points integer := 10;
  computed_rarity text;
  observed_hour integer;
  inserted_sighting public.sightings;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if photo_path is null or btrim(photo_path) = '' then
    raise exception 'photo_path is required';
  end if;

  if split_part(photo_path, '/', 1) <> current_user_id::text then
    raise exception 'photo_path must belong to the authenticated user';
  end if;

  if observed_at is null or observed_at > now() + interval '5 minutes' then
    raise exception 'observed_at is invalid';
  end if;

  if exact_latitude is null or exact_latitude not between -90 and 90 then
    raise exception 'exact_latitude is invalid';
  end if;

  if exact_longitude is null or exact_longitude not between -180 and 180 then
    raise exception 'exact_longitude is invalid';
  end if;

  if location_accuracy_meters is null
    or location_accuracy_meters not between 0 and 10000 then
    raise exception 'location_accuracy_meters is invalid';
  end if;

  if char_length(normalized_notes) > 1000 then
    raise exception 'notes must be 1000 characters or fewer';
  end if;

  if primary_color is not null
    and primary_color not in ('Black', 'Orange', 'Gray', 'White', 'Brown', 'Cream', 'Mixed') then
    raise exception 'primary_color is invalid';
  end if;

  if pattern is not null
    and pattern not in ('Solid', 'Tabby', 'Tuxedo', 'Calico', 'Tortoiseshell', 'Spotted', 'Unknown') then
    raise exception 'pattern is invalid';
  end if;

  if not coalesce(is_outdoor_confirmed, false) then
    raise exception 'Outdoor confirmation is required';
  end if;

  observed_hour := extract(hour from observed_at at time zone 'UTC');

  insert into public.profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  if pattern in ('Calico', 'Tortoiseshell') then
    computed_points := computed_points + 6;
  elsif pattern in ('Tuxedo', 'Spotted') then
    computed_points := computed_points + 4;
  end if;

  if observed_hour >= 21 or observed_hour < 6 then
    computed_points := computed_points + 3;
  end if;

  if char_length(normalized_notes) >= 40 then
    computed_points := computed_points + 2;
  end if;

  if location_accuracy_meters <= 120 then
    computed_points := computed_points + 2;
  end if;

  computed_points := computed_points + 2;
  computed_rarity := public.sighting_rarity_label(computed_points);

  insert into public.sightings (
    user_id,
    photo_path,
    observed_at,
    exact_latitude,
    exact_longitude,
    public_latitude,
    public_longitude,
    location_accuracy_meters,
    notes,
    primary_color,
    pattern,
    is_outdoor_confirmed,
    points_awarded,
    rarity_label
  )
  values (
    current_user_id,
    photo_path,
    observed_at,
    exact_latitude,
    exact_longitude,
    public.snap_coordinate(exact_latitude),
    public.snap_coordinate(exact_longitude),
    location_accuracy_meters,
    normalized_notes,
    primary_color,
    pattern,
    true,
    computed_points,
    computed_rarity
  )
  returning * into inserted_sighting;

  return inserted_sighting;
end;
$$;

revoke all on function public.create_sighting(
  text,
  timestamptz,
  double precision,
  double precision,
  integer,
  text,
  text,
  text,
  boolean
) from public, anon;

grant execute on function public.create_sighting(
  text,
  timestamptz,
  double precision,
  double precision,
  integer,
  text,
  text,
  text,
  boolean
) to authenticated;

create or replace function public.list_active_sightings(
  result_limit integer default 50,
  before_created_at timestamptz default null
)
returns table (
  id uuid,
  user_id uuid,
  photo_path text,
  observed_at timestamptz,
  public_latitude double precision,
  public_longitude double precision,
  notes text,
  primary_color text,
  pattern text,
  points_awarded integer,
  rarity_label text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sightings.id,
    sightings.user_id,
    sightings.photo_path,
    sightings.observed_at,
    sightings.public_latitude,
    sightings.public_longitude,
    sightings.notes,
    sightings.primary_color,
    sightings.pattern,
    sightings.points_awarded,
    sightings.rarity_label,
    sightings.created_at
  from public.sightings
  where sightings.status = 'active'
    and (before_created_at is null or sightings.created_at < before_created_at)
  order by sightings.created_at desc
  limit least(greatest(coalesce(result_limit, 50), 1), 100);
$$;

revoke all on function public.list_active_sightings(integer, timestamptz)
from public, anon;

grant execute on function public.list_active_sightings(integer, timestamptz)
to authenticated;
