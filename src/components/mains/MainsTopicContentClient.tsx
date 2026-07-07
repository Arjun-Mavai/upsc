'use client';

import { useState } from 'react';
import { MainsContentViewer } from '@/components/mains/MainsContentViewer';
import { MainsHistoryRichViewer } from '@/components/mains/MainsHistoryRichViewer';
import { MAINS_HISTORY_RICH_VERSION } from '@/lib/mains-history-rich-normalize';
import { useSettingsStore } from '@/store/useSettingsStore';
import { FileQuestion, Lock, Sparkles, Hourglass, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SyllabusLockMainsModal } from '@/features/mains/components/SyllabusLockMainsModal';

type Topic = { id: string; titleHi: string; titleEn: string; unitId: string; paperId?: string; paperNumber?: number; unitPart?: string; unitNumber?: number; };

type ContentShape = {
  conceptHi: string;
  conceptEn: string;
  expertStrategyHi: string;
  expertStrategyEn: string;
  modelAnswers: Record<string, { text: string }[]>;
  keyTermsHi?: string | null;
  keyTermsEn?: string | null;
  richPayload?: Record<string, unknown> | null;
  linkedPyqs?: { id: string, year: number, marks: number, questionHi: string, questionEn: string | null }[];
};

export function MainsTopicContentClient({
  topic,
  content,
  vaultLocked = false,
  standalonePage = false,
}: {
  topic: Topic;
  content: ContentShape | null;
  /** When true, show a short preview + same vault modal as PYQ / gate (no `mppsc_mains`). */
  vaultLocked?: boolean;
  standalonePage?: boolean;
}) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const lang: 'hi' | 'en' = language === 'hi' ? 'hi' : 'en';
  const [vaultModalOpen, setVaultModalOpen] = useState(false);

  if (!content) {
    const hi = lang === 'hi';
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-16 text-center bg-slate-50/40 dark:bg-slate-900/40">
        <div className="max-w-2xl w-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 md:p-14 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 space-y-6">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner mb-2">
            <Hourglass className="size-8" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-900 dark:bg-slate-800 text-xs font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 shadow-sm">
              <span>🚀</span>
              <span>{hi ? 'जल्द आ रहा है' : 'Coming Soon'}</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {hi ? topic.titleHi : topic.titleEn}
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto pt-2 font-medium">
              {hi
                ? 'इस टॉपिक का गहन विश्लेषण, प्रामाणिक मॉडल उत्तर और टॉपर्स रणनीति जल्द ही मेंस लाइब्रेरी में अपलोड की जा रही है।'
                : 'Premium analysis, authentic model answers, and topper strategies for this topic are currently being curated and will be uploaded soon.'}
            </p>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-11 rounded-2xl border-slate-200 bg-white px-8 text-sm font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {hi ? 'वापस जाएँ' : 'Go Back'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rich = content.richPayload;
  const useRich =
    rich &&
    typeof rich === 'object' &&
    (String((rich as { schema_version?: string }).schema_version) === MAINS_HISTORY_RICH_VERSION ||
      typeof (rich as { cognitive_intro_hi?: string }).cognitive_intro_hi === 'string');

  // 🛡️ CRITICAL SECURITY & REVENUE GUARD: Mask proprietary content if vault is locked
  const maskedRich = vaultLocked && rich && typeof rich === 'object' ? {
    ...rich,
    pyq_trend_analysis_hi: '',
    pyq_trend_analysis_en: '',
    pyq_trend_analysis: '',
    dynamic_dimensions_hi: [],
    dynamic_dimensions_en: [],
    dynamic_dimensions: [],
    desi_analogy_hi: '',
    desi_analogy_en: '',
    authentic_source_citation_hi: '',
    authentic_source_citation_en: '',
    examiner_trap_hi: '',
    examiner_trap_en: '',
    topper_x_factor_hi: '',
    topper_x_factor_en: '',
    key_terms_cards_hi: [],
    key_terms_cards_en: [],
    key_terms_hi: '',
    key_terms_en: '',
    models_hi: null,
    models_en: null,
    model_answers_hi: null,
    model_answers_en: null,
    '2m_hi': [],
    '2m_en': [],
    '7m_hi': [],
    '7m_en': [],
    '10m_hi': [],
    '10m_en': [],
    '11m_hi': [],
    '11m_en': [],
    case18_hi: [],
    case18_en: [],
  } : rich;

  const maskedContent = vaultLocked && content ? {
    conceptHi: (content.conceptHi || '').slice(0, 220) + '...',
    conceptEn: (content.conceptEn || '').slice(0, 220) + '...',
    expertStrategyHi: '',
    expertStrategyEn: '',
    modelAnswers: {},
    keyTermsHi: null,
    keyTermsEn: null,
    richPayload: maskedRich,
  } : content;

  const inner =
    useRich && maskedRich ? (
      <MainsHistoryRichViewer standalonePage={standalonePage} topic={topic} payload={maskedRich as Record<string, unknown>} uiLang={lang} />
    ) : (
      <MainsContentViewer
        standalonePage={standalonePage}
        topic={topic}
        content={maskedContent}
        language={lang}
        onMarkDone={() => {}}
        isDone={false}
      />
    );

  const pyqSection = content.linkedPyqs && content.linkedPyqs.length > 0 ? (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6">
          <FileQuestion className="h-4 w-4" />
          {lang === 'hi' ? 'इस टॉपिक से पूछे गए प्रश्न (PYQ)' : 'Previous Year Questions from this Topic'}
        </div>
        <ul className="space-y-4">
          {content.linkedPyqs.map(q => (
            <li key={q.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase">
                  Mains {q.year}
                </span>
                <span className="inline-block rounded-md bg-sky-100 dark:bg-sky-900/30 px-2 py-1 text-[10px] font-black tracking-widest text-sky-700 dark:text-sky-400 uppercase">
                  {q.marks} {lang === 'hi' ? 'अंक' : 'Marks'}
                </span>
              </div>
              <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-[family-name:var(--font-pyq-dev)]">
                {q.questionHi}
              </p>
              {q.questionEn && (
                <p className="mt-2 text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed font-[family-name:var(--font-pyq-serif)]">
                  {q.questionEn}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  if (!vaultLocked) {
    return (
      <div className="flex-1 overflow-y-auto">
        {inner}
        {pyqSection}
      </div>
    );
  }

  const hi = lang === 'hi';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
      <div className="absolute top-2.5 left-3 z-50">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative max-h-[min(52vh,560px)] shrink-0 overflow-hidden pointer-events-none select-none">
        <div className="opacity-95">{inner}</div>
        <div
          className="absolute inset-x-0 bottom-0 top-1/4 bg-gradient-to-b from-transparent via-slate-950/90 to-slate-950 dark:from-transparent dark:via-slate-950/95 dark:to-slate-950"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 border-t border-slate-200 bg-slate-950 px-5 py-8 text-center dark:border-slate-800">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
          <Lock className="h-3 w-3" aria-hidden />
          {hi ? 'Mains ज्ञानकोश' : 'Mains Gyan Kosh'}
        </div>
        <p className="max-w-md text-sm leading-relaxed text-slate-400">
          {hi
            ? 'प्रत्येक टॉपिक की गहरी समझ, प्रामाणिक द्विभाषी मॉडल उत्तर और रणनीतिक विश्लेषण Mains ज्ञानकोश से अनलॉक होते हैं।'
            : 'Deep syllabus concepts, authentic bilingual model answers, and strategic insights unlock with Mains Gyan Kosh.'}
        </p>
        <Button
          type="button"
          onClick={() => setVaultModalOpen(true)}
          className={cn(
            'h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 px-8 font-black text-white shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98]'
          )}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {hi ? 'ज्ञानकोश अनलॉक / कीमत' : 'Unlock Gyan Kosh · Pricing'}
        </Button>
        <SyllabusLockMainsModal open={vaultModalOpen} onOpenChange={setVaultModalOpen} />
      </div>
    </div>
  );
}
