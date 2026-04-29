import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface ForgotPasswordEmailProps {
  name: string;
  actionUrl: string;
}

export const ForgotPasswordEmail = ({
  name,
  actionUrl,
}: ForgotPasswordEmailProps) => {
  const previewText = `Reset your UPSC Zen password.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
             <Text style={logoText}>UPSC ZEN</Text>
          </Section>
          
          <Section style={contentSection}>
            <Heading style={h1}>Password Reset Request</Heading>
            <Text style={text}>
              Hi {name},
            </Text>
            <Text style={text}>
              Someone requested a password reset for your UPSC Zen account. If this was you, please click the button below to set a new password.
            </Text>
            
            <Section style={btnSection}>
              <Button style={button} href={actionUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={secondaryText}>
              If the button doesn't work, copy and paste this link into your browser:
              <br />
              <Link href={actionUrl} style={link}>{actionUrl}</Link>
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              This link is valid for <strong>24 hours</strong>. If you didn't request this, you can safely ignore this email.
            </Text>
            
            <Text style={footerText}>
              Best regards,<br />
              <strong>Team UPSC Zen</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ForgotPasswordEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '580px',
};

const headerSection = {
  backgroundColor: '#0f172a',
  padding: '32px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800',
  letterSpacing: '0.05em',
  margin: '0',
};

const contentSection = {
  padding: '40px 48px',
};

const h1 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const btnSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const secondaryText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
};

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 12px',
};
