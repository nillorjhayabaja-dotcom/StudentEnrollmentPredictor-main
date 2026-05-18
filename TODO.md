# TODO — Demo dashboard without Supabase login

- [ ] Update frontend route guard to allow entering `/_authenticated/*` without a Supabase user.
  - File: `src/routes/_authenticated.tsx`
  - Remove redirect-to-`/login` when `!user`
  - Remove demo email restriction / signOut

- [ ] Verify Supabase RLS allows dashboard reads without authentication.
  - Current state (checked): policies allow only `to authenticated`.
  - Decision: either
    - [ ] Change policies for `students`, `enrollments`, `activity_log` to `to anon` (or disable RLS), OR
    - [ ] Keep policies but ensure client is treated as authenticated (not possible without login)

- [x] Apply RLS policy changes if needed.
  - Created migration: `supabase/migrations/20260617000000_anon_select_demo.sql`

- [ ] Run/build check (`npm run build` or `bun` equivalent) and quick manual navigation check.
- [x] Note: local `npm` scripts could not be executed due to Windows PowerShell execution policy restrictions (running scripts disabled).



