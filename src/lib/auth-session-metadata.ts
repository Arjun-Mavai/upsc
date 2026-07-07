type AuthSessionState = {
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
};

/**
 * authSession metadata helper
 * Ye mppsc_users.metadata me chhota sa register maintain karta hai:
 * - lastLoginAt  = banda andar kab aaya
 * - lastLogoutAt = banda bahar kab gaya
 *
 * Rule simple:
 * lastLoginAt > lastLogoutAt -> active session chal raha hai
 * warna no active session.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toIso(value: Date): string {
  return value.toISOString();
}

function getState(metadata: unknown): AuthSessionState | null {
  if (!isRecord(metadata)) return null;
  const authSession = metadata.authSession;
  if (!isRecord(authSession)) return null;
  return {
    lastLoginAt: typeof authSession.lastLoginAt === 'string' ? authSession.lastLoginAt : null,
    lastLogoutAt: typeof authSession.lastLogoutAt === 'string' ? authSession.lastLogoutAt : null,
  };
}

export function hasActiveAuthSession(metadata: unknown): boolean {
  const state = getState(metadata);
  if (!state?.lastLoginAt) return false;

  const loginTime = new Date(state.lastLoginAt).getTime();
  const logoutTime = state.lastLogoutAt ? new Date(state.lastLogoutAt).getTime() : null;

  return Number.isFinite(loginTime) && (logoutTime === null || loginTime > logoutTime);
}

export function touchAuthLoginMetadata(metadata: unknown, at = new Date()): Record<string, unknown> {
  const base = isRecord(metadata) ? { ...metadata } : {};
  const authSession = isRecord(base.authSession) ? { ...base.authSession } : {};

  base.authSession = {
    ...authSession,
    lastLoginAt: toIso(at),
  };

  return base;
}

export function touchAuthLogoutMetadata(metadata: unknown, at = new Date()): Record<string, unknown> {
  const base = isRecord(metadata) ? { ...metadata } : {};
  const authSession = isRecord(base.authSession) ? { ...base.authSession } : {};

  base.authSession = {
    ...authSession,
    lastLogoutAt: toIso(at),
  };

  return base;
}
