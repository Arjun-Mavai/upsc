import * as Sentry from '@sentry/nextjs';

/**
 * 📢 EXPERT LOGGER SYSTEM
 *
 * Designed for:
 * 1. Deep Observability (Categorized logs)
 * 2. structured Context (User IDs, Metadata)
 * 3. Sentry Integration (Automatic tagging)
 */

export type LogCategory =
  | 'auth'
  | 'payment'
  | 'db'
  | 'api'
  | 'content' // Added for blogs/syllabus
  | 'uncategorized'
  | 'email'
  | 'system'
  | 'admin'
  | 'ui'
  | 'error-boundary'
  | 'production-error'
  | 'telegram'
  | 'whatsapp';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  category: LogCategory;
  userId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Formats options into a context object for Sentry
 */
const formatContext = (context?: LogContext) => {
  const { category, userId, metadata, ...rest } = context || {};
  return {
    tags: {
      category: category || 'system',
    },
    user: userId ? { id: userId } : undefined,
    extra: {
      ...metadata,
      ...rest,
    },
  };
};

/**
 * Internal printer that handles both Console and Sentry
 */
const logToSentry = (level: LogLevel, message: string, error?: any, context?: LogContext) => {
  const { tags, user, extra } = formatContext(context);

  Sentry.withScope((scope) => {
    scope.setTags(tags);
    if (user) {
      scope.setUser(user);
    }
    if (extra) {
      scope.setExtras(extra);
    }
    // Set level via scope if needed, or rely on capture methods

    if (level === 'error') {
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message || 'Unknown Error', 'error');
        if (error) {
          scope.setExtra('original_error_object', error);
        }
      }
    } else if (level === 'warn') {
      Sentry.captureMessage(message, 'warning');
    } else if (level === 'info') {
      Sentry.addBreadcrumb({
        category: tags.category,
        message: message,
        level: 'info',
        data: extra,
      });
    }
  });
};

const printConsole = (level: LogLevel, message: string, error?: any, context?: LogContext) => {
  if (!isDev) return; // Optional: Silence console in prod to keep logs clean, or keep it for Vercel logs

  const timestamp = new Date().toISOString().substring(11, 19);
  const category = context?.category || 'system';

  const styles = {
    info: 'color: #3b82f6; font-weight: bold;',
    warn: 'color: #f59e0b; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    debug: 'color: #a855f7; font-weight: bold;',
  };

  const prefix = `[${timestamp}] [${category.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(`%c${prefix} ${message}`, styles.error);
      if (error) console.error(error);
      break;
    case 'warn':
      console.warn(`%c${prefix} ${message}`, styles.warn, context?.metadata || '');
      break;
    case 'info':
      console.log(`%c${prefix} ${message}`, styles.info, context?.metadata || '');
      break;
    case 'debug':
      console.debug(`%c${prefix} ${message}`, styles.debug, context?.metadata || '');
      break;
  }
};

// Explicit type to avoid circular reference
type Logger = {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: any, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
};

export const logger: Logger = {
  /**
   * ℹ️ INFO: Standard events (User logged in, Payment started)
   * - recorded as Sentry Breadcrumbs
   */
  info: (message: string, context?: LogContext) => {
    printConsole('info', message, undefined, context);
    logToSentry('info', message, undefined, context);
  },

  /**
   * ⚠️ WARN: Unexpected but handled issues (Rate limit hit, invalid input)
   * - recorded as Sentry Issues (Warning level)
   */
  warn: (message: string, context?: LogContext) => {
    printConsole('warn', message, undefined, context);
    logToSentry('warn', message, undefined, context);
  },

  /**
   * 🚨 ERROR: Critical failures (DB connection lost, Payment failed)
   * - recorded as Sentry Issues (Error level) w/ Stack Trace
   */
  error: (message: string, error?: any, context?: LogContext) => {
    printConsole('error', message, error, context);
    logToSentry('error', message, error, context);
  },

  /**
   * 🐛 DEBUG: Dev-only traces
   * - Not sent to Sentry (usually)
   */
  debug: (message: string, context?: LogContext) => {
    printConsole('debug', message, undefined, context);
  },
};
