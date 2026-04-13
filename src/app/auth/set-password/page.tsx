'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, LockKeyhole, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Need at least one lowercase letter')
      .regex(/[A-Z]/, 'Need at least one uppercase letter')
      .regex(/\d/, 'Need at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-slate-400'}`}
    >
      {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const pwd = form.watch('password');
  const rules = [
    { met: pwd.length >= 8, label: '8+ characters' },
    { met: /[a-z]/.test(pwd), label: 'One lowercase (a-z)' },
    { met: /[A-Z]/.test(pwd), label: 'One uppercase (A-Z)' },
    { met: /\d/.test(pwd), label: 'One number (0-9)' },
  ];

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to set password');
      }

      const data = await res.json();
      setIsSuccess(true);
      toast.success(`Password set! Your ${data.planTier || ''} plan is active.`);
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      logger.error('Set password failed', error, {
        category: 'auth',
        metadata: { component: 'SetPasswordPage' },
      });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 inline-block rounded-full bg-red-100 p-3 text-red-600">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-red-600">Invalid Link</h1>
          <p className="mt-2 text-sm text-slate-500">
            This link is invalid or has expired. Please contact support or request a new one.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-lg">
          <div className="mb-4 inline-block rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">You&apos;re All Set! 🎉</h2>
          <p className="mb-4 text-sm text-slate-500">
            Your password has been set and your premium plan is now active. Start your UPSC
            preparation!
          </p>
          <p className="text-xs text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-block rounded-full bg-slate-900 p-3 text-white">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set Your Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a secure password to access your UPSC premium account.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...form.register('password')}
                className="border-slate-300 pr-10 focus:border-slate-900 focus:ring-slate-900"
                placeholder="Min 8 chars, Aa, 0-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-90"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
            )}
            {pwd.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {rules.map((r) => (
                  <PasswordRule key={r.label} met={r.met} label={r.label} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                {...form.register('confirmPassword')}
                className="border-slate-300 pr-10 focus:border-slate-900 focus:ring-slate-900"
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-90"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Password...
              </>
            ) : (
              'Set Password & Activate Account'
            )}
          </Button>

          <p className="text-center text-[11px] text-slate-400">
            By setting your password, your premium plan gets activated immediately.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
