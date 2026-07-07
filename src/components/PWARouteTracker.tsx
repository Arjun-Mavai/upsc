'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';

const TRACKING_KEY = 'upsc_pwa_last_route'; // Apun ka khufiya bahi-khata jisme last location likha jayega (UPSC version)
const EXPIRY_HOURS = 8; // 8 ghante ke baad memory wash, uske baad user sidha dashboard pe land karega!

/**
 * 🚀 PWA Route Tracker (Apun ka Smart Bouncer / Tracker)
 * 
 * WHAT IS THIS?
 * This is a headless (no UI) Client Component that solves a major UX issue in PWAs.
 * When a PWA (Progressive Web App) is installed on iOS/Android, and the user leaves the app, 
 * the OS might suspend or kill it to save battery. When re-opened, the PWA strictly follows 
 * the `start_url` defined in `manifest.json` (which is `/dashboard` in our case).
 * This causes users to lose their current context.
 */
export function PWARouteTracker() {
  const pathname = usePathname(); // Abhi user kis page ki gali me khada hai
  const router = useRouter(); // Apun ka driver jo redirect marega
  const hasResumed = useRef(false); // Ek hi baar resume marne ka, baar-baar chipakne ka nahi

  useEffect(() => {
    // 1. Agar ye server-side pe run ho raha hai, toh kat le yaha se. Apun sirf browser (client) pe game karta hai!
    if (typeof window === 'undefined' || !pathname) return;

    // 2. AUTO-RESUME LOGIC: Agar user direct App me tapka hai (Fresh Launch)
    if ((pathname === '/' || pathname === '/dashboard') && !hasResumed.current) {
      hasResumed.current = true; // Set kar diya ki ek baar kaam ho gaya hai, ab chill mar
      try {
        const savedData = localStorage.getItem(TRACKING_KEY); // Purana thikana dhoondo
        if (savedData) {
          const { path, timestamp } = JSON.parse(savedData);
          const hoursSinceSaved = (Date.now() - timestamp) / 3600000; // Kitne ghante pehle ki baat hai?

          // Agar location solid hai, aur 8 ghante ke andar ki baat hai, toh chal bidu wahi chalte hai!
          if (path && path !== '/dashboard' && path !== '/' && hoursSinceSaved < EXPIRY_HOURS) {
            localStorage.removeItem(TRACKING_KEY); // Purani entry hata de, varna aage loop me ghumte rahenge
            router.replace(path); // Bina history me kachra kiye (replace), turant wahi teleport kar de
            return; // Yaha se nikal le jaldi
          }
        }
      } catch (e) {
        // Kuch locha hua toh chup rehne ka, console me lafda nahi karne ka
      }
      
      // FALLBACK: Agar user logged-in hai, aur uske paas koi saved route nahi hai, 
      // toh usko marketing page (/) pe mat chhod, usko dashboard bhej de.
      const isLogged = useSettingsStore.getState().user !== null;
      if (pathname === '/' && isLogged) {
        router.replace('/dashboard');
        return;
      }
    }

    // 3. TRACKING LOGIC: User nayi gali me gaya, toh entry maar le
    // Lekin in sab jagaho pe entry nahi marne ka (Public/Auth pages apun track nahi karte)
    const isExcluded = 
      pathname === '/' || 
      pathname === '/dashboard' || 
      pathname.startsWith('/signin') || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/register') ||
      pathname.startsWith('/upgrade');

    if (!isExcluded) {
      try {
        // User kisi kaam ke page pe hai, toh localStorage ke khopche me likh ke rakh le
        localStorage.setItem(TRACKING_KEY, JSON.stringify({
          path: pathname,
          timestamp: Date.now() // Abhi ka waqt daal de
        }));
      } catch (e) {
        // Storage full hai ya kuch locha hai toh ignore maar
      }
    } else if (pathname === '/' || pathname === '/dashboard') {
      // Agar user KHUD chal ke wapas home ya dashboard pe aaya hai, toh pichla record saaf kar de
      localStorage.removeItem(TRACKING_KEY);
    }
  }, [pathname, router]);

  // Ye component UI pe dikhta nahi hai, sirf pichhe se game karta hai. Solid bouncer!
  return null;
}
