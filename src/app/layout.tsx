import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
import PwaRegistry from '@/components/PwaRegistry';
import { Suspense } from 'react';
import Providers from './Providers';
import { AppFooter } from '@/components/layout/AppFooter';
import { GlobalLockModal } from '@/components/GlobalLockModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/sonner';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import dynamic from 'next/dynamic';
import { VersionManager } from '@/components/VersionManager';
import Script from 'next/script';

const InstallPrompt = dynamic(() =>
  import('@/components/InstallPrompt').then((m) => m.InstallPrompt)
);
const SupportButton = dynamic(() =>
  import('@/components/SupportButton').then((m) => m.SupportButton)
);

// const outfit = Outfit({
//   subsets: ['latin'],
//   variable: '--font-outfit',
//   display: 'swap',
// });

// const playfair = Playfair_Display({
//   subsets: ['latin'],
//   variable: '--font-playfair',
//   display: 'swap',
// });

export const viewport: Viewport = {
  themeColor: '#4c1d95',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { getExamContext } from '@/lib/exam-context';

export async function generateMetadata(): Promise<Metadata> {
  const exam = await getExamContext();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${exam.id}.zenscroll.app`;

  return {
    title: {
      default: exam.title,
      template: `%s | ${exam.name}`,
    },
    description: exam.description,
    keywords: [
      `${exam.name} 2026 Test Series`,
      `${exam.name} Prelims Mock Test`,
      `${exam.name} Previous Year Papers`,
      `${exam.name} Analysis`,
    ],
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: baseUrl,
      title: `${exam.name} Elite Test Series | सर्वोत्तम अभ्यास`,
      description: exam.description,
      siteName: exam.name,
      images: [
        {
          url: '/og-hero.webp',
          width: 1200,
          height: 630,
          alt: `Mindful ${exam.name} - Crack ${exam.id.toUpperCase()}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${exam.name} | Best App for aspirants`,
      description: exam.description,
      images: ['/og-hero.webp'],
    },
    manifest: '/manifest.json',
    icons: {
      icon: '/icons/icon-192x192.png',
      apple: '/icons/icon-192x192.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: exam.name,
    },
  };
}

import { verifyAuth } from '@/lib/auth';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { MainContentWrapper } from '@/components/layout/MainContentWrapper';

// ... imports ...

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Fetch User on Server (Once per request)
  const user = await verifyAuth();

  // 2. Transform for Navbar
  const navbarUser = user
    ? {
        name: user.name,
        email: user.email,
        image: null, // Add image if in DB
        role: user.role || undefined,
        is_subscribed: user.isSubscribed || undefined,
        plan_tier: user.planTier || undefined,
      }
    : null;

  const exam = await getExamContext();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${exam.id}.zenscroll.app`;

  // JSON-LD structured data — helps Google show rich results
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: exam.name,
    url: baseUrl,
    description: exam.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/blogs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: exam.name,
    url: baseUrl,
    description: exam.description,
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Facebook Pixel Code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '2337193063478696'); fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2337193063478696&ev=PageView&noscript=1"
            alt="facebook pixel"
          />
        </noscript>
        {/* End Facebook Pixel Code */}
      </head>
      <body
        className={`${inter.variable} bg-gray-50 font-sans text-gray-900 antialiased`}
      >
        <GlobalErrorBoundary>
          <PwaRegistry />
          <Providers>
            <AppNavbar user={navbarUser} />
            <MainContentWrapper>{children}</MainContentWrapper>

            <AppFooter />
            <GlobalLockModal />
            <ScrollToTop />
          </Providers>
          <Suspense fallback={null}>
            <SupportButton />
          </Suspense>
          <Toaster position="top-right" richColors />
          <InstallPrompt />
          <VersionManager />
        </GlobalErrorBoundary>
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
