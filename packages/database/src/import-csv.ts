/**
 * CSV Import Script for Church App
 *
 * This script imports the existing member data from CSV into the Supabase database.
 * Run this after creating the database schema.
 *
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * 2. Run: npx tsx src/import-csv.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { resolve } from 'path';

// Load .env from packages/database directory
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CSVRow {
  Timestamp: string;
  SP: string;
  'Church Name': string;
  Field: string;
  District: string;
  City: string;
  Province: string;
  "Member's Name": string;
  'Birth day': string;
  Age: string;
  'Date of Baptism': string;
  'Baptize By': string;
  'Transfer In Date': string;
  'Transfer In From': string;
  'Transfer Out Date': string;
  'Transfer Out To': string;
  'Resignation Date': string;
  'Disfellowship Date': string;
  'Date of Death': string;
  'Cause of Death': string;
  'Physical Condition': string;
  'If sickly to what illness?': string;
  'Spiritual Condition': string;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  try {
    // Handle various date formats from CSV
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function calculateAge(birthday: string | null): number {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function normalizeChurchName(name: string): string {
  // Normalize church names (remove extra spaces, standardize format)
  return name.trim().replace(/\s+/g, ' ');
}

async function importData(csvPath: string) {
  console.log('Reading CSV file...');
  const fileContent = readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV...');
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records`);

  // Step 1: Extract unique churches and insert them
  console.log('\n--- Step 1: Importing Churches ---');
  const churchMap = new Map<string, string>(); // name -> id
  const uniqueChurches = new Map<string, CSVRow>();

  records.forEach(row => {
    const churchKey = `${row['Church Name']}|${row.District}|${row.Field}`;
    if (!uniqueChurches.has(churchKey)) {
      uniqueChurches.set(churchKey, row);
    }
  });

  console.log(`Found ${uniqueChurches.size} unique churches`);

  for (const [key, row] of uniqueChurches.entries()) {
    const churchName = normalizeChurchName(row['Church Name']);

    const { data, error } = await supabase
      .from('churches')
      .insert({
        name: churchName,
        field: row.Field || 'Unknown',
        district: row.District || 'Unknown',
        city: row.City || null,
        province: row.Province || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Error inserting church ${churchName}:`, error);
    } else {
      churchMap.set(key, data.id);
      console.log(`✓ Inserted church: ${churchName}`);
    }
  }

  // Step 2: Import members
  console.log('\n--- Step 2: Importing Members ---');
  let successCount = 0;
  let errorCount = 0;

  for (const row of records) {
    const churchKey = `${row['Church Name']}|${row.District}|${row.Field}`;
    const churchId = churchMap.get(churchKey);

    if (!churchId) {
      console.error(`Church not found for member: ${row["Member's Name"]}`);
      errorCount++;
      continue;
    }

    const birthday = parseDate(row['Birth day']);
    const age = row.Age ? parseInt(row.Age) : calculateAge(birthday);

    // Determine member status
    let status: 'active' | 'transferred_out' | 'resigned' | 'disfellowshipped' | 'deceased' = 'active';
    if (row['Date of Death']) status = 'deceased';
    else if (row['Disfellowship Date']) status = 'disfellowshipped';
    else if (row['Resignation Date']) status = 'resigned';
    else if (row['Transfer Out To']) status = 'transferred_out';

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        church_id: churchId,
        sp: row.SP || null,
        full_name: row["Member's Name"],
        birthday: birthday || new Date().toISOString().split('T')[0],
        age: age,
        date_of_baptism: parseDate(row['Date of Baptism']),
        baptized_by: row['Baptize By'] || null,
        physical_condition: row['Physical Condition']?.toLowerCase() === 'sickly' ? 'sickly' : 'fit',
        illness_description: row['If sickly to what illness?'] || null,
        spiritual_condition: row['Spiritual Condition']?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
        status: status,
        resignation_date: parseDate(row['Resignation Date']),
        disfellowship_date: parseDate(row['Disfellowship Date']),
        date_of_death: parseDate(row['Date of Death']),
        cause_of_death: row['Cause of Death'] || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Error inserting member ${row["Member's Name"]}:`, error);
      errorCount++;
    } else {
      successCount++;

      // Step 3: Import transfer history if exists
      if (row['Transfer In From'] || row['Transfer Out To']) {
        if (row['Transfer In From']) {
          await supabase.from('transfer_history').insert({
            member_id: member.id,
            from_church: row['Transfer In From'],
            to_church: normalizeChurchName(row['Church Name']),
            to_church_id: churchId,
            transfer_date: parseDate(row['Transfer In Date']) || new Date().toISOString().split('T')[0],
            transfer_type: 'transfer_in',
          });
        }

        if (row['Transfer Out To']) {
          await supabase.from('transfer_history').insert({
            member_id: member.id,
            from_church: normalizeChurchName(row['Church Name']),
            to_church: row['Transfer Out To'],
            from_church_id: churchId,
            transfer_date: parseDate(row['Transfer Out Date']) || new Date().toISOString().split('T')[0],
            transfer_type: 'transfer_out',
          });
        }
      }
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Churches imported: ${churchMap.size}`);
  console.log(`Members imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total records processed: ${records.length}`);
}

// Run the import
const csvPath = process.argv[2] || '../../../data/sample-data.csv';
importData(csvPath)
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  });
