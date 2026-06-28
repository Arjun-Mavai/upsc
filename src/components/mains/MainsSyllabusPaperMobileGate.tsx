'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainsMobilePaperExplorer } from '@/components/mains/MainsMobilePaperExplorer';
import type { MainsUnitPart } from '@/lib/mains-syllabus-unit-label';

export type MobileUnit = {
  id: string;
  unitNumber: number;
  /** UPSC खंड A/B — same unit_number can appear under A and B */
  part: MainsUnitPart;
  titleHi: string;
  titleEn: string;
  topics: { id: string; titleHi: string; titleEn: string; status?: string }[];
};

/** Desktop (lg+): jump straight to first topic (sidebar navigation). Mobile: stay here — accordion explorer, no extra page hops. */
export function MainsSyllabusPaperMobileGate(props: {
  paperId: string;
  paperNumber: number;
  titleEn: string;
  units: MobileUnit[];
  firstTopicId: string | null;
  vaultUnlocked: boolean;
  allowGuestPreview: boolean;
}) {
  const router = useRouter();
  const { firstTopicId, paperId } = props;

  useEffect(() => {
    if (!firstTopicId) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const go = () => {
      if (mq.matches) {
        router.replace(`/mains/syllabus/${paperId}/${firstTopicId}`);
      }
    };
    go();
    mq.addEventListener('change', go);
    return () => mq.removeEventListener('change', go);
  }, [firstTopicId, paperId, router]);

  return (
    <>
      <div className="hidden h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center lg:flex">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Loading syllabus…</p>
      </div>

      <div className="flex h-full min-h-0 flex-1 flex-col lg:hidden">
        <MainsMobilePaperExplorer
          paperId={props.paperId}
          paperNumber={props.paperNumber}
          titleEn={props.titleEn}
          units={props.units}
          vaultUnlocked={props.vaultUnlocked}
          allowGuestPreview={props.allowGuestPreview}
        />
      </div>
    </>
  );
}
