'use client';

import React, { useState, useEffect } from 'react';
import { Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-play the slider
  useEffect(() => {
    if (TESTIMONIALS.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 8000); // 8 seconds per slide
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const t = {
    tag: hi ? 'छात्रों की सफलता की कहानियाँ' : 'Success Stories',
    titleStart: hi ? 'गंभीर UPSC' : 'Trusted by',
    titleHighlight: hi ? 'अभ्यर्थियों का भरोसा' : 'Serious Aspirants',
    subtitle: hi
      ? 'उन छात्रों के साथ जुड़ें जो UPSC प्रीलिम्स को स्मार्ट तरीके से डिकोड कर रहे हैं।'
      : 'Join students from across India who are decoding UPSC Prelims with expert precision.',
  };

  if (!TESTIMONIALS || TESTIMONIALS.length === 0) return null;

  const currentTestimonial = TESTIMONIALS[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(4px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(4px)',
    }),
  };

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-white py-24 sm:py-32">
      {/* Premium Apple-like Background Glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_100%)]" />

      <div className="container relative z-10 mx-auto mb-16 px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/50 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-700 uppercase backdrop-blur-sm transition-all hover:bg-amber-100/50">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          {t.tag}
        </div>
        <h2 className="font-display mb-6 text-4xl leading-tight font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          {hi ? (
            <>
              <span className="text-amber-600 bg-amber-50/80 px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-sm inline-block">
                {t.titleStart}
              </span>{' '}
              {t.titleHighlight}
            </>
          ) : (
            <>
              {t.titleStart}{' '}
              <span className="text-amber-600 bg-amber-50/80 px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-sm inline-block">
                {t.titleHighlight}
              </span>
            </>
          )}
        </h2>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500 md:text-xl">
          {t.subtitle}
        </p>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-4xl h-[500px] sm:h-[450px]">
          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 -left-4 sm:-left-12 md:-left-16 flex items-center z-30">
            <button
              onClick={handlePrev}
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 text-slate-600 shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] backdrop-blur-md transition-all hover:scale-110 hover:border-amber-300 hover:text-amber-600 active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
            </button>
          </div>
          
          <div className="absolute inset-y-0 -right-4 sm:-right-12 md:-right-16 flex items-center z-30">
            <button
              onClick={handleNext}
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 text-slate-600 shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] backdrop-blur-md transition-all hover:scale-110 hover:border-amber-300 hover:text-amber-600 active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-slate-50 border border-slate-100 p-6 sm:p-12 shadow-sm">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.3 },
                  filter: { duration: 0.3 }
                }}
                className="absolute inset-0 flex flex-col items-center p-8 sm:p-12 text-center"
              >
                {/* 5-Star Rating */}
                <div className="mb-6 shrink-0 flex justify-center gap-1">
                  {[...Array(currentTestimonial.stars || 5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Testimonial Content - Scrollable for long text */}
                <div className="mt-4 flex-1 w-full overflow-y-auto px-2 pb-4 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col">
                  <h3 className="my-auto text-xl font-medium leading-relaxed tracking-tight text-slate-800 sm:text-2xl md:text-3xl md:leading-snug">
                    "{currentTestimonial.comment}"
                  </h3>
                </div>

                {/* User Info & Avatar */}
                <div className="mt-auto shrink-0 pt-4 flex flex-col items-center">
                  <div className="mb-4 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                    <Image
                      src={currentTestimonial.image || '/default-avatar.png'}
                      alt={currentTestimonial.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-base font-bold text-slate-900 tracking-tight">
                    {currentTestimonial.name}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    {currentTestimonial.location && (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        <span>{currentTestimonial.location}</span>
                        {currentTestimonial.role && <span className="mx-1">•</span>}
                      </>
                    )}
                    {currentTestimonial.role && (
                      <span className="text-slate-400">{currentTestimonial.role}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Paginator Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-2 transition-all duration-300 rounded-full ${
                idx === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
