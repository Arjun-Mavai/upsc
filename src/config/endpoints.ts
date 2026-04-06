// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 CENTRALIZED API ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Single source of truth for all API routes.
// Import from here instead of hardcoding strings.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const API = {
  // ── Auth ──────────────────────────────────────────────
  AUTH: {
    LOGIN: '/api/auth/check/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    CHECK: '/api/auth/check',
    ME: '/api/auth/me',
    UPGRADE: '/api/auth/upgrade',
    EXTEND_ACCESS: '/api/auth/extend-access',
    CHECK_EMAIL: '/api/auth/check-email',
  },

  // ── Pricing ──────────────────────────────────────────
  PRICING: '/api/pricing',

  // ── Payment ──────────────────────────────────────────
  PAYMENT: {
    CHECKOUT: '/api/payment/checkout',
    EXIT_SURVEY: '/api/payment/exit-survey',
  },

  // ── Tests ────────────────────────────────────────────
  TESTS: {
    FLT: '/api/tests/flt',
    CSAT: '/api/tests/csat',
    PYQ: '/api/tests/pyq',
  },

  // ── Admin ────────────────────────────────────────────
  ADMIN: {
    USERS: '/api/admin/users',
    FEEDBACKS: '/api/admin/feedbacks',
    TOGGLE_ACTIVE: '/api/admin/toggle-active',
    ENRICH_SYLLABUS: '/api/admin/enrich-syllabus',
  },

  // ── Feedback ─────────────────────────────────────────
  FEEDBACK: '/api/feedback',

  // ── Webhooks ─────────────────────────────────────────
  WEBHOOKS: {
    DODO: '/api/webhooks/dodo',
  },

  // ── Utilities ────────────────────────────────────────
  REVALIDATE: '/api/revalidate',
  DEBUG_DB: '/api/debug-db',
} as const;

// Type-safe endpoint type
export type ApiEndpoint = string;
