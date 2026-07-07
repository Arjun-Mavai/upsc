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
  minimal?: boolean;
}

export function ConnectSocials({ 
  variant = 'light', 
  className,
  title,
  titleHi,
  subtitle,
  subtitleHi,
  minimal = false
}: ConnectSocialsProps) {
  const { language, user } = useSettingsStore();
  const hi = language === 'hi';

  // Omit for logged-in users 
  if (user) return null;

  const isDark = variant === 'dark';

  if (minimal) {
    return (
      <div className={cn('flex items-center gap-4 py-1', className)}>
        {/* Telegram Icon Only */}
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href="https://t.me/upsc_zenscroll_support_agent_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm transition-colors hover:bg-sky-600"
          title="Join Telegram"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.a>
 
        {/* YouTube Icon Only */}
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href="https://www.youtube.com/@UPSCZEN-s8w"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700"
          title="Watch YouTube Shorts"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V16C22 18.2091 20.2091 20 18 20H6C3.79086 20 2 18.2091 2 16V8Z" fill="currentColor" />
            <path d="M10 9L15 12L10 15V9Z" fill="white" />
          </svg>
        </motion.a>
      </div>
    );
  }

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
      <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-8">
        {/* Telegram Link */}
        <motion.a
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          href="https://t.me/upsc_zenscroll_support_agent_bot"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group relative flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 transition-all md:w-auto md:min-w-[200px]',
            isDark
              ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:bg-sky-500/20'
              : 'bg-gradient-to-br from-sky-50 to-sky-100/50 text-sky-700 shadow-sm border border-sky-100 hover:from-sky-100 hover:to-sky-200 hover:shadow-md'
          )}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-300/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
            >
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute inset-0 animate-ping rounded-xl bg-sky-400 opacity-15" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-tight">
              {hi ? 'टेलीग्राम' : 'Telegram'}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold tracking-tight',
                isDark ? 'text-sky-500' : 'text-sky-600'
              )}
            >
              {hi ? 'जॉइन मिशन 2026' : 'Join Mission 2026'}
            </span>
          </div>
        </motion.a>

        {/* YouTube Link */}
        <motion.a
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          href="https://www.youtube.com/@UPSCZEN-s8w"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group relative flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 transition-all md:w-auto md:min-w-[200px]',
            isDark
              ? 'bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-red-500/20'
              : 'bg-gradient-to-br from-red-50 to-red-100/50 text-red-700 shadow-sm border border-red-100 hover:from-red-100 hover:to-red-200 hover:shadow-md'
          )}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-300/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
            >
              <path
                d="M2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V16C22 18.2091 20.2091 20 18 20H6C3.79086 20 2 18.2091 2 16V8Z"
                fill="currentColor"
              />
              <path d="M10 9L15 12L10 15V9Z" fill="white" />
            </svg>
            <span className="absolute inset-0 animate-ping rounded-xl bg-red-400 opacity-15" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-tight">{hi ? 'यूट्यूब' : 'YouTube'}</span>
            <span
              className={cn(
                'text-[10px] font-bold tracking-tight',
                isDark ? 'text-red-500' : 'text-red-600'
              )}
            >
              {hi ? 'शॉर्ट्स देखें' : 'Expert Shorts'}
            </span>
          </div>
        </motion.a>
      </div>
    </div>
  );
}
