import { hasMainsAccess } from '@/lib/access-grants';

/** Admin or explicit `mppsc_mains` grant — used for syllabus + PYQ vault content (not navbar). */
export function isMainsVaultUnlockedUser(
  user:
    | {
        accessGrants?: string[] | string | null;
        planTier?: string | null;
        isSubscribed?: boolean | null;
        role?: string | null;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return hasMainsAccess(user);
}
