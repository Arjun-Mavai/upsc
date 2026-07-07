'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, X, Send } from 'lucide-react';
import { isIndianMobileValid, validateIndianMobileMessage } from '@/lib/validate-indian-mobile';
import { useSettingsStore } from '@/store/useSettingsStore';
import { toast } from 'sonner';

export function MainsGuestEntryDialog() {
  const { user, setGuestLead } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const isLoggedIn = !!user;
    if (isLoggedIn) {
      setIsOpen(false);
      return;
    }

    // Check localStorage for existing lead
    const stored = localStorage.getItem('upsc_mains_lead');
    if (stored) {
      try {
        // Hydrate Zustand store from localStorage for returning guests
        const lead = JSON.parse(stored);
        setGuestLead({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
        });
      } catch {
        // If parse fails, show dialog to get fresh data
        setIsOpen(true);
      }
    } else {
      // No stored lead, show dialog
      setIsOpen(true);
    }
  }, [user, setGuestLead]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setKeyboardHeight(Math.max(0, windowHeight - viewportHeight));
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const isNameValid = useMemo(() => {
    const trimmed = guestName.trim();
    return trimmed.length >= 2;
  }, [guestName]);

  const isMobileValid = useMemo(
    () => isIndianMobileValid(guestMobile.trim()),
    [guestMobile]
  );

  const mobileErrorMsg = useMemo(
    () => (guestMobile.trim() ? validateIndianMobileMessage(guestMobile) : null),
    [guestMobile]
  );

  const isEmailValid = useMemo(() => {
    if (!guestEmail.trim()) return true; // Optional
    return guestEmail.toLowerCase().endsWith('@gmail.com') && guestEmail.length > 10;
  }, [guestEmail]);

  const isFormValid = isNameValid && isMobileValid && isEmailValid;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    const lead = {
      name: guestName.trim(),
      phone: guestMobile.trim(),
      email: guestEmail.trim() || undefined,
      page: 'upsc-mains',
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
    };

    try {
      // Save to localStorage
      localStorage.setItem('upsc_mains_lead', JSON.stringify(lead));
      localStorage.setItem('mains_guest_lead', JSON.stringify(lead)); // Fallback support
      localStorage.setItem('upsc_guest_name', lead.name); // Global identity

      // 🎯 SYNC TO ZUSTAND STORE (for tracking throughout the app)
      setGuestLead({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
      });

      // 🚀 INSTANT ASYNC BACKGROUND UNLOCK
      fetch('/api/tracking/guest-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch((err) => {
        console.error('Failed to save guest lead in background:', err);
      });

      toast.success('भावी अधिकारी, स्वागत है आपका! 🏛️', {
        description: 'Free Syllabus unlocked successfully. All the best!',
        duration: 4500,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save guest lead:', error);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogStyle = useMemo(() => ({
    paddingBottom: keyboardHeight > 0 ? `${Math.max(16, keyboardHeight - 20)}px` : '1rem',
  }), [keyboardHeight]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="border-none p-0 sm:max-w-md rounded-3xl overflow-hidden shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div
          className="flex flex-col bg-white overflow-hidden"
          style={dialogStyle}
        >
          {/* Header styled like QuizSubmitDialog */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-400" />
                Welcome to UPSC Mains!
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-sm pt-1">
                Just name and mobile to get started
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-6 p-6 bg-white">

            {/* Name Field - Always Visible */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                disabled={isSubmitting}
                className={`h-11 border-slate-200 bg-white text-base font-medium shadow-sm transition-all focus:ring-2 ${
                  guestName.length > 0 && !isNameValid 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                    : 'focus:border-indigo-500 focus:ring-indigo-200'
                }`}
                autoFocus
                autoComplete="name"
              />
              {guestName.length > 0 && !isNameValid && (
                <p className="animate-in fade-in-0 slide-in-from-top-1 text-[11px] font-bold text-red-500">
                  Please enter a valid name (min 2 letters).
                </p>
              )}
            </div>

            {/* Optional Fields - Appears only after valid name */}
            {isNameValid && (
              <div className="animate-in fade-in-50 slide-in-from-top-2 space-y-4 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={isSubmitting}
                      className={`h-11 border-slate-200 bg-white text-base font-medium shadow-sm transition-all focus:ring-2 ${
                        guestMobile.length > 0 && !isMobileValid 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'focus:border-indigo-500 focus:ring-indigo-200'
                      }`}
                      autoComplete="tel"
                    />
                    {guestMobile.length > 0 && !isMobileValid && mobileErrorMsg && (
                      <p className="animate-in fade-in-0 slide-in-from-top-1 text-[11px] font-bold text-red-500">
                        {mobileErrorMsg}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                      <span>Gmail (Optional)</span>
                      {guestEmail.length > 0 && (
                        <span className={isEmailValid ? 'text-emerald-600' : 'text-red-500'}>
                          {isEmailValid ? '✓ Valid' : 'Must end with @gmail.com'}
                        </span>
                      )}
                    </label>
                    <Input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      disabled={isSubmitting}
                      className={`h-11 border-slate-200 transition-all focus:ring-2 ${
                        guestEmail.length > 0 && !isEmailValid 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100' 
                          : 'bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-200'
                      }`}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {isNameValid && (
            <div className="animate-in slide-in-from-bottom-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-6">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="h-12 w-full rounded-xl bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Unlocking...
                  </>
                ) : (
                  'Unlock Now 🔓'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
