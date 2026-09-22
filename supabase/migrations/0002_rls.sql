-- ritmo — Row Level Security
--
-- Tables with their own user_id: policy checks it directly.
-- Child tables without user_id: policy walks up the chain via EXISTS.
-- `exercises` is the one public table — readable by any authenticated
-- user, writable by nobody from the client (seeded via migration only).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

create policy "profiles: owner has full access"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user is created, so the
-- client never has to remember to do it after login. Tightly coupled to
-- auth, which is why it lives here instead of waiting for the "connect
-- frontend" step.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- exercises — public read, no client writes
-- ---------------------------------------------------------------------------

alter table exercises enable row level security;

create policy "exercises: readable by authenticated users"
  on exercises for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- workouts (plan)
-- ---------------------------------------------------------------------------

alter table workouts enable row level security;

create policy "workouts: owner has full access"
  on workouts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table workout_exercises enable row level security;

create policy "workout_exercises: owner has full access"
  on workout_exercises for all
  using (exists (
    select 1 from workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  ));

alter table workout_sets enable row level security;

create policy "workout_sets: owner has full access"
  on workout_sets for all
  using (exists (
    select 1 from workout_exercises
    join workouts on workouts.id = workout_exercises.workout_id
    where workout_exercises.id = workout_sets.workout_exercise_id
      and workouts.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_exercises
    join workouts on workouts.id = workout_exercises.workout_id
    where workout_exercises.id = workout_sets.workout_exercise_id
      and workouts.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- sessions (history)
-- ---------------------------------------------------------------------------

alter table sessions enable row level security;

create policy "sessions: owner has full access"
  on sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table session_exercises enable row level security;

create policy "session_exercises: owner has full access"
  on session_exercises for all
  using (exists (
    select 1 from sessions
    where sessions.id = session_exercises.session_id
      and sessions.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from sessions
    where sessions.id = session_exercises.session_id
      and sessions.user_id = auth.uid()
  ));

alter table session_sets enable row level security;

create policy "session_sets: owner has full access"
  on session_sets for all
  using (exists (
    select 1 from session_exercises
    join sessions on sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id
      and sessions.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from session_exercises
    join sessions on sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id
      and sessions.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- weight_entries
-- ---------------------------------------------------------------------------

alter table weight_entries enable row level security;

create policy "weight_entries: owner has full access"
  on weight_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- diet_day_types (plan) and children
-- ---------------------------------------------------------------------------

alter table diet_day_types enable row level security;

create policy "diet_day_types: owner has full access"
  on diet_day_types for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table diet_meal_slots enable row level security;

create policy "diet_meal_slots: owner has full access"
  on diet_meal_slots for all
  using (exists (
    select 1 from diet_day_types
    where diet_day_types.id = diet_meal_slots.day_type_id
      and diet_day_types.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from diet_day_types
    where diet_day_types.id = diet_meal_slots.day_type_id
      and diet_day_types.user_id = auth.uid()
  ));

alter table diet_meal_options enable row level security;

create policy "diet_meal_options: owner has full access"
  on diet_meal_options for all
  using (exists (
    select 1 from diet_meal_slots
    join diet_day_types on diet_day_types.id = diet_meal_slots.day_type_id
    where diet_meal_slots.id = diet_meal_options.meal_slot_id
      and diet_day_types.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from diet_meal_slots
    join diet_day_types on diet_day_types.id = diet_meal_slots.day_type_id
    where diet_meal_slots.id = diet_meal_options.meal_slot_id
      and diet_day_types.user_id = auth.uid()
  ));

alter table diet_meal_option_foods enable row level security;

create policy "diet_meal_option_foods: owner has full access"
  on diet_meal_option_foods for all
  using (exists (
    select 1 from diet_meal_options
    join diet_meal_slots on diet_meal_slots.id = diet_meal_options.meal_slot_id
    join diet_day_types on diet_day_types.id = diet_meal_slots.day_type_id
    where diet_meal_options.id = diet_meal_option_foods.option_id
      and diet_day_types.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from diet_meal_options
    join diet_meal_slots on diet_meal_slots.id = diet_meal_options.meal_slot_id
    join diet_day_types on diet_day_types.id = diet_meal_slots.day_type_id
    where diet_meal_options.id = diet_meal_option_foods.option_id
      and diet_day_types.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- diet_weekday_assignments and diet_daily_log (both have user_id directly)
-- ---------------------------------------------------------------------------

alter table diet_weekday_assignments enable row level security;

create policy "diet_weekday_assignments: owner has full access"
  on diet_weekday_assignments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table diet_daily_log enable row level security;

create policy "diet_daily_log: owner has full access"
  on diet_daily_log for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
