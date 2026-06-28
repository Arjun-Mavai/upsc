'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  ChevronDown, 
  Table as TableIcon, 
  Target, 
  FileText, 
  BarChart3, 
  Award,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 🎓 MAINS SYLLABUS STRUCTURE COMPONENT
 * 
 * Bhai, ye component students ko UPSC Mains ka pura blueprint batayega.
 * 2024 ke naye pattern ke according detailed breakdown.
 */

interface PaperStructure {
  paper: string;
  titleHi: string;
  titleEn: string;
  marks: number;
  duration: string;
  structure: {
    parts?: string;
    descriptionHi: string;
    descriptionEn: string;
    breakdown?: {
      labelHi: string;
      labelEn: string;
      qType: string;
      marks: string;
      limit?: string;
    }[];
  };
}

const SYLLABUS_DATA: PaperStructure[] = [
  {
    paper: "Paper A",
    titleHi: "अनिवार्य भारतीय भाषा (क्वालिफाइंग)",
    titleEn: "Compulsory Indian Language (Qualifying)",
    marks: 300,
    duration: "3 Hours",
    structure: {
      descriptionHi: "यह पेपर क्वालिफाइंग प्रकृति का है (इसके अंक मेरिट में नहीं जुड़ते)। 25% अंक (75) अनिवार्य हैं।",
      descriptionEn: "Qualifying paper (marks not counted for merit). Minimum 25% (75 marks) required.",
    }
  },
  {
    paper: "Paper B",
    titleHi: "अंग्रेजी (क्वालिफाइंग)",
    titleEn: "English (Qualifying)",
    marks: 300,
    duration: "3 Hours",
    structure: {
      descriptionHi: "यह पेपर क्वालिफाइंग प्रकृति का है (इसके अंक मेरिट में नहीं जुड़ते)। 25% अंक (75) अनिवार्य हैं।",
      descriptionEn: "Qualifying paper (marks not counted for merit). Minimum 25% (75 marks) required.",
    }
  },
  {
    paper: "Paper I",
    titleHi: "निबंध",
    titleEn: "Essay",
    marks: 250,
    duration: "3 Hours",
    structure: {
      descriptionHi: "उम्मीदवारों को दो निबंध (प्रत्येक खंड से एक) लिखने होते हैं।",
      descriptionEn: "Candidates are required to write two essays (one from each section).",
      breakdown: [
        { labelHi: "निबंध (खंड A)", labelEn: "Essay (Section A)", qType: "1", marks: "125 Marks", limit: "1000-1200 Words" },
        { labelHi: "निबंध (खंड B)", labelEn: "Essay (Section B)", qType: "1", marks: "125 Marks", limit: "1000-1200 Words" },
      ]
    }
  },
  {
    paper: "Paper II",
    titleHi: "सामान्य अध्ययन - I (भारतीय विरासत एवं संस्कृति, इतिहास एवं भूगोल)",
    titleEn: "General Studies - I (Indian Heritage & Culture, History & Geo)",
    marks: 250,
    duration: "3 Hours",
    structure: {
      parts: "20 Questions",
      descriptionHi: "कुल 20 अनिवार्य प्रश्न। 10 प्रश्न 10 अंक के और 10 प्रश्न 15 अंक के।",
      descriptionEn: "Total 20 compulsory questions. 10 questions of 10 marks and 10 of 15 marks.",
      breakdown: [
        { labelHi: "लघु उत्तरीय", labelEn: "Short", qType: "10", marks: "10 Marks", limit: "150 Words" },
        { labelHi: "दीर्घ उत्तरीय", labelEn: "Long", qType: "10", marks: "15 Marks", limit: "250 Words" },
      ]
    }
  },
  {
    paper: "Paper III",
    titleHi: "सामान्य अध्ययन - II (शासन व्यवस्था, संविधान, शासन प्रणाली, सामाजिक न्याय)",
    titleEn: "General Studies - II (Governance, Constitution, Polity, Social Justice)",
    marks: 250,
    duration: "3 Hours",
    structure: {
      parts: "20 Questions",
      descriptionHi: "कुल 20 अनिवार्य प्रश्न। 10 प्रश्न 10 अंक के और 10 प्रश्न 15 अंक के।",
      descriptionEn: "Total 20 compulsory questions. 10 questions of 10 marks and 10 of 15 marks.",
      breakdown: [
        { labelHi: "लघु उत्तरीय", labelEn: "Short", qType: "10", marks: "10 Marks", limit: "150 Words" },
        { labelHi: "दीर्घ उत्तरीय", labelEn: "Long", qType: "10", marks: "15 Marks", limit: "250 Words" },
      ]
    }
  },
  {
    paper: "Paper IV",
    titleHi: "सामान्य अध्ययन - III (प्रौद्योगिकी, आर्थिक विकास, जैव विविधता, पर्यावरण)",
    titleEn: "General Studies - III (Tech, Econ Dev, Bio-diversity, Env)",
    marks: 250,
    duration: "3 Hours",
    structure: {
      parts: "20 Questions",
      descriptionHi: "कुल 20 अनिवार्य प्रश्न। 10 प्रश्न 10 अंक के और 10 प्रश्न 15 अंक के।",
      descriptionEn: "Total 20 compulsory questions. 10 questions of 10 marks and 10 of 15 marks.",
      breakdown: [
        { labelHi: "लघु उत्तरीय", labelEn: "Short", qType: "10", marks: "10 Marks", limit: "150 Words" },
        { labelHi: "दीर्घ उत्तरीय", labelEn: "Long", qType: "10", marks: "15 Marks", limit: "250 Words" },
      ]
    }
  },
  {
    paper: "Paper V",
    titleHi: "सामान्य अध्ययन - IV (नीतिशास्त्र, सत्यनिष्ठा और अभिरुचि)",
    titleEn: "General Studies - IV (Ethics, Integrity and Aptitude)",
    marks: 250,
    duration: "3 Hours",
    structure: {
      parts: "Section A + Section B",
      descriptionHi: "खंड A में 13 सैद्धांतिक प्रश्न (130 अंक) और खंड B में 6 केस स्टडीज (120 अंक) शामिल हैं।",
      descriptionEn: "Section A contains 13 theory questions (130 marks) and Section B contains 6 Case Studies (120 marks).",
      breakdown: [
        { labelHi: "सैद्धांतिक प्रश्न", labelEn: "Theory Questions", qType: "13", marks: "10 Marks", limit: "150 Words" },
        { labelHi: "केस स्टडी", labelEn: "Case Studies", qType: "6", marks: "20 Marks", limit: "250 Words" },
      ]
    }
  },
  {
    paper: "Paper VI",
    titleHi: "वैकल्पिक विषय - पेपर 1",
    titleEn: "Optional Subject - Paper 1",
    marks: 250,
    duration: "3 Hours",
    structure: {
      descriptionHi: "कुल 8 प्रश्न 2 खंडों में। 5 प्रश्न करने होते हैं (प्रश्न 1 और 5 अनिवार्य)।",
      descriptionEn: "Total 8 questions in 2 sections. 5 to be attempted (Q1 & Q5 compulsory).",
    }
  },
  {
    paper: "Paper VII",
    titleHi: "वैकल्पिक विषय - पेपर 2",
    titleEn: "Optional Subject - Paper 2",
    marks: 250,
    duration: "3 Hours",
    structure: {
      descriptionHi: "कुल 8 प्रश्न 2 खंडों में। 5 प्रश्न करने होते हैं (प्रश्न 1 और 5 अनिवार्य)।",
      descriptionEn: "Total 8 questions in 2 sections. 5 to be attempted (Q1 & Q5 compulsory).",
    }
  }
];

export function MainsSyllabusStructure({ hi }: { hi: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full mb-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border-2 shadow-sm active:scale-100",
          isOpen 
            ? "bg-emerald-50 border-emerald-500/30 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-500/40 dark:text-emerald-400" 
            : "bg-white border-slate-200 hover:border-emerald-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-emerald-500/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            isOpen ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}>
            <TableIcon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-sm uppercase tracking-wider">
              {hi ? 'UPSC मेंस सिलेबस संरचना (New Pattern)' : 'UPSC Mains Syllabus Structure (New Pattern)'}
            </h3>
            <p className="text-[10px] font-bold opacity-70">
              {hi ? 'मार्क्स, प्रश्न प्रारूप और समय की पूरी जानकारी' : 'Full details on marks, question format & timing'}
            </p>
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hi ? 'कुल लिखित' : 'Total Written'}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">1750</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hi ? 'साक्षात्कार' : 'Interview'}</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">275</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hi ? 'कुल अंक' : 'Grand Total'}</p>
                  <p className="text-xl font-black text-amber-600">2025</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hi ? 'कुल पेपर्स' : 'Total Papers'}</p>
                  <p className="text-xl font-black text-sky-600">09</p>
                </div>
              </div>

              {/* Papers Breakdown */}
              <div className="space-y-3">
                {SYLLABUS_DATA.map((p) => (
                  <PaperRow
                    key={p.paper}
                    p={p}
                    hi={hi}
                    isExpanded={!!expandedPapers[p.paper]}
                    onToggle={() => setExpandedPapers(prev => ({ ...prev, [p.paper]: !prev[p.paper] }))}
                  />
                ))}
              </div>

              {/* Success Mantra Card - Premium Dark Slate Look */}
              <div className="mt-6 bg-slate-900 dark:bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl border border-slate-800 overflow-hidden relative group">
                <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <BookOpen className="h-64 w-64" />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-2xl shadow-inner group-hover:shadow-amber-500/10 transition-all">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                      }}
                    >
                      <Target className="h-7 w-7 text-amber-400" />
                    </motion.div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-black text-xl tracking-tight text-white">
                        {hi ? 'सफलता का मंत्र' : 'Mantra for Success'}
                      </h4>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-lg">
                      {hi 
                        ? 'मेंस केवल नॉलेज का टेस्ट नहीं है, यह "Speed, Precision और Answer Writing" की कला है। हर यूनिट से अपने 30 अंक पक्के करने का लक्ष्य रखें!' 
                        : 'Mains is not just a test of knowledge; it is an art of Speed, Precision, and Writing. Aim to secure your 30 marks from every single unit!'}
                    </p>
                    <div className="pt-2 flex items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        {hi ? 'नियमित अभ्यास' : 'Consistency'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-400">
                        <span className="h-1 w-1 rounded-full bg-sky-400" />
                        {hi ? 'उत्तर लेखन' : 'Answer Writing'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 🎯 Individual Paper Row with Premium UX
 */
function PaperRow({ 
  p, 
  hi, 
  isExpanded, 
  onToggle 
}: { 
  p: PaperStructure; 
  hi: boolean; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div 
      className={cn(
        "border rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-slate-950 shadow-sm",
        isExpanded ? "border-emerald-500/30 shadow-md ring-1 ring-emerald-500/10" : "border-slate-200 dark:border-slate-800"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors interactive-tile active:scale-100"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-12 items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase">
            {p.paper.replace('Paper ', 'P')}
          </span>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {hi ? p.titleHi : p.titleEn}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                {p.marks} Marks
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                {p.duration}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] },
              opacity: { duration: 0.3, delay: 0.1 }
            }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-4 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                {hi ? p.structure.descriptionHi : p.structure.descriptionEn}
              </p>

              {p.structure.breakdown && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <th className="px-3 py-2 font-black uppercase tracking-wider">{hi ? 'प्रकार' : 'Type'}</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">{hi ? 'संख्या' : 'Count'}</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">{hi ? 'अंक' : 'Marks'}</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">{hi ? 'शब्द सीमा' : 'Limit'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {p.structure.breakdown.map((row, i) => (
                        <tr key={i} className="bg-white dark:bg-slate-900/50">
                          <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                            {hi ? row.labelHi : row.labelEn}
                          </td>
                          <td className="px-3 py-2.5 font-black text-slate-900 dark:text-white">
                            {row.qType}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black text-[10px]">
                              {row.marks}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-500">
                            {row.limit || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {p.paper === 'Paper 5' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{hi ? 'नोट' : 'Note'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{hi ? 'समय: 2 घंटे' : 'Time: 2 Hours'}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{hi ? 'माध्यम' : 'Medium'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{hi ? 'केवल हिन्दी' : 'Hindi only'}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
