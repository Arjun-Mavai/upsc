'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Shield, BookOpen, Target, BarChart3, Sparkles, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { verifyPayment, startPayment } from '@/actions/payment-actions';
import { checkEmailExists } from '@/actions/email-actions';
import { getCurrentUser } from '@/actions/auth-actions';
import { trackFbStandardEvent } from '@/lib/analytics/facebook-pixel';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  source: z.string().optional(),
});

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType?: 'pro' | 'upgrade';
  planName?: string;
  examId?: string;
}

const UPSC_FACTS = [
  { icon: BookOpen, text: 'UPSC Prelims has 100 MCQs in GS Paper 1' },
  { icon: BarChart3, text: 'Practice tests improve scores by up to 30%' },
  { icon: Target, text: 'Environment & Economy are high-scoring in UPSC Prelims' },
  { icon: Target, text: '10 lakh+ students appear for UPSC every year' },
  { icon: Brain, text: 'Indian History covers 15-20% of Prelims questions' },

  { icon: Sparkles, text: 'UPSC 2026 Prelims expected date is May 2026' },
  { icon: BookOpen, text: 'GS Paper 2 (CSAT) is qualifying — 33% needed' },

  { icon: Brain, text: 'Current Affairs covers 20-25% of questions' },
];


/**
 * PaymentModal Component - The Gateway to Premium 🚀
 *
 * Bhai, ye component pure payment flow ka heart h. Isme humne best UX practices follow ki h:
 * 1. **Zero-Freeze Guarantee**: Radix Dialog ka overlay Razorpay popup ko block karta tha.
 *    Humne 'smart-toggle' logic lagaya h: Dialog close -> Razorpay Open -> Dialog Re-open.
 * 2. **State Preservation**: Dialog close hone par React state udd jaati h. Isliye humne `useRef`
 *    use kiya h (userIdRef, formValuesRef) taaki data persist rahe jab dialog wapas aaye.
 * 3. **Engaging Loading State**: User bore na ho isliye UPSC ke amazing facts rotate hote h
 *    jab tak payment verify ho raha h.
 */
import { useSettingsStore } from '@/store/useSettingsStore';

export function PaymentModal({
  open,
  onOpenChange,
  planType = 'pro',
  planName = 'Pro Plan',
  examId = 'upsc',
}: PaymentModalProps) {
  const { user, setUser } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);

  // Bhai, ye phases users ko batate h ki abhi background me kya chal raha h.
  // Transparancy = Trust. 🤝
  const [loadingPhase, setLoadingPhase] = useState<
    'registering' | 'razorpay-open' | 'verifying' | null
  >(null);
  const [factIndex, setFactIndex] = useState(0);
  const [emailCheckInProgress, setEmailCheckInProgress] = useState(false);
  const router = useRouter();

  // 💡 LEARNING MOMENT:
  // Jab hum Razorpay ke liye dialog close karte h, to ye component unmount ho sakta h ya state reset ho sakti h.
  // `useRef` ka data re-renders aur unmounts ke beech me bhi zinda rehta h (agar component memory me h).
  // Ye rock-solid solution h data loss bachane ka! 🛡️
  const formValuesRef = useRef<z.infer<typeof formSchema> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
      source: '',
    },
  });

  // Update form if user loads late
  useEffect(() => {
    if (user) {
      form.setValue('name', user.name || '');
      form.setValue('email', user.email || '');
      if ((user as any).phone) form.setValue('phone', (user as any).phone);
    }
  }, [user, form]);

  // Check if email already has a plan (for inline validation when user enters details)
  const checkEmailHasPlan = useCallback(
    async (emailVal: string) => {
      const normalized = (emailVal || '').toLowerCase().trim();
      if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
      const isSameUser = !!user && user.email?.toLowerCase().trim() === normalized;
      if (isSameUser) return false;
      try {
        // ✅ Server Action instead of fetch!
        const data = await checkEmailExists(normalized);
        if (data.error) return false;
        const tier = (data.planTier ?? '').toLowerCase();
        return !!(data.exists && (tier === 'lite' || tier === 'pro' || data.isSubscribed === true));
      } catch {
        return false;
      }
    },
    [user]
  );

  const onEmailBlur = useCallback(async () => {
    const emailVal = form.getValues('email');
    const normalized = (emailVal || '').toLowerCase().trim();
    if (!normalized || !!user?.email) return;
    setEmailCheckInProgress(true);
    const hasPlan = await checkEmailHasPlan(emailVal);
    setEmailCheckInProgress(false);
    if (hasPlan) {
      form.setError('email', {
        type: 'manual',
        message:
          'This email is already registered with a plan. Please log in to access your account.',
      });
    } else {
      form.clearErrors('email');
    }
  }, [form, user, checkEmailHasPlan]);

  // ⚡ Performance Tip: Razorpay SDK ko dynamically load karte h taaki initial page load slow na ho.
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 🎡 Engagement: Jab tak "Waiting for Razorpay" ya verification ho, tab tak facts dikhao.
  const activeFacts = UPSC_FACTS;

  useEffect(() => {
    if (!isLoading || loadingPhase === 'razorpay-open') return;
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % activeFacts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading, loadingPhase, activeFacts.length]);

  const getLoadingMessage = useCallback(() => {
    switch (loadingPhase) {
      case 'registering':
        return user ? 'Setting up payment...' : 'Creating your account...';
      case 'verifying':
        return 'Verifying your payment...';
      default:
        return 'Processing...';
    }
  }, [loadingPhase, user]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLoadingPhase('registering');
      formValuesRef.current = values;

      // Block if this email already has lite/pro (without same-user login) — validation at submit time
      const emailToCheck = (values.email || '').toLowerCase().trim();
      const isLoggedInWithSameEmail = !!user && user.email?.toLowerCase().trim() === emailToCheck;
      if (!isLoggedInWithSameEmail && emailToCheck) {
        // ✅ Server Action instead of fetch!
        const checkRes = await checkEmailExists(emailToCheck);
        if (!checkRes.error) {
          const tier = (checkRes.planTier ?? '').toLowerCase();
          const hasPaidPlan =
            checkRes.exists &&
            (tier === 'lite' || tier === 'pro' || checkRes.isSubscribed === true);
          if (hasPaidPlan) {
            form.setError('email', {
              type: 'manual',
              message:
                'This email is already registered with a plan. Please log in to access your account.',
            });
            toast.error(
              'This email is already registered with a plan. Please log in to access your account.'
            );
            setIsLoading(false);
            setLoadingPhase(null);
            return;
          }
        }
        form.clearErrors('email');
      }

      // 🚀 Server Action: Register + Create Order in ONE call
      const startRes = await startPayment({ ...values, planType });

      // Server-side block: existing lite/pro must be same logged-in user
      if (!startRes.success || !startRes.data) {
        toast.error(startRes.error || 'Failed to start payment');
        setIsLoading(false);
        setLoadingPhase(null);
        return;
      }

      // TypeScript: After error check, userId and order are guaranteed to exist
      const { userId, order: orderData } = startRes.data;
      userIdRef.current = userId;

      // Launch Razorpay
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

      // 🛑 CRITICAL FIX: The "Freeze" Solver
      // Radix UI ka Dialog `z-index: 50` par hota h aur screen block karta h.
      // Razorpay bhi overlay banata h. Dono ladte h to user click nahi kar pata.
      // Solution: Hum apna Dialog chhupa dete h (onOpenChange(false)) jab Razorpay khulta h.
      setLoadingPhase('razorpay-open');
      onOpenChange(false);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'UPSC ZEN',
        description: planName,
        order_id: orderData.id,
        prefill: { name: values.name, email: values.email, contact: values.phone },
        theme: { color: '#000000' },
        // Handler tab chalta h jab payment success hota h
        handler: async function (response: any) {
          try {
            // Wapas Dialog kholo for "Verification" state
            setLoadingPhase('verifying');
            onOpenChange(true);

            // 🔒 SECURITY UPGRADE: Server Action instead of API route!
            // userId from JWT if logged in, else from startPayment (verified against order)
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userIdRef.current || undefined, // Fallback for new users without JWT
            });

            if (verifyResult.error) {
              throw new Error(verifyResult.error);
            }

            // 🔥 CACHE INVALIDATION MAGIC: Update local store immediately
            // This ensures user sees "Pro" badge everywhere instantly without reload
            if (user) {
              // If we have previous user object, update it
              // Fix TypeScript: Ensure planTier is properly typed
              const updatedPlan = (verifyResult.planTier as 'free' | 'lite' | 'pro') || 'pro';
              setUser({ ...user, planTier: updatedPlan, isSubscribed: true }, true);
            }
            // 🔒 Server Action: Re-fetch user data (no API visible!)
            const meData = await getCurrentUser();
            if (meData?.user) {
              const u = {
                ...meData.user,
                role: meData.user.role ?? undefined,
                isSubscribed: meData.user.isSubscribed ?? undefined,
                planTier: meData.user.planTier ?? undefined,
              };
              setUser(u, true);
            }
            router.refresh();

            // 🎯 Track Purchase Facebook Event
            trackFbStandardEvent('Purchase', {
              value: Number(orderData.amount) / 100,
              currency: orderData.currency,
            });

            toast.success('Payment successful! 🎉');

            // Sab clean up karke Thank You page par bhejo
            onOpenChange(false);
            setIsLoading(false);
            setLoadingPhase(null);

            const displayPlan = planType === 'upgrade' ? 'pro' : verifyResult.planTier || planType;
            const upgradeParam = planType === 'upgrade' ? '&type=upgrade' : '';
            router.push(
              `/thank-you?plan=${displayPlan}&email=${encodeURIComponent(values.email)}&name=${encodeURIComponent(values.name)}${upgradeParam}`
            );
          } catch (error) {
            console.error(error);
            toast.error('Payment verification failed. Please contact support.');
            onOpenChange(false);
            setIsLoading(false);
            setLoadingPhase(null);
          }
        },
        modal: {
          ondismiss: function () {
            // Agar user ne Razorpay close kar diya bina pay kiye
            setIsLoading(false);
            setLoadingPhase(null);
            toast.info('Payment cancelled');
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Something went wrong');
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  // Don't render dialog when Razorpay is active (dialog is closed anyway)
  if (loadingPhase === 'razorpay-open' && !open) return null;

  const showLoading = isLoading && loadingPhase !== 'razorpay-open';
  const CurrentFactIcon = activeFacts[factIndex].icon;

  // Determine if we should show the "Simplified" view for logged in users (Lite upgrade / renew)
  // Session se data lete h — form nahi; direct paywall. Phone required by Razorpay; if missing we show form for phone only.
  const isUserReady = !!user && !!(user.phone ?? (user as any).phone);

  return (
    <Dialog open={open} onOpenChange={showLoading ? undefined : onOpenChange} modal={false}>
      <DialogContent className="border-zinc-200 bg-white text-black sm:max-w-[425px]">
        {showLoading ? (
          // ── Loading State: UPSC facts while API calls process ──
          <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
            <DialogTitle
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0,
              }}
            >
              Processing Payment
            </DialogTitle>
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-100 border-t-black" />
              <Shield className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-black" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900">{getLoadingMessage()}</p>
            </div>

            {/* UPSC Fact Card */}
            <div className="w-full rounded-lg border border-zinc-100 bg-zinc-50 p-4 transition-all duration-500">
              <p className="mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Did you know?
              </p>
              <div className="flex items-start gap-3 text-left">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5">
                  <CurrentFactIcon className="h-4 w-4 text-zinc-600" />
                </div>
                <p className="text-sm leading-snug text-zinc-700">{activeFacts[factIndex].text}</p>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-1">
              {activeFacts.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === factIndex ? 'w-4 bg-black' : 'w-1 bg-zinc-200'}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Shield className="h-3 w-3" />
              <span>256-bit SSL Encrypted • Razorpay Secure</span>
            </div>
          </div>
        ) : (
          // ── Form State ──
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Upgrade to Premium</DialogTitle>
              <DialogDescription className="text-zinc-500">
                {isUserReady
                  ? 'Confirm your details to proceed.'
                  : 'Enter your details to proceed with the payment.'}
              </DialogDescription>
            </DialogHeader>

            {isUserReady ? (
              // SIMPLIFIED VIEW FOR LOGGED IN USERS
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                    <p className="text-xs text-zinc-500">{user?.phone ?? (user as any)?.phone}</p>
                  </div>
                </div>
                <Button
                  onClick={() => onSubmit(form.getValues())}
                  className="mt-4 w-full bg-black py-2 font-bold text-white hover:bg-zinc-800"
                  disabled={isLoading}
                >
                  {`Pay — ${planName}`}
                </Button>
              </div>
            ) : (
              // FULL FORM FOR GUESTS Or USERS WITHOUT PHONE
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...form.register('name')}
                    // Disable if logged in
                    disabled={!!user?.name}
                    className="border-zinc-300 bg-white focus:ring-black disabled:bg-zinc-100 disabled:text-zinc-500"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...form.register('email')}
                    onBlur={() => void onEmailBlur()}
                    disabled={!!user?.email}
                    className="border-zinc-300 bg-white focus:ring-black disabled:bg-zinc-100 disabled:text-zinc-500"
                  />
                  {(form.formState.errors.email || emailCheckInProgress) && (
                    <p className="text-sm text-red-500">
                      {emailCheckInProgress ? 'Checking...' : form.formState.errors.email?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    {...form.register('phone')}
                    className="border-zinc-300 bg-white focus:ring-black"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Source dropdown not needed for upgrade/logged-in users usually, but keeping it optional */}
                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="source">How did you hear about us? (Optional)</Label>
                    <Select onValueChange={(val) => form.setValue('source', val)}>
                      <SelectTrigger className="border-zinc-300 bg-white focus:ring-black">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="friends">Friends/Family</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  className="mt-4 w-full bg-black py-2 font-bold text-white hover:bg-zinc-800"
                  disabled={isLoading}
                >
                  {`Pay — ${planName}`}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
