'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Copy,
  CheckCircle2,
  Download,
  Quote,
  Sparkles,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ExitSurveyModal } from './ExitSurveyModal';
import { contactEmail } from '@/app/contact/page';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailCopied, setEmailCopied] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const queryAmount = searchParams.get('amount');
  const [amount, setAmount] = useState(queryAmount || '99');

  useEffect(() => {
    if (queryAmount) {
      setAmount(queryAmount);
    }
  }, [queryAmount]);

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const displayAmount = `${currencySymbol}${amount}`;
  const planName =
    amount === '299'
      ? 'Premium Yearly Plan'
      : amount === '199'
        ? 'Upgrade to Pro'
        : 'Basic Yearly Plan';
  // Calculate original price
  const originalAmount =
    amount === '299'
      ? `${currencySymbol}799`
      : amount === '199'
        ? `${currencySymbol}499`
        : `${currencySymbol}299`;
  const discount = amount === '299' ? '63% OFF' : amount === '199' ? '60% OFF' : '67% OFF';

  // Back Navigation Interception
  const [showExitModal, setShowExitModal] = useState(false);
  const isSurveyCompleted =
    typeof window !== 'undefined' ? localStorage.getItem('payment_exit_survey_completed') : null;
  const handlePopStateRef = useRef<((event: PopStateEvent) => void) | null>(null);

  useEffect(() => {
    // If already surveyed, no need to intercept
    if (isSurveyCompleted) return;

    // Push state to detect back button
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Check FRESH value from localStorage (in case it changed)
      const currentStatus = localStorage.getItem('payment_exit_survey_completed');

      if (!currentStatus) {
        // Prevent back, show modal
        window.history.pushState(null, '', window.location.href);
        setShowExitModal(true);
      }
    };

    handlePopStateRef.current = handlePopState;
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSurveyCompleted]);

  const handleConfirmExit = () => {
    setShowExitModal(false);
    localStorage.setItem('payment_exit_survey_completed', 'true');

    // Remove listener immediately to prevent interception
    if (handlePopStateRef.current) {
      window.removeEventListener('popstate', handlePopStateRef.current);
    }

    // Force navigation back
    router.back();
  };

  const paymentEmail = contactEmail;
  const paymentSubject = `Payment Confirmation - ${planName}`;
  const paymentBody = `Dear Team,

I have made the payment for the ${planName} (${displayAmount}).

Payment Details:
- Amount: ${displayAmount}
- Plan: ${planName}
- Payment Method: UPI/QR Code / Manual Transfer

Please find the payment screenshot attached.

Thank you,
[Your Name]`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const openEmailClient = () => {
    const mailtoLink = `mailto:${paymentEmail}?subject=${encodeURIComponent(paymentSubject)}&body=${encodeURIComponent(paymentBody)}`;
    window.open(mailtoLink);
  };

  const openTelegramBot = () => {
    window.open('https://t.me/UPSC_Support_Bot', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <ExitSurveyModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onConfirmExit={handleConfirmExit}
      />

      {/* Header */}
      <nav className="fixed z-50 w-full border-b border-white/20 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/syllabus" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg transition-transform group-hover:scale-105">
              <Quote size={18} fill="currentColor" className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Mindful</span>
          </Link>
          <button onClick={() => setShowExitModal(true)}>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Syllabus
            </Button>
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl space-y-12 px-4 pt-32 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="space-y-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
            <Sparkles className="h-3 w-3" />
            {amount === '299' || amount === '199' ? 'Premium Access' : 'Basic Access'}
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            {amount === '299' || amount === '199'
              ? 'Unlock Complete Mastery'
              : 'Unlock Syllabus Access'}
          </h1>
          <p className="mx-auto max-w-lg text-lg text-slate-600">
            {amount === '299' || amount === '199'
              ? 'Get yearly access to 10 units, Quizzes, Mock Tests, and Smart Analytics.'
              : 'Get yearly access to all 10 units of the UPSC Syllabus with detailed notes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* Left Column: QR Code & Amount */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/50"
          >
            <div className="space-y-6 rounded-[20px] bg-slate-50/50 p-6 text-center md:p-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Scan & Pay</h2>
                <p className="text-sm text-slate-500">Use any UPI app to complete payment</p>
              </div>

              <div className="group relative mx-auto h-64 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-50 blur-xl transition-all group-hover:blur-2xl"></div>
                <Image
                  src="/arjun-qrcode.jpg"
                  alt="Payment QR Code"
                  className="relative z-10 h-full w-full rounded-lg object-cover"
                  height={256}
                  width={256}
                  priority
                />
              </div>

              <div className="flex items-center justify-center gap-2 rounded-full border border-slate-100 bg-white/60 p-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> UPI
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> GPay
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> PhonePe
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-4">
                <div className="flex items-center justify-between px-4 pb-2">
                  <span className="text-sm font-medium text-slate-500">Amount to pay</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-slate-400 line-through decoration-slate-400/50">
                      {originalAmount}
                    </span>
                    <span className="text-3xl font-extrabold text-indigo-600">{displayAmount}</span>
                    <span className="rounded-full border border-green-200 bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                      {discount}
                    </span>
                  </div>
                </div>
                <a
                  href="/arjun-qrcode.jpg"
                  download="Syllabus_QR.jpg"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  <Download className="h-3 w-3" /> Download QR
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Instructions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                  2
                </div>
                <h3 className="font-bold text-slate-900">Send Payment Screenshot</h3>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-600">
                Congratulations on taking the first step! 🎉 <br />
                Please send the screenshot to activate your account immediately.
              </p>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <Button
                  onClick={openEmailClient}
                  className="h-10 w-full rounded-lg bg-slate-900 font-bold text-white shadow-md hover:bg-slate-800"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Via Email
                </Button>
                <Button
                  onClick={openTelegramBot}
                  className="h-10 w-full rounded-lg bg-[#2AABEE] font-bold text-white shadow-md hover:bg-[#229ED9]"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Via Bot
                </Button>
              </div>

              <div className="space-y-3">
                <div
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-100 hover:bg-indigo-50/30"
                  onClick={openEmailClient}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Email to
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {paymentEmail}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 group-hover:text-indigo-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(paymentEmail, 'Email');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-100 hover:bg-indigo-50/30">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                      <Quote className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Subject
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {paymentSubject}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 group-hover:text-indigo-600"
                    onClick={() => copyToClipboard(paymentSubject, 'Subject')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-medium text-slate-400">
                We usually reply within 10 minutes on the Bot! ⚡️
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-200"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>

              <div className="relative z-10 flex items-start gap-4">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-bold">Activation Promise</h3>
                  <p className="text-sm leading-relaxed text-indigo-100">
                    We verify payments manually to ensure security. Within{' '}
                    <span className="font-bold text-white">24 hours</span>, you will receive an
                    email with your{' '}
                    <span className="font-bold text-white">username & password</span> to access the
                    full syllabus.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
          Loading secure gateway...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
