'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookMarked, BookOpen, Filter, Moon, Sparkles, SunMedium, Target, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { MAIN_SYLLABUS_CARD_HUES, mainsSyllabusTileSkin } from '@/components/mains/mainsSyllabusTileSkin';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainsSyllabusStructure } from '@/components/mains/MainsSyllabusStructure';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
export type MainsSyllabusHubPaper = {
  id: string;
  paperNumber: number;
  titleEn: string | null;
  titleHi: string | null;
  totalTopics: number;
  publishedTopics: number;
  progress: number;
};

const PAPER_MOJIS = ['📘', '📗', '📙', '📕', '📓', '📝'] as const;

const UPSC_PAPERS = [
  { paperNumber: 1, titleHi: 'अनिवार्य भारतीय भाषा (क्वालिफाइंग)', titleEn: 'Compulsory Indian Language (Qualifying)', moji: '🗣️' },
  { paperNumber: 2, titleHi: 'अंग्रेजी (क्वालिफाइंग)', titleEn: 'English (Qualifying)', moji: '🇬🇧' },
  { paperNumber: 3, titleHi: 'निबंध (पेपर I)', titleEn: 'Essay (Paper I)', moji: '📝' },
  { paperNumber: 4, titleHi: 'सामान्य अध्ययन I (पेपर II): भारतीय विरासत और संस्कृति, विश्व का इतिहास एवं भूगोल और समाज', titleEn: 'General Studies I (Paper II): Indian Heritage and Culture, History and Geography of the World and Society', moji: '📘' },
  { paperNumber: 5, titleHi: 'सामान्य अध्ययन II (पेपर III): शासन व्यवस्था, संविधान, राजव्यवस्था, सामाजिक न्याय तथा अंतर्राष्ट्रीय संबंध', titleEn: 'General Studies II (Paper III): Governance, Constitution, Polity, Social Justice and International relations', moji: '📗' },
  { paperNumber: 6, titleHi: 'सामान्य अध्ययन III (पेपर IV): प्रौद्योगिकी, आर्थिक विकास, जैव विविधता, पर्यावरण, सुरक्षा तथा आपदा प्रबंधन', titleEn: 'General Studies III (Paper IV): Technology, Economic Development, Bio diversity, Environment, Security and Disaster Management', moji: '📙' },
  { paperNumber: 7, titleHi: 'सामान्य अध्ययन IV (पेपर V): नीतिशास्त्र, सत्यनिष्ठा और अभिरुचि', titleEn: 'General Studies IV (Paper V): Ethics, Integrity and Aptitude', moji: '📕' },
  { paperNumber: 8, titleHi: 'वैकल्पिक विषय - पेपर 1 (पेपर VI)', titleEn: 'Optional Subject - Paper 1 (Paper VI)', moji: '📓' },
  { paperNumber: 9, titleHi: 'वैकल्पिक विषय - पेपर 2 (पेपर VII)', titleEn: 'Optional Subject - Paper 2 (Paper VII)', moji: '📓' },
];

type ReadingTheme = 'deep' | 'paper';

export function MainsSyllabusHubClient({
  papers,
  missing,
  isAdmin = false,
}: {
  papers: MainsSyllabusHubPaper[];
  missing: string | null;
  isAdmin?: boolean;
}) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('paper');
  const themeDeep = readingTheme === 'deep';
  const [filterOpen, setFilterOpen] = useState(false);
  /** `__ALL__` = सभी; default hydrate to __ALL__ */
  const [paperScope, setPaperScope] = useState<string | '__ALL__'>('__ALL__');

  useEffect(() => {
    if (papers.length === 0) return;
    setPaperScope((prev) => {
      if (prev === '__ALL__') return '__ALL__';
      if (prev && papers.some((x) => x.id === prev)) return prev;
      return '__ALL__';
    });
  }, [papers]);

  const visiblePapers = useMemo(() => {
    if (!papers.length) return [];
    if (paperScope === '__ALL__') return papers;
    if (!paperScope) return papers;
    const one = papers.filter((p) => p.id === paperScope);
    return one.length ? one : papers;
  }, [papers, paperScope]);

  const paperSelectValue = paperScope === '__ALL__' ? '__ALL__' : paperScope || papers[0]?.id || '';

  const shell = cn(
    'relative min-h-screen w-screen max-w-[100vw] overflow-x-hidden px-2 pb-24 pt-5 sm:px-2.5 sm:pb-28 sm:pt-6',
    themeDeep ? 'text-slate-100' : 'bg-[#fafbfc] text-slate-900'
  );
  const blobClass = 'pointer-events-none absolute rounded-full blur-[100px] opacity-40';

  return (
    <div className={shell} style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
      {!themeDeep ? (
        <>
          <div className={`${blobClass} top-[-70px] right-[-100px] h-[400px] w-[400px] bg-pink-100`} />
          <div className={`${blobClass} top-[28%] left-[-90px] h-[360px] w-[360px] bg-emerald-100`} />
          <div className={`${blobClass} bottom-[8%] right-[8%] h-[300px] w-[300px] bg-amber-100`} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/90 to-transparent" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-3xl px-1 sm:px-1.5">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            className={cn(
              'h-9 px-3',
              themeDeep ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            )}
            asChild
          >
            <Link href="/mains">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {hi ? 'मेंस हब' : 'Mains hub'}
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95',
              themeDeep
                ? filterOpen
                  ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-md shadow-amber-500/15'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
                : filterOpen
                  ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100/50'
            )}
            aria-expanded={filterOpen}
            aria-label={hi ? 'फिल्टर व थीम' : 'Filters & reading theme'}
          >
            <Target className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <div className="mb-8 flex items-start gap-3">
          <div
            className={cn(
              'mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm',
              themeDeep
                ? 'border border-emerald-500/30 bg-emerald-950/40'
                : 'border border-emerald-200 bg-emerald-50'
            )}
            aria-hidden
          >
            📚
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'text-[1.65rem] font-black tracking-tight md:text-[2rem]',
                themeDeep ? 'text-slate-50' : 'text-slate-900'
              )}
            >
              {hi ? 'UPSC मेंस सिलेबस 🎯' : 'UPSC Mains syllabus 🎯'}
            </h1>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {filterOpen ? (
            <motion.div
              key="filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="mb-8 overflow-hidden"
            >
              <div
                className={cn(
                  'rounded-[2rem] border-2 p-5 sm:p-6 transition-all duration-300 shadow-xl space-y-5',
                  themeDeep
                    ? 'border-slate-700 bg-slate-900/60 backdrop-blur-md shadow-black/40 text-slate-100'
                    : 'border-slate-200/80 bg-white/95 backdrop-blur-md shadow-slate-200/60 text-slate-900'
                )}
              >
                {/* 1. PAPER FILTER (TOP) */}
                {papers.length > 0 ? (
                  <div>
                    <label
                      className={cn(
                        'mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider',
                        themeDeep ? 'text-emerald-400' : 'text-emerald-600'
                      )}
                    >
                      <span>🎯</span>
                      <span>{hi ? 'पेपर फ़ील्टर (Select Paper Scope)' : 'Paper Filter Scope'}</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
                        <span
                          className={cn(
                            'inline-block h-2 w-2 rounded-full animate-pulse ring-4',
                            themeDeep
                              ? 'bg-emerald-400 ring-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                              : 'bg-emerald-600 ring-emerald-200/70 shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                          )}
                        />
                      </div>
                      <Select
                        value={paperSelectValue}
                        onValueChange={(v) => setPaperScope(v === '__ALL__' ? '__ALL__' : v)}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-13 w-full rounded-2xl pl-10 pr-4 text-base font-black shadow-md ring-offset-0 focus:ring-0 md:min-w-[280px]',
                            themeDeep
                              ? 'border-slate-700 bg-slate-950 text-slate-100 hover:border-emerald-500/50 [&_svg]:text-slate-400'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500/40 [&_svg]:text-slate-500'
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={6}
                          className={cn(
                            'z-[200] rounded-2xl shadow-2xl',
                            themeDeep
                              ? 'border border-slate-700 bg-slate-950 text-slate-100'
                              : 'border border-slate-200 bg-white text-slate-800'
                          )}
                        >
                          <SelectItem
                            value="__ALL__"
                            className={cn(
                              'cursor-pointer py-3.5 px-4 font-black text-sm rounded-xl mx-1 my-0.5',
                              themeDeep ? 'focus:bg-slate-800 focus:text-white' : 'focus:bg-emerald-50 focus:text-emerald-950'
                            )}
                          >
                            <span>🌐</span> {hi ? 'सभी 9 पेपर्स (All Papers)' : 'All 9 Papers'}
                          </SelectItem>
                          {papers.map((p) => {
                            const staticInfo = UPSC_PAPERS.find(s => s.paperNumber === p.paperNumber);
                            return (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                                textValue={`Paper ${p.paperNumber}`}
                                className={cn(
                                  'cursor-pointer py-3.5 px-4 font-bold text-sm rounded-xl mx-1 my-0.5',
                                  themeDeep ? 'focus:bg-slate-800 focus:text-white' : 'focus:bg-emerald-50 focus:text-emerald-950'
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-emerald-500">▪</span>
                                  {hi ? (
                                    <>
                                      पेपर {p.paperNumber}
                                      {staticInfo?.titleHi ? ` · ${staticInfo.titleHi}` : ''}
                                    </>
                                  ) : (
                                    <>
                                      Paper {p.paperNumber}
                                      {staticInfo?.titleEn ? ` · ${staticInfo.titleEn}` : ''}
                                    </>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}

                {/* 2. THEME SWITCHER (MIDDLE) */}
                <div
                  className={cn(
                    'flex items-center justify-between gap-3 border-t pt-4',
                    themeDeep ? 'border-slate-800' : 'border-slate-100'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-extrabold uppercase tracking-wider',
                      themeDeep ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {hi ? 'पठन थीम (Theme)' : 'Reading Theme'}
                  </span>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-2xl border p-1.5',
                      themeDeep ? 'border-slate-700 bg-slate-950/80' : 'border-slate-200 bg-slate-100/80 shadow-inner'
                    )}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant={!themeDeep ? 'default' : 'ghost'}
                      className={cn(
                        'rounded-xl font-black px-4 py-2 h-9 transition-all active:scale-95',
                        !themeDeep ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400' : 'text-slate-400 hover:text-slate-200'
                      )}
                      onClick={() => setReadingTheme('paper')}
                    >
                      <SunMedium className="mr-1.5 h-4 w-4 shrink-0" />
                      <span>{hi ? 'हल्का' : 'Light'}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={themeDeep ? 'default' : 'ghost'}
                      className={cn(
                        'rounded-xl font-black px-4 py-2 h-9 transition-all active:scale-95',
                        themeDeep ? 'bg-slate-800 text-white shadow-md border border-slate-700 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900'
                      )}
                      onClick={() => setReadingTheme('deep')}
                    >
                      <Moon className="mr-1.5 h-4 w-4 shrink-0" />
                      <span>{hi ? 'गहरा' : 'Dark'}</span>
                    </Button>
                  </div>
                </div>

                {/* 3. DESCRIPTIVE TEXT (BOTTOM FOOTER) */}
                <div
                  className={cn(
                    'rounded-2xl p-4 border transition-colors',
                    themeDeep ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-600'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <SlidersHorizontal className={cn("h-4 w-4 mt-0.5 shrink-0", themeDeep ? "text-amber-500" : "text-amber-600")} />
                    <div className="space-y-1 text-xs leading-relaxed font-semibold">
                      <p>
                        {hi ? 'दिखावट · पेपर (View & Scope)' : 'View & Scope'}
                      </p>
                      <p className="font-normal opacity-90">
                        {hi
                          ? 'पेपर चुनें — यूनिट ट्री व टॉपिक एक्सपर्ट कंटेंट (जहाँ जोड़ा गया हो)। भाषा स्विच से EN/HI देखें। फिल्टर बटन से पढ़ने का थीम और पेपर स्कोप। ✨'
                          : 'Pick a paper for units & topics — expert notes where published. Site language toggles HI/EN. Use the filter for reading theme & paper scope. ✨'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <MainsSyllabusStructure hi={hi} />

        <div className="mb-8">
          <Link
            href="/mains/syllabus/pyq-library"
            className={cn(
              'flex items-center justify-between gap-4 overflow-hidden rounded-[2.25rem] px-5 py-4 transition-all duration-300 sm:rounded-[2.5rem] sm:py-5 interactive-tile',
              mainsSyllabusTileSkin('sky', themeDeep).frame,
              mainsSyllabusTileSkin('sky', themeDeep).rowHover
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-inner',
                  themeDeep ? 'bg-black/30' : 'bg-white/80'
                )}
                aria-hidden
              >
                📑
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'font-black text-base md:text-lg',
                    hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
                    themeDeep ? 'text-slate-50' : 'text-slate-900'
                  )}
                >
                  {hi ? 'UPSC मेंस PYQ लाइब्रेरी' : 'UPSC Mains PYQ Library'}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-sm opacity-85',
                    hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
                    themeDeep ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {hi
                    ? 'सभी वर्षों के प्रश्नपत्र और 2 अलग-अलग मॉडल उत्तर'
                    : 'All previous years\' papers & 2 distinct model answers'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                      themeDeep
                        ? 'border-white/15 bg-black/25 text-amber-200'
                        : 'border-amber-200/90 bg-amber-50 text-amber-900'
                    )}
                  >
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {hi ? 'सभी सॉल्व्ड' : '100% Solved'}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-bold',
                      themeDeep ? 'text-slate-500' : 'text-slate-500'
                    )}
                  >
                    {hi ? '2 अलग-अलग स्टाइल उत्तर' : '2 distinct writing styles'}
                  </span>
                </div>
              </div>
            </div>
            <BookMarked
              className={cn(
                'h-9 w-9 shrink-0 opacity-85',
                themeDeep ? 'text-sky-400' : 'text-sky-600'
              )}
            />
          </Link>
        </div>

        {missing ? (
          <div
            className={cn(
              'rounded-[2rem] border-2 p-6 sm:p-8',
              themeDeep
                ? 'border-amber-500/35 bg-gradient-to-br from-amber-950/50 to-slate-900/90 text-amber-50'
                : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-950 shadow-sm shadow-amber-200/30'
            )}
          >
            <p className="mb-2 flex items-center gap-2 font-black">
              <span aria-hidden>⚠️</span>
              {hi ? 'अभी टेबल नहीं बने' : 'Mains tables not on this DB yet'}
            </p>
            <p className="mb-4 whitespace-pre-wrap text-sm font-medium opacity-95">{missing}</p>
            <p className={cn('text-xs', themeDeep ? 'text-slate-400' : 'text-slate-600')}>
              {hi ? 'लोकल फिक्स:' : 'Local quick fix:'}{' '}
              <code
                className={cn(
                  'rounded px-1 py-0.5 font-mono text-[11px]',
                  themeDeep ? 'bg-black/35 text-emerald-300' : 'bg-white text-emerald-800'
                )}
              >
                npm run db:apply:mains
              </code>{' '}
              →{' '}
              <code
                className={cn(
                  'rounded px-1 py-0.5 font-mono text-[11px]',
                  themeDeep ? 'bg-black/35 text-emerald-300' : 'bg-white text-emerald-800'
                )}
              >
                npm run db:seed:mains
              </code>
            </p>
          </div>
        ) : (
          <ul className="space-y-3 pb-10">
            {UPSC_PAPERS.map((sp, idx) => {
              const matchingDb = papers.find((x) => x.paperNumber === sp.paperNumber);
              if (paperScope && paperScope !== '__ALL__' && matchingDb?.id !== paperScope) {
                return null;
              }

              const hue = MAIN_SYLLABUS_CARD_HUES[idx % 4];
              const tileSkin = mainsSyllabusTileSkin(hue, themeDeep);
              const moji = sp.moji;

              if (matchingDb) {
                return (
                  <li key={matchingDb.id}>
                    <Link
                      href={`/mains/syllabus/${matchingDb.id}`}
                      className={cn(
                        'flex items-center justify-between gap-4 overflow-hidden rounded-[2.25rem] px-5 py-4 transition-all duration-300 sm:rounded-[2.5rem] sm:py-5 interactive-tile',
                        tileSkin.frame,
                        tileSkin.rowHover
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-inner',
                            themeDeep ? 'bg-black/30' : 'bg-white/80'
                          )}
                          aria-hidden
                        >
                          {moji}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'truncate font-black',
                              hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
                              themeDeep ? 'text-slate-50' : 'text-slate-900'
                            )}
                          >
                            {hi
                              ? `पेपर ${matchingDb.paperNumber}: ${sp.titleHi}`
                              : `Paper ${matchingDb.paperNumber}: ${sp.titleEn}`}
                          </p>
                          {!hi && sp.titleHi ? (
                            <p
                              className={cn(
                                'mt-0.5 truncate text-sm font-[family-name:var(--font-pyq-dev)] opacity-85',
                                themeDeep ? 'text-slate-400' : 'text-slate-600'
                              )}
                            >
                              {sp.titleHi}
                            </p>
                          ) : hi && sp.titleEn ? (
                            <p
                              className={cn(
                                'mt-0.5 truncate text-sm font-[family-name:var(--font-pyq-serif)] opacity-85',
                                themeDeep ? 'text-slate-400' : 'text-slate-600'
                              )}
                            >
                              {sp.titleEn}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {isAdmin && (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                                  themeDeep
                                    ? 'border-white/15 bg-black/25 text-emerald-200'
                                    : 'border-emerald-200/90 bg-emerald-50 text-emerald-900'
                                )}
                              >
                                <Sparkles className="h-3 w-3" />
                                {matchingDb.progress}% {hi ? 'तैयार' : 'ready'}
                              </span>
                            )}
                            <span
                              className={cn(
                                'text-[11px] font-bold',
                                themeDeep ? 'text-slate-500' : 'text-slate-500'
                              )}
                            >
                              {/* {matchingDb.publishedTopics}/{matchingDb.totalTopics} {hi ? 'टॉपिक · खोलने के लिए टैप' : 'topics · tap to open'} */}
                              {hi ? 'खोलने के लिए टैप' : 'tap to open'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <BookOpen
                        className={cn(
                          'h-9 w-9 shrink-0 opacity-85',
                          themeDeep ? 'text-emerald-400' : 'text-emerald-600'
                        )}
                      />
                    </Link>
                  </li>
                );
              }

              return (
                <li key={`missing-${sp.paperNumber}`}>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-4 overflow-hidden rounded-[2.25rem] px-5 py-4 transition-all duration-300 sm:rounded-[2.5rem] sm:py-5 opacity-80 interactive-tile',
                      tileSkin.frame
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-inner grayscale',
                          themeDeep ? 'bg-black/30' : 'bg-white/80'
                        )}
                        aria-hidden
                      >
                        {moji}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate font-black',
                            hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
                            themeDeep ? 'text-slate-200' : 'text-slate-800'
                          )}
                        >
                          {hi
                            ? `पेपर ${sp.paperNumber}: ${sp.titleHi}`
                            : `Paper ${sp.paperNumber}: ${sp.titleEn}`}
                        </p>
                        <p
                          className={cn(
                            'mt-0.5 truncate text-sm opacity-85',
                            hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
                            themeDeep ? 'text-slate-400' : 'text-slate-600'
                          )}
                        >
                          {hi ? sp.titleEn : sp.titleHi}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                              themeDeep
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                : 'border-amber-300 bg-amber-50 text-amber-800'
                            )}
                          >
                            🚀 {hi ? 'जल्द आ रहा है (Coming Soon)' : 'Coming Soon'}
                          </span>
                          <span
                            className={cn(
                              'text-[11px] font-bold',
                              themeDeep ? 'text-slate-500' : 'text-slate-500'
                            )}
                          >
                            {hi ? 'एक्सपर्ट कंटेंट तैयार किया जा रहा है' : 'Expert content under preparation'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <BookMarked
                      className={cn(
                        'h-9 w-9 shrink-0 opacity-30',
                        themeDeep ? 'text-slate-500' : 'text-slate-400'
                      )}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
