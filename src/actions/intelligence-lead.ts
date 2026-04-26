'use server';

import { db } from '@/db';
import { supportTickets } from '@/db/schema';
import { logger } from '@/lib/logger';
import { createGuestEntry } from '@/actions/guest-actions';

interface IntelligenceLeadInput {
  name: string;
  mobile: string;
  email?: string;
  unitId?: string;
  source?: string;
}

export async function submitIntelligenceLead(input: IntelligenceLeadInput) {
  try {
    const name = input.name?.trim();
    const mobile = (input.mobile || '').trim();
    const email = input.email?.trim();

    if (!name || mobile.replace(/\D/g, '').length < 10) {
      return { success: false as const, error: 'Missing required fields' };
    }

    // 1) Upsert guest entry (canonical guest store)
    await createGuestEntry({ name, email, mobile });

    // 2) Store an attribution event (using support_tickets as a lightweight lead inbox)
    const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);
    const message = [
      'INTELLIGENCE_LEAD',
      `unitId=${input.unitId || ''}`,
      `source=${input.source || ''}`,
      `mobile=${normalizedMobile}`,
    ]
      .filter(Boolean)
      .join(' | ');

    await db.insert(supportTickets).values({
      id: crypto.randomUUID(),
      userId: null,
      name,
      email: email || 'lead@upsczen.local',
      phone: normalizedMobile,
      category: 'intelligence_lead',
      message,
      status: 'open',
      createdAt: new Date(),
      examType: 'upsc',
    });

    return { success: true as const };
  } catch (error) {
    logger.error('Failed to submit intelligence lead', { error, category: 'intelligence_lead' });
    return { success: false as const, error: 'Failed to submit' };
  }
}

