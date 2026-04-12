'use client';

import { useState } from 'react';
import ViewAllQuestionsModernClient from './ViewAllQuestionsModernClient';
import ViewAllQuestionsClassicClient from './ViewAllQuestionsClassicClient';
import type { PyqQuestionListItem } from './pyqQuestionListItem';

export type { PyqQuestionListItem };

interface ViewAllQuestionsClientProps {
  examId?: string;
  unitId: string;
  unitTitle: string;
  questions: PyqQuestionListItem[];
  source: 'paper' | 'overall' | 'topic' | 'subject';
  topicTitle?: string;
  year?: number;
  subject?: string;
  isPro?: boolean;
}

export default function ViewAllQuestionsClient(props: ViewAllQuestionsClientProps) {
  const [isModern, setIsModern] = useState(true);

  if (isModern) {
    return (
      <ViewAllQuestionsModernClient 
        {...props} 
        onToggleMode={() => setIsModern(false)} 
      />
    );
  }

  return (
    <div className="relative">
      {/* Floating Toggle Button for Classic to Modern */}
      <div className="fixed top-4 right-4 z-50 sm:top-5 sm:right-6">
        <button
          onClick={() => setIsModern(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-[10px] sm:text-xs font-black tracking-widest text-white shadow-xl backdrop-blur-xl transition hover:bg-slate-800"
        >
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          MODERN VIEW
        </button>
      </div>
      <ViewAllQuestionsClassicClient {...props} />
    </div>
  );
}
