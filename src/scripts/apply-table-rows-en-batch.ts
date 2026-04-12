/**
 * Merges tableHeadersEn + tableRowsEn into questions.extended_data for known IDs.
 * Run: cd upsc && NODE_ENV=production npx tsx src/scripts/apply-table-rows-en-batch.ts
 *
 * Dry run: add --dry-run
 */
import dotenv from 'dotenv';
import * as nodePath from 'node:path';

const cwd = process.cwd();
dotenv.config({ path: nodePath.join(cwd, '.env.local') });
dotenv.config({ path: nodePath.join(cwd, '.env') });

const dryRun = process.argv.includes('--dry-run');

/** English matrices aligned to each question's tableHeaders / tableRows shape */
const PATCHES: Record<string, { tableHeadersEn: string[]; tableRowsEn: string[][] }> = {
  csSDI6nHwdOdjUGThku0l: {
    tableHeadersEn: ['Organization', 'Some functions of this organization', 'Works under'],
    tableRowsEn: [
      [
        'I. Directorate of Enforcement',
        'Enforcement of the Fugitive Economic Offenders Act, 2018',
        'Internal Security Division-1, Ministry of Home Affairs',
      ],
      [
        'II. Directorate of Revenue Intelligence',
        'Enforcing the provisions of the Customs Act, 1962',
        'Department of Revenue, Ministry of Finance',
      ],
      [
        'III. Directorate General of Systems and Data Management',
        'Using big data analytics to assist tax officials in better policy and catching tax evaders',
        'Department of Revenue, Ministry of Finance',
      ],
    ],
  },
  PhofriFjtC37pOlJWMImy: {
    tableHeadersEn: ['Regional area', 'River flowing in this region'],
    tableRowsEn: [
      ['I. Ashmaka', 'Godavari'],
      ['II. Kamboja', 'Beas (Vipasha)'],
      ['III. Avanti', 'Mahanadi'],
      ['IV. Kosala', 'Sarayu'],
    ],
  },
  '7WfSyZbovq6tot90kiQqq': {
    tableHeadersEn: ['Plant', 'Description'],
    tableRowsEn: [
      ['1. Cassava', 'Woody shrub'],
      ['II. Ginger', 'Rhizomatous herb'],
      ['III. Malabar spinach', 'Herbaceous climbing vine'],
      ['IV. Mint', 'Annual herb'],
      ['V. Papaya', 'Woody shrub'],
    ],
  },
  '3cdWsetHCA9MiaRxH0gEd': {
    tableHeadersEn: ['State', 'Description'],
    tableRowsEn: [
      [
        'I. Arunachal Pradesh',
        "The capital's name is derived from a fort and the state has two national parks",
      ],
      [
        'II. Nagaland',
        'This state came into existence under a Constitutional Amendment Act',
      ],
      [
        'III. Tripura',
        "Initially a Part 'C' state; after the States Reorganisation of 1956 it became a Union Territory and later attained full statehood",
      ],
    ],
  },
  'N-A9TP6crHcAYgL9Oa0c9': {
    tableHeadersEn: ['Provision in the Constitution of India', 'Envisaged under'],
    tableRowsEn: [
      [
        'I. Separation of the judiciary from the executive in the public services of the State',
        'Directive Principles of State Policy',
      ],
      [
        'II. Understanding the importance of our rich composite heritage and preserving it',
        'Fundamental Duties',
      ],
      [
        'III. Prohibition of employment of children below 14 years of age in factories',
        'Fundamental Rights',
      ],
    ],
  },
  'o-whiZhLdYhS3id5YVcff': {
    tableHeadersEn: ['Organization', 'Union ministry'],
    tableRowsEn: [
      ['I. National Automotive Board', 'Ministry of Commerce and Industry'],
      ['II. Coir Board', 'Ministry of Heavy Industries'],
      ['III. National Trade Information Centre', 'Ministry of Micro, Small and Medium Enterprises'],
    ],
  },
  'H-CHyFDGY1C7ci2gVdL76': {
    tableHeadersEn: ['Country', 'Resource it is rich in'],
    tableRowsEn: [
      ['I. Botswana', 'Diamond'],
      ['II. Chile', 'Lithium'],
      ['III. Indonesia', 'Nickel'],
    ],
  },
  '1oiCqCdnNI1rzJcOiJU4W': {
    tableHeadersEn: ['Region', 'Country'],
    tableRowsEn: [
      ['I. Mallorca', 'Italy'],
      ['II. Normandy', 'Spain'],
      ['III. Sardinia', 'France'],
    ],
  },
  agT38TfpJtARAttTCM6qZ: {
    tableHeadersEn: ['Type', 'Description'],
    tableRowsEn: [
      ['I. Dornier-228 aircraft', 'Maritime patrol aircraft'],
      ['II. IL-76', 'Supersonic combat aircraft'],
      ['III. C-17 Globemaster III', 'Military transport aircraft'],
    ],
  },
  ixjWeE8Sd58TQsneWRyxk: {
    tableHeadersEn: ['International year / observance', 'Year'],
    tableRowsEn: [
      ['I. International Year of Women Farmers', '2026'],
      ['II. International Year of Sustainable and Resilient Tourism', '2027'],
      ['III. International Year of Peace and Trust', '2025'],
      ['IV. International Year of Asteroid Awareness and Planetary Defence', '2029'],
    ],
  },
  ZTRl34q3VosfWCYXjOzSl: {
    tableHeadersEn: ['Feature', 'Region'],
    tableRowsEn: [
      ['1. Bailadila hills', 'India'],
      ['2. Catalonia', 'Spain'],
      ['3. Gran Chaco', 'Argentina'],
    ],
  },
  '0abe_G8omQvzlvWkZBmfE': {
    tableHeadersEn: ['River', 'Flows into'],
    tableRowsEn: [
      ['1. Mekong', 'Andaman Sea'],
      ['2. Thames', 'Irish Sea'],
      ['3. Volga', 'Caspian Sea'],
      ['4. Zambezi', 'Indian Ocean'],
    ],
  },
  knynGCOKFmguzOOVYF_qw: {
    tableHeadersEn: ['Famous place', 'River'],
    tableRowsEn: [
      ['1. Pandharpur', 'Chandrabhaga'],
      ['2. Tiruchirappalli', 'Kaveri'],
      ['3. Hampi', 'Malaprabha'],
    ],
  },
  '-oHoe0yeVRofOw7MBHPoD': {
    tableHeadersEn: ['Waterfall', 'River'],
    tableRowsEn: [
      ['1. Dhuandhar', 'Narmada'],
      ['2. Jog', 'Sharavati'],
      ['3. Shivanasamudra', 'Kaveri'],
    ],
  },
  NhpRw6iik00O6ay7VJGvL: {
    tableHeadersEn: ['Region (often mentioned in news)', 'Country'],
    tableRowsEn: [
      ['1. Anatolia', 'Turkey'],
      ['2. Amhara', 'Ethiopia'],
      ['3. Cabo Delgado', 'Spain'],
      ['4. Catalonia', 'Italy'],
    ],
  },
  TTpLGbMMhqvgjxlr2qfhK: {
    tableHeadersEn: ['Crop', 'Leading producer state'],
    tableRowsEn: [
      ['1. Cotton', 'Gujarat'],
      ['2. Gram', 'Madhya Pradesh'],
      ['3. Black pepper', 'Kerala'],
    ],
  },
  afGZWwCF9LCuWsijBxBf6: {
    tableHeadersEn: ['International agreement / set-up', 'Subject'],
    tableRowsEn: [
      ['1. Alma-Ata Declaration', 'Healthcare of the people'],
      ['2. Hague Convention', 'Biological and chemical weapons'],
      ['3. Talanoa Dialogue', 'Global climate change'],
      ['4. Under-2 Coalition', "Children's rights"],
    ],
  },
  SWLDAuLZOm8pYGad59rdM: {
    tableHeadersEn: ['Place', 'Known for'],
    tableRowsEn: [
      ['1. Burzahom', 'Rock-cut shrines'],
      ['2. Chandraketugarh', 'Terracotta art'],
      ['3. Ganeshwar', 'Copper artefacts'],
    ],
  },
  'L8OH0NrP1tO5y-Yu7QsUx': {
    tableHeadersEn: ['Wildlife', 'Naturally found in'],
    tableRowsEn: [
      ['1. Nilgiri tahr', 'Western Ghats'],
      ['2. Lion-tailed macaque', 'Eastern Ghats'],
      ['3. Malabar civet', 'Western Ghats'],
    ],
  },
};

function assertShape(
  id: string,
  hiH: string[],
  hiR: string[][],
  enH: string[],
  enR: string[][]
) {
  if (enH.length !== hiH.length) {
    throw new Error(`${id}: tableHeadersEn length ${enH.length} != tableHeaders ${hiH.length}`);
  }
  if (enR.length !== hiR.length) {
    throw new Error(`${id}: tableRowsEn rows ${enR.length} != tableRows ${hiR.length}`);
  }
  for (let i = 0; i < hiR.length; i++) {
    if (enR[i].length !== hiR[i].length) {
      throw new Error(`${id}: row ${i} EN cells ${enR[i].length} != HI ${hiR[i].length}`);
    }
  }
}

async function main() {
  const { db } = await import('../db');
  const { questions } = await import('../db/schema');
  const { eq, inArray } = await import('drizzle-orm');

  const ids = Object.keys(PATCHES);
  const rows = await db
    .select({ id: questions.id, extendedData: questions.extendedData })
    .from(questions)
    .where(inArray(questions.id, ids));

  const byId = new Map(rows.map((r) => [r.id, r.extendedData]));

  for (const id of ids) {
    const patch = PATCHES[id];
    const raw = byId.get(id);
    if (raw == null) {
      console.warn('Skip (not found):', id);
      continue;
    }
    const ext = typeof raw === 'string' ? JSON.parse(raw) : { ...raw };
    if (!ext || typeof ext !== 'object') continue;

    const hiH = ext.tableHeaders as string[];
    const hiR = ext.tableRows as string[][];
    if (!Array.isArray(hiH) || !Array.isArray(hiR)) {
      console.warn('Skip (no table):', id);
      continue;
    }

    assertShape(id, hiH, hiR, patch.tableHeadersEn, patch.tableRowsEn);

    const next = {
      ...ext,
      tableHeadersEn: patch.tableHeadersEn,
      tableRowsEn: patch.tableRowsEn,
    };

    if (dryRun) {
      console.log('[dry-run] OK', id);
      continue;
    }

    await db.update(questions).set({ extendedData: next }).where(eq(questions.id, id));
    console.log('Updated', id);
  }

  console.log(dryRun ? 'Dry run done.' : 'Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
