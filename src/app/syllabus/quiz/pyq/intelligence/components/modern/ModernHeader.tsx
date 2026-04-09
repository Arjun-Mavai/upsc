'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '../LanguageToggle';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  onToggleMode: () => void;
}

export function ModernHeader({ title, subtitle, onToggleMode }: ModernHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-30 border-b border-[#E5E5EA] bg-[rgba(250,250,251,0.85)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[#1D1D1F] hover:bg-[#E5E5EA]/50 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-medium text-[#86868B] tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleMode}
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#1D1D1F] px-4 py-2 text-xs font-semibold tracking-wide text-white transition-all hover:bg-[#333336] active:scale-95"
            >
              Classic Mode
            </button>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
