'use client';

import { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, Eye, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ExpandableCard } from './shared/ExpandableCard';
import { UnitBadge, CountBadge } from './shared/UnitBadge';
import { formatUnitTitle } from './shared/constants';
import { QuestionList, QuestionData } from './QuestionItem';
import { TopicStat } from '@/actions/pyq-analytics';
import { TransitionLink } from '@/components/ui/transition-link';

interface MostRepeatedTopicsProps {
  topicStats: Record<string, TopicStat[]>;
  combinedStats: Record<string, { unitTitle: string }>;
  isHindi: boolean;
  isPro?: boolean;
}

export function MostRepeatedTopics({ topicStats, combinedStats, isHindi, isPro = false }: MostRepeatedTopicsProps) {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [showAllQuestions, setShowAllQuestions] = useState<Record<string, boolean>>({});

  const toggleUnit = (unitKey: string) => {
    setExpandedUnit((prev) => {
      if (prev === unitKey) return null;
      setExpandedTopic(null); // Reset topic when switching units
      return unitKey;
    });
  };

  const toggleTopic = (topicKey: string) => {
    setExpandedTopic((prev) => (prev === topicKey ? null : topicKey));
  };

  const toggleShowAll = (topicKey: string) => {
    setShowAllQuestions((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
  };

  const header = (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium tracking-wider text-slate-400 uppercase">
        <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
        {isHindi ? 'पैटर्न' : 'Patterns'}
      </div>
      <h3 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        <BrainCircuit className="h-7 w-7 text-pink-400" />
        {isHindi ? 'सबसे ज्यादा दोहराए गए टॉपिक्स' : 'Most Repeated Topics'}
      </h3>
    </div>
  );

  return (
    <ExpandableCard
      id="most-repeated-topics"
      header={header}
      gradientFrom="from-pink-500/20"
      gradientTo="to-rose-500/20"
    >
      <CardContent className="px-0 py-4 sm:px-0 sm:py-8">
        <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-4 lg:grid-cols-3 lg:px-6">
          {Object.entries(topicStats).map(([unitKey, topics]) => {
            const isUnitExpanded = expandedUnit === unitKey;
            const unitTitle = combinedStats[unitKey]?.unitTitle || '';

            return (
              <div
                key={unitKey}
                className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 transition-colors duration-300 hover:bg-slate-800/60"
              >
                {/* Unit Header */}
                <div
                  className="flex min-h-[140px] cursor-pointer flex-col justify-between gap-3 border-b border-slate-700/50 bg-white/5 p-5 transition-colors hover:bg-white/10 sm:p-6"
                  onClick={() => toggleUnit(unitKey)}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UnitBadge unitId={unitKey} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
                          {formatUnitTitle(unitKey)}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {unitTitle}
                        </p>
                      </div>
                    </div>
                    {isUnitExpanded ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-pink-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                  </div>

                  {!isUnitExpanded && (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      {topics
                        .slice(0, 3)
                        .map((t) => (isHindi ? t.topicTitle : t.topicTitleEn || t.topicTitle))
                        .join(', ')}
                      {topics.length > 3 && (isHindi ? ` +${topics.length - 3} और` : ` +${topics.length - 3} more`)}
                    </p>
                  )}
                </div>

                {/* Expanded Topics */}
                <AnimatePresence>
                  {isUnitExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-[400px] space-y-0 overflow-y-auto p-0">
                        {topics.map((topic, idx) => {
                          const topicKey = `${unitKey}-${topic.topicTitle}`;
                          const isTopicExpanded = expandedTopic === topicKey;
                          const topicTitle = isHindi
                            ? topic.topicTitle
                            : topic.topicTitleEn || topic.topicTitle || 'Untitled Topic';

                          // Map topic questions to QuestionData
                          const questions: QuestionData[] = topic.questions.map((q) => ({
                            id: q.id,
                            text: q.text,
                            textEn: q.textEn,
                            year: q.year,
                            qNo: q.qNo,
                            explanation: q.explanation,
                            explanationEn: q.explanationEn,
                          }));

                          return (
                            <div key={idx} className="border-b border-slate-700/30 last:border-b-0">
                              {/* Topic Header */}
                              <div
                                className="flex w-full cursor-pointer items-start justify-between p-4 transition-colors hover:bg-white/5 sm:p-5"
                                onClick={() => toggleTopic(topicKey)}
                              >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-mono text-xs text-slate-500">
                                    {idx + 1}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-sm font-bold leading-relaxed transition-colors sm:text-base',
                                      isTopicExpanded ? 'text-pink-400' : 'text-slate-300'
                                    )}
                                  >
                                    {topicTitle}
                                  </span>
                                </div>
                                <div className="ml-3 flex shrink-0 items-center gap-2">
                                  <CountBadge count={topic.count} />
                                  {isTopicExpanded ? (
                                    <ChevronUp className="h-5 w-5 shrink-0 text-pink-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-600" />
                                  )}
                                </div>
                              </div>

                              {/* Topic Questions */}
                              <AnimatePresence>
                                {isTopicExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-slate-950/40">
                                      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                                        <span className="text-sm font-bold text-pink-300 line-clamp-1">
                                          {topicTitle}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleShowAll(topicKey);
                                            }}
                                            className="h-7 gap-1 px-2 text-xs text-slate-400 hover:bg-white/10"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            {showAllQuestions[topicKey]
                                              ? (isHindi ? 'संक्षिप्त' : 'Collapse')
                                              : (isHindi ? 'विस्तार' : 'Expand')}
                                          </Button>
                                          <TransitionLink
                                            href={`/syllabus/quiz/pyq/intelligence/questions?topic=${encodeURIComponent(topic.topicSlug)}&source=topic&unit=${unitKey}`}
                                            onClick={(e) => e.stopPropagation()}
                                            transitionTypes={['slide']}
                                            className="inline-flex h-7 items-center gap-1 rounded-md bg-pink-500/10 px-2 text-xs font-bold text-pink-400 hover:bg-pink-500/20"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            {isHindi ? 'पेज' : 'View Page'}
                                          </TransitionLink>
                                        </div>
                                      </div>
                                      <div className="px-4 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:px-5">
                                        {isHindi ? 'प्रश्न' : 'Questions'} ({questions.length})
                                      </div>
                                      <QuestionList
                                        questions={questions}
                                        isHindi={isHindi}
                                        showYears={true}
                                        variant="compact"
                                        showAllExpanded={showAllQuestions[topicKey]}
                                        isPro={isPro}
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </CardContent>
    </ExpandableCard>
  );
}
