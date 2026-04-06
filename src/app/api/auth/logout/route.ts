import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Logout must never be cached
export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();

  // Clear the JWT auth cookie
  cookieStore.delete('mppsc_token');

  // Set no-cache headers to prevent browser/CDN from caching logout response
  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
