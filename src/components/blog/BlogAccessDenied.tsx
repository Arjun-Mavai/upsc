'use client';

import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function BlogAccessDenied() {
  const router = useRouter();

  return (
    <div className="animate-in fade-in zoom-in flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center duration-500">
      <div className="relative mb-8">
        <div className="flex h-24 w-24 rotate-3 items-center justify-center rounded-3xl bg-slate-900 shadow-2xl">
          <Lock className="h-10 w-10 fill-yellow-400/20 text-yellow-400" />
        </div>
        <div className="absolute -top-2 -right-2 flex h-10 w-10 -rotate-12 items-center justify-center rounded-xl border-4 border-white bg-emerald-500 shadow-lg">
          <Crown className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">
          Premium Content
        </h1>
        <p className="leading-relaxed font-medium text-slate-600">
          This Article is for <span className="font-bold text-slate-900">Pro & Lite Members</span>{' '}
          only. Upgrade to unlock exclusive strategies and notes!
        </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
          <Button
            size="lg"
            onClick={() => router.push('/pricing')}
            className="h-12 w-full rounded-xl bg-slate-900 px-8 font-bold text-white shadow-xl shadow-slate-200 hover:bg-slate-800 sm:w-auto"
          >
            Learn More & Upgrade
          </Button>
          <Button variant="ghost" asChild className="font-bold text-slate-500 hover:text-slate-900">
            <Link href="/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blogs
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
        <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
          Why upgrade?
        </p>
        <ul className="space-y-2">
          {[
            'Complete UPSC Pre + Mains Strategies',
            'High-Yield Bilingual Test Series',
            'Mnemonic-based learning for better recall',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-700">
              <span className="font-bold text-emerald-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
