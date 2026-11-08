-- LarpParty core schema.
--
-- Shape of the system:
--   * Browsers read rooms/players/player_private directly (RLS-filtered) and
--     subscribe to changes through Supabase Realtime.
--   * Browsers NEVER write. All writes go through Next.js server actions using
--     the service-role key, which bypasses RLS. That is why there are no
--     insert/update/delete policies below.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.rooms (
  id              uuid primary key default gen_random_uuid(),
  code            text not null check (code ~ '^[A-Z]{4}$'),
  game_slug       text not null,
  status          text not null default 'lobby'
                  check (status in ('lobby', 'playing', 'finished', 'closed')),
  settings        jsonb not null default '{}'::jsonb,
  public_state    jsonb,
  -- Optimistic concurrency: every state write bumps this. A writer that read
  -- version N may only write if the row is still at version N.
  version         integer not null default 0,
  host_player_id  uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A code is unique among rooms that are not closed. Old rooms get closed when
-- new rooms are created (see createRoom), which frees their codes.
create unique index rooms_code_open_idx on public.rooms (code) where status <> 'closed';

create table public.players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 20),
  is_host    boolean not null default false,
  connected  boolean not null default true,
  joined_at  timestamptz not null default now(),
  unique (room_id, user_id)
);

create unique index players_room_nickname_idx on public.players (room_id, lower(nickname));
create index players_user_idx on public.players (user_id);

alter table public.rooms
  add constraint rooms_host_player_fk
  foreign key (host_player_id) references public.players (id) on delete set null;

-- Private state lives in its own table because RLS works on rows, not columns.
-- One row per player; only that player's auth user can read it.
create table public.player_private (
  player_id   uuid primary key references public.players (id) on delete cascade,
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create index player_private_room_idx on public.player_private (room_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.player_private enable row level security;

-- security definer so the players policy can call it without recursing into
-- its own RLS check.
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;

create policy "members read their room"
  on public.rooms for select to authenticated
  using (public.is_room_member(id));

create policy "members read players in their room"
  on public.players for select to authenticated
  using (public.is_room_member(room_id));

create policy "players read only their own private state"
  on public.player_private for select to authenticated
  using (user_id = auth.uid());

-- Defense in depth: clients only ever read.
revoke insert, update, delete, truncate on public.rooms, public.players, public.player_private from anon, authenticated;
revoke all on public.rooms, public.players, public.player_private from anon;
grant select on public.rooms, public.players, public.player_private to authenticated;
grant all on public.rooms, public.players, public.player_private to service_role;

-- ---------------------------------------------------------------------------
-- Atomic state write
-- ---------------------------------------------------------------------------

-- Writes a room's public state, status and every player's private state in one
-- transaction, guarded by the optimistic version check.
-- Returns the new version, or null if someone else wrote first (caller retries).
create or replace function public.apply_room_state(
  p_room_id uuid,
  p_expected_version integer,
  p_status text,
  p_public jsonb,
  p_private jsonb  -- { "<player id>": <state>, ... }, or null to leave private rows alone
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_version integer;
begin
  update public.rooms
     set public_state = p_public,
         status       = p_status,
         version      = version + 1,
         updated_at   = now()
   where id = p_room_id
     and version = p_expected_version
  returning version into v_new_version;

  if v_new_version is null then
    return null;
  end if;

  if p_private is not null then
    insert into public.player_private (player_id, room_id, user_id, state, updated_at)
    select p.id, p_room_id, p.user_id, e.value, now()
      from jsonb_each(p_private) as e
      join public.players p on p.id = (e.key)::uuid and p.room_id = p_room_id
    on conflict (player_id) do update
       set state = excluded.state,
           updated_at = excluded.updated_at
     -- Skip no-op writes so unchanged players don't get a realtime event.
     where public.player_private.state is distinct from excluded.state;
  end if;

  return v_new_version;
end;
$$;

revoke all on function public.apply_room_state(uuid, integer, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.apply_room_state(uuid, integer, text, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.rooms, public.players, public.player_private;
