/**
 * Create/ensure the demo auth user for this app.
 *
 * Usage:
 *   1) Ensure env vars are set in your shell:
 *      - SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY
 *   2) (Optional) Use different credentials:
 *      - DEMO_EMAIL
 *      - DEMO_PASSWORD
 *   3) Run:
 *      node scripts/create-demo-user.mjs
 */

import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DEMO_EMAIL = 'demo@example.com',
  DEMO_PASSWORD = 'Demo123456',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  // 1) Check if user exists
  const { data: existing, error: findErr } = await supabaseAdmin.auth.admin.listUsers();
  if (findErr) {
    console.error('Failed to list users:', findErr);
    process.exit(1);
  }

  const match = existing.users.find(
    (u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase()
  );

  if (match) {

    console.log(`User already exists: ${match.email} (id=${match.id})`);

    // Reset password by creating a new user is not supported directly for existing users.
    // The most reliable method is to update the user and set a new password via admin API.
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(match.id, {
      password: DEMO_PASSWORD,
    });

    if (updateErr) {
      console.error('Failed to update password:', updateErr);
      process.exit(1);
    }

    // Optionally mark email as confirmed (so password grant works even if confirmations are enabled)
    // If this fails due to API constraints, the user may still be able to sign in depending on your settings.
    const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(match.id, {
      email_confirm: true,
    });

    if (confirmErr) {
      console.warn('Could not mark email as confirmed (continuing):', confirmErr.message || confirmErr);
    }

    console.log('Demo user ensured (password updated).');
    return;
  }

  // 2) Create user with provided password
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true, // ensures confirmation for demo environments
    user_metadata: {
      full_name: 'Demo User',
    },
  });

  if (createErr) {
    console.error('Failed to create demo user:', createErr);
    process.exit(1);
  }

  console.log(`Created demo user: ${created.user?.email} (id=${created.user?.id})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

