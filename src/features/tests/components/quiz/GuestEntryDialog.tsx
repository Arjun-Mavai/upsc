// 'use client';

// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Loader2 } from 'lucide-react';

// interface GuestEntryDialogProps {
//   open: boolean;
//   guestName: string;
//   guestEmail: string;
//   guestMobile: string;
//   isSubmitting: boolean;
//   onNameChange: (value: string) => void;
//   onEmailChange: (value: string) => void;
//   onMobileChange: (value: string) => void;
//   onSubmit: () => void;
//   onExit: () => void;
// }

// export function GuestEntryDialog({
//   open,
//   guestName,
//   guestEmail,
//   guestMobile,
//   isSubmitting,
//   onNameChange,
//   onEmailChange,
//   onMobileChange,
//   onSubmit,
//   onExit,
// }: GuestEntryDialogProps) {
//   return (
//     <Dialog open={open} onOpenChange={() => {}}>
//       <DialogContent
//         showCloseButton={false}
//         className="sm:max-w-md"
//         onInteractOutside={(e) => e.preventDefault()}
//       >
//         <DialogHeader className="relative">
//           <DialogTitle className="text-center text-2xl font-black text-slate-900">
//             Welcome to UPSC 2026! 🚀
//           </DialogTitle>
//           <button
//             onClick={onExit}
//             className="absolute -top-3 -right-3 z-10 rounded-full bg-slate-100 p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-700 active:scale-90"
//           >
//             <span className="sr-only">Close</span>
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="24"
//               height="24"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2.5"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="h-5 w-5"
//             >
//               <path d="M18 6 6 18" />
//               <path d="m6 6 12 12" />
//             </svg>
//           </button>
//           <DialogDescription className="px-4 pt-3 text-center text-slate-600">
//             <span className="block leading-relaxed text-balance">
//               We value your time and just need your name to get started!
//             </span>
//             <span className="mt-2 block text-xs font-medium text-balance text-slate-400">
//               Email and mobile are optional but help us serve you better.
//             </span>
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-4">
//           <div className="space-y-2">
//             <label className="flex items-center gap-1 text-sm font-bold text-slate-900">
//               Name <span className="text-red-500">*</span>
//             </label>
//             <Input
//               placeholder="Enter your name"
//               value={guestName}
//               onChange={(e) => onNameChange(e.target.value)}
//               className="h-12 border-slate-300 bg-white text-lg font-medium shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
//               autoFocus
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
//                 Email
//               </label>
//               <Input
//                 type="email"
//                 placeholder="Optional"
//                 value={guestEmail}
//                 onChange={(e) => onEmailChange(e.target.value)}
//                 className="h-10 border-slate-200 bg-slate-50 text-sm text-slate-600 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
//                 Mobile
//               </label>
//               <Input
//                 type="tel"
//                 placeholder="Optional"
//                 value={guestMobile}
//                 onChange={(e) => onMobileChange(e.target.value)}
//                 className="h-10 border-slate-200 bg-slate-50 text-sm text-slate-600 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300"
//               />
//             </div>
//           </div>
//         </div>

//         <DialogFooter>
//           <Button
//             onClick={onSubmit}
//             disabled={!guestName.trim() || isSubmitting}
//             className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98]"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
//               </>
//             ) : (
//               'Start Test 🚀'
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

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

interface GuestEntryDialogProps {
  open: boolean;
  guestName: string;
  guestEmail: string;
  guestMobile: string;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onSubmit: () => void;
  onExit: () => void;
}

export function GuestEntryDialog({
  open,
  guestName,
  guestEmail,
  guestMobile,
  isSubmitting,
  onNameChange,
  onEmailChange,
  onMobileChange,
  onSubmit,
  onExit,
}: GuestEntryDialogProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setKeyboardHeight(Math.max(0, windowHeight - viewportHeight));
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [open]);

  const isNameValid = guestName.trim().length > 0;
  const isMobileValid = guestMobile.trim().length >= 10; // At least 10 digits
  const isFormValid = isNameValid && isMobileValid;

  // ✅ Memoize style calculation for performance
  const dialogStyle = useMemo(() => ({
    paddingBottom: keyboardHeight > 0 ? `${Math.max(16, keyboardHeight - 20)}px` : '1rem',
  }), [keyboardHeight]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="border-none p-0 sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div
          className="flex flex-col bg-white"
          style={dialogStyle}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <button
              onClick={onExit}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-300 shadow-sm backdrop-blur-md transition-all hover:bg-slate-700 hover:text-white active:scale-90"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
              <span className="sr-only">Close</span>
            </button>

            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-400" />
                Welcome to UPSC Prelims!
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-sm pt-1">
                Just name and mobile to get started
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-3 px-6 py-5 sm:px-6">
            {/* Name Field - Primary Focus */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => onNameChange(e.target.value)}
                disabled={isSubmitting}
                className="h-11 border-slate-200 bg-white text-base font-medium shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                autoFocus
                autoComplete="name"
              />
            </div>

            {/* Optional Fields - Show when name is valid */}
            {isNameValid && (
              <div className="animate-in fade-in-50 space-y-3 duration-200">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={guestMobile}
                      onChange={(e) => onMobileChange(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 border-slate-200 bg-white text-base font-medium shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      autoComplete="tel"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                      Email (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="Optional"
                      value={guestEmail}
                      onChange={(e) => onEmailChange(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 border-slate-200 bg-slate-50 text-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-200"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Button - Always Visible Above Keyboard */}
          {isFormValid && (
            <div className="animate-in slide-in-from-bottom-3 border-t border-slate-100 bg-white px-6 py-4 duration-200 sm:px-6">
              <Button
                onClick={onSubmit}
                disabled={!isFormValid || isSubmitting}
                className="h-12 w-full rounded-xl bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...
                  </>
                ) : (
                  'Start Test 🚀'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
