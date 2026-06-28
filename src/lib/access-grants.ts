import type { InferSelectModel } from 'drizzle-orm';
import type { mppscUsers } from '@/db/schema';

export const ACCESS_PRE = 'upsc_pre' as const;
export const ACCESS_MAINS = 'upsc_mains' as const;
export type AccessGrant = typeof ACCESS_PRE | typeof ACCESS_MAINS;

export type MppscUserRow = InferSelectModel<typeof mppscUsers>;

/** Basic fields needed to determine access */
type UserAccessInfo = {
  accessGrants?: string[] | string | null;
  planTier?: string | null;
  isSubscribed?: boolean | null;
};

export function dedupeGrants(grants: string[]): string[] {
  return [...new Set(grants.filter(Boolean))];
}

const GRANT_SLUG = /^upsc_[a-z0-9_]+$/;

/** Parse DB value; tolerate null, bad JSON, comma-separated slugs, legacy mistakes. */
export function parseAccessGrants(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return dedupeGrants(raw.filter((x): x is string => typeof x === 'string'));
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith('[')) {
      try {
        const j = JSON.parse(t) as unknown;
        return Array.isArray(j)
          ? dedupeGrants(j.filter((x): x is string => typeof x === 'string'))
          : [];
      } catch {
        return [];
      }
    }
    // Comma-separated product slugs (no JSON array)
    const parts = t.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
    const slugs = parts.filter((p) => GRANT_SLUG.test(p));
    if (slugs.length > 0) return dedupeGrants(slugs);
    return [];
  }
  return [];
}

/** Persist to SQLite `access_grants` text column (always valid JSON array). */
export function serializeAccessGrants(grants: string[]): string {
  return JSON.stringify(dedupeGrants(grants));
}

/**
 * effectiveAccessGrants — single source of truth for what this user has access to.
 *
 * Priority:
 * 1. accessGrants column exists (array) → use it directly
 * 2. accessGrants column exists (JSON string) → parse it
 * 3. Legacy fallback: derive from plan_tier
 *
 * Legacy plan_tier → grants mapping:
 *   - 'lite' | 'pro'   → [upsc_pre]          (Pre-only paid plans)
 *   - 'combo'          → [upsc_pre, upsc_mains] (full combo)
 *   - 'mains'          → [upsc_mains]         (Mains-only, NO Pre access)
 *   - 'free' / null    → []                    (nothing paid)
 *   - isSubscribed=true with null tier → [upsc_pre] (assume Pre, safe default)
 */
export function effectiveAccessGrants(user: UserAccessInfo): string[] {
  // Check both accessGrants and access_grants (DB vs client shape)
  const rawGrants = (user as any).accessGrants ?? (user as any).access_grants ?? null;

  if (Array.isArray(rawGrants)) {
    return dedupeGrants(rawGrants.filter((x): x is string => typeof x === 'string'));
  }

  const g = parseAccessGrants(rawGrants);
  if (g.length > 0) return dedupeGrants(g);

  // ── Legacy fallback: no grants column, derive from plan_tier ──
  const tier = String(user.planTier ?? (user as any).plan_tier ?? 'free').toLowerCase();

  if (tier === 'combo') return [ACCESS_PRE, ACCESS_MAINS];
  if (tier === 'mains') return [ACCESS_MAINS]; // Mains-only → NO Pre access
  if (tier === 'lite' || tier === 'pro') return [ACCESS_PRE];
  // isSubscribed=true but no tier info → safe default: Pre access
  if (user.isSubscribed) return [ACCESS_PRE];

  return [];
}

export function hasPreAccess(
  user: UserAccessInfo | null | undefined
): boolean {
  if (!user) return true;
  return effectiveAccessGrants(user).includes(ACCESS_PRE);
}

export function hasMainsAccess(
  user: UserAccessInfo | null | undefined
): boolean {
  if (!user) return false;
  return effectiveAccessGrants(user).includes(ACCESS_MAINS);
}

/** After successful Prelims plan purchase (lite / pro / upgrade). */
export function mergeGrantsAfterPrePurchase(current: string[]): string[] {
  return dedupeGrants([...current, ACCESS_PRE]);
}

/** Mains-only SKU: if user already had Pre, keep it; else mains-only bag. */
export function mergeGrantsAfterMainsPurchase(current: string[]): string[] {
  if (current.includes(ACCESS_PRE)) return dedupeGrants([...current, ACCESS_MAINS]);
  return [ACCESS_MAINS];
}

export function mergeGrantsAfterComboPurchase(): string[] {
  return [ACCESS_PRE, ACCESS_MAINS];
}
