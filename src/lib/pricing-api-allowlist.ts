/** Fields allowed through `PUT /api/pricing` (prevents arbitrary column writes). */

export const PRICING_PUT_ALLOWLIST = new Set([
  'litePrice',
  'liteOriginalPrice',
  'liteValidityText',
  'liteMonths',
  'proPrice',
  'proOriginalPrice',
  'proValidityText',
  'proMonths',
  'upgradePrice',
  'upgradeOriginalPrice',
  'mainsPrice',
  'mainsOriginalPrice',
  'mainsValidityText',
  'mainsMonths',
  'comboPrice',
  'comboOriginalPrice',
  'comboValidityText',
  'comboMonths',
  'urgencyText',
  'urgencyTextHi',
  'studentsBought',
  'mppscProductCopyJson',
]);

export function pickPricingPutPayload(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (!PRICING_PUT_ALLOWLIST.has(key)) continue;
    if (key === 'mppscProductCopyJson' && typeof val === 'string' && val.trim() === '') {
      out[key] = null;
      continue;
    }
    if (val === '') continue;
    out[key] = val;
  }
  return out;
}
