create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.sightings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_path text not null,
  observed_at timestamptz not null,
  exact_latitude double precision not null,
  exact_longitude double precision not null,
  public_latitude double precision not null,
  public_longitude double precision not null,
  location_accuracy_meters integer not null check (location_accuracy_meters >= 0),
  notes text not null default '',
  primary_color text,
  pattern text,
  is_outdoor_confirmed boolean not null default true,
  points_awarded integer not null default 0,
  rarity_label text not null default 'Common' check (rarity_label in ('Common', 'Uncommon', 'Rare')),
  status text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sightings_user_created_at_idx
  on public.sightings (user_id, created_at desc);

create index if not exists sightings_created_at_idx
  on public.sightings (created_at desc);

alter table public.sightings enable row level security;

create policy "Authenticated users can view active sightings"
on public.sightings
for select
to authenticated
using (status = 'active' or (select auth.uid()) = user_id);

create or replace function public.snap_coordinate(value double precision)
returns double precision
language sql
immutable
as $$
  select round(value::numeric, 3)::double precision;
$$;

create or replace function public.sighting_rarity_label(points integer)
returns text
language sql
immutable
as $$
  select case
    when points >= 20 then 'Rare'
    when points >= 16 then 'Uncommon'
    else 'Common'
  end;
$$;

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
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_notes text := regexp_replace(trim(coalesce(notes, '')), '\s+', ' ', 'g');
  computed_points integer := 10;
  computed_rarity text;
  observed_hour integer := extract(hour from observed_at at time zone 'UTC');
  inserted_sighting public.sightings;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if photo_path is null or btrim(photo_path) = '' then
    raise exception 'photo_path is required';
  end if;

  if not is_outdoor_confirmed then
    raise exception 'Outdoor confirmation is required';
  end if;

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

  if is_outdoor_confirmed then
    computed_points := computed_points + 2;
  end if;

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
    is_outdoor_confirmed,
    computed_points,
    computed_rarity
  )
  returning * into inserted_sighting;

  return inserted_sighting;
end;
$$;

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sightings',
  'sightings',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload their own sighting photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sightings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated users can read their own sighting photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sightings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated users can delete their own sighting photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sightings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
