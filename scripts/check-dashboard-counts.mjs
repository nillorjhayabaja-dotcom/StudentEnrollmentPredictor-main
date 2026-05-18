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
    if (!process.env[key]) process.env[key] = value;
  }
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const studentsRes = await supabase.from('students').select('id,status,gender', { count: 'exact' }).range(0, 99999);
  if (studentsRes.error) {
    console.error('students error', studentsRes.error.message);
    process.exit(1);
  }
  const enrollmentsRes = await supabase.from('enrollments').select('year,count', { count: 'exact' }).order('year', { ascending: false });
  if (enrollmentsRes.error) {
    console.error('enrollments error', enrollmentsRes.error.message);
    process.exit(1);
  }

  const students = studentsRes.data ?? [];
  console.log('Full student rows fetched:', students.length);
  console.log('Full student count metadata:', studentsRes.count);
  const active = students.filter((s) => s.status === 'Active').length;
  const maleFemaleActive = students.filter((s) => s.status === 'Active' && (s.gender === 'Male' || s.gender === 'Female')).length;
  const unknownActive = students.filter((s) => s.status === 'Active' && !(s.gender === 'Male' || s.gender === 'Female')).length;
  console.log('Active total:', active);
  console.log('Active male/female:', maleFemaleActive);
  console.log('Active unknown/non-M/F:', unknownActive);
  console.log('Enrollment counts by year:');
  (enrollmentsRes.data ?? []).forEach((row) => console.log(row.year, row.count));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
