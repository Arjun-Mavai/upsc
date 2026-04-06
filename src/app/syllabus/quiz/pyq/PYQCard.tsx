'use client';

import { motion } from 'framer-motion';
import { LucideIcon, Plus, Sparkles, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';

interface PYQCardProps {
  title: string;
  subtitle?: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'pink' | 'emerald' | 'amber' | 'indigo'; // Added indigo
  onClick: () => void;
  isLocked?: boolean;
  delay?: number;
  description?: string;
}

const VARIANTS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-400',
    border: 'border-blue-100',
    shadow: 'shadow-blue-200/40',
    gradient: 'from-blue-500 to-blue-600',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    icon: 'text-pink-400',
    border: 'border-pink-100',
    shadow: 'shadow-pink-200/40',
    gradient: 'from-pink-500 to-pink-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'text-emerald-400',
    border: 'border-emerald-100',
    shadow: 'shadow-emerald-200/40',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'text-amber-400',
    border: 'border-amber-100',
    shadow: 'shadow-amber-200/40',
    gradient: 'from-amber-500 to-amber-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: 'text-indigo-400',
    border: 'border-indigo-100',
    shadow: 'shadow-indigo-200/40',
    gradient: 'from-indigo-500 to-indigo-600',
  },
};

export function PYQCard({
  title,
  subtitle,
  count,
  icon: Icon,
  color,
  onClick,
  isLocked,
  delay = 0,
  description,
}: PYQCardProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const style = VARIANTS[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        'group relative flex h-[320px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-[2.5rem] border p-6 transition-all duration-300',
        style.bg,
        style.border,
        'shadow-sm hover:shadow-2xl',
        style.shadow,
        isLocked && 'opacity-80 grayscale-[0.6]'
      )}
    >
      {/* Top Bar: Search Pill + Plus Icon */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <FolderOpen className={cn('h-3.5 w-3.5', style.icon)} />
          <span className="text-[10px] font-black tracking-wider text-slate-800 uppercase">
            {hi ? 'विषय' : 'Subjects'}
          </span>
        </div>

        <div
          className={cn('rounded-full p-2 transition-colors group-hover:bg-white/50', style.text)}
        >
          <Plus className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
        </div>
      </div>

      {/* Centered Visual (Floating Icon) */}
      <div className="relative -mt-4 flex flex-1 items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Floating Decorative Rings */}
          <div
            className={cn(
              'absolute inset-0 rounded-full opacity-20 blur-2xl',
              style.bg.replace('50', '200') // Darker blur
            )}
          />

          <div className="animate-float relative z-10 text-slate-900 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br shadow-xl',
                style.gradient
              )}
            >
              <Icon className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Content: Title & Stats */}
      <div className="relative z-10 space-y-3">
        <div>
          <h3 className="line-clamp-2 text-2xl leading-none font-black text-slate-900 transition-colors group-hover:text-slate-800">
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-white bg-white px-2.5 py-1 text-[9px] font-black tracking-widest text-slate-600 uppercase shadow-sm">
            <Sparkles className={cn('mr-1.5 h-3 w-3', style.icon)} />
            {count} {hi ? 'प्रश्न' : 'Questions'}
          </div>
        </div>
      </div>

      {/* Background Glows (Subtle) */}
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
    </motion.div>
  );
}
