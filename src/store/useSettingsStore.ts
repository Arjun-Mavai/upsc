import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'hi';

export interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: string; // 'admin' | 'user'
  isSubscribed?: boolean; // Fixed: camelCase to match DB
  isPro?: boolean; // Legacy flag support
  planTier?: 'free' | 'lite' | 'pro'; // Fixed: camelCase to match DB
  examType?: 'upsc' | 'mppsc' | 'mppolice' | 'all'; // Added examType
}

interface SettingsState {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  isSubscribed: boolean;
  isLockModalOpen: boolean;
  setLockModalOpen: (isOpen: boolean) => void;
  authCheckStatus: 'idle' | 'loading' | 'checked';
  setAuthCheckStatus: (status: 'idle' | 'loading' | 'checked') => void;
  setUser: (user: User | null, isSubscribed: boolean) => void;
  // We can add more settings here like 'theme'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'hi', // Default to Hindi as per user implied preference or common use
      setLanguage: (lang) => set({ language: lang }),
      user: null,
      isSubscribed: false,
      isLockModalOpen: false,
      authCheckStatus: 'idle',
      setAuthCheckStatus: (status) => set({ authCheckStatus: status }),
      setLockModalOpen: (isOpen) => set({ isLockModalOpen: isOpen }),
      // On logout: caller must also localStorage.removeItem('settings-storage')
      // to trigger cross-tab sync via the 'storage' event in AppNavbar
      setUser: (user, isSubscribed) => set({ user, isSubscribed, authCheckStatus: 'checked' }),
    }),
    {
      name: 'settings-storage', // localStorage key — removing this key triggers cross-tab logout
    }
  )
);
