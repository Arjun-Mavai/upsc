'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { MainsPyqLoader } from './MainsPyqLoader';

type ReadingTheme = 'deep' | 'paper';

type ErrorType = 'papers_error' | 'questions_error' | 'loading_papers' | 'loading_questions' | 'empty_papers';

interface ErrorInfo {
  type: ErrorType;
  hasError: boolean;
  errorDetail?: string | null;
  onRetry?: () => void;
}

interface PyqLibraryErrorBoundaryProps {
  readingTheme: ReadingTheme;
  papersError: boolean;
  papersErrorDetail: string | null;
  questionsLoadIssue: 'none' | 'not_found' | 'fetch_failed';
  loadingList: boolean;
  loadingQ: boolean;
  papersCount: number;
  onRetryPapers?: () => void;
  children?: React.ReactNode;
}

export function PyqLibraryErrorBoundary({
  readingTheme,
  papersError,
  papersErrorDetail,
  questionsLoadIssue,
  loadingList,
  loadingQ,
  papersCount,
  onRetryPapers,
  children,
}: PyqLibraryErrorBoundaryProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const themeDeep = readingTheme === 'deep';

  if (papersError) {
    return (
      <div
        className={cn(
          'rounded-2xl border p-4 text-[15px] font-semibold leading-snug',
          themeDeep ? 'border-slate-600 bg-slate-900/80 text-slate-200' : 'border-rose-200 bg-rose-50 text-rose-900'
        )}
      >
        <p className="font-black">
          {hi ? 'पेपर सूची लोड नहीं हो सकी' : 'Could not load the paper list'}
        </p>
        <p className="mt-2 text-sm font-medium opacity-95">
          {hi
            ? 'जाँच करें: (1) डेव सर्वर चल रहा हो (npm run dev) (2) .env में वही डेटाबेस जिसमें PYQ इम्पोर्ट हैं (स्थानीय फ़ाइल या Turso) (3) नवीनतम टेबिल — npm run db:migrate या scripts/ensure जैसा दस्तावेज़।'
            : 'Typical fixes: Dev server running; DATABASE_URL/Turso pointing at the DB where you imported mains PYQ; migrations applied (`npm run db:migrate`). Local dev defaults to ./mppsc_local_dev.db — differs from prod Turso unless you toggle USE_PROD_DB.'}
        </p>
        {papersErrorDetail ? (
          <pre
            className={cn(
              'mt-3 max-h-40 overflow-auto rounded-lg border px-3 py-2 text-left text-[11px] font-mono whitespace-pre-wrap',
              themeDeep ? 'border-slate-700 bg-black/35 text-slate-300' : 'border-rose-200/70 bg-white/90 text-slate-800'
            )}
          >
            {papersErrorDetail}
          </pre>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('mt-3 font-bold', themeDeep && 'border-slate-600 text-slate-200 hover:bg-slate-800')}
          onClick={onRetryPapers}
          disabled={loadingList}
        >
          {hi ? 'फिर कोशिश करें' : 'Try again'}
        </Button>
      </div>
    );
  }

  if (loadingList) {
    return <p className={themeDeep ? 'text-slate-500' : 'text-slate-600'}>{hi ? 'लोड हो रहा है…' : 'Loading papers…'}</p>;
  }

  if (papersCount === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border p-6',
          themeDeep ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-200 bg-white text-slate-600 shadow-sm'
        )}
      >
        {hi ? (
          <>
            इस डेटाबेस में अभी कोई UPSC मेंस PYQ पेपर इम्पोर्ट नहीं है। लोकल डेव पर प्रोडक्शन वाली DB
            नहीं चल रही हो तो Admin → Mains PYQ से इम्पोर्ट करें, या उस टीम डेटाबेस को पॉइंट करें जहाँ
            डेटा पहले से है।
          </>
        ) : (
          <>
            No UPSC Mains PYQ papers in this database yet. On local dev, import via{' '}
            <span className="font-bold">Admin → Mains PYQ</span>, or point{' '}
            <code className="rounded-md bg-black/10 px-1 py-0.5 font-mono text-[11px]">DATABASE_URL</code>{' '}
            at the project where papers are already loaded.
          </>
        )}
      </div>
    );
  }

  if (loadingQ) {
    return <MainsPyqLoader hi={hi} themeDeep={themeDeep} />;
  }

  if (questionsLoadIssue !== 'none') {
    return (
      <div
        className={cn(
          'rounded-2xl border p-4 text-sm font-semibold',
          themeDeep ? 'border-slate-600 bg-slate-900/80 text-slate-200' : 'border-amber-200 bg-amber-50 text-amber-950'
        )}
      >
        {questionsLoadIssue === 'not_found' ? (
          hi ? (
            'यह पेपर इस DB में नहीं मिला। ऊपर से दूसरा पेपर चुनें या पेज रिफ्रेश करें।'
          ) : (
            'This paper was not found in the database — pick another paper from the list above or refresh the page.'
          )
        ) : hi ? (
          <>
            प्रश्न डेटाबेस से पूरी तरह लोड नहीं हो सके। टर्मिनल में{' '}
            <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-[11px] text-amber-50">npm run db:migrate</code>{' '}
            चलाकर नवीनतम माइग्रेशन लगाएँ (जैसे{' '}
            <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-[11px]">drizzle/002*</code>) फिर reload
            करें। अगर टेबिल पहले से हों और फिर भी यह संदेश आए तो Admin में पेपर दोबारा इम्पोर्ट या DB URL चेक करें।
          </>
        ) : (
          <>
            Questions could not be loaded from the database. Run{' '}
            <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">npm run db:migrate</code> so the
            latest migrations apply (see <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">drizzle/002*</code>
            ), then reload. If tables already exist and this persists, re-import from Admin → Mains PYQ or verify{' '}
            <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">DATABASE_URL</code> points at the DB
            that holds your papers.
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
