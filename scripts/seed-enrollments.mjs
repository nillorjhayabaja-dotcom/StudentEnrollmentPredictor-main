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
  console.error('Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const programs = [
  'Computer Science',
  'Business Administration',
  'Psychology',
  'Biology',
  'Education',
  'Nursing',
  'Engineering',
  'Marketing',
  'Information Technology',
  'Graphic Design',
];

const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const semesters = [1, 2];

const baseProgramScale = {
  'Computer Science': 420,
  'Business Administration': 360,
  Psychology: 300,
  Biology: 280,
  Education: 240,
  Nursing: 260,
  Engineering: 380,
  Marketing: 220,
  'Information Technology': 340,
  'Graphic Design': 180,
};

const weekday = (value) => Math.round(value);

const randomVariance = () => Math.floor(Math.random() * 35) - 15;

const buildEnrollments = () => {
  const rows = [];
  for (const program of programs) {
    const base = baseProgramScale[program];
    for (const year of years) {
      for (const semester of semesters) {
        const yearIndex = year - years[0];
        const trend = base + yearIndex * 18;
        const season = semester === 1 ? 1.08 : 0.92;
        const noise = randomVariance();
        const count = Math.max(20, Math.round(trend * season + noise));

        rows.push({
          year,
          semester,
          program,
          count,
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  return rows;
};

async function main() {
  const rows = buildEnrollments();
  console.log(`Seeding ${rows.length} enrollment records for forecasting...`);

  const batchSize = 20;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('enrollments').upsert(batch, {
      onConflict: ['year', 'semester', 'program'],
    });
    if (error) {
      console.error('Failed to seed enrollments:', error.message);
      process.exit(1);
    }
    process.stdout.write(`Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length} records\r`);
  }

  console.log(`\nEnrollment seed complete: ${rows.length} records inserted or updated.`);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
