'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 ADMIN RESET PASSWORD — Email + New Password → Direct DB update
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// No email sending — admin directly sets new password for user.
// Mobile-first card layout.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setResult(data.message);
      toast.success('Password reset done!');
      setEmail('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          Reset Password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          User ka email daalo, naya password set karo — directly DB me update hoga
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        {result ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">{result}</p>
            <Button variant="outline" onClick={() => setResult(null)} className="font-bold">
              Reset Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 pr-11 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Min 8 chars, A-z, 0-9, @$!%*?&"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                1 uppercase, 1 lowercase, 1 digit, 1 special char
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-slate-900 font-bold text-white hover:bg-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
