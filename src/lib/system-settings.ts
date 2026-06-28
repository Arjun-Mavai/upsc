import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const TELEMETRY_KEY = 'telemetry_enabled';

/**
 * 🔒 Check if telemetry/event logging is enabled dynamically.
 * Defaults to false if the setting is missing or the database is unavailable (fail-closed).
 */
export async function getTelemetryEnabled(): Promise<boolean> {
  try {
    const row = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, TELEMETRY_KEY))
      .limit(1);

    if (row.length === 0) {
      return false; // Default is disabled (fail-closed)
    }

    return row[0].value === 'true';
  } catch (error) {
    // Fail-closed: default to false on DB connectivity errors to prevent log flooding
    console.error('[Telemetry Settings] Failed to load setting from DB (failing closed):', error);
    return false;
  }
}

/**
 * 🔒 Set the telemetry/event logging state in the SQLite/Turso database.
 */
export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
  try {
    const valueStr = enabled ? 'true' : 'false';

    await db.insert(systemSettings)
      .values({
        key: TELEMETRY_KEY,
        value: valueStr,
        description: 'Toggles Telegram event logging bot dynamic tracking',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: valueStr,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('[Telemetry Settings] Failed to update setting in DB:', error);
    throw new Error('Failed to update telemetry settings');
  }
}

