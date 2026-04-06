export async function GET() {
  const baseUrl = 'https://upsc.zenscroll.app';

  // 🤖 ROBOTS.TXT — UPSC Intelligence

  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /syllabus/quiz/play',
    'Disallow: /_next/static/css/',
    'Disallow: /_next/static/media/',
    'Disallow: /signup',
    'Disallow: /forgot-password',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    'Allow: /syllabus/quiz/pyq',
    'Allow: /syllabus/quiz/pyq/intelligence',
    'Allow: /blogs/',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /syllabus/quiz/play',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    'Allow: /syllabus/quiz/pyq',
    'Allow: /blogs/',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /syllabus/quiz/play',
    '',
    'User-agent: AhrefsBot',
    'User-agent: SemrushBot',
    'User-agent: DotBot',
    'User-agent: MJ12bot',
    'User-agent: BLEXBot',
    'User-agent: PetalBot',
    'Disallow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=600',
    },
  });
}
