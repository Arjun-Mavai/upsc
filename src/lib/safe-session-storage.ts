export function safeGetSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function safeSetSessionStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch (e) {
    // Ignored
  }
}

export function safeRemoveSessionStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (e) {
    // Ignored
  }
}
