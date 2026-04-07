import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  revalidateTag('pyq-stats', { expire: 0 });
  revalidateTag('tests', { expire: 0 });
  revalidateTag('pyq-questions', { expire: 0 });
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
