import { NextResponse } from 'next/server';
import { sendTelemetryEvent, TelemetryEvent } from '@/lib/telegram-events';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TelemetryEvent;
    
    // Call the telemetry dispatcher without awaiting to not block response
    // Or await if you want to ensure it works.
    await sendTelemetryEvent(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Tracking API] Error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
