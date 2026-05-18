import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const envPath = join(currentDir, '..', '.env');

if (existsSync(envPath)) {
  const envContents = readFileSync(envPath, 'utf8');
  for (const line of envContents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=['"]?(.*?)['"]?$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: _d, count: total, error: totalErr } = await supabase.from('students').select('*', { head: true, count: 'exact' });
  if (totalErr) {
    console.error('Error fetching total:', totalErr.message || totalErr);
    process.exit(1);
  }
  const { data: _a, count: active, error: activeErr } = await supabase.from('students').select('*', { head: true, count: 'exact' }).eq('status', 'Active');
  if (activeErr) {
    console.error('Error fetching active count:', activeErr.message || activeErr);
    process.exit(1);
  }
  console.log(`Total students: ${Number(total ?? 0)}`);
  console.log(`Active students: ${Number(active ?? 0)}`);
  const pct = Number(active ?? 0) / Math.max(1, Number(total ?? 1)) * 100;
  console.log(`Active percent: ${pct.toFixed(4)}%`);
}

main().catch((e) => { console.error(e); process.exit(1); });
