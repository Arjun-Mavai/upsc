import { cn } from '@/lib/utils';

/** Light: warm accents. Dark: cooler 4th slot (sky) so nothing reads red/pink-hot on slate. */
export const MAIN_SYLLABUS_CARD_HUES = ['pink', 'emerald', 'amber', 'sky'] as const;

export type MainSyllabusCardHue = (typeof MAIN_SYLLABUS_CARD_HUES)[number];

export function mainsSyllabusTileSkin(
  hue: MainSyllabusCardHue,
  deep: boolean
): { frame: string; rowHover: string; markBadge: string } {
  if (!deep) {
    const outer: Record<MainSyllabusCardHue, string> = {
      pink:
        'border-2 border-pink-100 bg-pink-50 shadow-sm shadow-pink-200/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-200/45',
      emerald:
        'border-2 border-emerald-100 bg-emerald-50 shadow-sm shadow-emerald-200/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/45',
      amber:
        'border-2 border-amber-100 bg-amber-50 shadow-sm shadow-amber-200/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-200/45',
      sky:
        'border-2 border-sky-100 bg-sky-50 shadow-sm shadow-sky-200/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-200/45',
    };
    const badges: Record<MainSyllabusCardHue, string> = {
      pink:
        'border border-pink-200/80 bg-white/90 font-black text-[10px] text-pink-900 shadow-sm',
      emerald:
        'border border-emerald-200/80 bg-white/90 font-black text-[10px] text-emerald-900 shadow-sm',
      amber:
        'border border-amber-200/80 bg-white/90 font-black text-[10px] text-amber-950 shadow-sm',
      sky:
        'border border-sky-200/80 bg-white/90 font-black text-[10px] text-sky-900 shadow-sm',
    };
    return {
      frame: outer[hue],
      rowHover: 'hover:bg-white/55',
      markBadge: badges[hue],
    };
  }

  const outer: Record<MainSyllabusCardHue, string> = {
    pink:
      'border-2 border-pink-400/25 bg-slate-950/50 shadow-md shadow-black/30 hover:border-pink-400/40',
    emerald:
      'border-2 border-emerald-500/40 bg-emerald-950/35 shadow-md shadow-emerald-950/50 hover:border-emerald-400/55',
    amber: 'border-2 border-amber-500/40 bg-amber-950/30 shadow-md shadow-amber-950/45 hover:border-amber-400/55',
    sky: 'border-2 border-sky-500/35 bg-slate-900/65 shadow-md shadow-slate-950/50 hover:border-sky-400/45',
  };
  const badges: Record<MainSyllabusCardHue, string> = {
    pink: 'border border-pink-400/35 bg-pink-950/65 font-black text-[10px] text-pink-100',
    emerald:
      'border border-emerald-400/35 bg-emerald-950/65 font-black text-[10px] text-emerald-100',
    amber:
      'border border-amber-400/35 bg-amber-950/55 font-black text-[10px] text-amber-50',
    sky: 'border border-sky-400/30 bg-slate-800/90 font-black text-[10px] text-sky-100',
  };
  return {
    frame: outer[hue],
    rowHover: 'hover:bg-black/15',
    markBadge: badges[hue],
  };
}

/** High-contrast pill — PYQ variant slot label. */
export function mainsSyllabusVariantBadge(
  hue: MainSyllabusCardHue,
  variantSlot: 1 | 2,
  deep: boolean
): string {
  if (!deep) {
    return cn(
      'inline-flex items-center rounded-full border border-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm',
      'bg-slate-900',
      variantSlot === 2 && 'ring-2 ring-white/90'
    );
  }
  const badge: Record<MainSyllabusCardHue, [string, string]> = {
    pink: [
      'border border-pink-300/40 bg-pink-950 text-pink-50',
      'border border-pink-300/35 bg-pink-900 text-pink-50',
    ],
    emerald: [
      'border border-emerald-300/40 bg-emerald-950 text-emerald-50',
      'border border-emerald-300/35 bg-emerald-900 text-emerald-50',
    ],
    amber: [
      'border border-amber-300/40 bg-amber-950 text-amber-50',
      'border border-amber-300/35 bg-amber-900 text-amber-50',
    ],
    sky: [
      'border border-sky-400/35 bg-slate-900 text-sky-50',
      'border border-sky-400/28 bg-slate-800 text-sky-100',
    ],
  };
  return cn(
    'inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm',
    badge[hue][variantSlot === 1 ? 0 : 1]
  );
}
