-- ritmo — initial schema
--
-- This is schema only. Row Level Security is intentionally NOT enabled
-- here — it's the next step of Fase 2, done as its own migration so
-- "shape the data" and "protect the data" aren't mixed in one change.
--
-- Naming: snake_case, plural table names, `id uuid default gen_random_uuid()`
-- everywhere for consistency with Supabase Auth's `auth.users.id`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Exercise catalog
--
-- Global, read-only reference list (the same ~38 rows already mocked in
-- exercise-catalog.ts). Not a per-user table and not the "full curated
-- catalog" we deliberately deferred in Fase 1 — just persisted IDs so
-- workout/session exercises have something stable to point back to for
-- load-progression comparisons over time.
-- ---------------------------------------------------------------------------

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null
);

-- ---------------------------------------------------------------------------
-- Workouts (the reusable plan — see workout_exercises/workout_sets)
-- ---------------------------------------------------------------------------

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  day_label text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index workouts_user_id_idx on workouts (user_id);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts (id) on delete cascade,
  -- Stable provenance link to the catalog. Nullable + SET NULL so catalog
  -- maintenance never blocks on existing workout plans; the plan keeps its
  -- own name/muscle_group/equipment below regardless of what happens here.
  exercise_id uuid references exercises (id) on delete set null,
  name text not null,
  muscle_group text not null,
  equipment text not null,
  rest_seconds integer not null default 60,
  note text not null default '',
  position integer not null
);

create index workout_exercises_workout_id_idx on workout_exercises (workout_id);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  position integer not null,
  target_reps integer not null,
  target_load_kg numeric(6, 2)
);

create index workout_sets_workout_exercise_id_idx on workout_sets (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- Sessions (what actually happened — fully snapshotted, see the
-- "load progression over time" decision: editing a workout later must
-- never change what a past session shows).
-- ---------------------------------------------------------------------------

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- RESTRICT: deleting a workout that already has session history is
  -- blocked at the database level. Archiving (workouts.archived_at) is
  -- unaffected — it's a soft flag, not a delete.
  workout_id uuid references workouts (id) on delete restrict,
  workout_name_snapshot text not null,
  status text not null check (status in ('completed', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_workout_id_idx on sessions (workout_id);

create table session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  -- Same stable provenance link as workout_exercises, used to compare a
  -- given exercise's load across sessions even if it gets renamed later.
  exercise_id uuid references exercises (id) on delete set null,
  name text not null,
  muscle_group text not null,
  equipment text not null,
  note text not null default '',
  position integer not null
);

create index session_exercises_session_id_idx on session_exercises (session_id);
create index session_exercises_exercise_id_idx on session_exercises (exercise_id);

create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references session_exercises (id) on delete cascade,
  position integer not null,
  load_kg numeric(6, 2),
  reps integer,
  is_done boolean not null default false
);

create index session_sets_session_exercise_id_idx on session_sets (session_exercise_id);

-- ---------------------------------------------------------------------------
-- Progress
-- ---------------------------------------------------------------------------

create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null,
  recorded_at date not null default current_date
);

create index weight_entries_user_id_idx on weight_entries (user_id);

-- ---------------------------------------------------------------------------
-- Diet — day types (the plan). Simpler than workouts/sessions: no
-- snapshotting here, since nobody asked for diet trend comparison yet
-- (YAGNI). If that need shows up later, mirror the workout/session pattern.
-- ---------------------------------------------------------------------------

create table diet_day_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null
);

create index diet_day_types_user_id_idx on diet_day_types (user_id);

create table diet_meal_slots (
  id uuid primary key default gen_random_uuid(),
  day_type_id uuid not null references diet_day_types (id) on delete cascade,
  name text not null,
  time text not null default '',
  position integer not null
);

create index diet_meal_slots_day_type_id_idx on diet_meal_slots (day_type_id);

create table diet_meal_options (
  id uuid primary key default gen_random_uuid(),
  meal_slot_id uuid not null references diet_meal_slots (id) on delete cascade,
  name text not null,
  estimated_kcal integer not null default 0,
  position integer not null
);

create index diet_meal_options_meal_slot_id_idx on diet_meal_options (meal_slot_id);

create table diet_meal_option_foods (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references diet_meal_options (id) on delete cascade,
  description text not null,
  position integer not null
);

create index diet_meal_option_foods_option_id_idx on diet_meal_option_foods (option_id);

-- ---------------------------------------------------------------------------
-- Diet — weekday assignment (which day type applies to Mon/Tue/...)
-- ---------------------------------------------------------------------------

create table diet_weekday_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekday_code text not null check (weekday_code in ('S', 'T', 'Q', 'Q2', 'S2', 'S3', 'D')),
  day_type_id uuid references diet_day_types (id) on delete set null,
  unique (user_id, weekday_code)
);

-- ---------------------------------------------------------------------------
-- Diet — daily log (today's completion + chosen option per meal slot).
-- Dated from day one, so "today" naturally becomes real per-day history
-- without any extra modeling — the frontend just isn't using that yet.
-- ---------------------------------------------------------------------------

create table diet_daily_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  meal_slot_id uuid not null references diet_meal_slots (id) on delete cascade,
  selected_option_id uuid references diet_meal_options (id) on delete cascade,
  is_done boolean not null default false,
  unique (user_id, log_date, meal_slot_id)
);

create index diet_daily_log_user_id_log_date_idx on diet_daily_log (user_id, log_date);
