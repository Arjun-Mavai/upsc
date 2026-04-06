'use client';

import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Brain, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Hero Section */}
      <section className="bg-white px-4 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">
              Our Mission
            </span>
          </div>
          <h1 className="font-display mb-6 text-4xl leading-tight font-black text-slate-900 md:text-6xl">
            Decoding{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              UPSC Prelims
            </span>{' '}
            with Logic.
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            We don't just give you PYQs. We give you the{' '}
            <span className="font-semibold text-slate-800">expert logic</span> to crack them.
            UPSC Intelligence is India's first expert-led PYQ analysis platform for Civil Services.
          </p>
        </div>
      </section>

      {/* Story / Problem-Solution */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="prose prose-lg prose-slate mx-auto">
            <h2 className="font-display mb-6 text-3xl font-bold text-slate-900">
              Why UPSC Intelligence?
            </h2>
            <p className="mb-6 text-slate-600">
              The UPSC Civil Services Prelims is one of the most competitive exams in India. 
              With over 10 lakh applicants and only a few thousand clearing Prelims, every mark counts.
            </p>
            <p className="mb-6 text-slate-600">
              Most aspirants spend months reading without analyzing <strong>what UPSC actually asks</strong>. 
              They miss patterns, ignore logical constraints, and fail to prioritize high-yield topics.
            </p>
            <p className="mb-8 text-slate-600">
              <strong>Enter UPSC Intelligence.</strong> We've analyzed 6 years of UPSC Prelims (2020-2025) 
              with subject-wise segregation and expert-level explanations (Verdict, Logic Path, Trap Watch) 
              that tell you <em>how</em> to reach the correct answer.
            </p>

            <div className="not-prose mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Brain className="h-5 w-5 text-amber-600" />
                The UPSC Intelligence Advantage
              </h3>
              <ul className="space-y-3">
                {[
                  'Subject-wise analysis of 600+ questions from 6 years (2020-2025)',
                  'Expert Wisdom: Verdict, Logic Path, and Trap Watch for every question',
                  'Instant Mode: Real-time logic during practice tests',
                  'Personalized Dashboard to track your PYQ progress',
                  'Bilingual support (English + Hindi) for maximum accessibility',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-600 md:text-base"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-6 text-3xl font-bold md:text-4xl">
            Ready to crack UPSC Prelims 2026?
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            Join serious aspirants who are analyzing PYQs intelligently, not blindly.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/pricing">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl bg-white px-8 font-bold text-slate-900 hover:bg-slate-100 sm:w-auto"
              >
                View Plans
              </Button>
            </Link>
            <Link href="/syllabus/quiz/pyq">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl border-slate-700 px-8 font-bold text-white hover:bg-slate-800 sm:w-auto"
              >
                Explore PYQs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
