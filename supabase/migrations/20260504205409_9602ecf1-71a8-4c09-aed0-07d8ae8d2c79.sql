
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end; $$;

-- User preferences
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tags jsonb not null default '[]'::jsonb,
  controls jsonb not null default '{"speed":"medium","tone":"calm","detail":"standard","chunkSize":"short"}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
create policy "own prefs all" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions (transformed content)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  source_text text not null,
  outputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "own sessions all" on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quiz results
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  score int not null,
  total int not null,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.quiz_results enable row level security;
create policy "own quiz all" on public.quiz_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Interaction events
create table public.interaction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.interaction_events enable row level security;
create policy "own events all" on public.interaction_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Assignments + steps
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.assignments enable row level security;
create policy "own assignments all" on public.assignments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.assignment_steps (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position int not null default 0,
  title text not null,
  estimate_minutes int default 10,
  done boolean not null default false,
  remind_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.assignment_steps enable row level security;
create policy "own steps all" on public.assignment_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
