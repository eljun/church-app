/**
 * Data Analysis Script for Church App
 *
 * Analyzes all CSV files to identify:
 * - Duplicate churches
 * - Duplicate members
 * - District inconsistencies
 * - Missing/unknown values
 * - Similar church names that should be merged
 */

import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
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

interface ChurchInfo {
  name: string;
  field: string;
  district: string;
  city: string;
  province: string;
  memberCount: number;
  sources: string[];
}

interface DuplicateMember {
  name: string;
  birthday: string;
  churches: string[];
  sources: string[];
}

// Normalize church name for comparison
function normalizeChurchName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/church$/i, '')
    .replace(/local$/i, '')
    .trim();
}

// Normalize district names according to rules
function normalizeDistrict(district: string): string {
  if (!district || district.trim() === '') return 'Unknown';

  let normalized = district.trim();

  // Rule 1: CV -> Central Visayas
  if (normalized === 'CV') {
    normalized = 'Central Visayas';
  }

  // Rule 2: Central Visayas District -> Central Visayas
  if (normalized === 'Central Visayas District') {
    normalized = 'Central Visayas';
  }

  // Rule 3: Western Visayas District -> Western Visayas
  if (normalized === 'Western Visayas District') {
    normalized = 'Western Visayas';
  }

  // Rule 4: Eastern Visayas District -> Eastern Visayas
  if (normalized === 'Eastern Visayas District') {
    normalized = 'Eastern Visayas';
  }

  // Rule 5: NV -> Northern Visayas (assumption)
  if (normalized === 'NV') {
    normalized = 'Northern Visayas';
  }

  // Rule 6: SV -> Southern Visayas (assumption)
  if (normalized === 'SV') {
    normalized = 'Southern Visayas';
  }

  return normalized;
}

// Calculate similarity score between two strings
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function analyzeData() {
  console.log('🔍 Starting data analysis...\n');

  const files = [
    { path: '../../data/sample-data.csv', name: 'Visayas' },
    { path: '../../data/luzon-data.csv', name: 'Luzon' },
    { path: '../../data/mindanao-data.csv', name: 'Mindanao' },
  ];

  const allRecords: { row: CSVRow; source: string }[] = [];
  const churchMap = new Map<string, ChurchInfo>();
  const memberMap = new Map<string, DuplicateMember>();

  // Read all files
  for (const file of files) {
    console.log(`📖 Reading ${file.name} data...`);
    const content = readFileSync(file.path, 'utf-8');
    const records: CSVRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`   Found ${records.length} records\n`);

    records.forEach(row => {
      allRecords.push({ row, source: file.name });

      // Track churches
      const churchKey = `${normalizeChurchName(row['Church Name'])}|${row.District}|${row.Field}`;
      if (!churchMap.has(churchKey)) {
        churchMap.set(churchKey, {
          name: row['Church Name'],
          field: row.Field,
          district: row.District,
          city: row.City,
          province: row.Province,
          memberCount: 0,
          sources: [],
        });
      }
      const church = churchMap.get(churchKey)!;
      church.memberCount++;
      if (!church.sources.includes(file.name)) {
        church.sources.push(file.name);
      }

      // Track members for duplicates
      const memberKey = `${row["Member's Name"].toLowerCase().trim()}|${row['Birth day']}`;
      if (!memberMap.has(memberKey)) {
        memberMap.set(memberKey, {
          name: row["Member's Name"],
          birthday: row['Birth day'],
          churches: [],
          sources: [],
        });
      }
      const member = memberMap.get(memberKey)!;
      const churchName = row['Church Name'];
      if (!member.churches.includes(churchName)) {
        member.churches.push(churchName);
      }
      if (!member.sources.includes(file.name)) {
        member.sources.push(file.name);
      }
    });
  }

  console.log('📊 Analysis Summary:');
  console.log(`   Total records: ${allRecords.length}`);
  console.log(`   Unique churches: ${churchMap.size}`);
  console.log(`   Unique members: ${memberMap.size}\n`);

  // Generate reports
  let report = '# Church Data Cleaning Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Records: ${allRecords.length}\n`;
  report += `- Unique Churches: ${churchMap.size}\n`;
  report += `- Unique Members: ${memberMap.size}\n\n`;

  // 1. Analyze Districts
  report += '## 1. District Analysis\n\n';
  const districtCounts = new Map<string, { original: string; normalized: string; count: number }>();

  allRecords.forEach(({ row }) => {
    const original = row.District || 'Empty/Unknown';
    const normalized = normalizeDistrict(row.District);
    const key = original;

    if (!districtCounts.has(key)) {
      districtCounts.set(key, { original, normalized, count: 0 });
    }
    districtCounts.get(key)!.count++;
  });

  report += '| Original District | Normalized District | Count | Action |\n';
  report += '|------------------|-------------------|-------|--------|\n';

  Array.from(districtCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([key, data]) => {
      const action = data.original !== data.normalized ? '✏️ Rename' : '✅ Keep';
      report += `| ${data.original} | ${data.normalized} | ${data.count} | ${action} |\n`;
    });

  report += '\n';

  // 2. Find duplicate/similar churches
  report += '## 2. Duplicate & Similar Churches\n\n';

  const churches = Array.from(churchMap.entries());
  const similarChurches: Array<{ church1: string; church2: string; similarity: number }> = [];

  for (let i = 0; i < churches.length; i++) {
    for (let j = i + 1; j < churches.length; j++) {
      const [key1, info1] = churches[i];
      const [key2, info2] = churches[j];

      const name1 = normalizeChurchName(info1.name);
      const name2 = normalizeChurchName(info2.name);

      const sim = similarity(name1, name2);

      // Flag if similarity > 70% or same name different district
      if (sim > 0.7 || (name1 === name2 && info1.district !== info2.district)) {
        similarChurches.push({
          church1: `${info1.name} (${info1.district}, ${info1.field})`,
          church2: `${info2.name} (${info2.district}, ${info2.field})`,
          similarity: sim,
        });
      }
    }
  }

  if (similarChurches.length > 0) {
    report += '### Potentially Duplicate Churches (>70% similarity)\n\n';
    report += '| Church 1 | Church 2 | Similarity | Action Needed |\n';
    report += '|----------|----------|------------|---------------|\n';

    similarChurches
      .sort((a, b) => b.similarity - a.similarity)
      .forEach(item => {
        const simPercent = (item.similarity * 100).toFixed(1);
        report += `| ${item.church1} | ${item.church2} | ${simPercent}% | 🔍 Review & decide |\n`;
      });

    report += '\n';
  } else {
    report += 'No duplicate churches found.\n\n';
  }

  // 3. Churches with unknown/missing data
  report += '## 3. Churches with Missing Data\n\n';

  const churchesWithIssues: ChurchInfo[] = [];

  churchMap.forEach(church => {
    if (!church.district || church.district.toLowerCase().includes('unknown') ||
        !church.field || church.field.toLowerCase().includes('unknown') ||
        !church.city || !church.province) {
      churchesWithIssues.push(church);
    }
  });

  if (churchesWithIssues.length > 0) {
    report += '| Church Name | District | Field | City | Province | Members | Sources |\n';
    report += '|-------------|----------|-------|------|----------|---------|----------|\n';

    churchesWithIssues.forEach(church => {
      report += `| ${church.name} | ${church.district || 'MISSING'} | ${church.field || 'MISSING'} | ${church.city || 'MISSING'} | ${church.province || 'MISSING'} | ${church.memberCount} | ${church.sources.join(', ')} |\n`;
    });

    report += '\n';
  } else {
    report += 'No churches with missing data.\n\n';
  }

  // 4. Duplicate members (same name + birthday in different churches)
  report += '## 4. Duplicate Members\n\n';

  const duplicateMembers = Array.from(memberMap.values()).filter(
    m => m.churches.length > 1 || m.sources.length > 1
  );

  if (duplicateMembers.length > 0) {
    report += `Found ${duplicateMembers.length} potential duplicate members:\n\n`;
    report += '| Member Name | Birthday | Churches | Sources | Action |\n';
    report += '|-------------|----------|----------|---------|--------|\n';

    duplicateMembers.forEach(member => {
      report += `| ${member.name} | ${member.birthday} | ${member.churches.join(', ')} | ${member.sources.join(', ')} | 🔍 Review |\n`;
    });

    report += '\n';
  } else {
    report += 'No duplicate members found.\n\n';
  }

  // 5. Unknown districts - suggest fixes based on city/province
  report += '## 5. Suggested District Fixes (based on City/Province)\n\n';

  const unknownDistricts: Array<{
    church: string;
    currentDistrict: string;
    field: string;
    city: string;
    province: string;
    suggestedDistrict: string;
  }> = [];

  allRecords.forEach(({ row }) => {
    const normalized = normalizeDistrict(row.District);
    if (normalized === 'Unknown' || !row.District) {
      // Suggest based on province or city
      let suggested = 'Unknown';

      const province = row.Province?.toLowerCase() || '';
      const city = row.City?.toLowerCase() || '';

      // Visayas provinces
      if (province.includes('cebu') || province.includes('bohol') ||
          province.includes('negros') || city.includes('dumaguete')) {
        suggested = 'Central Visayas';
      } else if (province.includes('iloilo') || province.includes('guimaras') ||
                 province.includes('romblon') || province.includes('palawan')) {
        suggested = 'Western Visayas';
      } else if (province.includes('samar') || province.includes('leyte') ||
                 province.includes('biliran')) {
        suggested = 'Eastern Visayas';
      }
      // Luzon provinces
      else if (province.includes('bataan') || province.includes('pampanga') ||
               province.includes('bulacan') || province.includes('tarlac') ||
               city.includes('manila')) {
        suggested = 'Central Luzon';
      }
      // Mindanao provinces
      else if (province.includes('davao') || province.includes('agusan') ||
               province.includes('bukidnon') || province.includes('misamis')) {
        suggested = 'Northern Mindanao';
      }

      if (suggested !== 'Unknown') {
        unknownDistricts.push({
          church: row['Church Name'],
          currentDistrict: row.District || 'EMPTY',
          field: row.Field,
          city: row.City,
          province: row.Province,
          suggestedDistrict: suggested,
        });
      }
    }
  });

  if (unknownDistricts.length > 0) {
    report += '| Church | Current | Field | City | Province | Suggested District |\n';
    report += '|--------|---------|-------|------|----------|-------------------|\n';

    unknownDistricts.forEach(item => {
      report += `| ${item.church} | ${item.currentDistrict} | ${item.field} | ${item.city} | ${item.province} | **${item.suggestedDistrict}** |\n`;
    });

    report += '\n';
  } else {
    report += 'No unknown districts to fix.\n\n';
  }

  // Write report
  writeFileSync('../../data/CLEANING_REPORT.md', report);
  console.log('✅ Report generated: data/CLEANING_REPORT.md\n');

  // Generate summary stats
  console.log('📈 Key Findings:');
  console.log(`   - Districts to normalize: ${Array.from(districtCounts.values()).filter(d => d.original !== d.normalized).length}`);
  console.log(`   - Similar churches to review: ${similarChurches.length}`);
  console.log(`   - Churches with missing data: ${churchesWithIssues.length}`);
  console.log(`   - Duplicate members to review: ${duplicateMembers.length}`);
  console.log(`   - Unknown districts with suggestions: ${unknownDistricts.length}`);
}

analyzeData()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Analysis failed:', err);
    process.exit(1);
  });
