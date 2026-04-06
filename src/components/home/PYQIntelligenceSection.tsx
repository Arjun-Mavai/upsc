'use client';

/**
 * PYQIntelligenceSection — Marketing showcase for PYQ Analysis & Facts features.
 * Design matches existing home sections: 2-col layout, dark slate-900 card on right.
 * NO links — pure marketing/conversion section.
 * Real UPSC Prelims data: 2020-2025 = 6 papers × ~100 Qs each.
 */

import React from 'react';
import { TrendingUp, Lightbulb, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamConfig } from '@/config/exams';
import { useSettingsStore } from '@/store/useSettingsStore';

interface PYQIntelligenceSectionProps {
  exam: ExamConfig;
}

export function PYQIntelligenceSection({ exam }: PYQIntelligenceSectionProps) {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';

  // Robust data extraction with defaults
  const { years = [], risingTopics = [], insightHi = '', insightEn = '' } = exam?.marketing || {};

  // Protection: If no year data is available, don't render a broken section
  if (!years || years.length === 0) {
    return null;
  }

  const firstYear = years[0]?.year || '2020';
  const lastYear = years[years.length - 1]?.year || '2025';

  return (
    <section className="relative overflow-hidden py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-[-200px] h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-pink-50/60 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* LEFT — Marketing Copy */}
          <div className="space-y-8">
            <Badge
              variant="outline"
              className="border-pink-200 bg-pink-50 px-4 py-1 text-sm font-bold text-pink-700"
            >
              {isHindi
                ? `${years.length} साल का PYQ डेटा · ${firstYear}–${lastYear}`
                : `${years.length}-Year PYQ Data · ${firstYear}–${lastYear}`}
            </Badge>

            <h2 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 md:text-5xl">
              {isHindi ? (
                <>
                  UPSC PYQs{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                    (2020–2025)
                  </span>{' '}
                  <br />
                  पर महारत हासिल करें।
                </>
              ) : (
                <>
                  Master UPSC PYQs{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                    (2020–2025)
                  </span>
                  <br />
                  With Logical Insights.
                </>
              )}
            </h2>

            <p className="text-lg leading-relaxed font-medium text-slate-600">
              {isHindi
                ? `पिछले 6 वर्षों के ${years.length * 100}+ ${exam?.id?.toUpperCase() || ''} Prelims प्रश्नों का गहरा विश्लेषण। विषय-वार रुझान और लॉजिकल एक्सप्लेनेशन — सब एक जगह।`
                : `Deep analysis of ${years.length * 100}+ ${exam?.id?.toUpperCase() || ''} Prelims questions from the last 6 years. Subject trends and logical explanations — everything in one place.`}
            </p>

            <div className="flex flex-wrap gap-2.5">
              {[
                { icon: '📊', labelHi: 'व्यवस्थित विषय मैट्रिक्स', labelEn: 'Organized Subject Matrix' },
                { icon: '🧠', labelHi: 'विशेषज्ञ लॉजिक', labelEn: 'Expert Logic' },
                { icon: '⚡', labelHi: 'PYQ फैक्ट्स लाइब्रेरी', labelEn: 'PYQ Facts Library' },
                { icon: '📍', labelHi: 'सटीक मैपिंग', labelEn: 'Precise Mapping' },
              ].map((tag) => (
                <div
                  key={tag.labelEn}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  <span>{tag.icon}</span>
                  {isHindi ? tag.labelHi : tag.labelEn}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dark Visual Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-pink-500 to-rose-400 opacity-15 blur-xl" />

              <Card className="relative z-10 space-y-6 overflow-hidden rounded-[2rem] border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
                {/* Subtle grid pattern */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.03]" />

                {/* Header */}
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
                      {isHindi
                        ? `Smart PYQ इंटेलिजेंस · ${exam?.id?.toUpperCase() || ''}`
                        : `Smart PYQ Intelligence · ${exam?.id?.toUpperCase() || ''}`}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {isHindi
                        ? `टॉप राइज़िंग टॉपिक्स ${lastYear}`
                        : `Top Rising Topics ${lastYear}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/20 px-3 py-1">
                    <TrendingUp className="h-3 w-3 text-pink-400" />
                    <span className="text-[11px] font-black text-pink-400">LIVE</span>
                  </div>
                </div>

                {/* Topic Bars */}
                <div className="relative space-y-3.5">
                  {risingTopics?.map((row) => (
                    <div key={row.topicEn} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-bold text-slate-300">
                          <span className="text-base">{row.badge || '📍'}</span>
                          {isHindi ? row.topicHi : row.topicEn}
                        </span>
                        <span className="text-xs font-black text-emerald-400">
                          {row.delta || '0'} ▲
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${row.color || 'from-emerald-500 to-teal-400'}`}
                          style={{ width: `${row.pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Year Matrix — bigger, cleaner, green */}
                <div className="relative space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      <Zap className="h-3 w-3 text-emerald-400" />
                      {isHindi
                        ? `Year-wise Coverage · ${years.length} वर्ष`
                        : `Year-wise Coverage · ${years.length} Years`}
                    </span>
                    <span className="text-[10px] font-black text-slate-500">
                      {firstYear}–{lastYear}
                    </span>
                  </div>
                  <div className="flex h-16 items-end gap-2.5">
                    {years.map((bar, i) => (
                      <div key={bar.year} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[9px] font-black text-emerald-400 opacity-0 group-hover:opacity-100">
                          {bar.count ?? 0}
                        </span>
                        <div
                          className="w-full rounded-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                          style={{
                            height: `${((bar.pct ?? 0) / 100) * 52}px`,
                            opacity: 0.45 + i * 0.09,
                          }}
                        />
                        <span className="text-[9px] font-black text-slate-500">
                          {String(bar.year || '').slice(-2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>{isHindi ? '100 प्रश्न प्रति वर्ष' : '100 Questions/Year'}</span>
                    <span className="font-black text-emerald-400">
                      {isHindi
                        ? `${years.length * 100} कुल PYQ`
                        : `${years.length * 100} Total PYQ`}
                    </span>
                  </div>
                </div>

                {/* Smart Insight blurb */}
                <div className="relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-relaxed text-slate-300">
                    <span className="font-black text-emerald-400">
                      {isHindi ? 'Smart Insight: ' : 'Smart Insight: '}
                    </span>
                    {isHindi ? insightHi : insightEn}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
