import Image from 'next/image';
import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarLogoProps {
  user: any;
}

export const NavbarLogo = memo(function NavbarLogo({ user }: NavbarLogoProps) {
  const router = useRouter();
  
  const handleLogoClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(user ? '/syllabus/quiz/pyq' : '/');
  }, [router, user]);

  return (
    <div
      onClick={handleLogoClick}
      className="group flex cursor-pointer items-center gap-2"
    >
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950/50 backdrop-blur-sm shadow-lg shadow-indigo-500/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/20">
        <Image
          src="/icons/upsc-logo.png"
          alt="UPSC Logo"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg leading-none font-bold text-slate-900 tracking-tight">
          UPSC<span className="text-indigo-600">Zen</span>
        </span>
        <span className="text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase opacity-80">
          PYQ Intelligence
        </span>
      </div>
    </div>
  );
});