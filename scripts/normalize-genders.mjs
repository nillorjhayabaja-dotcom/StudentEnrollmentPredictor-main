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

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BATCH_SIZE = '1000' } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('Normalizing unknown genders to Male/Female...');

  const { count: maleCount = 0 } = await supabase.from('students').select('*', { head: true, count: 'exact' }).eq('gender', 'Male');
  const { count: femaleCount = 0 } = await supabase.from('students').select('*', { head: true, count: 'exact' }).eq('gender', 'Female');
  const { count: unknownCount = 0 } = await supabase.from('students').select('*', { head: true, count: 'exact' }).not('gender', 'in', '(Male,Female)');

  const male = Number(maleCount ?? 0);
  const female = Number(femaleCount ?? 0);
  const unknown = Number(unknownCount ?? 0);

  console.log(`Counts - Male: ${male}, Female: ${female}, Unknown: ${unknown}`);
  if (unknown === 0) {
    console.log('No unknown genders found. Nothing to do.');
    return;
  }

  const pMale = (male + female) > 0 ? male / (male + female) : 0.5;
  console.log(`Assigning unknown genders with Male probability ${pMale.toFixed(3)} (based on existing distribution).`);

  const rowsRes = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .not('gender', 'in', '(Male,Female)')
    .range(0, 999999);

  if (rowsRes.error) {
    console.error('Error fetching unknown rows:', rowsRes.error.message || rowsRes.error);
    return;
  }

  const rows = rowsRes.data || [];
  const totalRows = rows.length;
  if (totalRows === 0) {
    console.log('No unknown rows to process.');
    return;
  }

  const concurrency = 50;
  let updated = 0;

  for (let i = 0; i < totalRows; i += concurrency) {
    const slice = rows.slice(i, i + concurrency);
    const promises = slice.map((r) => {
      const gender = Math.random() < pMale ? 'Male' : 'Female';
      return supabase.from('students').update({ gender }).eq('id', r.id);
    });

    const results = await Promise.all(promises);
    for (const res of results) {
      if (res.error) {
        console.error('Update error:', res.error.message || res.error);
      } else {
        updated += 1;
      }
    }
    process.stdout.write(`Updated ${updated}/${totalRows} rows\\r`);
  }

  console.log(`\nNormalization complete. Updated ${updated} rows.`);
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
