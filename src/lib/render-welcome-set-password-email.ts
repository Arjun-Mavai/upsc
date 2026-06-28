import { createElement } from 'react';
import { render } from '@react-email/render';
import EmailTemplate from '@/components/email-template';

/**
 * HTML for “welcome / set your password” after a successful first-time (non-upgrade) payment.
 * Shared by `verifyPayment` (server action) and POST `/api/payment/verify` so one polished layout
 * (rich header, CTA, feature list, expiry notice — from `components/email-template.tsx`).
 */
export async function renderWelcomeSetPasswordEmailHtml(opts: {
  name: string;
  actionUrl: string;
  planTier: 'lite' | 'pro';
}): Promise<string> {
  const planName = opts.planTier === 'pro' ? 'Pro' : 'Lite';
  return render(
    createElement(EmailTemplate, {
      name: opts.name,
      actionUrl: opts.actionUrl,
      planName,
    })
  );
}
