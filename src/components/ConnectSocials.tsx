'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';

interface ConnectSocialsProps {
  variant?: 'light' | 'dark';
  className?: string;
  title?: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
}

export function ConnectSocials({ 
  variant = 'light', 
  className,
  title,
  titleHi,
  subtitle,
  subtitleHi
}: ConnectSocialsProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';

  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'w-full rounded-2xl border p-3 backdrop-blur-sm sm:p-4',
        isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-white/60 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 text-center sm:mb-4">
        <p
          className={cn(
            'text-[10px] font-black tracking-widest uppercase',
            isDark ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          {hi 
            ? (titleHi || '🚀 हमसे जुड़ें') 
            : (title || '🚀 Connect With Us')}
        </p>
        <p className={cn('text-xs font-bold mt-0.5', isDark ? 'text-slate-300' : 'text-slate-700')}>
          {hi 
            ? (subtitleHi || 'डेली अपडेट्स और शॉर्ट्स') 
            : (subtitle || 'Daily Updates & Quick Shorts')}
        </p>
      </div>



      {/* Social Links */}
      <div className="flex items-center justify-center gap-3">
        {/* Telegram Link */}
        <motion.a
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          href="https://t.me/UPSCIntelligence"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 transition-all sm:flex-none sm:px-5 sm:py-3',
            isDark
              ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:bg-sky-500/20'
              : 'bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 shadow-sm hover:from-sky-100 hover:to-sky-200 hover:shadow-md'
          )}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-300/50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute inset-0 animate-ping rounded-lg bg-sky-400 opacity-20" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black leading-tight">
              {hi ? 'टेलीग्राम' : 'Telegram'}
            </span>
            <span
              className={cn(
                'text-[9px] font-medium leading-tight',
                isDark ? 'text-sky-500' : 'text-sky-600'
              )}
            >
              {hi ? 'जॉइन करें' : 'Join Now'}
            </span>
          </div>
        </motion.a>

        {/* YouTube Link */}
        <motion.a
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          href="https://youtube.com/@UPSCZEN/shorts"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 transition-all sm:flex-none sm:px-5 sm:py-3',
            isDark
              ? 'bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-red-500/20'
              : 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-sm hover:from-red-100 hover:to-red-200 hover:shadow-md'
          )}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md shadow-red-300/50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V16C22 18.2091 20.2091 20 18 20H6C3.79086 20 2 18.2091 2 16V8Z"
                fill="currentColor"
              />
              <path d="M10 9L15 12L10 15V9Z" fill="white" />
            </svg>
            <span className="absolute inset-0 animate-ping rounded-lg bg-red-400 opacity-20" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black leading-tight">{hi ? 'यूट्यूब' : 'YouTube'}</span>
            <span
              className={cn(
                'text-[9px] font-medium leading-tight',
                isDark ? 'text-red-500' : 'text-red-600'
              )}
            >
              {hi ? 'शॉर्ट्स देखें' : 'Watch Shorts'}
            </span>
          </div>
        </motion.a>
      </div>
    </div>
  );
}
