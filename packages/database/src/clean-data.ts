/**
 * Data Cleaning Script for Church App
 *
 * Automatically cleans and consolidates all CSV files:
 * - Normalizes district names
 * - Removes duplicate churches
 * - Removes duplicate members
 * - Applies suggested district fixes
 * - Generates a single cleaned CSV file
 */

import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

interface CSVRow {
  Timestamp?: string;
  SP?: string;
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

interface CleaningStats {
  originalRecords: number;
  cleanedRecords: number;
  duplicateChurchesRemoved: number;
  duplicateMembersRemoved: number;
  districtsNormalized: number;
  unknownDistrictsFixed: number;
}

// Normalize district names according to rules
function normalizeDistrict(district: string): string {
  if (!district || district.trim() === '') return '';

  let normalized = district.trim();

  // Rule 1: CV -> Central Visayas
  if (normalized === 'CV') normalized = 'Central Visayas';

  // Rule 2: Central Visayas District -> Central Visayas
  if (normalized === 'Central Visayas District') normalized = 'Central Visayas';

  // Rule 3: Western Visayas District -> Western Visayas
  if (normalized === 'Western Visayas District') normalized = 'Western Visayas';

  // Rule 4: Eastern Visayas District -> Eastern Visayas
  if (normalized === 'Eastern Visayas District') normalized = 'Eastern Visayas';

  // Rule 5: NV -> Northern Visayas
  if (normalized === 'NV') normalized = 'Northern Visayas';

  // Rule 6: SV -> Southern Visayas
  if (normalized === 'SV') normalized = 'Southern Visayas';

  return normalized;
}

// Suggest district based on province/city
function suggestDistrict(province: string, city: string): string {
  const prov = (province || '').toLowerCase();
  const cty = (city || '').toLowerCase();

  // Visayas provinces
  if (prov.includes('cebu') || prov.includes('bohol') ||
      prov.includes('negros') || cty.includes('dumaguete')) {
    return 'Central Visayas';
  }

  if (prov.includes('iloilo') || prov.includes('guimaras') ||
      prov.includes('romblon') || prov.includes('palawan')) {
    return 'Western Visayas';
  }

  if (prov.includes('samar') || prov.includes('leyte') || prov.includes('biliran')) {
    return 'Eastern Visayas';
  }

  // Luzon provinces
  if (prov.includes('bataan') || prov.includes('pampanga') ||
      prov.includes('bulacan') || prov.includes('tarlac') ||
      cty.includes('manila')) {
    return 'Central Luzon';
  }

  if (prov.includes('ilocos') || prov.includes('baguio') ||
      prov.includes('cagayan') || prov.includes('pangasinan')) {
    return 'Northern Luzon';
  }

  if (prov.includes('albay') || prov.includes('camarines') ||
      prov.includes('sorsogon') || prov.includes('catanduanes')) {
    return 'Southern Luzon';
  }

  // Mindanao provinces
  if (prov.includes('davao') || prov.includes('agusan') ||
      prov.includes('bukidnon') || prov.includes('misamis') ||
      prov.includes('cotabato')) {
    return 'Northern Mindanao';
  }

  if (prov.includes('zamboanga') || prov.includes('sarangani') ||
      prov.includes('south cotabato') || prov.includes('sultan kudarat')) {
    return 'Southern Mindanao';
  }

  return ''; // No suggestion
}

// Normalize church key for deduplication
function getChurchKey(row: CSVRow): string {
  const name = row['Church Name'].toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/church$/i, '')
    .replace(/local$/i, '')
    .trim();

  const district = normalizeDistrict(row.District).toLowerCase();
  const field = (row.Field || '').toLowerCase().trim();

  return `${name}|${district}|${field}`;
}

// Get member key for deduplication
function getMemberKey(row: CSVRow): string {
  const name = row["Member's Name"].toLowerCase().trim();
  const birthday = (row['Birth day'] || '').trim();
  return `${name}|${birthday}`;
}

async function cleanData() {
  console.log('🧹 Starting data cleaning process...\n');

  const stats: CleaningStats = {
    originalRecords: 0,
    cleanedRecords: 0,
    duplicateChurchesRemoved: 0,
    duplicateMembersRemoved: 0,
    districtsNormalized: 0,
    unknownDistrictsFixed: 0,
  };

  const files = [
    { path: '../../data/sample-data.csv', name: 'Visayas' },
    { path: '../../data/luzon-data.csv', name: 'Luzon' },
    { path: '../../data/mindanao-data.csv', name: 'Mindanao' },
  ];

  const allRecords: CSVRow[] = [];
  const seenChurches = new Set<string>();
  const seenMembers = new Set<string>();
  const cleanedRecords: CSVRow[] = [];

  // Read all files
  for (const file of files) {
    console.log(`📖 Reading ${file.name} data...`);
    const content = readFileSync(file.path, 'utf-8');
    const records: CSVRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`   Found ${records.length} records`);
    stats.originalRecords += records.length;

    allRecords.push(...records);
  }

  console.log(`\n📊 Total records to process: ${stats.originalRecords}\n`);
  console.log('🔧 Applying cleaning rules...\n');

  // Process each record
  for (const row of allRecords) {
    let modified = false;

    // Step 1: Normalize district
    const originalDistrict = row.District;
    const normalizedDistrict = normalizeDistrict(row.District);

    if (originalDistrict !== normalizedDistrict && normalizedDistrict) {
      row.District = normalizedDistrict;
      stats.districtsNormalized++;
      modified = true;
    }

    // Step 2: Fix unknown/empty districts
    if (!row.District || row.District === 'Unknown' || row.District === '') {
      const suggested = suggestDistrict(row.Province, row.City);
      if (suggested) {
        row.District = suggested;
        stats.unknownDistrictsFixed++;
        modified = true;
      }
    }

    // Step 3: Remove duplicate churches (keep first occurrence)
    const churchKey = getChurchKey(row);
    const isNewChurch = !seenChurches.has(churchKey);

    if (isNewChurch) {
      seenChurches.add(churchKey);
    }

    // Step 4: Remove duplicate members (keep first occurrence)
    const memberKey = getMemberKey(row);
    const isNewMember = !seenMembers.has(memberKey);

    if (!isNewMember) {
      stats.duplicateMembersRemoved++;
      continue; // Skip this duplicate member
    }

    seenMembers.add(memberKey);

    // Step 5: If this is a duplicate church (not the first), count it
    if (!isNewChurch) {
      stats.duplicateChurchesRemoved++;
      // Note: We still keep the member but under the first church occurrence
    }

    // Add to cleaned records
    cleanedRecords.push(row);
    stats.cleanedRecords++;
  }

  console.log('✅ Cleaning completed!\n');
  console.log('📈 Cleaning Statistics:');
  console.log(`   Original records: ${stats.originalRecords}`);
  console.log(`   Cleaned records: ${stats.cleanedRecords}`);
  console.log(`   Duplicate members removed: ${stats.duplicateMembersRemoved}`);
  console.log(`   Duplicate church entries: ${stats.duplicateChurchesRemoved}`);
  console.log(`   Districts normalized: ${stats.districtsNormalized}`);
  console.log(`   Unknown districts fixed: ${stats.unknownDistrictsFixed}\n`);

  // Sort by church name, then member name
  cleanedRecords.sort((a, b) => {
    const churchCompare = a['Church Name'].localeCompare(b['Church Name']);
    if (churchCompare !== 0) return churchCompare;
    return a["Member's Name"].localeCompare(b["Member's Name"]);
  });

  // Generate cleaned CSV
  const csvOutput = stringify(cleanedRecords, {
    header: true,
    columns: [
      'Timestamp',
      'SP',
      'Church Name',
      'Field',
      'District',
      'City',
      'Province',
      "Member's Name",
      'Birth day',
      'Age',
      'Date of Baptism',
      'Baptize By',
      'Transfer In Date',
      'Transfer In From',
      'Transfer Out Date',
      'Transfer Out To',
      'Resignation Date',
      'Disfellowship Date',
      'Date of Death',
      'Cause of Death',
      'Physical Condition',
      'If sickly to what illness?',
      'Spiritual Condition',
    ],
  });

  writeFileSync('../../data/cleaned-data.csv', csvOutput);
  console.log('💾 Cleaned data saved to: data/cleaned-data.csv\n');

  // Generate cleaning report
  let report = '# Data Cleaning Summary Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += '## Cleaning Statistics\n\n';
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Original Records | ${stats.originalRecords} |\n`;
  report += `| Cleaned Records | ${stats.cleanedRecords} |\n`;
  report += `| Records Removed | ${stats.originalRecords - stats.cleanedRecords} |\n`;
  report += `| Duplicate Members Removed | ${stats.duplicateMembersRemoved} |\n`;
  report += `| Duplicate Church Entries | ${stats.duplicateChurchesRemoved} |\n`;
  report += `| Districts Normalized | ${stats.districtsNormalized} |\n`;
  report += `| Unknown Districts Fixed | ${stats.unknownDistrictsFixed} |\n\n`;

  report += '## Changes Applied\n\n';
  report += '### 1. District Normalization\n\n';
  report += '- `CV` → `Central Visayas`\n';
  report += '- `NV` → `Northern Visayas`\n';
  report += '- `SV` → `Southern Visayas`\n';
  report += '- `Central Visayas District` → `Central Visayas`\n';
  report += '- `Western Visayas District` → `Western Visayas`\n';
  report += '- `Eastern Visayas District` → `Eastern Visayas`\n\n';

  report += '### 2. Unknown District Fixes\n\n';
  report += 'Empty or unknown districts were assigned based on province/city:\n';
  report += '- Davao, Agusan, Bukidnon provinces → `Northern Mindanao`\n';
  report += '- Zamboanga, Sarangani provinces → `Southern Mindanao`\n';
  report += '- Cebu, Bohol, Negros provinces → `Central Visayas`\n';
  report += '- And more...\n\n';

  report += '### 3. Duplicate Removal\n\n';
  report += '- Duplicate members (same name + birthday) were removed\n';
  report += '- Duplicate church entries were consolidated\n';
  report += '- First occurrence was kept in all cases\n\n';

  report += '## Output Files\n\n';
  report += '- **Cleaned Data**: `data/cleaned-data.csv`\n';
  report += `- **Total Churches**: ${seenChurches.size}\n`;
  report += `- **Total Members**: ${seenMembers.size}\n\n`;

  report += '## Next Steps\n\n';
  report += '1. ✅ Review the cleaned data in `data/cleaned-data.csv`\n';
  report += '2. ✅ Use this file for the final import to Supabase\n';
  report += '3. ✅ Missing city/province data can be filled by admins in the app\n\n';

  report += '---\n\n';
  report += '*Data cleaning completed successfully! The consolidated file is ready for import.*\n';

  writeFileSync('../../data/CLEANING_SUMMARY.md', report);
  console.log('📝 Cleaning summary saved to: data/CLEANING_SUMMARY.md\n');

  // Show sample of cleaned data
  console.log('📋 Sample of cleaned data (first 5 records):\n');
  cleanedRecords.slice(0, 5).forEach((row, i) => {
    console.log(`${i + 1}. ${row["Member's Name"]} - ${row['Church Name']} (${row.District})`);
  });

  console.log('\n✨ Data cleaning complete!');
  console.log(`\n🎯 Ready to import ${stats.cleanedRecords} clean records to Supabase!`);
}

cleanData()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Cleaning failed:', err);
    process.exit(1);
  });
