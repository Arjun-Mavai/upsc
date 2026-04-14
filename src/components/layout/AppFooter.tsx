'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Info, MessageSquare, Mail, Shield, FileText } from 'lucide-react';

/**
 * AppFooter — Global Footer Component
 *
 * This footer shows on all pages EXCEPT quiz play pages.
 * During quizzes, showing the footer would be a distraction.
 */

export function AppFooter() {
  const pathname = usePathname();

  // 🚫 Hide footer on quiz pages — user is taking a test!
  if (pathname.startsWith('/syllabus/quiz')) return null;
  if (pathname.startsWith('/free-quiz')) return null;

  return (
    <footer className="min-h-[250px] border-t border-slate-200 bg-slate-50 py-12 pb-24 sm:min-h-[200px] md:pb-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:gap-6">
        {/* Brand Section */}
        <div className="order-last w-full text-center md:order-first md:w-auto md:text-left">
          <p className="text-lg font-bold text-slate-900">UPSC Zen</p>
          <p className="mt-1 text-sm text-slate-500">© 2026 All rights reserved.</p>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Made with ❤️ for aspirants</p>
        </div>

        {/* Mobile Grid Layout (Icons + Text) */}
        <div className="grid w-full grid-cols-3 gap-3 md:hidden">
          {[
            { name: 'About', href: '/about', icon: Info },
            { name: 'Feedback', href: '/feedback', icon: MessageSquare },
            { name: 'Contact', href: '/contact', icon: Mail },
            { name: 'Privacy', href: '/privacy', icon: Shield },
            { name: 'Terms', href: '/terms', icon: FileText },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all active:scale-95"
            >
              <div className="rounded-full bg-slate-50 p-2 text-slate-600">
                <link.icon size={18} />
              </div>
              <span className="text-xs font-semibold text-slate-700">{link.name}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Horizontal Layout (Text Only) */}
        <div className="hidden flex-wrap justify-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/about" className="transition-colors hover:text-slate-900">
            About Us
          </Link>
          <Link href="/feedback" className="transition-colors hover:text-slate-900">
            Feedback
          </Link>
          <Link href="/contact" className="transition-colors hover:text-slate-900">
            Contact Us
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-900">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
