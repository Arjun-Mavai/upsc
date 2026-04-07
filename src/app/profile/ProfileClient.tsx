'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, User, Lock, CheckCircle2, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateUserName, updateUserPassword } from './actions';

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    planTier: string | null;
    createdAt: Date | null;
  };
}

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
];

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Random quote
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const handleNameUpdate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    setSavingName(true);
    const result = await updateUserName(name);
    setSavingName(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    const result = await updateUserPassword(currentPassword, newPassword);
    setSavingPassword(false);

    if (result.success) {
      toast.success('Password updated! Logging out for security...');
      // Logout user after password change for security
      setTimeout(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      }, 1500);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Badge variant="outline" className="border-slate-200 text-xs font-bold text-slate-500">
            Profile Settings
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
        {/* Quote Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
          <div className="absolute top-4 right-4">
            <Sparkles className="h-5 w-5 text-slate-600" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Sparkles className="h-4 w-4 text-slate-700" />
          </div>
          <p className="mb-3 text-lg font-medium leading-relaxed tracking-tight text-white md:text-xl">
            "{quote.text}"
          </p>
          <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">
            — {quote.author}
          </p>
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-black text-white">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              {user.name || 'Your Profile'}
            </h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={cn(
                  'text-[10px] font-black uppercase',
                  user.planTier === 'pro'
                    ? 'bg-amber-100 text-amber-700'
                    : user.planTier === 'lite'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                )}
              >
                {user.planTier || 'Free'}
              </Badge>
              {user.createdAt && (
                <span className="text-[10px] text-slate-400">
                  Member since{' '}
                  {new Date(user.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name Update Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <User className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Display Name</h2>
                <p className="text-xs text-slate-500">This is how others will see you</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1.5 border-slate-200 bg-slate-50 font-medium focus:border-slate-900 focus:ring-slate-900"
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleNameUpdate}
                disabled={savingName || name === user.name}
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingName ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Update Name
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Update Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Lock className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500">Keep your account secure</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-xs font-bold uppercase text-slate-500">
                  Current Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-200 bg-slate-50 pr-10 font-medium focus:border-slate-900 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-xs font-bold uppercase text-slate-500">
                  New Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-200 bg-slate-50 pr-10 font-medium focus:border-slate-900 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase text-slate-500">
                  Confirm New Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-200 bg-slate-50 pr-10 font-medium focus:border-slate-900 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handlePasswordUpdate}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-slate-400">
            Changes are saved automatically to your account
          </p>
        </div>
      </div>
    </div>
  );
}
