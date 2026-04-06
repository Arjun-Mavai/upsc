'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Star, Quote, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useSettingsStore } from '@/store/useSettingsStore';

const TESTIMONIALS = [
  {
    name: 'Aravind Swamy',
    role: 'Aspirant',
    location: 'Delhi',
    comment:
      'The "Verdict" and "Logic Path" structure is a game-changer. I used to struggle with elimination, but this teaches you how to think like the examiner.',
    image: '/testimonials/arjun.png',
    stars: 5,
  },
  {
    name: 'Meera Deshmukh',
    role: 'Aspirant',
    location: 'Pune',
    comment: 'Most organized PYQ platform. The subject-wise segregation helps in targeted revision after completing a topic.',
    image: '/testimonials/priya.png',
    stars: 5,
  },
  {
    name: 'Rohan Malhotra',
    role: 'Aspirant',
    location: 'Chandigarh',
    comment:
      'Finally, an explanation that doesn\'t just dump data. The Trap Watch section helps me avoid those common UPSC pitfalls.',
    image: '/testimonials/amit.png',
    stars: 5,
  },
  {
    name: 'Snehal Singh',
    role: 'Aspirant',
    location: 'Lucknow',
    comment: 'The Instant Mode is excellent for building confidence. Real-time expert logic during practice is exactly what I needed.',
    image: '/testimonials/sneha.png',
    stars: 5,
  },
];

export function Testimonials() {
  const { language } = useSettingsStore();
  const hi = language === 'hi';

  const t = {
    tag: hi ? 'छात्रों की सफलता' : 'Success Stories',
    titleStart: hi ? 'गंभीर UPSC' : 'Trusted by',
    titleHighlight: hi ? 'अभ्यर्थियों का भरोसा' : 'Serious Aspirants',
    subtitle: hi
      ? 'उन छात्रों के साथ जुड़ें जो UPSC प्रीलिम्स को स्मार्ट तरीके से डिकोड कर रहे हैं।'
      : 'Join students from across India who are decoding UPSC Prelims with expert precision.',
  };

  return (
    <section className="overflow-hidden border-t border-slate-100 bg-white py-24">
      <div className="container mx-auto mb-16 px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-black tracking-widest text-amber-700 uppercase">
          <Star className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
          {t.tag}
        </div>
        <h2 className="font-display mb-6 text-3xl leading-tight font-black tracking-tight text-slate-900 md:text-5xl">
          {hi ? (
            <>
              {t.titleStart}{' '}
              <span className="text-amber-600">
                {t.titleHighlight}
              </span>
            </>
          ) : (
            <>
              {t.titleStart}{' '}
              <span className="text-amber-600">
                {t.titleHighlight}
              </span>
            </>
          )}
        </h2>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed font-bold text-slate-500 md:text-xl">
          {t.subtitle}
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((user, idx) => (
            <div
              key={`${user.name}-${idx}`}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50/50 p-8 transition-all duration-300 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div>
                <div className="flex gap-0.5 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-8 text-base leading-relaxed font-bold text-slate-700">
                  "{user.comment}"
                </p>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm">
                  <Image
                    height={48}
                    width={48}
                    src={user?.image || '/assets/images/user.png'}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate leading-tight font-black text-slate-900">{user.name}</h4>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <MapPin className="h-3 w-3 text-amber-500" />
                    <span className="truncate">
                      {user.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
