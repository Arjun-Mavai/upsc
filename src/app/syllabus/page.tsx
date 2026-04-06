import { Suspense } from 'react';
import { Metadata } from 'next';
import { getSyllabusTopics } from '@/actions/getSyllabusTopics';
import { syllabusData as staticSyllabusData } from '@/data/syllabusData';
import { SyllabusClient } from '@/features/syllabus/components/SyllabusClient';
import { SyllabusData } from '@/types/syllabus';

export const metadata: Metadata = {
  title: 'UPSC 2026 Complete Syllabus — All 17 Units with Mnemonics',
  description:
    'Complete UPSC 2026 syllabus in Hindi & English. All 10 units with topic-wise mnemonics, tests, cards for syllabus, and quizzes. Start free preparation today!',
  keywords: [
    'UPSC Syllabus 2026',
    'UPSC Syllabus Hindi',
    'UPSC Units',
    'UPSC Topics',
    'UPSC Preparation',
  ],
};

// 7-Day Cached Data Fetching
async function getSyllabusData(): Promise<SyllabusData> {
  console.log('DEBUG: getSyllabusData started');

  try {
    // 1. Fetch Dynamic Topics from DB (Cached)
    const { data: dynamicTopics } = await getSyllabusTopics();
    console.log('DEBUG: dynamicTopics fetched', dynamicTopics ? 'Found' : 'Null');

    // 2. Merge with Static Metadata (Titles, Images)
    // We clone the static data to avoid mutating the original import
    const mergedUnits = { ...staticSyllabusData.units };

    if (dynamicTopics) {
      Object.keys(mergedUnits).forEach((unitKey) => {
        const unitTopics = dynamicTopics[unitKey];
        if (unitTopics && unitTopics.length > 0) {
          // Logic to merge DB topics would go here.
          // Currently just logging and using static data as per previous logic.
          // To execute dynamic merge:
          /*
                 const mappedTopics = unitTopics.map(t => ({
                    id: parseInt(t.id) || 0,
                    front: t.title,
                    back: "",
                    order: t.order
                 }));
                 // mergedUnits[unitKey].topics = mappedTopics as any;
                 */
        }
      });
    }

    return staticSyllabusData;
  } catch (e) {
    console.error('DEBUG: getSyllabusData Failed', e);
    return staticSyllabusData;
  }
}

export default async function SyllabusPage() {
  console.log('DEBUG: SyllabusPage Rendering');
  const syllabusData = await getSyllabusData();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">Loading...</div>
      }
    >
      <SyllabusClient syllabusData={syllabusData} />
    </Suspense>
  );
}
