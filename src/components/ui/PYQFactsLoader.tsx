'use client';

import React, { useEffect, useState } from 'react';
import { Brain, BookOpen, Trophy, Zap, Lightbulb, Globe } from 'lucide-react';

// ─── Shared facts pool ────────────────────────────────────────────────────────
const FACTS = [
  {
    emoji: '🏆',
    category: 'Current Affairs 2026',
    title: 'BAFTA 2026 – भारत का गर्व',
    hi: 'मणिपुर की फिल्म "Boong" ने BAFTA 2026 में Best Children\'s & Family Film award जीता। यह इस category में जीतने वाली पहली Indian film है।',
    en: 'Manipur\'s "Boong" won BAFTA 2026 Best Children\'s & Family Film — first Indian film in this category. Director: Lakshmipriya Devi.',
    color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  {
    emoji: '🌊',
    category: 'MP Geography',
    title: 'नर्मदा – MP की जीवन रेखा',
    hi: 'नर्मदा नदी प्रायद्वीपीय भारत की सबसे लंबी पश्चिम-प्रवाहित नदी है। यह अमरकंटक (MP) से निकलकर अरब सागर में मिलती है।',
    en: 'Narmada is the longest west-flowing river of peninsular India, originating from Amarkantak in MP and draining into the Arabian Sea.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400',
  },
  {
    emoji: '🚀',
    category: 'Science & Technology',
    title: 'Chandrayaan-3 – World First',
    hi: 'चंद्रयान-3 ने 23 अगस्त 2023 को चंद्रमा के दक्षिणी ध्रुव पर लैंड किया। भारत ऐसा करने वाला विश्व का पहला देश बना।',
    en: 'Chandrayaan-3 landed near Moon\'s South Pole on Aug 23, 2023. India became the FIRST country to achieve this feat.',
    color: 'from-indigo-500/20 to-violet-500/20',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    emoji: '🐯',
    category: 'MP GK',
    title: 'Tiger State of India',
    hi: 'मध्यप्रदेश को "Tiger State of India" कहा जाता है — देश में सबसे अधिक बाघ यहाँ हैं। कान्हा और बांधवगढ़ प्रसिद्ध Tiger Reserves हैं।',
    en: 'MP has the highest tiger population in India and is called "Tiger State". Kanha & Bandhavgarh are famous Project Tiger reserves.',
    color: 'from-orange-500/20 to-amber-500/20',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/10 text-orange-400',
  },
  {
    emoji: '⚖️',
    category: 'Indian Polity',
    title: 'संविधान – Key Facts',
    hi: 'भारतीय संविधान 26 जनवरी 1950 को लागू हुआ। यह विश्व का सबसे लंबा लिखित संविधान है। मूल में 395 अनुच्छेद, 22 भाग और 8 अनुसूचियां थीं।',
    en: 'India\'s Constitution came into effect on 26 Jan 1950 — world\'s longest written constitution. Originally: 395 Articles, 22 parts, 8 schedules.',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-400',
  },
  {
    emoji: '🌍',
    category: 'International Relations',
    title: 'G20 Summit 2023 – India',
    hi: 'भारत ने 2023 में G20 की अध्यक्षता की। New Delhi Summit का theme था "वसुधैव कुटुम्बकम"। African Union को स्थायी सदस्य बनाया गया।',
    en: 'India held G20 Presidency in 2023. "Vasudhaiva Kutumbakam" was the theme. African Union admitted as permanent G20 member.',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    emoji: '🏛️',
    category: 'History – MP',
    title: 'सांची स्तूप – UNESCO Site',
    hi: 'सांची स्तूप अशोक ने तीसरी शताब्दी ईसा पूर्व में बनवाया। यह UNESCO World Heritage Site है और भारत का सबसे बड़ा स्तूप है।',
    en: 'Sanchi Stupa was built by Emperor Ashoka in 3rd century BC. It is a UNESCO World Heritage Site and the largest stupa in India.',
    color: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/10 text-rose-400',
  },
  {
    emoji: '📊',
    category: 'Economy',
    title: 'India – 5th Largest Economy',
    hi: 'भारत 2023 में GDP के आधार पर विश्व की 5वीं सबसे बड़ी अर्थव्यवस्था बना। 2047 तक Viksit Bharat बनने का लक्ष्य है।',
    en: 'India surpassed UK to become world\'s 5th largest economy (GDP) in 2023. Viksit Bharat 2047 aims for developed nation status.',
    color: 'from-teal-500/20 to-cyan-500/20',
    border: 'border-teal-500/30',
    badge: 'bg-teal-500/10 text-teal-400',
  },
];

const STEPS = [Brain, BookOpen, Trophy, Zap];
const STEP_LABELS = ['Fetching data...', 'Processing...', 'Building insights...', 'Almost ready!'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PYQFactsLoaderProps {
  /**
   * "page"    – full-screen, used as a Next.js loading.tsx fallback (default)
   * "overlay" – fixed overlay on top of existing content (quiz submission etc.)
   */
  variant?: 'page' | 'overlay';
  /** Short status text below the spinner */
  label?: string;
  /** Color scheme */
  theme?: 'dark' | 'light';
}

// ─── Inner fact card (shared between variants) ────────────────────────────────
function FactCard({
  fact,
  visible,
  isDark,
  factIdx,
}: {
  fact: (typeof FACTS)[0];
  visible: boolean;
  isDark: boolean;
  factIdx: number;
}) {
  return (
    <div
      className={`w-full max-w-lg rounded-3xl border bg-gradient-to-br p-px transition-all duration-500 ${fact.border} ${fact.color}`}
    >
      <div
        className={`rounded-[calc(1.5rem-1px)] p-5 ${
          isDark ? 'bg-slate-900/90' : 'bg-white/95'
        } backdrop-blur-sm`}
      >
        <div className="mb-3 flex items-start gap-3">
          <span className="text-xl">{fact.emoji}</span>
          <div className="min-w-0 flex-1">
            <span
              className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${fact.badge}`}
            >
              {fact.category}
            </span>
            <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {fact.title}
            </p>
          </div>
          <Lightbulb className="h-4 w-4 shrink-0 animate-pulse text-amber-400" />
        </div>

        <div
          style={{ transition: 'opacity 0.35s, transform 0.35s' }}
          className={visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}
        >
          <p
            className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
          >
            {fact.hi}
          </p>
          <p
            className={`mt-2 border-t pt-2 text-xs italic leading-relaxed ${
              isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
            }`}
          >
            {fact.en}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {FACTS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === factIdx
                    ? `w-4 ${isDark ? 'bg-indigo-400' : 'bg-indigo-500'}`
                    : `w-1 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`
                }`}
              />
            ))}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <Globe className="h-3 w-3" />
            UPSC Fact
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Spinner + steps ─────────────────────────────────────────────────────────
function SpinnerBlock({
  step,
  label,
  isDark,
}: {
  step: number;
  label: string;
  isDark: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={`h-16 w-16 animate-spin rounded-full border-4 shadow-lg ${
            isDark
              ? 'border-indigo-500/20 border-t-indigo-500 shadow-indigo-500/20'
              : 'border-slate-200 border-t-indigo-500'
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className={`h-7 w-7 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
      </div>

      <div className="text-center">
        <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {STEP_LABELS[step]}
        </p>
        <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((Icon, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500 ${
                i <= step
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : isDark
                    ? 'bg-white/10 text-slate-600'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-6 transition-all duration-700 ${
                  i < step ? 'bg-indigo-500' : isDark ? 'bg-white/10' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function PYQFactsLoader({
  variant = 'page',
  label = 'Loading...',
  theme = 'dark',
}: PYQFactsLoaderProps) {
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  const isDark = theme === 'dark';

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFactIdx((i) => (i + 1) % FACTS.length);
        setVisible(true);
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 350);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const fact = FACTS[factIdx];

  // ── overlay variant ────────────────────────────────────────────────────────
  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <SpinnerBlock step={step} label={label} isDark={true} />
          <FactCard fact={fact} visible={visible} isDark={true} factIdx={factIdx} />
        </div>
      </div>
    );
  }

  // ── page variant (default) ─────────────────────────────────────────────────
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-16 ${
        isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
      }`}
    >
      <SpinnerBlock step={step} label={label} isDark={isDark} />
      <FactCard fact={fact} visible={visible} isDark={isDark} factIdx={factIdx} />
    </div>
  );
}

// Default export alias so existing `GlobalLoader` import in /app/loading.tsx keeps working
export default PYQFactsLoader;
