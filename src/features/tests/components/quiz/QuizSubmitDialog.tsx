'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Send } from 'lucide-react';

interface QuizSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  stats: {
    attempted: number;
    skipped: number;
    marked: number;
    total: number;
  };
  language: string;
}

export function QuizSubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  stats,
  language,
}: QuizSubmitDialogProps) {
  const isHindi = language === 'hi';

  const t = {
    title: isHindi ? 'क्या आप टेस्ट जमा करना चाहते हैं?' : 'Ready to Submit?',
    description: isHindi 
      ? 'एक बार जमा करने के बाद आप अपने उत्तर नहीं बदल पाएंगे।' 
      : 'You will not be able to change your answers after submission.',
    attempted: isHindi ? 'हल किए गए' : 'Attempted',
    skipped: isHindi ? 'छोड़े गए' : 'Skipped',
    marked: isHindi ? 'समीक्षा के लिए' : 'Marked',
    total: isHindi ? 'कुल प्रश्न' : 'Total Questions',
    cancel: isHindi ? 'वापस जाएं' : 'Back to Test',
    confirm: isHindi ? 'हाँ, जमा करें' : 'Yes, Submit Now',
  };

  const attemptedPercentage = (stats.attempted / stats.total) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          
          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-400" />
              {t.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-sm pt-1">
              {t.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 bg-white space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{t.attempted}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-700">{stats.attempted}</span>
                <span className="text-xs font-bold text-emerald-600/60">/ {stats.total}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t.skipped}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-700">{stats.skipped}</span>
                <span className="text-xs font-bold text-slate-400">/ {stats.total}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 transition-all col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{t.marked}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-700">{stats.marked}</span>
                <span className="text-xs font-bold text-amber-600/60">questions flagged</span>
              </div>
            </div>
          </div>

          {/* Progress Visualizer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{isHindi ? 'पूर्णता' : 'Completion'}</span>
              <span className="text-slate-900">{Math.round(attemptedPercentage)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${attemptedPercentage}%` }}
              />
            </div>
          </div>

          {/* Warning for many skipped */}
          {stats.skipped > stats.total * 0.3 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-800 leading-tight">
                {isHindi 
                  ? `आपने ${stats.skipped} प्रश्न छोड़ दिए हैं। क्या आप सुनिश्चित हैं?` 
                  : `You have skipped ${stats.skipped} questions. Are you sure you want to finish?`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 bg-white grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 order-2 sm:order-1"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={onConfirm}
            className="h-12 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 shadow-xl shadow-slate-200 order-1 sm:order-2 transition-all active:scale-95"
          >
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
