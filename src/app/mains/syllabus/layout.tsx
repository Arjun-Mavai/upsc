import { Noto_Sans_Devanagari, Source_Serif_4 } from 'next/font/google';
import { verifyAuth } from '@/lib/auth';
import { isMainsVaultUnlockedUser } from '@/lib/mains-vault-access';
import { MainsGuestAccessGuards } from '@/app/mains/syllabus/MainsGuestAccessGuards';

const serif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-pyq-serif',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-pyq-dev',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/**
 * Mains syllabus tree + PYQ desk are publicly navigable for demos.
 * Pre-only users see Mains content as demo (overlays & locked sections).
 * Topic expert content & most PYQs are gated in-page (overlay + SyllabusLockMainsModal) unless vault unlocked.
 */
export default async function MainsSyllabusLayout({ children }: { children: React.ReactNode }) {
  const user = await verifyAuth();
  const vaultUnlocked = isMainsVaultUnlockedUser(user);

  return (
    <div
      data-mains-vault={vaultUnlocked ? 'open' : 'demo'}
      className={`${serif.variable} ${devanagari.variable} min-h-screen bg-slate-950 text-slate-100`}
    >
      <MainsGuestAccessGuards />
      {children}
    </div>
  );
}
