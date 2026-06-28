import { getMainsProgressOverview } from '@/actions/mains-actions';
import { MainsSyllabusHubClient, type MainsSyllabusHubPaper } from '@/app/mains/syllabus/MainsSyllabusHubClient';
import { verifyAuth } from '@/lib/auth';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// ⚡ CACHE: Hub view change slower than content — 10 mins cache for better perceived speed
export const revalidate = 600;

async function MainsSyllabusHubData() {
  const [user, res] = await Promise.all([
    verifyAuth(),
    getMainsProgressOverview()
  ]);

  const isAdmin = user?.role === 'admin';
  const missing =
    !res.success && (res as { error?: string; hint?: string }).error === 'mains_tables_missing'
      ? (res as { hint?: string }).hint ?? null
      : null;

  const papers: MainsSyllabusHubPaper[] =
    res.success && res.data
      ? res.data.map((p: any) => ({
          id: p.id,
          paperNumber: p.paperNumber,
          titleEn: p.titleEn,
          titleHi: p.titleHi,
          totalTopics: p.totalTopics,
          publishedTopics: p.publishedTopics,
          progress: p.progress,
        }))
      : [];

  return <MainsSyllabusHubClient papers={papers} missing={missing} isAdmin={isAdmin} />;
}

export default function MainsSyllabusPaperPickerPage() {
  return (
    <Suspense fallback={<MainsSyllabusHubSkeleton />}>
      <MainsSyllabusHubData />
    </Suspense>
  );
}

function MainsSyllabusHubSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

