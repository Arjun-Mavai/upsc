'use client';

import { useState } from 'react';
import { SubjectDistributionStats, UnitDistributionStats, RepeatedQuestion, TopicStat, OverallWeightageSubjectData } from '@/actions/pyq-analytics';
import PYQIntelligenceModernClient from './PYQIntelligenceModernClient';
import PYQIntelligenceClassicClient from './PYQIntelligenceClassicClient';

interface PYQIntelligenceClientProps {
  examId?: string;
  subjectStats: SubjectDistributionStats[];
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  topicStats: Record<string, TopicStat[]>;
  simpleSubjectStats: Record<string, number>;
  subjectQuestionsData: OverallWeightageSubjectData[];
  isPro?: boolean;
}

export default function PYQIntelligenceClient(props: PYQIntelligenceClientProps) {
  const [isModern, setIsModern] = useState(true);

  if (isModern) {
    return (
      <PYQIntelligenceModernClient 
        {...props} 
        onToggleMode={() => setIsModern(false)} 
      />
    );
  }

  return (
    <div className="relative">
      {/* Floating Toggle Button for Classic to Modern */}
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <button
          onClick={() => setIsModern(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-black tracking-widest text-white shadow-xl backdrop-blur-xl transition hover:bg-slate-800"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          MODERN VIEW
        </button>
      </div>
      <PYQIntelligenceClassicClient {...props} />
    </div>
  );
}
