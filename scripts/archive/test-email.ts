import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
  
  if (!apiKey) {
    console.error('❌ Error: RESEND_API_KEY is not set in .env');
    return;
  }

  console.log(`🔌 Testing Resend with:
  From: ${fromEmail}
  API Key: ${apiKey.substring(0, 7)}...`);

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: `Test <${fromEmail}>`,
      to: ['yuyureka212@gmail.com'], // Sending to user's email from git log
      subject: 'Resend Test - MPPSC App',
      html: '<h1>Connection Successful</h1><p>If you see this, Resend is working correctly with your current API key.</p>',
    });

    if (error) {
      console.error('❌ Resend Error:', error);
    } else {
      console.log('✅ Email sent successfully!', data);
    }
  } catch (err) {
    console.error('💥 Unexpected Crash:', err);
  }
}

testEmail();
