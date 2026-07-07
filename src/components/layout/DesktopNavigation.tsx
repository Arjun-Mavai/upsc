import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Zap, 
  Sparkles 
} from './icons';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  color: string;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
  pathname: string;
  user: any;
}

export const DesktopNavigation = memo(function DesktopNavigation({ 
  navItems, 
  pathname, 
  user 
}: DesktopNavigationProps) {
  return (
    <nav className="hidden items-center gap-1 rounded-full border border-slate-200/50 bg-slate-100/50 p-1.5 backdrop-blur-md md:flex">
      {navItems
        .filter((item) => {
          // Hide Dashboard if user is not logged in
          if (item.name === 'Dashboard') return !!user;
          // Test History & About Us — sidebar only, not in desktop top nav
          if (item.name === 'Test History' || item.name === 'About Us') return false;
          return true;
        })
        .map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              )}
            >
              <Icon size={16} className={cn(isActive && 'fill-slate-600/10')} />
              {item.name}
            </Link>
          );
        })}
      
      {/* User Badge */}
      {user && user.isPro ? (
        /* Pro Badge — Premium Gold/Amber Gradient style */
        <div className="group relative overflow-hidden rounded-full p-[1px]">
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
          <div className="relative flex cursor-default items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-bold text-white transition-colors group-hover:bg-slate-800">
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
            <Sparkles size={12} className="relative z-10 fill-amber-400 text-amber-400" />
            <span className="relative z-10 text-[10px] font-black tracking-widest uppercase">
              PRO+
            </span>
          </div>
        </div>
      ) : user && user.isSubscribed && user.planTier === 'lite' ? (
        /* Lite Badge — Seamless Pink/Purple gradient */
        <div className="relative overflow-hidden rounded-full p-[1.5px]">
          {/* Static Gradient Border for Performance */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />
          <div className="relative flex cursor-default items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            <Sparkles size={12} className="fill-pink-500 text-pink-500" />
            <span className="text-[10px] font-black tracking-wide uppercase">Lite</span>
          </div>
        </div>
      ) : user ? (
        /* Free user — "Upgrade" Button with Premium Seamless Rainbow Border */
        <div className="group relative overflow-hidden rounded-full p-[1.5px]">
          {/* Static Rainbow Gradient for 'Award Winning' look - Only animate opacity/scale on hover if needed */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
          <Link
            href="/pricing"
            className="relative flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <Sparkles size={14} className="fill-white/20 text-yellow-400" />
            <span className="tracking-wide">Upgrade</span>
          </Link>
        </div>
      ) : null}
    </nav>
  );
});