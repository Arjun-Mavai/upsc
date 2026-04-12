/**
 * Lists UPSC questions that have extendedData (table / pairs / statements / assertion, etc.)
 * so you can search by question id or "Year Q.No" in your JSON editor and add tableRowsEn etc.
 *
 * Run from the Next.js app root — the folder that contains `package.json`
 * (often `.../upsc/upsc/`, NOT the parent `.../upsc/`):
 *   cd upsc && npx tsx src/scripts/list-upsc-extended-layout-questions.ts
 *   cd upsc && npm run list:upsc-extended:table
 *
 * Needs `.env.local` (or `.env`) with TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET
 * — same as `next dev`. Dotenv is applied BEFORE importing `db` (see dynamic import below).
 */
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as nodePath from 'path';

const cwd = process.cwd();
dotenv.config({ path: nodePath.join(cwd, '.env.local') });
dotenv.config({ path: nodePath.join(cwd, '.env') });

type Ext = Record<string, unknown>;

function parseExt(raw: unknown): Ext | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Ext;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Ext;
    } catch {
      return null;
    }
  }
  return null;
}

function classify(ext: Ext): string {
  const lt = String(ext.layoutType ?? '').toLowerCase();
  if (lt) return lt;
  if (ext.tableRows || ext.table_rows) return 'table(inferred)';
  if (ext.tableRowsEn || ext.table_rows_en) return 'table(inferred-en)';
  if (ext.listItems && Array.isArray(ext.listItems)) return 'statements(inferred)';
  if (ext.statementI || ext.statementII) return 'assertion_reason(inferred)';
  return 'unknown';
}

function needsEnTable(ext: Ext): boolean {
  const lt = String(ext.layoutType ?? '').toLowerCase();
  if (lt !== 'table' && lt !== 'pairs') return false;
  const rowsEn = ext.tableRowsEn ?? ext.table_rows_en;
  const hasEn = Array.isArray(rowsEn) && rowsEn.length > 0;
  return !hasEn;
}

async function main() {
  const { db } = await import('../db');
  const { questions, tests } = await import('../db/schema');
  const { and, eq, isNotNull } = await import('drizzle-orm');
  const { getYearFromTestId } = await import('../lib/pyq-constants');

  const tableOnly = process.argv.includes('--table-only');

  const rows = await db
    .select({
      id: questions.id,
      order: questions.order,
      subject: questions.subject,
      testId: questions.testId,
      testTitle: tests.title,
      extendedData: questions.extendedData,
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(and(eq(tests.examType, 'upsc'), isNotNull(questions.extendedData)));

  const enriched = rows
    .map((r) => {
      const ext = parseExt(r.extendedData);
      if (!ext) return null;
      const kind = classify(ext);
      const year = getYearFromTestId(r.testId);
      const qNo = r.order;
      const missingEn = needsEnTable(ext);
      return {
        id: r.id,
        year,
        qNo,
        subject: r.subject ?? '',
        testTitle: r.testTitle ?? '',
        layoutKind: kind,
        missingTableRowsEn: missingEn,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    year: number;
    qNo: number;
    subject: string;
    testTitle: string;
    layoutKind: string;
    missingTableRowsEn: boolean;
  }>;

  const filtered = tableOnly
    ? enriched.filter(
        (x) =>
          x.layoutKind.startsWith('table') ||
          x.layoutKind === 'pairs' ||
          x.layoutKind.startsWith('pair')
      )
    : enriched;

  filtered.sort((a, b) => b.year - a.year || a.qNo - b.qNo);

  console.log('\n=== UPSC questions with extendedData ===\n');
  console.log(`Total: ${filtered.length}${tableOnly ? ' (table/pairs filter)' : ''}\n`);

  console.log(
    '| Year | Q# | Subject | layoutKind | missing tableRowsEn? | question id (search in JSON) |'
  );
  console.log('| --- | --- | --- | --- | --- | --- |');

  for (const x of filtered) {
    console.log(
      `| ${x.year} | ${x.qNo} | ${x.subject.replace(/\|/g, '/')} | ${x.layoutKind} | ${x.missingTableRowsEn ? 'yes' : 'no'} | \`${x.id}\` |`
    );
  }

  console.log('\n--- IDs only (one per line) ---\n');
  console.log(filtered.map((x) => x.id).join('\n'));

  const outDir = nodePath.join(cwd, 'src', 'scripts', 'output');
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch {
    /* ignore */
  }
  const tsvPath = nodePath.join(outDir, 'upsc-extended-layout-questions.tsv');
  const tsv = [
    ['year', 'qNo', 'subject', 'layoutKind', 'missing_tableRowsEn', 'question_id'].join('\t'),
    ...filtered.map((x) =>
      [
        x.year,
        x.qNo,
        x.subject,
        x.layoutKind,
        x.missingTableRowsEn ? '1' : '0',
        x.id,
      ].join('\t')
    ),
  ].join('\n');
  fs.writeFileSync(tsvPath, tsv, 'utf8');
  console.log(`\nWrote: ${tsvPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
