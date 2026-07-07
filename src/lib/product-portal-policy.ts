import {
  ACCESS_MAINS,
  ACCESS_PRE,
  effectiveAccessGrants,
  type MppscUserRow,
} from '@/lib/access-grants';
import type { AuthenticatedUser } from '@/types/auth';

/** Fields needed to decide what nav / surfaces to show per product (Pre / Mains / Combo). */
export type PortalPolicyUser = (Pick<MppscUserRow, 'accessGrants' | 'planTier' | 'isSubscribed'> | AuthenticatedUser) & {
  is_subscribed?: boolean;
};

export type ProductPortalNavVisibility = {
  /** Prelims hub: Syllabus, Test Series, Blogs, Test History, Free Daily Quiz, PYQ Analysis subtree */
  showPrePortalNav: boolean;
  /** Navbar link to Mains (guests: teaser; logged-in: only if they have mains grant) */
  showMainsNav: boolean;
  /** Mobile “PYQ Analysis” accordion (Pro-style); requires pre portal + subscription */
  showPyqAnalysisAccordion: boolean;
};

function isSubscribed(u: PortalPolicyUser): boolean {
  return Boolean(u.isSubscribed ?? u.is_subscribed);
}

/**
 * Single place for “what menus to show” for Pre-only vs Mains-only vs Combo vs guest.
 * Combo = both grants; mains-only = mains without pre; pre-only = pre without mains.
 */
export function getProductPortalNavVisibility(
  user: PortalPolicyUser | null | undefined
): ProductPortalNavVisibility {
  if (!user) {
    return {
      showPrePortalNav: true,
      showMainsNav: true,
      showPyqAnalysisAccordion: false,
    };
  }

  const grants = effectiveAccessGrants(user as any);
  const hasPre = grants.includes(ACCESS_PRE);
  const hasMains = grants.includes(ACCESS_MAINS);

  return {
    showPrePortalNav: hasPre,
    showMainsNav: hasMains,
    showPyqAnalysisAccordion: isSubscribed(user) && hasPre,
  };
}

/** Server layouts: mains-only subscribers should not stay on pre syllabus tree. */
export function shouldRedirectPreSyllabusToMains(
  user: PortalPolicyUser
): boolean {
  const grants = effectiveAccessGrants(user as any);
  return grants.includes(ACCESS_MAINS) && !grants.includes(ACCESS_PRE);
}
