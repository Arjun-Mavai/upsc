'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Sparkles, Upload, DownloadCloud, Info, Database, MonitorSmartphone, Cpu, CheckCircle2, Activity, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { adminUpsertCurrentAffairsBatch, adminGetCAQuestionsToProcess, adminGetCAStats } from '@/actions/mains-pyq-actions';

export function MainsPyqInitialImportPromptGenerator() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [paperNumber, setPaperNumber] = useState('1');
  const [prompt, setPrompt] = useState('');

  const generatePrompt = () => {
    const pNum = parseInt(paperNumber);
    const yr = year.trim() || new Date().getFullYear().toString();
    
    let structureHint = '';
    if (pNum === 1) {
      structureHint = 'This is an ESSAY paper. It typically has two parts: Section A and Section B. Please capture both sections in the "parts" array and list the essay topics as questions.';
    } else if (pNum === 2 || pNum === 3 || pNum === 4) {
      structureHint = 'This is a General Studies paper (GS1/GS2/GS3). Capture all questions. Wrap them in "part": "A". Usually contains 10 markers and 15 markers.';
    } else if (pNum === 5) {
      structureHint = 'This is GS4 (Ethics). It has Section A (Theoretical) and Section B (Case Studies). Please capture both sections in the "parts" array. Case studies are usually 20 markers.';
    } else {
      structureHint = 'Capture all units/questions. Wrap them in "part": "A".';
    }

    const text = `Act as an expert UPSC Mains data extraction specialist. 
Your task is to convert UPSC Mains ${yr} Paper ${pNum} into a strict JSON format suitable for database import.

JSON STRUCTURE TEMPLATE:
{
  "upsc_mains_paper_${yr}": {
    "exam": "UPSC Civil Services Mains Examination ${yr}",
    "paper_number": ${pNum},
    "paper_title_hi": "...",
    "paper_title_en": "...",
    "parts": [
      {
        "part": "A",
        "part_title_hi": "...",
        "part_title_en": "...",
        "units": [
          {
            "unit_number": 1,
            "unit_title_hi": "...",
            "unit_title_en": "...",
            "questions": [
              {
                "question_number": "1.1",
                "marks": 10,
                "type": "10 Marker",
                "question_hi": "...",
                "question_en": "..."
              }
            ]
          }
        ]
      }
    ]
  }
}

RULES:
1. ${structureHint}
2. "question_number" must be stable and unique within the unit. This is CRITICAL for data stability.
3. Common marking schemes:
   - Paper 1 (Essay): 125 marks (Essay).
   - Paper 2, 3, 4 (GS1-GS3): 10 marks (10 Marker), 15 marks (15 Marker).
   - Paper 5 (GS4): 10 marks (10 Marker), 20 marks (Case Study).
4. "type" should be: "Essay", "10 Marker", "15 Marker", or "Case Study".
5. Ensure both Hindi (question_hi) and English (question_en) text is extracted accurately.
6. CRITICAL: For Hindi unseen passages (अपठित गद्यांश / Gaddhans) or any other long-form questions, you MUST extract and return the ENTIRE passage word-for-word. Do NOT summarize, truncate, or use triple dots "..." to omit any part of the passage. The complete, raw, long-form passage must be fully present in "question_hi" (and "question_en" if translation is provided).
7. The root key MUST be "upsc_mains_paper_${yr}".
8. Return ONLY the JSON object. No markdown fences, no preamble.

Please extract the data for UPSC Mains ${yr} Paper ${pNum} from the text provided in the next message.`;

    setPrompt(text);
    toast.success('Prompt generated!');
  };

  const copyToClipboard = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copied to clipboard!');
  };

  return (
    <div className="space-y-6">
    <Card className="border-indigo-100 bg-indigo-50/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-indigo-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black text-indigo-950">AI Prompt Generator (Paper Import)</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Generate a prompt to extract JSON from raw paper text</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-500">Exam Year</Label>
          <Input 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            placeholder="e.g. 2024"
            className="h-10 font-bold"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-500">UPSC Paper (Official Numbering)</Label>
          <Select value={paperNumber} onValueChange={setPaperNumber}>
            <SelectTrigger className="h-10 font-bold">
              <SelectValue placeholder="Select Paper" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="font-bold">Paper 1 (Essay)</SelectItem>
              <SelectItem value="2" className="font-bold">Paper 2 (GS-I)</SelectItem>
              <SelectItem value="3" className="font-bold">Paper 3 (GS-II)</SelectItem>
              <SelectItem value="4" className="font-bold">Paper 4 (GS-III)</SelectItem>
              <SelectItem value="5" className="font-bold">Paper 5 (GS-IV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={generatePrompt} className="flex-1 font-black bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98]">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Prompt
        </Button>
        {prompt && (
          <Button onClick={copyToClipboard} variant="outline" className="font-bold border-indigo-200 hover:bg-indigo-100">
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        )}
      </div>

      {prompt && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <Label className="text-[10px] font-black uppercase text-indigo-600">Generated Prompt Preview</Label>
          <Textarea 
            value={prompt} 
            readOnly 
            className="h-40 text-xs font-mono bg-white border-indigo-100 leading-relaxed"
          />
        </div>
      )}
    </Card>
    <MainsPyqCurrentAffairsPromptGenerator />
    </div>
  );
}

function MainsPyqCurrentAffairsPromptGenerator() {
  const [year, setYear] = useState('2024');
  const [paperNumber, setPaperNumber] = useState('1');
  const [part, setPart] = useState('ALL');
  const [limit, setLimit] = useState('30');
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [stats, setStats] = useState({ total: 0, missing: 0, done: 0 });

  useEffect(() => {
    async function loadStats() {
      const res = await adminGetCAStats(Number(year), Number(paperNumber), part);
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    }
    loadStats();
  }, [year, paperNumber, part]);

  const generatePrompt = async () => {
    setIsFetching(true);
    try {
      const res = await adminGetCAQuestionsToProcess(Number(year), Number(paperNumber), Number(limit), part, includeCompleted);
      if (!res.success || !res.questions) {
        toast.error(res.error || 'Failed to fetch questions');
        return;
      }

      if (res.questions.length === 0) {
        const partText = part !== 'ALL' ? ` Part ${part}` : '';
        toast.success(`No questions found for ${year} Paper ${paperNumber}${partText}! 🎉`);
        setPrompt('');
        return;
      }

      const questionsFormat = res.questions.map((q, i) => 
        `### Q${i + 1} [id=${q.id}]\n- Marks: ${q.marks}\n- HI: ${q.questionHi}\n- EN: ${q.questionEn ?? '(none)'}`
      ).join('\n\n');

      const text = `Act as an elite Union Public Service Commission (UPSC) Mains Expert and Evaluator. Your goal is to provide "Topper-Level Value Addition" for any given UPSC Mains question. 

You must output STRICTLY IN RAW JSON FORMAT. No markdown, no preambles.

CRITICAL ACCURACY & ANTI-HALLUCINATION PROTOCOL (ZERO-BS RULE):
1. NO FAKE STATS: Never invent, guess, or hallucinate data, percentages, GDP growth rates, or index rankings. 
2. MANDATORY SOURCING: Every single data point must explicitly state its source and year (e.g., "As per India/National Economic Survey 2025-26..." or "According to NFHS-5...").
3. LATEST ECONOMY DATA: For Paper 3 (Economy), you must prioritize the most recent data available (Union Budget 2026-27, India/National Budget 2026-27, latest NITI Aayog indices, ISFR).
4. THE FALLBACK RULE: If you are not 100% certain about an exact number/statistic, DO NOT provide a number. Instead, provide a highly accurate qualitative trend (e.g., "NITI Aayog reports a consistent decline in multidimensional poverty in India/National" instead of guessing the exact percentage).

CRITICAL SUBJECT-WISE ROUTING LOGIC:
Before generating data, identify which Paper/Subject the question belongs to and strictly apply these rules based on the UPSC Syllabus:

1. PAPER 1 (History, Geography, Disaster Management, Water Management):
   - data_facts_and_evidence: ASI excavations, IMD climate data, ISFR forest reports, NDMA stats.
   - national_specific_examples_and_schemes: Recent GI Tags, UNESCO sites, Freedom Fighters, Smart City models.
   - reports_frameworks_and_thinkers: Historiography quotes (Kautilya, Max Müller) or NITI Aayog Water Index.

2. PAPER 2 (Constitution, Polity, Public Administration, Sociology, Health & Education):
   - data_facts_and_evidence: ASER, NFHS-5, NCRB stats, NITI Aayog indices.
   - reports_frameworks_and_thinkers: Law Commission, NCRWC, 2nd ARC.
   - anchors_sdgs_and_constitution: Articles (e.g., Art 21, Art 14), SDGs (e.g., SDG 5, SDG 16).
   - national_specific_examples_and_schemes: Ayushman Bharat, PESA Act implementation across states, Mission Shakti.
   - best_practices_and_case_studies: Kerala's Kudumbashree, Chhattisgarh's PDS model.

3. PAPER 3 (Economics, Science, Tech, Environment, Energy, Computer Science & Maths):
   - data_facts_and_evidence: Economic Survey 2024-25, Union Budget, RBI reports.
   - reports_frameworks_and_thinkers: Gadgil Committee, Swaminathan Report.
   - anchors_sdgs_and_constitution: SDGs (e.g., SDG 13, SDG 9).
   - national_specific_examples_and_schemes: PM Gati Shakti, Kuno Cheetah, ISRO missions (Chandrayaan-3).
   - best_practices_and_case_studies: Indore Bio-CNG, ISRO missions.

4. PAPER 4 (Philosophy, Psychology, Public Administration, Ethics & Case Studies):
   - reports_frameworks_and_thinkers: 2nd ARC (4th & 12th Reports), Nolan Committee's 7 Principles, Max Weber, Kautilya.
   - best_practices_and_case_studies: Real-world administrative empathy (Swachh Indore Model, Operation Ganga).
   - SKIP SDGs/Articles unless directly related to governance.

CONTEXT:
- Exam: UPSC Mains ${year}
- Paper: Paper ${paperNumber}
- Part: ${part === 'ALL' ? 'Part A & B' : `Part ${part}`}

OUTPUT STRICTLY AS A RAW JSON OBJECT. DO NOT include any markdown formatting (like \`\`\`json), preambles, or conversational text. Return ONLY valid JSON.
CRITICAL JSON SAFETY: NEVER use double quotes (") inside your string values. Use single quotes (') instead. Unescaped double quotes will break the JSON parser!

JSON SCHEMA TO RETURN:
{
  "updates": [
    {
      "id": "{{question_id}}",
      "value_addition_kit_en": {
        "data_facts_and_evidence": ["1 crisp data point with SOURCE and YEAR (e.g., NITI Aayog 2025)"],
        "reports_frameworks_and_thinkers": ["1 Committee, Report, Judgement, or Thinker quote"],
        "anchors_sdgs_and_constitution": ["Exact SDG Number or Constitutional Article"],
        "national_specific_examples_and_schemes": ["1 India/National-specific scheme, regional model, or GI tag"],
        "best_practices_and_case_studies": ["1 real-world implementation case study"]
      },
      "value_addition_kit_hi": {
        "data_facts_and_evidence": ["१ सटीक तथ्य स्रोत और वर्ष के साथ (उदा. आर्थिक सर्वेक्षण २०२५-२६)"],
        "reports_frameworks_and_thinkers": ["१ समिति, रिपोर्ट या विचारक"],
        "anchors_sdgs_and_constitution": ["सटीक SDG या संविधान अनुच्छेद"],
        "national_specific_examples_and_schemes": ["राष्ट्रीय का विशिष्ट उदाहरण या योजना"],
        "best_practices_and_case_studies": ["१ वास्तविक केस स्टडी"]
      },
      "current_affairs_data_en": {
        "intro_hook": "A 20-word striking introduction using a fact/article from the kit.",
        "conclusion_way_forward": "A 20-word forward-looking conclusion using an SDG/Report from the kit.",
        "keywords": ["tag1", "tag2", "tag3"]
      },
      "current_affairs_data_hi": {
        "intro_hook": "किट के तथ्य/अनुच्छेद का उपयोग करके 20 शब्दों की प्रभावशाली शुरुआत।",
        "conclusion_way_forward": "SDG/रिपोर्ट का उपयोग करके 20 शब्दों का सकारात्मक निष्कर्ष।",
        "keywords": ["टैग1", "टैग2", "टैग3"]
      }
    }
  ]
}

CRITICAL UPSC SUBJECT-WISE RULES (VALUE ADDITION STRATEGY):

1. PAPER 2 (Polity, Constitution, Health, Education, Sociology):
   - Constitutional Anchors: MANDATORY to quote relevant Articles, Fundamental Rights (FR), Fundamental Duties (FD - Article 51A), or DPSP (Directive Principles).
   - SDGs: Link to SDG 3 (Health), SDG 4 (Education), SDG 5 (Gender Equality), SDG 10 (Inequality), or SDG 16 (Peace & Institutions).
   - Frameworks/Data: Cite SC landmark verdicts (Kesavananda Bharati, SR Bommai, Puttaswamy), Law Commission, ASER reports, NFHS-5 data. Mention India/National Schemes (CM Rise, Ladli Behna).

2. PAPER 4 (Ethics, Thinkers, Psychology & PubAd):
   - Reports & Frameworks: ALWAYS integrate 2nd ARC Reports (e.g., 4th Report: Ethics in Governance, 12th Report). Explicitly use Nolan Committee’s 7 Principles of Public Life, or Max Weber's bureaucracy traits.
   - Cases: Cite real-world administrative examples (e.g., "Swachh Indore Model", "Operation Ganga", "ISRO scientists' dedication"). 
   - Skip SDGs/Articles here unless directly tied to governance.

3. PAPER 3 (Economy, Science, Tech, Environment):
   - SDGs: MANDATORY. Link to SDG 7 (Clean Energy), SDG 8 (Decent Work), SDG 9 (Industry), SDG 13 (Climate Action).
   - Data: STRICTLY use India/National Economic Survey data, Union Budget highlights, or NITI Aayog Poverty Index.
   - India/National/Tech: Mention India/National Renewable Energy targets (Sanchi Solar City), ISRO missions (Chandrayaan/Aditya L1), Kuno Cheetah relocation, or COP targets.

4. PAPER 1 (History & Geography):
   - History: Focus on India/National's cultural pride—recent GI Tags (Gond Painting, Sundaraja Mango), UNESCO sites, ASI excavations, or tribal heroes (Rani Durgavati), Recent excavations (e.g., Nachna Panna, Eran/Tripuri findings), Tribal Heroes (Tantia Bhil/Bhima Nayak - use 'Guerilla Warfare'), Princely States.
   - Professionalism: Use historiography (quote Max Müller, Kautilya, or दादाभाई नौरोजी for Economic Drain).
   - Presentation: Mandate flowcharts for timelines (e.g., 1857 revolt stages) and structural diagrams for architecture (e.g., Khajuraho temples).
   - Geography: Quote IMD climate data, recent disaster stats, NITI Aayog Water Index, or Ken-Betwa Link project, NITI Aayog's Composite Water Management Index, ISFR (Forest Report), NDMA guidelines.
   - India/National Specifics: Dewas Model (Farm Ponds), Jhabua Model (Halma), Ken-Betwa Link, Indore Bio-CNG.
   - Presentation: Must suggest a "10-Second India/National Map" to shade the region mentioned in the question.

★★★ STRICT COMPLETENESS & CONSISTENCY RULE (NEW & MANDATORY) ★★★
1. NO EMPTY OBJECTS: You MUST populate AT LEAST ONE OR TWO arrays in the \`value_addition_kit\` for EVERY question. 
   - If it's a static History question, use ASI Excavations, UNESCO sites, Tourism initiatives, or Historiography quotes as your "data".
   - If it's a static Geography question, use IMD trends, NDMA guidelines, or NITI Aayog indices.
2. NEVER LEAVE INTRO/CONCLUSION BLANK: The \`intro_hook\` and \`conclusion_way_forward\` MUST ALWAYS BE FILLED. NEVER output an empty string "". 
   - If you cannot fit a specific kit fact into the intro/conclusion, write a powerful, marks-fetching historical/constitutional/philosophical statement relevant to the topic.
3. PAIRING IS COMPULSORY: Every question that gets an intro_hook MUST also get a conclusion_way_forward. They work together.
4. BREVITY & LANGUAGE: Kit points MUST be under 15 words. Intro/Conclusion under 25 words. The Hindi translation MUST be simple, natural, and easy to memorize.

Here are the questions to process:

${questionsFormat}`;

      setPrompt(text);
      navigator.clipboard.writeText(text);
      toast.success(`Prompt with ${res.questions.length} questions copied to clipboard!`);
    } catch (e) {
      toast.error('Unexpected error generating prompt');
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copied to clipboard!');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      toast.success('Pasted JSON from clipboard!');
    } catch (err) {
      toast.error('Failed to read clipboard data. Check browser permissions.');
    }
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste the JSON output from AI');
      return;
    }
    
    setIsUploading(true);
    try {
      const res = await adminUpsertCurrentAffairsBatch(jsonInput);
      if (res.success) {
        toast.success(`Successfully updated ${res.updatedCount} questions!`);
        setJsonInput('');
        // Refresh stats immediately after upload
        const statsRes = await adminGetCAStats(Number(year), Number(paperNumber), part);
        if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      } else {
        toast.error(res.error || 'Failed to upload JSON');
      }
    } catch (e) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-emerald-100 bg-emerald-50/30 p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-emerald-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black text-emerald-950">AI Current Affairs Batch Upsert (Isolated)</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target specific missing questions & Upload JSON</p>
        </div>
      </div>

      <div className="mb-6 bg-white/60 border border-emerald-100 rounded-xl p-4 shadow-sm text-sm">
        <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold border-b border-emerald-100 pb-2">
          <Info className="h-4 w-4" />
          How does this pipeline work? (Transparency & Impact)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Cpu className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-xs text-slate-700">1. AI Prompt Generation</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">We use a specialized prompt with UPSC rules (e.g. UNESCO tags for History). When you copy the batch of missing questions, it sends them to AI.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-xs text-slate-700">2. 100% Safe DB Update (No Data Loss)</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Uploading JSON only targets a new isolated column <code className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded font-bold">current_affairs_data</code>. <strong>It will NEVER delete or modify</strong> any of your existing Model Answers or old Expert Insights.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MonitorSmartphone className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-xs text-slate-700">3. Frontend Impact (Expert Tips Only)</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">On the app, this data is magically injected <strong>inside the Expert Insights card</strong>. If a question doesn't need CA data, the UI gracefully hides it without breaking anything.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-xs text-slate-700">4. Best Use Case</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Use this specific tool to <strong>Retroactively update older PYQ Papers</strong> that were generated before we added the automated Current Affairs feature.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-emerald-700">Exam Year</Label>
          <Input 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            placeholder="e.g. 2024"
            className="h-10 font-bold border-emerald-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-emerald-700">Paper Number</Label>
          <Select value={paperNumber} onValueChange={setPaperNumber}>
            <SelectTrigger className="h-10 font-bold border-emerald-200">
              <SelectValue placeholder="Select Paper" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={n.toString()} className="font-bold">
                  Paper {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-emerald-700">Part</Label>
          <Select value={part} onValueChange={setPart}>
            <SelectTrigger className="h-10 font-bold border-emerald-200">
              <SelectValue placeholder="Select Part" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">All Parts</SelectItem>
              <SelectItem value="A" className="font-bold">Part A</SelectItem>
              <SelectItem value="B" className="font-bold">Part B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-emerald-700">Fetch Limit</Label>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="h-10 font-bold border-emerald-200">
              <SelectValue placeholder="Select Limit" />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 30, 50].map((n) => (
                <SelectItem key={n} value={n.toString()} className="font-bold">
                  {n} Questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex flex-col justify-start pt-1">
          <Label className="text-[10px] font-black uppercase text-emerald-700">Regenerate CA Data</Label>
          <div className="flex items-center space-x-2 h-10">
            <input 
              type="checkbox" 
              id="includeCompleted" 
              checked={includeCompleted} 
              onChange={(e) => setIncludeCompleted(e.target.checked)} 
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="includeCompleted" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Include completed
            </label>
          </div>
        </div>
      </div>

      <div className="mb-4 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Live Paper Tracker (Year {year} • Paper {paperNumber})</span>
        </div>
        <div className="flex gap-4 text-[11px] font-bold">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase tracking-wider text-[9px]">Total Questions</span>
            <span className="text-slate-800">{stats.total}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-emerald-600 uppercase tracking-wider text-[9px]">CA Done</span>
            <span className="text-emerald-700">{stats.done}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-rose-500 uppercase tracking-wider text-[9px]">Pending</span>
            <span className="text-rose-600">{stats.missing}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <Button 
          onClick={generatePrompt} 
          disabled={isFetching}
          className="w-full font-black bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-[0.98]"
        >
          {isFetching ? (
            'Generating & Fetching...'
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              1. Generate & Copy AI Prompt (with max {limit} {includeCompleted ? 'questions' : 'pending questions'})
            </>
          )}
        </Button>
      </div>

      {prompt && (
        <div className="space-y-2 mb-6 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-emerald-600">Generated Prompt Preview</Label>
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={copyToClipboard}>
              <Copy className="mr-1.5 h-3 w-3" />
              Copy Prompt
            </Button>
          </div>
          <Textarea 
            value={prompt} 
            readOnly 
            className="h-48 text-xs font-mono bg-white border-emerald-100 leading-relaxed"
          />
        </div>
      )}

      <div className="space-y-4 bg-emerald-50 p-5 rounded-xl border-2 border-emerald-300 mt-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-black uppercase text-emerald-900 flex items-center gap-2">
              <Database className="h-4 w-4" />
              2. Upload AI JSON Output & Save
            </Label>
            <p className="text-xs text-emerald-700 mt-1 font-medium">Paste the exact JSON response from AI containing the updates array below.</p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100" onClick={pasteFromClipboard}>
            <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" />
            Paste JSON
          </Button>
        </div>
        
        <Textarea 
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{ "updates": [ ... ] }'
          className="h-48 text-sm font-mono bg-white border-emerald-200 shadow-inner focus:border-emerald-500"
        />
        
        <div className="pt-2">
          <Button 
            size="lg"
            onClick={handleUpload} 
            disabled={isUploading || !jsonInput.trim()}
            className="w-full font-black text-lg h-14 bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg text-white"
          >
            <Upload className="mr-2 h-5 w-5" />
            {isUploading ? 'Uploading & Updating DB...' : 'Final Step: Save Data to Database!'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
