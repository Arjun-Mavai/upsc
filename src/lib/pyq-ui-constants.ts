import {
  BookOpen,
  Calendar,
  MapPin,
  Scale,
  TrendingUp,
  Atom,
  Newspaper,
  Smartphone,
  GraduationCap,
  Leaf,
  Library,
  Network,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// Shared PYQ UI Constants
// Single source of truth for subject styling across PYQ pages
// ============================================

export interface SubjectConfig {
  name: string;
  nameHi: string;
  icon: LucideIcon;
  color: SubjectColorKey;
}

export type SubjectColorKey =
  | 'amber'
  | 'pink'
  | 'blue'
  | 'emerald'
  | 'cyan'
  | 'indigo'
  | 'purple'
  | 'rose'
  | 'slate';

// Subject configuration - icons and color mapping
export const SUBJECTS: SubjectConfig[] = [
  // Core / MPPSC Subjects
  { name: 'MP GK', nameHi: 'एमपी सामान्य ज्ञान', icon: BookOpen, color: 'amber' },
  { name: 'History', nameHi: 'इतिहास', icon: Calendar, color: 'pink' },
  { name: 'Geography', nameHi: 'भूगोल', icon: MapPin, color: 'blue' },
  { name: 'Polity', nameHi: 'राजव्यवस्था', icon: Scale, color: 'emerald' },
  { name: 'Economy', nameHi: 'अर्थव्यवस्था', icon: TrendingUp, color: 'cyan' },
  { name: 'Science', nameHi: 'विज्ञान', icon: Atom, color: 'indigo' },
  { name: 'Current Affairs', nameHi: 'समसामयिकी', icon: Newspaper, color: 'purple' },
  { name: 'ICT', nameHi: 'सूचना संचार प्रौद्योगिकी', icon: Smartphone, color: 'rose' },
  { name: 'GS', nameHi: 'सामान्य अध्ययन', icon: GraduationCap, color: 'slate' },
  
  // UPSC Specific / Shared Extended
  { name: 'History & Culture', nameHi: 'इतिहास और संस्कृति', icon: Library, color: 'pink' },
  { name: 'Polity & Governance', nameHi: 'शासन और राजव्यवस्था', icon: Scale, color: 'indigo' },
  { name: 'Environment', nameHi: 'पर्यावरण', icon: Leaf, color: 'emerald' },
  { name: 'Science & Tech', nameHi: 'विज्ञान और तकनीक', icon: Atom, color: 'cyan' },
  { name: 'International Relations', nameHi: 'अंतरराष्ट्रीय संबंध', icon: Network, color: 'indigo' },
  { name: 'Quantitative Aptitude', nameHi: 'अंकगणित', icon: TrendingUp, color: 'amber' },
  { name: 'Reasoning', nameHi: 'तर्कशक्ति', icon: Smartphone, color: 'blue' },

  // UPSC Specific DB Mappings
  { name: 'Science & Technology', nameHi: 'विज्ञान और तकनीक', icon: Atom, color: 'cyan' },
  { name: 'Agriculture', nameHi: 'कृषि', icon: Leaf, color: 'emerald' },
  { name: 'Economy / Agriculture', nameHi: 'अर्थव्यवस्था / कृषि', icon: TrendingUp, color: 'cyan' },
  { name: 'Defence', nameHi: 'रक्षा', icon: Scale, color: 'rose' },
  { name: 'Defence / IR', nameHi: 'रक्षा / अंतरराष्ट्रीय संबंध', icon: Network, color: 'indigo' },
  { name: 'Geography / IR', nameHi: 'भूगोल / अंतरराष्ट्रीय संबंध', icon: MapPin, color: 'blue' },
  { name: 'Environment / IR', nameHi: 'पर्यावरण / अंतरराष्ट्रीय संबंध', icon: Leaf, color: 'emerald' },
  { name: 'Governance / Economy', nameHi: 'शासन / अर्थव्यवस्था', icon: Scale, color: 'indigo' },
  { name: 'Governance / Social Issues', nameHi: 'शासन / सामाजिक मुद्दे', icon: Scale, color: 'slate' },
];

// Color variants for cards, badges, progress bars
export const SUBJECT_VARIANTS: Record<
  SubjectColorKey,
  {
    bg: string;
    border: string;
    text: string;
    progress: string;
    dot: string;
    highlight: string;
  }
> = {
  amber: {
    bg: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    progress: 'bg-amber-500',
    dot: 'bg-amber-500',
    highlight: 'bg-amber-500/10',
  },
  pink: {
    bg: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    progress: 'bg-pink-500',
    dot: 'bg-pink-500',
    highlight: 'bg-pink-500/10',
  },
  blue: {
    bg: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    progress: 'bg-blue-500',
    dot: 'bg-blue-500',
    highlight: 'bg-blue-500/10',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-green-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    progress: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    highlight: 'bg-emerald-500/10',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-teal-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    progress: 'bg-cyan-500',
    dot: 'bg-cyan-500',
    highlight: 'bg-cyan-500/10',
  },
  indigo: {
    bg: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    progress: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    highlight: 'bg-indigo-500/10',
  },
  purple: {
    bg: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    progress: 'bg-purple-500',
    dot: 'bg-purple-500',
    highlight: 'bg-purple-500/10',
  },
  rose: {
    bg: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    progress: 'bg-rose-500',
    dot: 'bg-rose-500',
    highlight: 'bg-rose-500/10',
  },
  slate: {
    bg: 'from-slate-500/20 to-gray-500/20',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    progress: 'bg-slate-500',
    dot: 'bg-slate-500',
    highlight: 'bg-slate-500/10',
  },
};

// Helper to get variant by subject name
export function getSubjectVariant(subjectName: string) {
  const subject = SUBJECTS.find((s) => s.name === subjectName);
  return subject ? SUBJECT_VARIANTS[subject.color] : SUBJECT_VARIANTS.slate;
}

// Helper to get subject config by name
export function getSubjectConfig(subjectName: string) {
  return SUBJECTS.find((s) => s.name === subjectName);
}
