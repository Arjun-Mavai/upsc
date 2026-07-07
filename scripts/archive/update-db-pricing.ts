import { db } from './src/db';
import { pricingConfig } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  await db.update(pricingConfig)
    .set({
      proPrice: 499,
      comboPrice: 499,
      urgencyText: 'Early Bird Offer — UPSC 2026 🚀',
      urgencyTextHi: 'अर्ली बर्ड ऑफर — UPSC 2026 🚀'
    })
    .where(eq(pricingConfig.examType, 'upsc'));
  
  console.log("Updated pricing in DB successfully!");
  process.exit(0);
}

main().catch(console.error);
