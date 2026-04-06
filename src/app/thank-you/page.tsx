'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Mail,
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get('plan') || 'pro';
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const type = searchParams.get('type'); // 'upgrade' or null

  const firstName = name.split(' ')[0] || 'Student';
  const isPro = plan === 'pro' || plan === 'upgrade';
  const isUpgrade = type === 'upgrade';
  const planLabel = isPro ? 'Pro' : 'Lite';
  const planColor = isPro ? 'text-amber-600' : 'text-blue-600';
  const planBg = isPro ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';

  // Auto-redirect for upgrades
  useEffect(() => {
    if (isUpgrade) {
      const timer = setTimeout(() => {
        router.push('/syllabus/quiz/topic');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isUpgrade, router]);

  const features = isPro
    ? [
        { icon: Target, text: 'Unlimited Topic & Unit Tests' },
        { icon: BookOpen, text: 'PYQ Papers (2020-2025)' },
        { icon: BarChart3, text: 'Smart Analytics Dashboard' },
        { icon: Sparkles, text: 'Full Length Mock Tests (100Q)' },
      ]
    : [
        { icon: Target, text: 'Topic Tests per Unit (Limited)' },
        { icon: BookOpen, text: 'PYQ Papers ×3' },
        { icon: BarChart3, text: 'Limited Analytics' },
        { icon: Sparkles, text: 'Smart Explanations of syllabus topics' },
      ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* ── Main Card ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          {/* Green Success Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-10 text-center text-white">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-8 h-16 w-16 rounded-full border-2 border-white" />
              <div className="absolute right-12 bottom-2 h-10 w-10 rounded-full border-2 border-white" />
              <div className="absolute top-8 right-6 h-6 w-6 rounded-full bg-white" />
            </div>

            <div className="relative">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm">
                <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isUpgrade ? 'Upgrade Successful!' : 'Payment Successful!'}
              </h1>
              <p className="mt-1 text-sm text-emerald-100">
                {isUpgrade ? 'Redirecting to your dashboard...' : 'Transaction verified & secured'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-5 px-6 py-6">
            {/* Greeting */}
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">
                {isUpgrade ? `Welcome to Pro, ${firstName}! 🚀` : `Thank you, ${firstName}! 🎉`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your <span className={`font-bold ${planColor}`}>{planLabel} Plan</span> is active.
              </p>
              {isUpgrade && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Redirecting to Test Series...
                </div>
              )}
            </div>

            {/* Email CTA - ONLY FOR NEW USERS */}
            {!isUpgrade && (
              <div className="space-y-3 rounded-xl bg-slate-900 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Check Your Email</p>
                    <p className="text-xs text-slate-300">
                      Set your password to start your journey
                    </p>
                  </div>
                </div>
                {email && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-slate-400">Sent to:</span>
                    <span className="truncate text-sm font-medium text-white">{email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield className="h-3 w-3" />
                  <span>Link expires in 1 hour • Check spam folder too</span>
                </div>
              </div>
            )}

            {/* Steps - ONLY FOR NEW USERS */}
            {!isUpgrade && (
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Next Steps
                </p>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: 'Open the email we just sent', done: false },
                    { step: '2', text: 'Click "Set Your Password"', done: false },
                    { step: '3', text: 'Create a strong password', done: false },
                    { step: '4', text: 'Login & start practicing!', done: false },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {item.step}
                      </div>
                      <span className="text-sm text-slate-600">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Features */}
            <div className={`rounded-xl border p-4 ${planBg}`}>
              <p className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                Your {planLabel} Features
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    <f.icon className={`h-3.5 w-3.5 ${planColor} shrink-0`} />
                    <span className="text-xs leading-tight text-slate-700">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {isUpgrade ? (
            <Button
              asChild
              className="h-11 w-full bg-slate-900 font-semibold text-white hover:bg-slate-800"
            >
              <Link href="/syllabus/quiz/topic">
                Start Practicing <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="h-11 flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Link href="/">Go to Home</Link>
              </Button>
              <Button
                asChild
                className="h-11 flex-1 bg-slate-900 font-semibold text-white hover:bg-slate-800"
              >
                <Link href="/login">
                  Login Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Motivational note */}
        <p className="px-4 text-center text-xs text-slate-400">
          &ldquo;सफलता उन्हें मिलती है जो मेहनत करते हैं&rdquo; — Your UPSC journey starts now! 🚀
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
