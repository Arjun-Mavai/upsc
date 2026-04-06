import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET env var is missing or too short (min 32 chars). Cannot start.'
    );
  }
  return secret;
}

export function signToken(payload: object) {
  try {
    // 🛡️ SECURITY FIX: JWT expiry must match cookie maxAge (30 days)
    // Bhai, PEHLE JWT 7 days mein expire hota tha par cookie 30 days ki thi.
    // Day 8 pe user ke paas cookie thi par JWT expired → silently logged out!
    // User ko laga "bhai app kharab hai" par actually JWT expire ho gaya tha.
    //
    // Now both are 30 days → user stays logged in for full cookie lifetime.
    // Cookie: maxAge = 60*60*24*30 (set in check/login/route.ts)
    // JWT:    expiresIn = '30d' (set here)
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
  } catch (error) {
    console.error('Token sign error:', error);
    return null;
  }
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error: any) {
    if (error.message === 'jwt malformed' || error.message === 'invalid token') {
      return null;
    }
    console.error('Token verify error:', error);
    return null;
  }
}
