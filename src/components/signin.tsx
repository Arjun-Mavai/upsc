'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Quote, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { logger } from '@/lib/logger';
import { loginUserAction } from '@/actions/auth-actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUserAction({ email, password });

      if (data.success) {
        // Update Global Store with fresh user data
        useSettingsStore.getState().setUser(data.user as any, true);
        toast.success('Welcome back!', {
          description: 'Accessing your syllabus...',
        });

        // Wait a bit for store to sync then redirect
        setTimeout(() => {
          if (data.user?.isSubscribed) {
            window.location.href = '/syllabus/quiz/pyq';
          } else {
            window.location.href = '/';
          }
        }, 600);
      } else {
        setError(data.error || 'Login failed');
        toast.error('Login failed', {
          description: data.error || 'Please check your credentials',
        });
      }
    } catch (err) {
      logger.error('Login submit error', err, {
        category: 'auth',
        metadata: { email },
      });
      setError('Something went wrong. Please try again.');

      toast.error('Connection Error', {
        description: 'Unable to connect to server. Please check your internet connection.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans lg:grid-cols-2">
      {/* Left Side: Visuals */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/30 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-purple-500/30 blur-[100px]"></div>

        <div className="relative z-10 max-w-lg space-y-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
          >
            <Quote className="h-10 w-10 text-white" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              UPSC Zen
            </h1>
            <p className="text-lg text-slate-400">
              Master UPSC Prelims with expert-level PYQ analysis. Access 6 years of curated questions
              with logical Verdicts and Logic Paths.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-12 sm:p-12">
        {/* Mobile Background Image (Visible only on small screens) */}
        <div className="absolute inset-0 z-0 lg:hidden">
          <div className="absolute inset-0 z-10 bg-slate-900/90"></div>
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
            alt="Background"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white lg:text-slate-500 lg:hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to UPSC Zen</h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-4 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 pr-10 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-slate-900 font-bold text-white hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="space-y-2 pt-2 text-center">
            <p className="text-xs text-slate-400">
              <Link
                href="/pricing"
                className="font-semibold transition-colors hover:text-indigo-600"
              >
                Buy Premium Plan
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
