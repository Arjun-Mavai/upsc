'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Lightbulb, ThumbsDown, HelpCircle, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { submitIntelligenceFeedback, type IntelligenceReaction } from '@/actions/intelligence-actions';
import { useSettingsStore } from '@/store/useSettingsStore';
import { toast } from 'sonner';

interface QuickFeedbackProps {
  questionId: string;
  questionText: string;
  guestMobile?: string;
  guestName?: string;
  testId?: string;
  source?: string; // 'expert_analysis', 'open_paper_view', etc.
  className?: string;
  unitInfo?: string;
}

export function QuickFeedback({
  questionId,
  questionText,
  guestMobile,
  guestName,
  testId,
  source,
  className,
  unitInfo,
}: QuickFeedbackProps) {
  const { isSubscribed, user, guestLead } = useSettingsStore();
  const [reaction, setReaction] = useState<IntelligenceReaction | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // 🎯 FALLBACK: Use guest data ONLY if no authenticated user
  // If user is logged in, use user's phone, never guest phone (prevents misattribution)
  const finalGuestMobile = user ? user.phone : (guestMobile || guestLead?.phone);
  const finalGuestName = user ? undefined : (guestName || guestLead?.name);
  
  // ⚡ OPTIMISTIC UI: Show reaction instantly
  const [optimisticReaction, setOptimisticReaction] = useOptimistic<IntelligenceReaction | null, IntelligenceReaction | null>(
    reaction,
    (_, newState) => newState
  );

  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const userAccessGrants = (user as any)?.accessGrants || [];
  const hasPre = userAccessGrants.includes('upsc_pre') || userAccessGrants.includes('mppsc_pre');
  const hasMains = userAccessGrants.includes('upsc_mains') || userAccessGrants.includes('mppsc_mains');

  let grantsInfo = 'Guest';
  if (user) {
    let typeLabel = 'Free / None';
    if (hasPre && hasMains) {
      typeLabel = 'Combo';
    } else if (hasPre) {
      typeLabel = 'Pre-Only';
    } else if (hasMains) {
      typeLabel = 'Mains-Only';
    }
    grantsInfo = `${typeLabel} (${JSON.stringify(userAccessGrants)})`;
  }


  const onReact = async (type: IntelligenceReaction) => {
    // Toggle logic for Unhelpful and Doubt (need comment box, so not purely backgrounded yet)
    if (type === 'unhelpful' || type === 'doubt') {
      if (reaction === type) {
        setShowFeedbackBox(!showFeedbackBox);
        return;
      }
      setReaction(type);
      setShowFeedbackBox(true);
      return;
    }

    // Normal submission (Helpful / Insightful)
    if (reaction === type) return;

    // 🚀 INSTANT UI UPDATE
    startTransition(() => {
      setOptimisticReaction(type);
      setReaction(type);
      toast.success('Thanks for the feedback!', {
        icon: <Check className="h-4 w-4 text-emerald-500" />,
        duration: 2000,
      });
    });

    try {
      // FIRE AND FORGET (Background)
      submitIntelligenceFeedback({
        questionId,
        questionText,
        testId,
        reaction: type,
        isPro: isSubscribed,
        source,
        userId: user?.id,
        userName: user?.name || finalGuestName || undefined,
        userEmail: user?.email || undefined,
        guestMobile: finalGuestMobile || user?.phone || undefined,
        unitInfo,
        userGrants: grantsInfo,
      }).catch(e => console.error('Reaction submission failed', e));
    } catch (e) {
      // Construction error
    }
  };

  const submitWithComment = async () => {
    if (isPending) return;
    
    // Optimistic close
    setShowFeedbackBox(false);
    toast.success('Feedback saved. We will improve this!', {
      icon: <Check className="h-4 w-4 text-rose-500" />,
    });

    try {
      submitIntelligenceFeedback({
        questionId,
        questionText,
        testId,
        reaction: reaction || 'doubt',
        message: feedbackMsg,
        isPro: isSubscribed,
        source,
        userId: user?.id,
        userName: user?.name || finalGuestName || undefined,
        userEmail: user?.email || undefined,
        guestMobile: finalGuestMobile || user?.phone || undefined,
        unitInfo,
        userGrants: grantsInfo,
      }).catch(e => console.error('Comment submission failed', e));
      
      setFeedbackMsg('');
    } catch (e) {
      // Fail
    }
  };

  return (
    <div className={cn('mt-6 flex flex-col items-center gap-3', className)}>
      <div className="flex items-center gap-1.5 rounded-full border border-slate-400/20 bg-slate-400/10 p-1.5 shadow-sm">
        <p className="px-2 text-[9px] font-black tracking-widest text-slate-500 uppercase">
          Helpful?
        </p>
        
        <div className="flex items-center gap-1">
          <ReactionButton
            icon={<ThumbsUp className="h-3.5 w-3.5" />}
            active={optimisticReaction === 'helpful'}
            onClick={() => void onReact('helpful')}
            submitting={false}
            disabled={false}
            activeColor="bg-emerald-500"
          />
          <ReactionButton
            icon={<Lightbulb className="h-3.5 w-3.5" />}
            active={optimisticReaction === 'insightful'}
            onClick={() => void onReact('insightful')}
            submitting={false}
            disabled={false}
            activeColor="bg-amber-400"
          />
          <ReactionButton
            icon={<ThumbsDown className="h-3.5 w-3.5" />}
            active={optimisticReaction === 'unhelpful'}
            onClick={() => void onReact('unhelpful')}
            submitting={false}
            disabled={false}
            activeColor="bg-rose-500"
          />
          <ReactionButton
            icon={<HelpCircle className="h-3.5 w-3.5" />}
            active={optimisticReaction === 'doubt'}
            onClick={() => void onReact('doubt')}
            submitting={false}
            disabled={false}
            activeColor="bg-blue-500"
          />
        </div>
      </div>

      <AnimatePresence>
        {showFeedbackBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-rose-100 bg-white dark:border-rose-900/50 dark:bg-slate-900 p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-rose-900 uppercase tracking-tight">How can we improve this?</p>
              <button 
                onClick={() => setShowFeedbackBox(false)} 
                className="rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              placeholder="Tell us what's missing or wrong..."
              className="min-h-[70px] w-full rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-800"
            />
            <Button
              size="sm"
              disabled={!feedbackMsg.trim()}
              onClick={submitWithComment}
              className="h-9 w-full rounded-xl bg-rose-600 text-[10px] font-black uppercase tracking-wider text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20"
            >
              Submit Feedback
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReactionButton({
  icon,
  active,
  onClick,
  submitting,
  disabled,
  activeColor,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  submitting: boolean;
  disabled: boolean;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 active:scale-90',
        active ? cn(activeColor, 'text-white shadow-md') : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 hover:shadow-sm'
      )}
    >
      {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
      {active && (
        <motion.span
          layoutId="reaction-ring"
          className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-current"
        />
      )}
    </button>
  );
}
