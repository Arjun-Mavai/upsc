import { createClient } from '@libsql/client';
import fs from 'fs';

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !authToken) {
  throw new Error('Missing TURSO credentials: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');
}

const client = createClient({
  url: dbUrl,
  authToken,
});

const CANONICAL_TEST_IDS = {
  2020: '5KRVTgTIw07bWNxu20YNl',
  2021: 'ix0FnJV496Rgvw0YHOEFj',
  2022: 'o_rO3J1tSEACKENOLT9QI',
  2023: 'mQ1a9hZoTdfSRfkz40K5C',
  2024: '3XmZ0l700BJV3j2FLd0XZ',
  2025: 'D0gf6bklgl3RT-sTnue2n',
};

function cleanCsvField(field: any) {
  if (!field) return '';
  return String(field).replace(/\n/g, ' ').replace(/\r/g, '').trim().replace(/"/g, '""');
}

function formatOptions(optionsJson: any) {
  try {
    // Remove outer quotes if present
    let jsonStr = optionsJson.trim();
    if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
      jsonStr = jsonStr.slice(1, -1).replace(/\\"/g, '"');
    }
    
    const options = JSON.parse(jsonStr);
    if (Array.isArray(options)) {
      return options.map((optText, i) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D
        const text = (optText || '').replace(/\n/g, ' ').trim();
        return `${letter}) ${text}`;
      }).join(' | ');
    }
  } catch (e) {
    // Return raw text as fallback
    return (optionsJson || '').replace(/\n/g, ' ').trim();
  }
  return '';
}

async function extractProdData() {
  console.log('🌐 Connecting to production database...');
  
  const testIds = Object.values(CANONICAL_TEST_IDS);
  
  try {
    // Query to get all PYQ questions
    const placeholders = testIds.map(() => '?').join(',');
    const result = await client.execute({
      sql: `
        SELECT 
          q.id as question_id,
          q.test_id,
          q.question_text,
          q.question_text_en, 
          q.options,
          q.correct_answer,
          q.subject,
          q."order" as question_order
        FROM questions q
        WHERE q.test_id IN (${placeholders})
          AND q.deleted_at IS NULL
        ORDER BY q.test_id, q."order"
      `,
      args: testIds
    });

    console.log(`Found ${result.rows.length} questions from production`);
    
    // Process data
    const csvRows = ['year,question_id,question_text,options,correct_answer,subject'];
    const yearCounts: Record<string, number> = {};
    let successCount = 0;
    
    for (const row of result.rows as any[]) {
      // Find year from test_id
      const year = Object.keys(CANONICAL_TEST_IDS).find(
        y => (CANONICAL_TEST_IDS as any)[y] === row.test_id
      );
      
      if (!year) continue;
      
      const questionText = cleanCsvField((row.question_text as string) || (row.question_text_en as string) || '');
      const options = formatOptions(row.options);
      const correctAnswer = cleanCsvField((row.correct_answer as string) || '');
      const subject = cleanCsvField((row.subject as string) || '');
      
      // Skip if essential data is missing
      if (!questionText.trim()) {
        console.log(`Skipping question ${row.question_id} - no question text`);
        continue;
      }
      
      // Count by year
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      successCount++;
      
      const cleanedOptions = cleanCsvField(options);
      const csvRow = `${year},"${questionText}","${cleanedOptions}","${correctAnswer}","${subject}"`;
      csvRows.push(csvRow);
    }
    
    // Write CSV file
    const csvContent = csvRows.join('\n');
    fs.writeFileSync('pyq_prod_analysis.csv', csvContent, 'utf8');
    
    console.log('\n✅ Production CSV created: pyq_prod_analysis.csv');
    console.log(`📊 Total questions: ${successCount}`);
    
    console.log('\n📈 Questions per year:');
    Object.keys(yearCounts).sort().forEach(year => {
      console.log(`  ${year}: ${yearCounts[year]} questions`);
    });
    
    console.log('\n🎯 Production CSV ready for AI analysis!');
    console.log('📁 File: pyq_prod_analysis.csv');
    
    return successCount;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

extractProdData().catch(console.error);
