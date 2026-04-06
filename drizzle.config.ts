import { defineConfig } from 'drizzle-kit';
import path from 'path';

const localDbPath = `file:${path.resolve(process.cwd(), 'mppsc_local_dev.db')}`;
const isDev = process.env.NODE_ENV === 'development';
// src/db/index.ts (ya jahan client banate ho)
if (process.env.NODE_ENV === 'development') {
  console.log('🛠️ App is talking to LOCAL SQLite');
} else {
  console.log('🌐 App is talking to TURSO CLOUD');
}
// drizzle.config.ts mein export se pehle dalo
console.log('🚀 DB Connection Type:', isDev ? 'LOCAL (SQLite File)' : 'PRODUCTION (Turso Cloud)');
console.log('📍 Connection URL:', isDev ? localDbPath : process.env.TURSO_DATABASE_URL);

// Fail fast in production if Turso credentials are missing
if (!isDev && !process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is required in production');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isDev ? 'sqlite' : 'turso',
  dbCredentials: {
    url: isDev ? localDbPath : process.env.TURSO_DATABASE_URL!,
    authToken: isDev ? undefined : process.env.TURSO_AUTH_TOKEN,
  },
  tablesFilter: ['!questions_fts*'],
});
