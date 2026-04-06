// PYQ Intelligence shared constants
import { SUBJECTS } from '@/lib/pyq-ui-constants';

export const UNIT_COLORS: Record<string, string> = {
  unit_1: 'bg-rose-500',
  unit_2: 'bg-orange-500',
  unit_3: 'bg-amber-400',
  unit_4: 'bg-yellow-400',
  unit_5: 'bg-lime-400',
  unit_6: 'bg-green-400',
  unit_7: 'bg-emerald-400',
  unit_8: 'bg-teal-400',
  unit_9: 'bg-cyan-400',
  unit_10: 'bg-sky-400',
  unmapped: 'bg-slate-600',
  // UPSC Subjects
  'History': 'bg-pink-500',
  'Polity': 'bg-emerald-500',
  'Geography': 'bg-blue-500',
  'Economy': 'bg-cyan-500',
  'Current Affairs': 'bg-purple-500',
  'Science & Technology': 'bg-cyan-500',
  'Science': 'bg-indigo-500',
  'Science & Tech': 'bg-cyan-500',
  'International Relations': 'bg-indigo-500',
  'Agriculture': 'bg-emerald-500',
  'Economy / Agriculture': 'bg-cyan-500',
  'Defence': 'bg-rose-500',
  'Defence / IR': 'bg-indigo-500',
  'Geography / IR': 'bg-blue-500',
  'Environment / IR': 'bg-emerald-500',
  'Environment': 'bg-emerald-500',
  'Governance / Economy': 'bg-indigo-500',
  'Governance / Social Issues': 'bg-slate-500',
};

export const SUBJECT_ICONS: Record<string, string> = {
  'History': 'Library',
  'Polity': 'Scale',
  'Geography': 'Globe',
  'Economy': 'Banknote',
  'Current Affairs': 'Newspaper',
  'Science & Technology': 'Atom',
  'Science': 'Atom',
  'Science & Tech': 'Atom',
  'International Relations': 'Network',
  'Agriculture': 'Leaf',
  'Environment': 'Leaf',
  'Economy / Agriculture': 'Banknote',
  'Defence': 'Shield',
  'Defence / IR': 'Network',
  'Geography / IR': 'Globe',
  'Environment / IR': 'Leaf',
  'Governance / Economy': 'Scale',
  'Governance / Social Issues': 'Scale',
};

export const getUnitColor = (unitId: string): string => {
  return UNIT_COLORS[unitId] || 'bg-slate-500';
};

export const formatUnitTitle = (unitId: string, isHindi: boolean = false): string => {
  // If it's a UPSC subject (doesn't start with unit_)
  if (!unitId.toLowerCase().startsWith('unit_')) {
    if (isHindi) {
      const sub = SUBJECTS.find(s => s.name === unitId || s.nameHi === unitId);
      return sub?.nameHi || unitId;
    }
    return unitId; // Return subject name as is
  }
  
  if (isHindi) {
    return unitId.replace(/unit_/i, 'यूनिट ').replace(/_/g, ' ');
  }
  return unitId.replace(/unit_/i, 'Unit ').replace(/_/g, ' ');
};
