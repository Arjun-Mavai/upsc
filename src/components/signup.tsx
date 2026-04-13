'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Quote, Loader2, ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 SIGNUP PAGE — Admin creates new users with full control
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fields: name, email, password + role, planTier, accessMonths, phone
// Used inside /admin/create-user and /signup routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('guest');
  const [planTier, setPlanTier] = useState('free');
  const [accessMonths, setAccessMonths] = useState(6);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          planTier,
          accessMonths: Number(accessMonths),
          phone: phone || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account created!', {
          description: data.message || 'User can now log in.',
        });
        // Reset form for next user creation
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setPlanTier('free');
        setRole('guest');
        setAccessMonths(6);
      } else {
        setError(data.error || 'Signup failed');
        toast.error('Signup failed', { description: data.error });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans lg:grid-cols-2">
      {/* Left Side: Visuals */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/30 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-purple-500/30 blur-[100px]"></div>

        <div className="relative z-10 max-w-lg space-y-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
          >
            <UserPlus className="h-10 w-10 text-white" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Create New User
            </h1>
            <p className="text-lg text-slate-400">
              Set up account with role, plan tier, and access duration.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="absolute top-6 left-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="text-sm text-slate-500">Fill details — user can login immediately</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-4 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 pr-10 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Min 8 chars, A-z, 0-9, @$!%*?&"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                1 uppercase, 1 lowercase, 1 digit, 1 special char
              </p>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Phone <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-4 text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="+91 9876543210"
              />
            </div>

            {/* Role + Plan Tier — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Plan Tier</label>
                <select
                  value={planTier}
                  onChange={(e) => setPlanTier(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="free">Free</option>
                  <option value="lite">Lite</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            {/* Access Duration */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Access Duration (months)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={accessMonths}
                  min={0}
                  max={24}
                  onChange={(e) => setAccessMonths(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-xs whitespace-nowrap text-slate-400">0 = unlimited</span>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create User
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
