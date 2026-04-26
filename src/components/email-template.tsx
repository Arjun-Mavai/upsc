interface EmailTemplateProps {
  name: string;
  actionUrl: string;
  planName?: string;
}

export default function EmailTemplate({
  name,
  actionUrl,
  planName = 'Premium',
}: EmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        lineHeight: '1.6',
        color: '#1a1a1a',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header with brand gradient */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          padding: '32px 24px',
          textAlign: 'center',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            letterSpacing: '-0.5px',
          }}
        >
          UPSC Zen
        </h1>
        <p
          style={{
            color: '#818CF8',
            fontSize: '12px',
            fontWeight: '600',
            margin: '0',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Civil Services · PYQ mastery
        </p>
      </div>

      {/* Main content */}
      <div style={{ padding: '32px 24px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
        {/* Congratulations badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
              color: '#4f46e5',
              fontSize: '13px',
              fontWeight: '700',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #c7d2fe',
            }}
          >
            🎉 Congratulations!
          </span>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>Hi {name},</p>

        <p style={{ fontSize: '15px', marginBottom: '16px', color: '#374151' }}>
          Welcome aboard! Your <strong style={{ color: '#4f46e5' }}>{planName}</strong> plan is
          activated. You&apos;ve taken a major step towards mastering UPSC CSE PYQs — the core of
          the exam. 💪
        </p>

        <p style={{ fontSize: '15px', marginBottom: '24px', color: '#374151' }}>
          Set your password below to unlock your full access — year-wise segregation, subject-wise trends,
          expert-led logic explanations, and everything you need for UPSC zen.
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a
            href={actionUrl}
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
            }}
          >
            Set Your Password →
          </a>
        </div>

        {/* Motivation box */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            borderLeft: '4px solid #4f46e5',
          }}
        >
          <p style={{ fontSize: '14px', color: '#475569', margin: '0', fontStyle: 'italic' }}>
            &quot;Syllabus is the map, and PYQs are the compass.&quot; — Your UPSC Zen journey starts now.
            We&apos;re here to help you decode the patterns and score higher.
          </p>
        </div>

        {/* What you get */}
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#0a0a0a',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            What&apos;s waiting for you:
          </p>
          <table style={{ width: '100%', fontSize: '14px', color: '#4b5563' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0' }}>✅ UPSC CSE PYQ Papers (2020-2025)</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>✅ Expert Wisdom (Verdict, Logic Path)</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>✅ Subject-Wise & Year-Wise Organised PYQs</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>✅ Instant Mode: Logic Behind Every Option</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>✅ Personal Test History & Dashboard</td>
              </tr>
              {/* <tr>
                <td style={{ padding: '4px 0' }}>✅ Premium PYQ Analysis & Insights</td>
              </tr> */}
            </tbody>
          </table>
        </div>

        {/* Token expiry warning */}
        <div
          style={{
            background: '#fef3c7',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#92400e', margin: '0', fontWeight: '500' }}>
            ⏰ This link expires in <strong>1 hour</strong>. Set your password now to avoid
            requesting a new one.
          </p>
        </div>

        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          If you didn&apos;t make this purchase, please ignore this email. No action is needed.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#f9fafb',
          padding: '20px 24px',
          textAlign: 'center',
          borderRadius: '0 0 12px 12px',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
        }}
      >
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: '600' }}>
          UPSC Zen — Smart Test Series
        </p>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0' }}>
          Secure • Trusted • Built for Serious UPSC Aspirants
        </p>
      </div>
    </div>
  );
}
