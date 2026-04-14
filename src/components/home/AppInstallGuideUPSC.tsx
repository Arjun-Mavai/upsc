'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Smartphone, Share, PlusSquare, ArrowRight, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useSettingsStore } from '@/store/useSettingsStore';
import Image from 'next/image';

export function AppInstallGuideUPSC() {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const { language } = useSettingsStore();

  const content = {
    en: {
      title: (
        <>
          Install <span className="text-amber-500">UPSC Zen</span>
        </>
      ),
      subtitle:
        'Get the full premium app experience. Works seamlessly on iPhone, iPad, and Android.',
      iosTab: 'iPhone',
      androidTab: 'Android',
      ios: [
        { text: 'Open Safari Browser', subtext: 'This feature works best in Safari on iOS.' },
        {
          text: 'Tap the Share Button',
          subtext: 'Look for the square icon with an arrow at the bottom.',
        },
        { text: "Select 'Add to Home Screen'", subtext: 'Scroll down until you see this option.' },
      ],
      android: [
        { text: 'Open Chrome Browser', subtext: 'Works best on Google Chrome.' },
        {
          text: "Tap 'Install App' Prompt",
          subtext: 'It usually appears at the bottom of the screen automatically.',
        },
        {
          text: 'Or use the Browser Menu',
          subtext: "Tap the 3 dots (⋮) top right > 'Install App'.",
        },
      ],
    },
    hi: {
      title: (
        <>
          UPSC Zen <span className="text-amber-500">इंस्टॉल करें</span>
        </>
      ),
      subtitle: 'बिना App Store के पाएँ फुल ऐप एक्सपीरियंस। iPhone और Android दोनों पर उपलब्ध।',
      iosTab: 'iPhone',
      androidTab: 'Android',
      ios: [
        { text: 'Safari ब्राउज़र खोलें', subtext: 'यह फीचर Safari में सबसे अच्छा चलता है।' },
        {
          text: 'Share बटन दबाएँ',
          subtext: 'नीचे दिए गए शेयर आइकन (तीर वाला बॉक्स) पर क्लिक करें।',
        },
        {
          text: "'Add to Home Screen' चुनें",
          subtext: 'लिस्ट में नीचे स्क्रॉल करके यह ऑप्शन चुनें।',
        },
      ],
      android: [
        { text: 'Chrome ब्राउज़र खोलें', subtext: 'यह Google Chrome पर सबसे अच्छा चलता है।' },
        { text: "'Install App' पर क्लिक करें", subtext: 'यह स्क्रीन के नीचे अपने आप दिखाई देगा।' },
        {
          text: 'या मेनू का उपयोग करें',
          subtext: "ऊपर राइट में 3 डॉट्स (⋮) दबाएँ और 'Install App' चुनें।",
        },
      ],
    },
  };

  const t = language === 'hi' ? content.hi : content.en;

  return (
    <section id="install-guide" className="overflow-hidden bg-[#050810] px-6 py-24 relative">
       {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-16 space-y-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl font-extrabold text-white md:text-5xl tracking-tight"
          >
            {t.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-lg text-slate-400 font-medium"
          >
            {t.subtitle}
          </motion.p>
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-24">
          {/* Left: Controls & Instructions */}
          <div className="order-2 w-full max-w-lg flex-1 lg:order-1">
            {/* Tab Switcher */}
            <div className="mx-auto mb-10 flex w-fit rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-xl lg:mx-0 shadow-2xl">
              <button
                onClick={() => setActiveTab('ios')}
                className={cn(
                  'flex items-center gap-2 rounded-[1.5rem] px-8 py-4 text-xs font-black uppercase tracking-widest transition-all duration-500',
                  activeTab === 'ios'
                    ? 'bg-amber-500 text-black shadow-[0_10px_20px_rgba(245,158,11,0.3)]'
                    : 'text-slate-500 hover:text-white'
                )}
              >
                <Apple size={16} className={activeTab === 'ios' ? 'fill-black' : ''} />
                {t.iosTab}
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={cn(
                  'flex items-center gap-2 rounded-[1.5rem] px-8 py-4 text-xs font-black uppercase tracking-widest transition-all duration-500',
                  activeTab === 'android'
                    ? 'bg-violet-600 text-white shadow-[0_10px_20px_rgba(139,92,246,0.3)]'
                    : 'text-slate-500 hover:text-white'
                )}
              >
                <Smartphone size={16} />
                {t.androidTab}
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'ios' ? (
                  <motion.div
                    key="ios-steps"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <InstructionStep
                      number={1}
                      text={t.ios[0].text}
                      subtext={t.ios[0].subtext}
                      icon={<Apple size={20} />}
                      variant="amber"
                    />
                    <InstructionStep
                      number={2}
                      text={t.ios[1].text}
                      subtext={t.ios[1].subtext}
                      icon={<Share size={20} />}
                      variant="amber"
                    />
                    <InstructionStep
                      number={3}
                      text={t.ios[2].text}
                      subtext={t.ios[2].subtext}
                      icon={<PlusSquare size={20} />}
                      variant="amber"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="android-steps"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <InstructionStep
                      number={1}
                      text={t.android[0].text}
                      subtext={t.android[0].subtext}
                      icon={<Smartphone size={20} />}
                      variant="amber"
                    />
                    <InstructionStep
                      number={2}
                      text={t.android[1].text}
                      subtext={t.android[1].subtext}
                      icon={<Download size={20} />}
                      variant="amber"
                    />
                    <InstructionStep
                      number={3}
                      text={t.android[2].text}
                      subtext={t.android[2].subtext}
                      icon={<ArrowRight size={20} />}
                      variant="amber"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="order-1 flex w-full flex-1 justify-center lg:order-2 lg:justify-start">
            <AnimatePresence mode="wait">
              {activeTab === 'ios' ? (
                <motion.div
                  key="ios-mockup"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative h-[650px] w-[320px] rounded-[3.5rem] border-[8px] border-slate-800 bg-[#0b081a] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                >
                  {/* iPhone Dynamic Island */}
                  <div className="absolute top-6 left-1/2 z-50 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-center rounded-full bg-black ring-1 ring-white/20">
                    <div className="mr-3 ml-auto h-2 w-2 rounded-full bg-slate-800"></div>
                  </div>

                  {/* Screen Content */}
                  <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[3rem] bg-[#080510] pt-10">
                    {/* App Header */}
                    <div className="flex h-12 items-center justify-between px-6 border-b border-white/5">
                      <span className="text-xs font-black tracking-widest text-white uppercase">UPSC Zen</span>
                      <div className="h-7 w-7 rounded-lg bg-slate-950/50 flex items-center justify-center overflow-hidden">
                         <Image
                            src="/icons/upsc-logo.png"
                            alt="UPSC Zen"
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                      </div>
                    </div>

                    {/* App Body */}
                    <div className="flex-1 space-y-4 p-6">
                      <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-violet-600/20 to-amber-500/10 border border-white/5"></div>
                      <div className="space-y-3">
                        <div className="h-3 w-3/4 rounded-full bg-white/5"></div>
                        <div className="h-3 w-1/2 rounded-full bg-white/5"></div>
                        <div className="h-3 w-5/6 rounded-full bg-white/5"></div>
                      </div>
                    </div>

                    {/* Safari Bottom Bar Mockup */}
                    <div className="absolute right-0 bottom-0 left-0 flex h-20 items-center justify-around border-t border-white/10 bg-[#0b081a]/90 px-6 pb-6 backdrop-blur-md">
                      <div className="text-slate-600">
                        <ArrowRight className="rotate-180" size={20} />
                      </div>
                      <div className="text-slate-600">
                        <ArrowRight size={20} />
                      </div>
                      <div className="text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-500/10 p-2 rounded-lg">
                        <Share size={20} />
                      </div>
                      <div className="text-slate-400">
                        <PlusSquare size={20} />
                      </div>
                      <div className="text-slate-400">
                        <Download size={20} />
                      </div>
                    </div>

                    {/* Share Sheet Overlay */}
                    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="space-y-4 rounded-t-[2.5rem] bg-[#161b22] p-5 pb-10 border-t border-white/10"
                      >
                        <div className="flex items-center gap-4 rounded-2xl bg-[#0d1117] p-4 border border-white/5">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-950/50 shadow-lg">
                            <Image
                              src="/icons/upsc-logo.png"
                              alt="UPSC Zen Logo"
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-sm text-white tracking-tight">UPSC Zen</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">upsc.zenscroll.app</p>
                          </div>
                        </div>

                        <div className="space-y-1 rounded-2xl bg-[#0d1117] p-2 border border-white/5 text-slate-300">
                          <div className="flex items-center justify-between p-3">
                            <span className="text-xs font-bold">Add to Reading List</span>
                          </div>
                          <div className="mx-3 h-[1px] bg-white/5"></div>
                          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 text-amber-500 border border-amber-500/20">
                            <span className="text-xs font-black uppercase tracking-widest">Add to Home Screen</span>
                            <PlusSquare size={18} />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="android-mockup"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative h-[660px] w-[310px] rounded-[2.5rem] border-[6px] border-slate-800 bg-[#0b081a] p-2 shadow-[0_50px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                >
                  {/* Android Punch Hole */}
                  <div className="absolute top-8 left-1/2 z-50 h-4 w-4 -translate-x-1/2 rounded-full bg-black ring-2 ring-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>

                  {/* Screen Content */}
                  <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-[#080510] pt-8">
                    {/* App Header */}
                    <div className="z-10 flex h-14 items-center justify-between bg-[#080510] px-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-950/50">
                           <Image
                              src="/icons/upsc-logo.png"
                              alt="UPSC Zen"
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                        </div>
                        <span className="text-xs font-black tracking-widest text-white uppercase">UPSC Zen</span>
                      </div>
                    </div>

                    {/* App Body */}
                    <div className="flex-1 space-y-4 bg-[#080510] p-6">
                      <div className="h-48 w-full rounded-2xl bg-gradient-to-br from-violet-600/20 to-amber-500/5 border border-white/5"></div>
                      <div className="space-y-3">
                        <div className="h-3 w-3/4 rounded-full bg-white/5"></div>
                        <div className="h-3 w-1/2 rounded-full bg-white/5"></div>
                      </div>
                    </div>

                    {/* Android Install Prompt Overlay */}
                    <div className="absolute right-0 bottom-0 left-0 z-40 flex h-full items-end justify-center bg-black/60 p-4 pb-8">
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full rounded-3xl border border-white/10 bg-[#161b22] p-6 shadow-2xl"
                      >
                        <div className="mb-6 flex items-start gap-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/50 shadow-xl">
                             <Image
                                src="/icons/upsc-logo.png"
                                alt="UPSC Zen Logo"
                                width={56}
                                height={56}
                                className="object-contain"
                              />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-black tracking-tight text-white">
                              Install UPSC Zen App
                            </h4>
                            <p className="mt-1 text-xs text-slate-400 leading-relaxed font-medium">
                              Add to Home screen for quick access to UPSC quizzes and analysis.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors bg-white/5">
                            Cancel
                          </button>
                          <button className="flex-1 rounded-xl bg-amber-500 py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors">
                            Install
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstructionStep({
  number,
  text,
  subtext,
  icon,
  variant,
}: {
  number: number;
  text: string;
  subtext: string;
  icon: React.ReactNode;
  variant: 'amber' | 'violet';
}) {
  return (
    <div className="group flex items-start gap-5 rounded-[2rem] border border-white/[0.03] bg-white/[0.02] p-5 backdrop-blur-sm transition-all hover:bg-white/[0.05] hover:border-white/[0.08] hover:shadow-2xl">
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black transition-all duration-500 group-hover:scale-110 shadow-lg",
        variant === 'amber' ? "bg-amber-500 text-black" : "bg-violet-600 text-white"
      )}>
        {number}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-3">
          <h3 className="font-black text-white tracking-tight">{text}</h3>
          <div className={cn(
             "transition-colors",
             variant === 'amber' ? "text-amber-500/50 group-hover:text-amber-500" : "text-violet-500/50 group-hover:text-violet-500"
          )}>{icon}</div>
        </div>
        <p className="text-xs leading-relaxed text-slate-500 font-medium">{subtext}</p>
      </div>
    </div>
  );
}