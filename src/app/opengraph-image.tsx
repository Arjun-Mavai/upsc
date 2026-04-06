import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'UPSC Prelims 2026 Test Series & PYQ Intelligence';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    // Outer Container
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b', // zinc-950
        backgroundImage:
          'radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)',
        backgroundSize: '100px 100px',
        color: 'white',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Glow Effect */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)', // Indigo glow
          filter: 'blur(80px)',
        }}
      />

      {/* Main Card Container (Glassmorphismish) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a', // zinc-800
          borderRadius: '24px',
          padding: '60px 80px',
          backgroundColor: 'rgba(9, 9, 11, 0.8)', // semi-transparent black
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 24px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #3730a3, #4f46e5)', // Indigo gradient
            border: '1px solid #4338ca',
            marginBottom: '32px',
            boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: 'white' }}>
            TARGET: UPSC 2026
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: 1.1,
            background: 'linear-gradient(to bottom, #ffffff, #a1a1aa)', // Text gradient
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.03em',
          }}
        >
          PYQ Intelligence
        </h1>

        {/* Sub Headline */}
        <p
          style={{
            fontSize: 32,
            color: '#a1a1aa', // zinc-400
            marginBottom: '48px',
            textAlign: 'center',
            maxWidth: '600px',
          }}
        >
          6 Years of Civil Services Prelims PYQs (2020-2025)
        </p>

        {/* Feature Grid */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {/* Feature 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: '#18181b', // zinc-900
              border: '1px solid #27272a',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#e4e4e7' }}>Subject-wise</span>
          </div>

          {/* Feature 2 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: '#18181b', // zinc-900
              border: '1px solid #27272a',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: 24 }}>📅</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#e4e4e7' }}>Year-wise</span>
          </div>

          {/* Feature 3 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: '#18181b', // zinc-900
              border: '1px solid #27272a',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: 24 }}>🇮🇳</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#e4e4e7' }}>Hindi & Eng</span>
          </div>
        </div>
      </div>

      {/* Branding Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: 0.6,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} />
        <span style={{ fontSize: 18, color: '#71717a', fontWeight: 500 }}>UPSC Intelligence</span>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
