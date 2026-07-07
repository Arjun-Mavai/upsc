import type { Metadata } from 'next';
import { verifyAuth } from '@/lib/auth';
import { isMainsVaultUnlockedUser } from '@/lib/mains-vault-access';
import { PyqLibraryClient } from '@/app/mains/syllabus/pyq-library/PyqLibraryClient';
import {
  getMainsPyqPaperPublic,
  listMainsPyqPapersLibrarySummary,
} from '@/actions/mains-pyq-prepared-actions';
import {
  isMainsPyqDemoPaper,
  MAINS_PYQ_DEMO_PAPER_NUMBER,
  MAINS_PYQ_DEMO_YEAR,
} from '@/lib/mains-vault-demo';
import type { QRow } from '@/app/mains/syllabus/pyq-library/PyqQuestionList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UPSC Mains PYQ desk — past papers & model answers',
  description:
    'Official UPSC Mains previous-year questions with bilingual model answers and expert pointers — practise by paper and section.',
};

async function PyqLibraryData() {
  // 🚀 CONCURRENT FETCHING: Auth + Paper List in parallel
  const [user, papersRes] = await Promise.all([
    verifyAuth(),
    listMainsPyqPapersLibrarySummary()
  ]);

  const vaultUnlocked = isMainsVaultUnlockedUser(user);

  const initialPapers = papersRes.success
    ? papersRes.data.map((p: any) => ({
        id: p.id,
        examYear: p.examYear,
        paperNumber: p.paperNumber,
        questionCount: p.questionCount,
      }))
    : [];

  let initialPaperId = initialPapers[0]?.id ?? '';
  let initialQuestions: QRow[] = [];

  if (initialPaperId) {
    if (!vaultUnlocked) {
      const demo = initialPapers.find(
        (p: any) => p.examYear === MAINS_PYQ_DEMO_YEAR && p.paperNumber === MAINS_PYQ_DEMO_PAPER_NUMBER
      );
      if (demo) initialPaperId = demo.id;
    }

    const needsQuestions =
      vaultUnlocked || isMainsPyqDemoPaper(
        initialPapers.find((p: any) => p.id === initialPaperId)?.examYear ?? 0,
        initialPapers.find((p: any) => p.id === initialPaperId)?.paperNumber ?? 0
      );

    if (needsQuestions) {
      const qs = await getMainsPyqPaperPublic(initialPaperId);
      if (qs.success) initialQuestions = qs.data.questions as QRow[];
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <PyqLibraryClient
      vaultUnlocked={vaultUnlocked}
      allowDemoAccess={!vaultUnlocked}
      initialPapers={initialPapers}
      initialPaperId={initialPaperId}
      initialQuestions={initialQuestions}
      isAdmin={isAdmin}
    />
  );
}

export default function MainsPyqLibraryPage() {
  return (
    <Suspense fallback={<PyqLibrarySkeleton />}>
      <PyqLibraryData />
    </Suspense>
  );
}

function PyqLibrarySkeleton() {
  return (
    <div className="flex h-screen bg-background animate-in fade-in duration-500">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r p-4 space-y-4 hidden md:block">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
