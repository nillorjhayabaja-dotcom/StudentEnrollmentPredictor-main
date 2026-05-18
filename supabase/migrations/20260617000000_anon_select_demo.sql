-- Demo change: allow dashboard reads without Supabase login (anon).
-- This makes the demo app work without requiring a user session.

-- Students
alter table public.students enable row level security;
create policy "anon read students" on public.students for select to anon using (true);
create policy "anon read students (also for authenticated)" on public.students for select to authenticated using (true);

-- Enrollments
alter table public.enrollments enable row level security;
create policy "anon read enrollments" on public.enrollments for select to anon using (true);
create policy "anon read enrollments (also for authenticated)" on public.enrollments for select to authenticated using (true);

-- Activity log
alter table public.activity_log enable row level security;
create policy "anon read activity" on public.activity_log for select to anon using (true);
create policy "anon read activity (also for authenticated)" on public.activity_log for select to authenticated using (true);

