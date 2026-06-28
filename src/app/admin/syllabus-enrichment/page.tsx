"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SyllabusMasterPrompt } from './components/SyllabusMasterPrompt';
import { SyllabusTrackAndBatch } from './components/SyllabusTrackAndBatch';
import { SyllabusImportSection } from './components/SyllabusImportSection';
import { logger } from '@/lib/logger';
import { parseLooseJSON } from './components/utils';

type SyllabusDbTopic = {
  id: string;
  unit_id?: string;
  unit?: string;
  unit_title?: string;
  title_hindi?: string;
  title_english?: string;
  topic_title?: string;
  topic_title_en?: string;
  content_hindi?: unknown;
  content_english?: unknown;
  hasAiContent?: boolean;
};

type SyllabusDbUnit = {
  title: string;
  topics: SyllabusDbTopic[];
};

type SyllabusDbResponse = {
  data?: SyllabusDbTopic[] | Record<string, SyllabusDbUnit>;
  units?: SyllabusDbTopic[] | Record<string, SyllabusDbUnit>;
};

const MASTER_PROMPT = `# Role: Elite UPSC Prelims Specialist & Chief Mentor

## Context
You are an Elite UPSC Prelims Specialist and Chief Mentor for ZenScroll, a premium UPSC preparation platform. You have surgically reverse-engineered every UPSC Prelims paper from the past decade, giving you an unparalleled, in-depth mastery of the commission's changing patterns. Your goal is to decode the examiner's mind and provide hyper-targeted, authentic, and actionable mentorship. By bridging the gap between a dry syllabus and ruthless exam strategy, your insights must directly maximize a student's probability of clearing the Prelims cutoff.

## Tone & Language Instructions (CRITICAL)
- **Zero Fluff/Marketing:** Do not use salesy, hyped-up, or exaggerated language. Be realistic, factual, and strictly focused on exam clearance. The premium feel comes from deep academic intelligence.
- **English Output:** Professional, empathetic, and highly strategic. Write like a senior guiding a junior.
- **Hindi Output:** Use natural, respectful, and highly readable Hindi (similar to top-tier offline coaching mentors in Indore/Bhopal). Use terms like 'Focus', 'Trend', or 'Sequence' naturally in Hinglish if it improves readability. The tone must be serious yet supportive.
- **No Hallucinations:** Only provide PYQs if they actually exist for this topic. Do not invent fake questions. Use your knowledge base of past State PCS exams (strictly UPSC, UPPCS, BPSC, RPSC, etc. - DO NOT INCLUDE UPSC). Prefer questions from the year 2020 onwards up until now.

## Content Depth, Format & Exhaustiveness (CRITICAL INSTRUCTION)
- **DO NOT BE BRIEF.** The content must act as **COMPLETE COMPREHENSIVE REVISION NOTES** for the student. It must be exhaustive, extremely deep, and highly informative. 
- A student reading this should feel 100% confident to solve any objective question on this topic. 
- Cover all dimensions: historical background, current relevance, core facts, exceptions, and conceptual nuances. Give them a deep understanding of the syllabus.
- **FORMATTING / READABILITY:** Content dumping is strictly prohibited. If any section, bullet point, or paragraph exceeds 1-2 lines, YOU MUST break it down using clear line breaks (\\n\\n) or sub-bullets. Make it highly engaging, skimmable, and easy to parse visually.

## The "Flow of Learning" (Your Core Task)
For EACH UPSC Prelims topic provided in the JSON array, structure your insights following this psychological journey:
0. **The Spark:** A highly meaningful, relevant quote that connects to the syllabus topic to refresh the student's mind before they begin. (Mapped to "quote")
1. **The Basics:** Exhaustive coverage of what the topic is, its core concepts, and its weightage. Provide enough depth to build a solid foundation. (Mapped to introduction & key_concepts)
2. **The Strategy & Shift:** What does the examiner want, how is the pattern changing, and what are the common mistakes? (Mapped to details)
3. **The Action & Validation:** Exhaustive list of exact facts to memorize, how to remember them, and a self-check "Litmus Test". (Mapped to facts_for_prelims)
4. **The Proof:** Exact PYQs and Mains linkage. For each topic, provide EXACTLY 8 Prelims Questions and EXACTLY 4 Mains Questions that are most relevant to the topic. **CRITICAL: Prioritize UPSC.** Out of the 8 prelims questions, aim to have at least 5-6 UPSC questions. If 5-6 UPSC questions do not exist, fall back to UPPCS or BPSC questions. (Mapped to pyq_pre_examples & potential_mains_questions)

**CRITICAL ANSWER FORMATTING RULE FOR PRELIMS PYQs:** You MUST include the correct answer in brackets at the very end of every prelims question string.
- For Hindi (content_hindi), use the exact format: (उत्तर: <सही उत्तर>). Example: "1. [UPSC] गुरु शिखर चोटी किस राज्य में स्थित है? (उत्तर: राजस्थान)"
- For English (content_english), use the exact format: (Answer: <Correct Answer>). Example: "1. [UPSC] In which state is the Guru Shikhar peak located? (Answer: Rajasthan)"
This is critical for our automated frontend parser to render the "Check Answer" toggle button.

## Output Format (STRICT JSON ARRAY)
You must output a valid JSON array of objects. Do NOT use markdown code formatting inside or around the JSON keys. Ensure perfectly valid JSON. 

## Strictest JSON Validation & Escaping Rules (MANDATORY):
- **NEVER use unescaped double quotes inside string values.** If you want to use double quotes around any phrase or word (e.g. \"ज्ञानं परमं बलम्\" or \"Knowledge is power\"), you **MUST** escape them using a single backslash: \`\\"\`.
- **NEVER output consecutive unescaped double quotes** (like \`""\` or \`""quote""\`).
- If you quote any phrase or book, write: \`\\"your quoted phrase\\"\`.
- **IF you need a line break inside a string, you MUST use the literal characters "\\n".** Do NOT press Enter to create a new line inside a string.
- **ABSOLUTELY CRITICAL:** The output MUST be a completely valid, fully closed JSON array. Do NOT truncate or cut off the output mid-way. Ensure every object is properly closed with '}' and the array with ']'.
- The output array MUST have exactly the same number of objects as the input array, keeping the "id" exactly as provided. All content must be in crisp, structured bullet points. Avoid huge paragraphs.

[
  {
    "id": "<keep the exact id from input>",
    "content_hindi": {
      "quote": "A meaningful, relevant quote related to the topic...",
      "introduction": "Exhaustive, impactful conceptual intro in bullet points...",
      "key_concepts": ["Concept 1 explained deeply\\n\\nWith clear spacing...", "Concept 2 with full details...", "Concept 3..."],
      "details": "Comprehensive point-wise details covering strategy, changing patterns, and common mistakes...",
      "facts_for_prelims": ["Extensive Fact 1 to memorize...", "Fact 2...", "Fact 3...", "Fact 4..."],
      "pyq_pre_examples": [
        "1. [UPSC] गुरु शिखर चोटी किस राज्य में स्थित है? (उत्तर: राजस्थान)",
        "2. [UPSC] प्रायद्वीपीय भारत की सबसे ऊंची चोटी कौन सी है? (उत्तर: अनामुडी)",
        "3. [UPSC] ... (उत्तर: ...)",
        "4. [UPSC] ... (उत्तर: ...)",
        "5. [UPSC] ... (उत्तर: ...)",
        "6. [UPSC] ... (उत्तर: ...)",
        "7. [UPPCS] ... (उत्तर: ...)",
        "8. [BPSC] ... (उत्तर: ...)"
      ],
      "potential_mains_questions": [
        "1. [UPSC] Question...",
        "2. [UPSC] Question...",
        "3. [BPSC] Question...",
        "4. Expected Question..."
      ]
    },
    "content_english": {
      "quote": "A meaningful, relevant quote related to the topic...",
      "introduction": "Exhaustive, impactful conceptual intro in bullet points...",
      "key_concepts": ["Concept 1 explained deeply\\n\\nWith clear spacing...", "Concept 2 with full details...", "Concept 3..."],
      "details": "Comprehensive point-wise details covering strategy, changing patterns, and common mistakes...",
      "facts_for_prelims": ["Extensive Fact 1 to memorize...", "Fact 2...", "Fact 3...", "Fact 4..."],
      "pyq_pre_examples": [
        "1. [UPSC] In which state is the Guru Shikhar peak located? (Answer: Rajasthan)",
        "2. [UPSC] Which is the highest peak of peninsular India? (Answer: Anamudi)",
        "3. [UPSC] ... (Answer: ...)",
        "4. [UPSC] ... (Answer: ...)",
        "5. [UPSC] ... (Answer: ...)",
        "6. [UPSC] ... (Answer: ...)",
        "7. [UPPCS] ... (Answer: ...)",
        "8. [BPSC] ... (Answer: ...)"
      ],
      "potential_mains_questions": ["1. [UPSC] Question...", "2. [UPSC] Question...", "3. [BPSC] Question...", "4. Expected Question..."]
    }
  }
]`;

export default function SyllabusEnrichmentPage() {
  const [dbData, setDbData] = useState<SyllabusDbTopic[] | Record<string, SyllabusDbUnit>>([]);
  const [loading, setLoading] = useState(true);

  // Tools & State
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('syllabus-admin-key') ?? '';
  });
  const [targetUnit, setTargetUnit] = useState('auto');
  const [targetTopic, setTargetTopic] = useState('auto');
  const [importJson, setImportJson] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const fetchData = async (secret?: string) => {
    try {
      const res = await fetch('/api/admin/enrich-syllabus', {
        headers: secret ? { 'x-admin-secret': secret } : undefined,
      });
      if (res.ok) {
        const data = (await res.json()) as SyllabusDbResponse;
        setDbData(data.data || data.units || []);
      }
    } catch (err) {
      logger.error('Failed to fetch DB syllabus:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    queueMicrotask(() => {
      localStorage.setItem('syllabus-admin-key', adminKey);
      void fetchData(adminKey);
    });
  }, [adminKey]);

  const handleUpload = async () => {
    if (!adminKey) return toast.error('Admin key required');
    if (!importJson.trim()) return toast.error('No JSON provided');

    setIsUploading(true);
    try {
      let payload;
      
      try {
        const parsed = parseLooseJSON(importJson);
        if (targetTopic !== 'auto') {
          if (Array.isArray(parsed)) {
            toast.error("You selected a specific topic but provided a JSON array. Please provide just the object with 'content_hindi' and 'content_english'.");
            return;
          }
          payload = [{
            id: targetTopic,
            content_hindi: parsed.content_hindi,
            content_english: parsed.content_english
          }];
        } else {
          if (!Array.isArray(parsed)) throw new Error("Auto mode requires a JSON array.");
          payload = parsed;
        }
      } catch (e: unknown) {
        console.error("JSON parse error:", e);
        toast.error("Invalid JSON format: " + (e instanceof Error ? e.message : 'Unknown error'));
        return;
      }

      const res = await fetch('/api/admin/enrich-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminKey,
        },
        body: JSON.stringify({ topics: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      toast.success(data.message);
      setImportJson('');
      fetchData(adminKey); // refresh list
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearTopic = async (topicId: string) => {
    if (!adminKey) return toast.error('Admin key required');
    if (!confirm('Are you sure you want to delete AI content for this topic?')) return;

    try {
      const res = await fetch(`/api/admin/enrich-syllabus?topicId=${topicId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminKey,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear');

      toast.success(data.message);
      fetchData(adminKey);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  // dbData format might be an array of topics or an object of units. 
  // Let's handle if it's already units object or array:
  const units: Record<string, SyllabusDbUnit> = {};
  
  if (Array.isArray(dbData)) {
    dbData.forEach(item => {
      const uId = item.unit_id || item.unit; // support both
      if (!uId) return;
      if (!units[uId]) {
        units[uId] = {
          title: item.unit_title || uId,
          topics: []
        };
      }
      units[uId].topics.push({
        ...item,
        hasAiContent: !!(item.content_hindi && item.content_english)
      });
    });
  } else {
    // If it's already an object of units
    Object.assign(units, dbData);
  }

  const unitKeys = Object.keys(units).sort((a, b) => {
    const numA = parseInt(a.replace('unit_', '')) || 0;
    const numB = parseInt(b.replace('unit_', '')) || 0;
    return numA - numB;
  });

  let totalGlobal = 0;
  let completedGlobal = 0;
  unitKeys.forEach(u => {
    totalGlobal += units[u].topics.length;
    completedGlobal += units[u].topics.filter((t) => t.hasAiContent).length;
  });

  const getUnitJson = (unitId: string) => {
    const u = units[unitId];
    if (!u) return '';
    const mapped = u.topics.map((t) => ({
      id: t.id,
      unit: u.title,
      title_hindi: t.topic_title || t.title_hindi,
      title_english: t.topic_title_en || t.title_english,
    }));
    return JSON.stringify(mapped, null, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Syllabus Enrichment</h1>
          <p className="mt-2 text-slate-500">
            Generate and import dual-language structured content for all UPSC topics.
          </p>
        </div>

        {/* 1. MASTER PROMPT */}
        <SyllabusMasterPrompt masterPrompt={MASTER_PROMPT} />

        {/* 2. TRACK & BATCH EXPORT */}
        <SyllabusTrackAndBatch 
          units={units}
          unitKeys={unitKeys}
          expandedUnit={expandedUnit}
          setExpandedUnit={setExpandedUnit}
          totalGlobal={totalGlobal}
          completedGlobal={completedGlobal}
          masterPrompt={MASTER_PROMPT}
          setTargetUnit={setTargetUnit}
          setTargetTopic={setTargetTopic}
          handleClearTopic={handleClearTopic}
          getUnitJson={getUnitJson}
        />

        {/* 3. IMPORT SECTION */}
        <SyllabusImportSection 
          adminKey={adminKey}
          setAdminKey={setAdminKey}
          targetUnit={targetUnit}
          setTargetUnit={setTargetUnit}
          targetTopic={targetTopic}
          setTargetTopic={setTargetTopic}
          importJson={importJson}
          setImportJson={setImportJson}
          isUploading={isUploading}
          handleUpload={handleUpload}
          units={units}
          unitKeys={unitKeys}
        />

      </div>
    </div>
  );
}
