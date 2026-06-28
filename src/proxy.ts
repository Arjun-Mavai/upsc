import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Bhai, ye proxy hi apna main gatekeeper (Middleware) hai.
// Bina valid token ke protected routes pe entry mana hai!
const FREE_TEST_IDS = [
  'CtN-YXOB5fU5Lz7f6HI1G',
  'd4fe15f9-faf0-42cb-a8d1-11831db84a5c',
  '33465b70-011e-45d7-92f3-5081351cc436',
  'FFPEWTMww259TMakCWyYF',
  'fnyHrjpJ3YXunl67GSihg',
  'ID-CHHATHA-666',
];
const JWT_SECRET = process.env.JWT_SECRET || 'bhai-ka-secret-key-change-kar-le-jaldi';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Protected Routes: Jahan bina login ke nahi ja sakte
const PROTECTED_ROUTES = ['/profile'];
// Note: /feedback is PUBLIC.

// Auth Routes: Jahan login hone ke baad nahi jana chahiye
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get('mppsc_token')?.value;
  const testId = searchParams.get('testId');
  console.log('middleware running for the path', pathname);
  // 1. Verify Token (Agar token hai to check karo valid hai ya nahi)
  let isValidToken = false;

  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      isValidToken = true;
    } catch (error) {
      // Token invalid or expired
      isValidToken = false;
    }
  }

  // 2. Handle Protected Routes
  // Agar route protected hai aur token nahi hai/invalid hai -> Login pe bhejo
  // Also check dynamic routes under /syllabus
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!isValidToken) {
      // "Bhai, pehle login karke aao"
      return NextResponse.redirect(new URL('/login', request.url), {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
      });
    }
  }
  // Agar testId free wali list mein hai, toh jaane do (Allow)
  if (testId && FREE_TEST_IDS.includes(testId)) {
    // console.log('hello i am here', testId, FREE_TEST_IDS.includes(testId));
    //https://share.google/aimode/zo09763VrWQotzvQU

    //https://share.google/aimode/JdmtXf6WUqWCKInbN
    // proxy knowlege of cache and all
    return NextResponse.next();
  }
  // 3. Handle Auth Routes
  // Agar user logged in hai aur Login/Signup pe ja raha hai -> Syllabus pe bhejo
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    if (isValidToken) {
      // "Arre bhai, login toh hai tu, andar chal"
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Admin Access
  if (pathname.startsWith('/admin')) {
    if (!isValidToken) {
      return NextResponse.redirect(new URL('/login', request.url), {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
      });
    }
  }

  return NextResponse.next();
}

// Export as 'proxy' if usage expects it, but for standard Middleware file, default export is usually config/middleware.
// Since user insists on 'proxy.ts', we export middleware logic.
// If this file is hooked up elsewhere, caller should import { middleware } from '@/proxy'.

// Matcher Configuration for Next.js Middleware mechanism
//"Syllabus ke baad agar quiz, units, ya pyq likha hai, toh Chup raho. Iske alawa kuch bhi aur likha hai, toh Chilla do (Redirect kar do)."
//
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icon|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
    // '/syllabus/:path((?!quiz$|units$|pyq$|csat$|full-length$|topics$|auth$).+)',
    // '/syllabus/:path*',
  ],
};
