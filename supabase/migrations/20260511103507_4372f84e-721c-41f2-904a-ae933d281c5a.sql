
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "users view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Trigger to auto-create profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text not null unique,
  full_name text not null,
  gender text not null check (gender in ('Male','Female','Other')),
  program text not null,
  year_level int not null check (year_level between 1 and 6),
  status text not null default 'Active' check (status in ('Active','Inactive','Graduated','Dropped')),
  email text,
  enrollment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.students enable row level security;
create policy "auth read students" on public.students for select to authenticated using (true);
create policy "auth insert students" on public.students for insert to authenticated with check (true);
create policy "auth update students" on public.students for update to authenticated using (true);
create policy "auth delete students" on public.students for delete to authenticated using (true);

create index students_program_idx on public.students(program);
create index students_enrollment_date_idx on public.students(enrollment_date);

-- Enrollments (aggregated history for forecasting)
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  semester int not null check (semester in (1,2)),
  program text not null,
  count int not null check (count >= 0),
  created_at timestamptz not null default now(),
  unique (year, semester, program)
);
alter table public.enrollments enable row level security;
create policy "auth read enrollments" on public.enrollments for select to authenticated using (true);
create policy "auth insert enrollments" on public.enrollments for insert to authenticated with check (true);
create policy "auth update enrollments" on public.enrollments for update to authenticated using (true);
create policy "auth delete enrollments" on public.enrollments for delete to authenticated using (true);

-- Activity log
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.activity_log enable row level security;
create policy "auth read activity" on public.activity_log for select to authenticated using (true);
create policy "auth insert activity" on public.activity_log for insert to authenticated with check (true);
create index activity_log_created_idx on public.activity_log(created_at desc);
