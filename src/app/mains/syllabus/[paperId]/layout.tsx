import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMainsSyllabusTree } from '@/actions/mains-actions';
import { db } from '@/db';
import { mainsPapers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MainsSyllabusSidebar } from '@/components/mains/MainsSyllabusSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { MainsUnitPart } from '@/lib/mains-syllabus-unit-label';

export default async function MainsPaperSyllabusLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  const paper = await db.query.mainsPapers.findFirst({
    where: eq(mainsPapers.id, paperId),
  });
  if (!paper) notFound();

  const tree = await getMainsSyllabusTree(paperId);
  const units =
    tree.success && tree.data
      ? tree.data.map((u) => ({
          id: u.id,
          unitNumber: u.unitNumber,
          part: u.part as MainsUnitPart,
          titleHi: u.titleHi,
          titleEn: u.titleEn,
          topics: (u.topics ?? []).map((t) => ({
            id: t.id,
            titleHi: t.titleHi,
            titleEn: t.titleEn,
            status: t.status ?? 'draft',
          })),
        }))
      : [];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <aside className="hidden w-80 lg:w-[22rem] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
        <div className="flex h-14 items-center border-b border-slate-200 dark:border-slate-800 px-4">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold" asChild>
            <Link href="/mains/syllabus">
              <ArrowLeft className="mr-2 h-4 w-4" />
              सभी पेपर (All Papers)
            </Link>
          </Button>
        </div>
        <MainsSyllabusSidebar paperNumber={paper.paperNumber} titleHi={paper.titleHi} titleEn={paper.titleEn} units={units} />
      </aside>

      <main className="min-h-0 min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <div className="min-h-0 flex-1 flex flex-col h-full w-full overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
