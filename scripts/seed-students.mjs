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

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NUM_STUDENTS = '2000',
  ACTIVE_PERCENT = '60',
  START_INDEX = '0',
  TARGET_TOTAL = '0',
  TARGET_ENROLLMENT_YEAR = '0',
  TARGET_ENROLLMENT_SEMESTER = '0',
} = process.env;

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

const firstNames = [
  'Avery', 'Jordan', 'Riley', 'Taylor', 'Morgan', 'Casey', 'Quinn', 'Peyton',
  'Hayden', 'Cameron', 'Skyler', 'Alex', 'Jamie', 'Logan', 'Devin', 'Rowan',
  'Parker', 'Drew', 'Blake', 'Emerson', 'Sage', 'Rory', 'Reese', 'Ariel',
  'Dakota', 'Kendall', 'Rowan', 'Aiden', 'Noah', 'Liam', 'Emma', 'Olivia',
  'Ava', 'Sophia', 'Mia', 'Isabella', 'Charlotte', 'Amelia', 'Harper',
  'Evelyn', 'Abigail', 'Emily', 'Ella'
];

const lastNames = [
  'Adams', 'Baker', 'Carter', 'Diaz', 'Evans', 'Fisher', 'Garcia', 'Hughes',
  'Ibrahim', 'Jenkins', 'Kim', 'Lopez', 'Morgan', 'Nguyen', 'Owens', 'Perez',
  'Quinn', 'Reed', 'Sanders', 'Taylor', 'Upton', 'Vasquez', 'Walker', 'Xu',
  'Young', 'Zimmerman', 'Chavez', 'Diaz', 'Flores', 'Gonzalez', 'Hernandez',
  'Johnson', 'Lee', 'Martinez', 'Nelson', 'Owen', 'Parker', 'Robinson', 'Smith',
  'Turner', 'West', 'Wood'
];

const programs = [
  'Computer Science',
  'Business Administration',
  'Psychology',
  'Biology',
  'Education',
  'Nursing',
  'Engineering',
  'Accounting',
  'Information Technology',
  'Marketing',
  'Hospitality Management',
  'Environmental Science',
  'Public Administration',
  'Data Science',
  'Graphic Design',
];

const genders = ['Male', 'Female', 'Other'];
const statuses = ['Active', 'Inactive', 'Graduated', 'Dropped'];

let ACTIVE_PERCENT_NUM = Math.max(0, Math.min(100, Number(ACTIVE_PERCENT ?? 60)));
const TARGET_ACTIVE_PERCENT = Math.max(0, Math.min(100, Number(process.env.TARGET_ACTIVE_PERCENT ?? 0)));
const TARGET_ENROLLMENT_YEAR_NUM = Math.max(0, Number(TARGET_ENROLLMENT_YEAR ?? 0));
const TARGET_ENROLLMENT_SEMESTER_NUM = Math.max(0, Number(TARGET_ENROLLMENT_SEMESTER ?? 0));
const DEFAULT_ACTIVE_PERCENT = 100;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = (list) => list[randomInt(0, list.length - 1)];

const formatDate = (date) => date.toISOString().slice(0, 10);

const buildStudent = (index) => {
  const firstName = sample(firstNames);
  const lastName = sample(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const studentNo = `S${String(100000 + index).padStart(6, '0')}`;
  const gender = sample(genders);
  const program = sample(programs);
  const yearLevel = randomInt(1, 6);
  const status = Math.random() * 100 < ACTIVE_PERCENT_NUM ? 'Active' : sample(['Inactive', 'Graduated', 'Dropped']);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@demo.school`;
  const enrollmentDate = formatDate(new Date(Date.now() - randomInt(0, 4 * 365) * 24 * 60 * 60 * 1000));

  const createdAt = new Date(Date.now() - randomInt(0, 4 * 365) * 24 * 60 * 60 * 1000);
  const updatedAt = new Date(createdAt.getTime() + randomInt(0, 180) * 24 * 60 * 60 * 1000);

  return {
    student_no: studentNo,
    full_name: fullName,
    gender,
    program,
    year_level: yearLevel,
    status,
    email,
    enrollment_date: enrollmentDate,
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
  };
};

async function main() {
  let total = Number(NUM_STUDENTS);
  console.log(`Seeding requested ${total} students into Supabase...`);

  const target = Math.max(0, Number(TARGET_TOTAL ?? 0));
  if (target > 0 || TARGET_ACTIVE_PERCENT > 0 || TARGET_ENROLLMENT_YEAR_NUM > 0) {
    try {
      const { data: _d, count, error: cntErr } = await supabase.from('students').select('*', { head: true, count: 'exact' });
      if (cntErr) {
        console.log('Could not determine current student count:', cntErr.message || cntErr);
      } else {
        const current = Number(count ?? 0);
        let currentActive = 0;
        try {
          const { data: _a, count: activeCount, error: activeErr } = await supabase
            .from('students')
            .select('*', { head: true, count: 'exact' })
            .eq('status', 'Active');
          if (!activeErr) {
            currentActive = Number(activeCount ?? 0);
          } else {
            console.log('Could not determine active student count:', activeErr.message || activeErr);
          }
        } catch (err) {
          console.log('Error determining active count:', err && err.message ? err.message : err);
        }

        let neededForTarget = Math.max(0, target - current);
        let needed = neededForTarget;
        let activeNeeded = 0;
        let effectiveYear = TARGET_ENROLLMENT_YEAR_NUM;
        let effectiveSemester = TARGET_ENROLLMENT_SEMESTER_NUM;
        let effectiveActivePercent = TARGET_ACTIVE_PERCENT;
        let effectiveTargetCount = 0;

        let referenceEnrollmentCount = 0;
        try {
          const { data: enrollmentRows, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('year,semester,count')
            .order('year', { ascending: false })
            .order('semester', { ascending: false });

          if (!enrollmentError && enrollmentRows?.length) {
            const latestRow = enrollmentRows[0];
            if (!effectiveYear || !effectiveSemester) {
              effectiveYear = latestRow.year;
              effectiveSemester = latestRow.semester;
              console.log(`No target semester set; using latest enrollment reference ${effectiveYear} S${effectiveSemester}.`);
            }

            if (effectiveYear && effectiveSemester) {
              referenceEnrollmentCount = enrollmentRows
                .filter((row) => row.year === effectiveYear && row.semester === effectiveSemester)
                .reduce((sum, row) => sum + (row.count ?? 0), 0);
              console.log(`Found ${referenceEnrollmentCount} enrollments for ${effectiveYear} S${effectiveSemester}.`);
            }
          } else {
            console.log('Could not determine target enrollment count:', enrollmentError?.message || enrollmentError);
          }
        } catch (err) {
          console.log('Error reading enrollment reference data:', err && err.message ? err.message : err);
        }

        if (!effectiveActivePercent && referenceEnrollmentCount > 0) {
          effectiveActivePercent = DEFAULT_ACTIVE_PERCENT;
        }

        if (referenceEnrollmentCount > 0) {
          if (effectiveActivePercent > 0) {
            effectiveTargetCount = Math.ceil((referenceEnrollmentCount * effectiveActivePercent) / 100);
          } else {
            effectiveTargetCount = referenceEnrollmentCount;
          }
          if (effectiveTargetCount > currentActive) {
            activeNeeded = effectiveTargetCount - currentActive;
          }
        }

        if (activeNeeded > 0) {
          console.log(`Current students: ${current}, active: ${currentActive}. Need ${activeNeeded} more active students to match semester enrollments for ${effectiveYear} S${effectiveSemester}.`);
          const { data: inactiveRows, error: inactiveErr } = await supabase
            .from('students')
            .select('id')
            .neq('status', 'Active')
            .limit(activeNeeded);

          if (inactiveErr) {
            console.log('Could not fetch inactive students for reactivation:', inactiveErr.message || inactiveErr);
          } else if (inactiveRows?.length) {
            const ids = inactiveRows.map((row) => row.id);
            const { error: updateErr } = await supabase
              .from('students')
              .update({ status: 'Active' })
              .in('id', ids);
            if (updateErr) {
              console.log('Could not reactivate existing students:', updateErr.message || updateErr);
            } else {
              console.log(`Reactivated ${ids.length} existing students to Active status.`);
              activeNeeded -= ids.length;
            }
          }
        }

        if (activeNeeded > 0) {
          needed = Math.max(neededForTarget, activeNeeded);
          ACTIVE_PERCENT_NUM = 100;
        } else {
          needed = Math.max(neededForTarget, 0);
        }

        if (activeNeeded > 0) {
          console.log(`After reactivation, inserting ${needed} additional active students to reach the target.`);
        } else if (needed > 0) {
          console.log(`Need to insert ${needed} new students to satisfy the requested target total.`);
        }

        if (needed === 0 && activeNeeded === 0) {
          console.log(`No seeding required: current students ${current} already satisfy targets.`);
          return;
        }

        console.log(`Will insert ${needed} new students to satisfy targets.`);
        total = needed;
      }
    } catch (err) {
      console.log('Error determining current count, proceeding with requested NUM_STUDENTS');
    }
  }

  // Determine start index to avoid duplicate student_no values.
  let START_INDEX_NUM = Math.max(0, Number(START_INDEX ?? 0));
  try {
    const { data: last, error: lastErr } = await supabase
      .from('students')
      .select('student_no')
      .order('student_no', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastErr && last?.student_no) {
      const m = String(last.student_no).match(/S(\d+)/);
      if (m) {
        const numeric = Number(m[1]);
        const detectedIdx = Math.max(0, numeric - 100000);
        if (detectedIdx > START_INDEX_NUM) {
          START_INDEX_NUM = detectedIdx;
        }
        console.log(`Detected existing max student_no ${numeric}, using START_INDEX ${START_INDEX_NUM}`);
      }
    } else if (lastErr) {
      console.log('Student_no detection error:', lastErr.message || lastErr);
    }
  } catch (err) {
    console.log('Student_no detection threw:', err && err.message ? err.message : err);
  }

  // Fallback: try ordering by created_at if above didn't yield a valid value
  try {
    const { data: last2, error: lastErr2 } = await supabase
      .from('students')
      .select('student_no')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastErr2 && last2?.student_no) {
      const m2 = String(last2.student_no).match(/S(\d+)/);
      if (m2) {
        const numeric2 = Number(m2[1]);
        const detected2 = Math.max(0, numeric2 - 100000);
        if (detected2 > START_INDEX_NUM) {
          START_INDEX_NUM = detected2;
        }
        console.log(`Fallback detected student_no ${numeric2}, using START_INDEX ${START_INDEX_NUM}`);
      }
    } else if (lastErr2) {
      console.log('Student_no detection fallback error:', lastErr2.message || lastErr2);
    }
  } catch (err) {
    console.log('Student_no detection fallback threw:', err && err.message ? err.message : err);
  }

  const batchSize = 100;
  const errors = [];
  for (let start = 0; start < total; start += batchSize) {
    const batch = [];
    const end = Math.min(start + batchSize, total);
    for (let i = start; i < end; i += 1) {
      batch.push(buildStudent(i + 1 + START_INDEX_NUM));
    }

    const { error } = await supabase.from('students').insert(batch);
    if (error) {
      errors.push({ range: `${start + 1}-${end}`, message: error.message });
      console.error(`Batch ${start + 1}-${end} failed:`, error.message);
      break;
    }

    const progress = Math.min(end, total);
    process.stdout.write(`Inserted ${progress}/${total} students\r`);
  }

  if (errors.length === 0) {
    console.log(`\nSeed complete: ${total} students inserted.`);
  } else {
    console.error('\nSeed completed with errors:', errors);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
