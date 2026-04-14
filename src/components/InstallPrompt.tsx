'use client';

import { useState, useEffect } from 'react';
import { usePwa } from '@/hooks/usePwa';
import { X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function InstallPrompt() {
  const { isInstallable, installPwa, isPwaInstalled, isIos, isSafari } = usePwa();
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect Mobile (Android/iOS) for the main prompt
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(isMobileDevice);

    // If iOS and not standalone, show prompt after a delay (once per session)
    if (isIos && !isPwaInstalled && !sessionStorage.getItem('ios-prompt-dismissed')) {
      const timer = setTimeout(() => {
        console.log('[PWA] Auto-showing iOS prompt');
        setShowIosPrompt(true);
        requestAnimationFrame(() => setIsVisible(true));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPwaInstalled, isIos]);

  // Listen for manual trigger (e.g. from Navbar)
  useEffect(() => {
    const handleManualTrigger = () => {
      console.log('[PWA] Manual trigger received. isIos:', isIos);
      if (isIos) {
        setShowIosPrompt(true);
        requestAnimationFrame(() => setIsVisible(true));
      }
    };

    window.addEventListener('show-ios-install-prompt', handleManualTrigger);
    return () => window.removeEventListener('show-ios-install-prompt', handleManualTrigger);
  }, [isIos]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setDismissed(true);
      setShowIosPrompt(false);
      if (isIos) {
        sessionStorage.setItem('ios-prompt-dismissed', 'true');
      }
    }, 300);
  };

  if ((isPwaInstalled || dismissed) && !showIosPrompt) return null;

  // Render iOS Prompt
  if (showIosPrompt) {
    return (
      <div
        className={cn(
          'fixed right-4 bottom-6 left-4 z-[9999] transform rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:mx-auto md:max-w-md',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-inner"
        >
          <X size={18} />
        </button>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/50 shadow-xl shadow-orange-500/20">
               <Image
                  src="/icons/upsc-logo.png"
                  alt="UPSC Zen Logo"
                  width={56}
                  height={56}
                  className="object-contain"
               />
               <div className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-75"></div>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Install UPSC Zen App</h3>
              <p className="text-xs text-slate-400">Essential for the best learning experience.</p>
            </div>
          </div>
          
          {isSafari ? (
            <div className="space-y-3 rounded-2xl bg-white/5 p-5 border border-white/5 ring-1 ring-white/5">
              <div className="flex items-center gap-4 text-sm font-bold text-slate-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-black shadow-lg shadow-amber-500/20">
                   <Share size={16} />
                </div>
                <span>Tap the <span className="text-amber-500 text-base">Share</span> button below</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-bold text-slate-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-black shadow-lg shadow-amber-500/20">
                   <PlusSquare size={16} />
                </div>
                <span>Select <span className="text-amber-500 text-base">Add to Home Screen</span></span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl bg-amber-500/10 p-5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">!</div>
                <div className="space-y-1">
                   <p className="text-sm font-black text-amber-500 uppercase tracking-tight">Open in Safari</p>
                   <p className="text-xs text-slate-300">Google Chrome and Facebook browsers don't support app installation. Please open <span className="text-amber-200 font-bold underline">upsc.zenscroll.app</span> in Safari to install.</p>
                </div>
              </div>
            </div>
          )}

          <Button 
             variant="ghost" 
             onClick={() => {
                window.location.href = '/#install-guide';
                handleDismiss();
             }}
             className="w-full h-12 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10"
          >
             Need help? View full guide →
          </Button>
        </div>
        
        {/* Pointer arrow for iOS bottom bar (Only in Safari) */}
        {isSafari && (
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-white/10 bg-slate-900 md:hidden"></div>
        )}
      </div>
    );
  }

  // Render Android/Desktop Prompt
  if (isInstallable && !isIos) {
    return (
      <div
        className={cn(
          'fixed right-4 bottom-6 left-4 z-[100] transform rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:mx-auto md:max-w-md',
          isVisible && isMobile ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/50 shadow-xl shadow-orange-500/20">
             <Image
                src="/icons/upsc-logo.png"
                alt="UPSC Zen Logo"
                width={56}
                height={56}
                className="object-contain"
             />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black tracking-tight text-white">UPSC Zen App</h3>
            <p className="text-xs text-slate-400">Faster access & full screen mode.</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleDismiss} className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
            Later
          </Button>
          <Button
            onClick={installPwa}
            className="flex-1 h-12 rounded-xl bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 font-black text-xs uppercase tracking-widest"
          >
            Install
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
