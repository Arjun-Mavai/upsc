// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 UPSC Zen — Pricing Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Used by: PremiumMarketing, /pricing page, /admin/pricing, /api/pricing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PricingData {
  proPrice: number;
  proOriginalPrice: number;
  litePrice: number;
  liteOriginalPrice: number;
  proValidityText: string;
  proMonths: number;
  liteMonths: number;
  liteValidityText: string;
  upgradePrice: number;
  upgradeOriginalPrice: number;
  urgencyText: string;
  urgencyTextHi: string;
  studentsBought: number;
  mainsPrice: number;
  mainsOriginalPrice: number;
  mainsValidityText: string;
  mainsMonths: number;
  comboPrice: number;
  comboOriginalPrice: number;
  comboValidityText: string;
  comboMonths: number;
}

export const PRICING_DEFAULTS: PricingData = {
  proPrice: 249,
  proOriginalPrice: 999,
  litePrice: 99,
  liteOriginalPrice: 499,
  proValidityText: 'Valid till UPSC Prelims 2026',
  proMonths: 12,
  liteMonths: 6,
  liteValidityText: 'Valid till UPSC Prelims 2026',
  upgradePrice: 150,
  upgradeOriginalPrice: 700,
  urgencyText: 'Special pricing for first 100 UPSC aspirants',
  urgencyTextHi: 'पहले 100 UPSC अभ्यर्थियों के लिए विशेष मूल्य',
  studentsBought: 47,
  mainsPrice: 999,
  mainsOriginalPrice: 1999,
  mainsValidityText: 'Valid till UPSC Mains 2026',
  mainsMonths: 12,
  comboPrice: 499,
  comboOriginalPrice: 999,
  comboValidityText: 'Valid till UPSC Mains 2026',
  comboMonths: 12,
};

// Icon types for pricing page (lucide icon components)
export interface PlanFeature {
  en: string;
  hi: string;
}

export interface PlanFeatureWithIcon extends PlanFeature {
  icon?: string; // lucide icon name for mapping
}

/**
 * ── UPSC Pro Plan Features ─────────────────────────────────
 * Focused on PYQ Intelligence for UPSC Civil Services.
 */
export const PRO_FEATURES: PlanFeatureWithIcon[] = [
  { en: 'Prelims PYQ Papers (2020-2025)', hi: 'प्रीलिम्स PYQ पेपर्स (2020-2025)', icon: 'Target' },
  { en: 'UPSC Mains Expert Library (GS1 - GS4)', hi: 'UPSC मेन्स एक्सपर्ट लाइब्रेरी (GS1 - GS4)', icon: 'BookOpen' },
  { 
    en: 'Expert Wisdom (Verdict, Logic, Topper Intro)', 
    hi: 'विशेषज्ञ व्याख्याएं (फैसला, तर्क, टॉपर भूमिका)', 
    icon: 'Sparkles' 
  },
  { en: 'Subject-Wise & Year-Wise Organised PYQs', hi: 'विषय-वार और वर्ष-वार व्यवस्थित PYQs', icon: 'LayoutGrid' },
  { en: 'Instant Mode: Logic Behind Every Option', hi: 'इंस्टेंट मोड: हर विकल्प के पीछे का तर्क', icon: 'Zap' },
  { en: 'Personal Test History & Analytics Dashboard', hi: 'व्यक्तिगत टेस्ट हिस्ट्री और एनालिटिक्स', icon: 'History' },
  // { en: 'Premium PYQ Analysis & Insights', hi: 'प्रीमियम PYQ विश्लेषण और इनसाइट्स', icon: 'TrendingUp' }, // hidden for now
];

// Helper: compute discount percentage
export function calcDiscount(price: number, originalPrice: number): number {
  return Math.round((1 - price / originalPrice) * 100);
}

// Helper: compute monthly cost
export function calcMonthly(price: number, months: number): number {
  return Math.round(price / months);
}
