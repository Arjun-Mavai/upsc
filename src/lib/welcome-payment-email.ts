import { createElement } from 'react';
import { render } from '@react-email/render';
import EmailTemplate from '@/components/email-template';
import type { UpscSegmentCopyBlock } from '@/config/upsc-product-copy';

/** Dynamic welcome email HTML + subject for MPPSC payments (/lite/pro/upgrade/mains/combo). */
export async function renderMppscPaymentWelcomeEmail(params: {
  name: string;
  actionUrl: string;
  segmentCopy: UpscSegmentCopyBlock;
}) {
  const { name, actionUrl, segmentCopy } = params;

  const html = await render(
    createElement(EmailTemplate, {
      name,
      actionUrl,
      planName: 'Premium',

    })
  );

  return { subject: segmentCopy.emailSubjectEn, html };
}
