'use server';

import { db } from '@/db';
import { guests } from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq } from 'drizzle-orm';

/**
 * 🎯 GUEST DATA MANAGEMENT - UPSERT LOGIC
 * 
 * Standard Practice:
 * - Mobile number = Primary identifier (unique for each person)
 * - Same mobile → Update existing guest with new info
 * - New mobile or no mobile → Create new entry
 * 
 * Why mobile over name/email:
 * - Names can be same (e.g., "Rahul Sharma" is very common)
 * - Email is optional and often fake
 * - Mobile is mandatory and unique per person in India
 */

interface GuestData {
  name: string;
  email?: string;
  mobile?: string;
}

export async function createGuestEntry(data: GuestData) {
  try {
    const { name, email, mobile } = data;
    
    // ✅ UPSERT LOGIC: Mobile is the unique identifier
    if (mobile && mobile.trim().length >= 10) {
      const normalizedMobile = mobile.trim().replace(/\D/g, '').slice(-10); // Last 10 digits
      
      // Check if guest with this mobile already exists
      const existingGuest = await db.query.guests.findFirst({
        where: eq(guests.mobile, normalizedMobile),
      });
      
      if (existingGuest) {
        // ⚡ UPDATE: Guest returning with same mobile - update their info
        await db.update(guests)
          .set({
            name: name.trim(), // Always use latest name
            email: email?.trim() || existingGuest.email, // Keep old email if new one is empty
          })
          .where(eq(guests.id, existingGuest.id));
        
        return { success: true, guestId: existingGuest.id, isReturning: true };
      }
      
      // ⚡ INSERT: New guest with mobile
      const guestId = crypto.randomUUID();
      await db.insert(guests).values({
        id: guestId,
        name: name.trim(),
        email: email?.trim() || null,
        mobile: normalizedMobile,
        examType: 'upsc' as const, // UPSC-only repo
      });
      
      return { success: true, guestId, isReturning: false };
    }
    
    // ⚡ INSERT: Guest without mobile (can't identify for upsert)
    // This is fallback for cases where mobile validation was bypassed
    const guestId = crypto.randomUUID();
    await db.insert(guests).values({
      id: guestId,
      name: name.trim(),
      email: email?.trim() || null,
      mobile: mobile?.trim() || null,
      examType: 'upsc' as const, // UPSC-only repo
    });
    
    return { success: true, guestId, isReturning: false };
    
  } catch (error) {
    logger.error('Failed to create/update guest entry', { error, category: 'guest' });
    return { error: 'Failed to save guest details' };
  }
}

/**
 * Get guest by mobile number
 */
export async function getGuestByMobile(mobile: string) {
  try {
    if (!mobile || mobile.trim().length < 10) return null;
    
    const normalizedMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    
    const guest = await db.query.guests.findFirst({
      where: eq(guests.mobile, normalizedMobile),
    });
    
    return guest;
  } catch (error) {
    logger.error('Failed to get guest by mobile', { error, category: 'guest' });
    return null;
  }
}

/**
 * Check if guest exists (for pre-filling form)
 */
export async function checkExistingGuest(mobile: string) {
  const guest = await getGuestByMobile(mobile);
  
  if (guest) {
    return {
      exists: true,
      name: guest.name,
      email: guest.email,
    };
  }
  
  return { exists: false };
}
