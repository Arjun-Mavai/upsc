import Link from 'next/link';
import { notFound } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';
import { isMainsVaultUnlockedUser } from '@/lib/mains-vault-access';
import { getMainsTopicForPage, getMainsSyllabusTree } from '@/actions/mains-actions';
import { db } from '@/db';
import { mainsPapers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { MainsUnitPart } from '@/lib/mains-syllabus-unit-label';
import { MainsMobileSyllabusDrawer } from '@/components/mains/MainsMobileSyllabusDrawer';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const MainsTopicContentClient = dynamic(
  () => import('@/components/mains/MainsTopicContentClient').then((mod) => mod.MainsTopicContentClient),
  { ssr: true } // Keep SSR true for SEO, but separate bundle
);

// ⚡ PERFORMANCE: Revalidate every 1 hour for topics (Rarely change, but need fresh auth/status)
export const revalidate = 3600;

async function MainsTopicData({ paperId, topicId }: { paperId: string, topicId: string }) {
  // 🚀 CONCURRENT FETCHING: Fetch everything at once
  const [paper, topicRes, user, tree] = await Promise.all([
    db.query.mainsPapers.findFirst({ where: eq(mainsPapers.id, paperId) }),
    getMainsTopicForPage(topicId, paperId),
    verifyAuth(),
    getMainsSyllabusTree(paperId),
  ]);

  if (!paper || !topicRes.success) notFound();

  const vaultUnlocked = isMainsVaultUnlockedUser(user);
  const { unit, content, titleHi, titleEn } = topicRes.data;
  if (!unit) notFound();
  
  const isFreeUnit = 'isDemoTopic' in topicRes ? (topicRes as any).isDemoTopic : false;

  const units = tree.success && tree.data
    ? tree.data.map((u: any) => ({
        id: u.id,
        unitNumber: u.unitNumber,
        part: u.part as MainsUnitPart,
        titleHi: u.titleHi,
        titleEn: u.titleEn,
        topics: (u.topics ?? []).map((t: any) => ({
          id: t.id,
          titleHi: t.titleHi,
          titleEn: t.titleEn,
          status: t.status ?? 'draft',
        })),
      }))
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="flex min-h-0 flex-1 flex-col w-full overflow-hidden">
        <MainsTopicContentClient
          standalonePage={true}
          vaultLocked={!vaultUnlocked && !isFreeUnit && !!content}
          topic={{
            id: topicRes.data.id,
            titleHi,
            titleEn,
            unitId: unit.id,
            paperId,
            paperNumber: paper.paperNumber,
          }}
          content={
            content
              ? {
                  conceptHi: content.conceptHi,
                  conceptEn: content.conceptEn,
                  expertStrategyHi: content.expertStrategyHi ?? '',
                  expertStrategyEn: content.expertStrategyEn ?? '',
                  modelAnswers: content.modelAnswers as Record<string, { text: string }[]>,
                  keyTermsHi: content.keyTermsHi ?? null,
                  keyTermsEn: content.keyTermsEn ?? null,
                  richPayload: (content as { richPayload?: Record<string, unknown> | null }).richPayload ?? null,
                }
              : null
          }
        />
      </div>
    </div>
  );
}

export default async function MainsTopicPage({
  params,
}: {
  params: Promise<{ paperId: string; topicId: string }>;
}) {
  const { paperId, topicId } = await params;
  return (
    <Suspense fallback={<TopicSkeleton />}>
      <MainsTopicData paperId={paperId} topicId={topicId} />
    </Suspense>
  );
}

function TopicSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <div className="space-y-4 pt-8">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-12">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}
