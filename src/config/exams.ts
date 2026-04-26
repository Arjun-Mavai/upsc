// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPSC Zen — Dedicated Platform Configuration
// Subdomain: upsc.zenscroll.app
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ExamLayoutMode = 'UNIT_WISE' | 'SUBJECT_WISE';

export interface ScoringConfig {
  marksPerQuestion: number;
  negativeMarking: number;
}

export interface ExamConfig {
  id: string;
  name: string;
  nameHi: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  description: string;
  descriptionHi: string;
  layoutMode: ExamLayoutMode;
  canonicalTestIds: Record<number, string>;
  subjects: string[];
  navItems: string[];
  logoText: string;
  primaryColor: string;
  marketing: {
    years: { year: string; count: number; pct: number }[];
    risingTopics: { topicHi: string; topicEn: string; pct: number; delta: string; color: string; badge: string }[];
    insightHi: string;
    insightEn: string;
  };
  scoring: {
    default: ScoringConfig;
    CSAT?: ScoringConfig;
  };
}

// UPSC Civil Services Exam Configuration
const UPSC_CONFIG: ExamConfig = {
  id: 'upsc',
  name: 'UPSC Zen',
  nameHi: 'UPSC जेन',
  title: 'UPSC Zen — Master UPSC CSE PYQs (2020-2025)',
  titleHi: 'UPSC जेन — UPSC CSE PYQs में महारत',
  subtitle: 'Decode the DNA of UPSC Prelims',
  subtitleHi: 'UPSC Prelims का DNA समझें',
  description:
    'Master UPSC CSE Previous Year Questions (2020-2025) with expert-led logical explanations (Verdict, Logic Path, Trap Watch) and organized subject-wise analysis.',
  descriptionHi:
    'विशेषज्ञ तार्किक व्याख्याओं (Verdict, Logic Path, Trap Watch) और व्यवस्थित विषय-वार विश्लेषण के साथ UPSC CSE PYQs (2020-2025) में महारत हासिल करें।',
  layoutMode: 'SUBJECT_WISE',
  canonicalTestIds: {
    2020: 'HlV9k4WU4baNG2RkTmJeC',
    2021: '1J4r7wY28DmgRoToapfGX',
    2022: '6qqqSGCLbSKL99FpsZeO2',
    2023: 'YmGpGJ_XEMwRdO8mWbrer',
    2024: 'PS0pMCOO4gOtoUTCMV_HH',
    2025: '9YZzj61hPIg2AgtmQkE1e',
  },
  subjects: [
    'History (Ancient, Medieval, Modern)',
    'Geography (India & World)',
    'Polity (Indian Constitution & Governance)',
    'Economy (Basic Economics & Indian Economy)',
    'Environment & Ecology',
    'Science & Technology',
    'International Relations',
    'Art & Culture',
    'Current Affairs',
  ],
  navItems: ['PYQ Intelligence', 'Year-wise Tests', 'Test History', 'Blogs'],
  logoText: 'UPSC',
  primaryColor: 'indigo',
  marketing: {
    years: [
      { year: '2020', count: 100, pct: 100 },
      { year: '2021', count: 100, pct: 100 },
      { year: '2022', count: 100, pct: 100 },
      { year: '2023', count: 100, pct: 100 },
      { year: '2024', count: 100, pct: 100 },
      { year: '2025', count: 100, pct: 100 },
    ],
    risingTopics: [
      { topicHi: 'भारतीय राजव्यवस्था', topicEn: 'Polity & Governance', pct: 88, delta: 'Core', color: 'from-indigo-500 to-blue-400', badge: '⚖️' },
      { topicHi: 'अर्थव्यवस्था', topicEn: 'Economy', pct: 82, delta: 'High', color: 'from-blue-500 to-cyan-400', badge: '📈' },
      { topicHi: 'पर्यावरण & पारिस्थितिकी', topicEn: 'Environment & Ecology', pct: 75, delta: 'Rising', color: 'from-emerald-500 to-green-400', badge: '🌱' },
      { topicHi: 'आधुनिक भारत का इतिहास', topicEn: 'Modern History', pct: 68, delta: 'Stable', color: 'from-amber-500 to-orange-400', badge: '📜' },
    ],
    insightHi: 'UPSC में "Conceptual Clarity" सबसे ऊपर है। PYQs के थीम्स को पहचानें और गहराई से पढ़ें।',
    insightEn: 'Conceptual Clarity is king in UPSC. Identify repeating themes from PYQs and master them deeply.',
  },
  scoring: {
    default: { marksPerQuestion: 2, negativeMarking: 0.666 },
    CSAT: { marksPerQuestion: 2.5, negativeMarking: 0.833 },
  },
};

// Single exam registry for this UPSC-dedicated platform
export const EXAM_CONFIG = UPSC_CONFIG;

// For backwards compatibility with any code expecting registry
export const EXAM_REGISTRY: Record<string, ExamConfig> = {
  upsc: UPSC_CONFIG,
};

// Always returns UPSC config (argument kept for API compatibility)
export function getCurrentExam(_examId?: string): ExamConfig {
  return UPSC_CONFIG;
}
