import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getSubjectWisePYQStats } from '../src/features/tests/actions/pyq-analytics';
import { getUnitDistributionStats, getOverallWeightageSubjectData } from '../src/actions/pyq-analytics';

async function main() {
  console.log("Fetching getSubjectWisePYQStats...");
  const simpleStats = await getSubjectWisePYQStats('upsc');
  console.log("simpleStats keys:", Object.keys(simpleStats));

  console.log("Fetching getUnitDistributionStats...");
  const unitStats = await getUnitDistributionStats(10, 'upsc', true);
  console.log("unitStats first 3 units:", unitStats.slice(0, 3).map(u => ({ year: u.year, unitId: u.unitId })));

  console.log("Fetching getOverallWeightageSubjectData...");
  const overall = await getOverallWeightageSubjectData(10, 'upsc', true);
  console.log("overall subjects:", overall.map(o => o.subject));
}

main().catch(console.error);
