/**
 * Content Protection System — Minimal anti-copy + watermark tracking
 * • Disables copy/paste on protected content
 * • Tracks copy attempts with user fingerprinting
 * • Watermarks content with subtle user ID
 * • Zero visual impact on readability
 */

import { logger } from '@/lib/logger';

/**
 * Simple hash function that works in both Node.js and Browser
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function safeGetSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    return window.sessionStorage.getItem('_sid') || 'unknown';
  } catch (e) {
    return 'blocked';
  }
}

// ============================================================================
// 1. WATERMARK GENERATION (Subtle, embedded in HTML)
// ============================================================================

/**
 * Generate invisible watermark metadata.
 * Embedded as data-* attributes (invisible to users, visible in DevTools)
 * 
 * Example: <div data-watermark="user-123-time-1715472984">Content</div>
 * Impact: Zero visual impact, only metadata
 */
export function generateWatermarkMeta(userId: string | undefined) {
  if (!userId) return {};

  const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
  const sessionId = safeGetSessionId();

  return {
    'data-watermark': `user-${userId.slice(0, 8)}-time-${timestamp}`,
    'data-session': sessionId,
    'data-protected': 'true',
  };
}

/**
 * Generate user fingerprint for tracking copy attempts.
 * Combines: user ID + session + timestamp (unique but not trackable across devices)
 */
export function generateFingerprint(userId: string | undefined): string {
  if (!userId) return 'anonymous';

  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = safeGetSessionId();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

  const combined = `${userId}|${sessionId}|${timestamp}|${userAgent}`;
  return simpleHash(combined);
}

// ============================================================================
// 2. COPY PREVENTION (JS + CSS)
// ============================================================================

/**
 * Disable copy/paste for protected element.
 * Blocks: copy, cut, paste operations
 * Allows: Normal selection (UX friendly)
 * 
 * Usage: attachCopyProtection(contentDiv, userId)
 */
export function attachCopyProtection(
  element: HTMLElement | null,
  userId: string | undefined,
  onCopyAttempt?: (fingerprint: string) => void
) {
  if (!element || typeof window === 'undefined') return;

  const fingerprint = generateFingerprint(userId);

  // Block copy event
  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    onCopyAttempt?.(fingerprint);
    
    // Fallback: Show subtle toast (optional)
    if (typeof window !== 'undefined') {
      const msg = document.createElement('div');
      msg.textContent = '📋 Content is protected';
      msg.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        animation: fadeInOut 2s;
      `;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    }
  };

  // Block cut event
  const handleCut = (e: ClipboardEvent) => {
    e.preventDefault();
    onCopyAttempt?.(fingerprint);
  };

  // Block paste event
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  element.addEventListener('copy', handleCopy);
  element.addEventListener('cut', handleCut);
  element.addEventListener('paste', handlePaste);

  // Cleanup function
  return () => {
    element.removeEventListener('copy', handleCopy);
    element.removeEventListener('cut', handleCut);
    element.removeEventListener('paste', handlePaste);
  };
}

/**
 * CSS to disable copy (fallback for elements without JS).
 * Applied via className: use on parent or specific content blocks
 */
export const COPY_PROTECTION_CSS = `
  /* Disable text selection (CSS fallback) */
  .protected-content {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  /* Allow selection in specific areas if needed */
  .protected-content .selection-allowed {
    user-select: text;
    -webkit-user-select: text;
  }
`;

// ============================================================================
// 3. TRACKING (Log copy attempts to backend)
// ============================================================================

/**
 * Track copy attempt to backend.
 * Sent via beacon API (guaranteed delivery even on page unload)
 * 
 * Data logged:
 * - fingerprint (unique to user+session+device)
 * - timestamp
 * - content type (question, answer, etc.)
 * - userId (for audit trail)
 */
export async function trackCopyAttempt(params: {
  fingerprint: string;
  contentType: 'question' | 'answer' | 'explanation' | 'quiz';
  contentId: string;
  userId: string | undefined;
}) {
  try {
    // Use beacon API for guaranteed delivery
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const data = new FormData();
      data.append('action', 'copy_attempt');
      data.append('fingerprint', params.fingerprint);
      data.append('contentType', params.contentType);
      data.append('contentId', params.contentId);
      data.append('userId', params.userId || 'anonymous');
      data.append('timestamp', new Date().toISOString());

      navigator.sendBeacon('/api/tracking/copy-attempt', data);
    } else {
      // Fallback: fetch (may not complete if page unloads)
      await fetch('/api/tracking/copy-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    }
  } catch (error) {
    logger.error('Failed to track copy attempt', error as Error, {
      category: 'content',
    });
  }
}

// ============================================================================
// 4. WATERMARK CSS (Minimal, no visual impact)
// ============================================================================

/**
 * Optional: Visible watermark (very faint, for PDFs/screenshots).
 * Impact: ~1% opacity, doesn't interfere with reading
 * Usage: Add to container holding protected content
 */
export const WATERMARK_CSS = `
  .watermarked {
    position: relative;
  }
  
  .watermarked::after {
    content: 'Licensed Material • Do Not Copy';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120px;
    font-weight: bold;
    color: rgba(128, 128, 128, 0.03); /* 3% opacity */
    pointer-events: none;
    z-index: -1;
    white-space: nowrap;
    width: 200%;
    height: 200%;
  }
`;
