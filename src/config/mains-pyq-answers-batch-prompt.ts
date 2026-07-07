import { getMainsPaperExpertAddon } from '@/config/mains-paper-expert-addons';

export type PyqBatchQuestion = {
  id: string;
  part: string;
  unitNumber: number;
  questionNumber: string;
  marks: number;
  questionType: string;
  questionHi: string;
  questionEn: string | null;
};

const MARK_POINT_PRESENTATION = (isEssay: boolean) => `
POINT-FIRST PRESENTATION (mandatory — students read in our UI as fast-scan bullets)
- **Every** model answer (**answer_hi** and **answer_en**) MUST be written as **vertical points**: each non-empty line starts with **"- "** (hyphen + space). No free-flow paragraphs; no essay blocks.${isEssay ? ' (EXCEPTION: For Paper 6 Essays and Draft Writing, you may use standard paragraphs or preformatted visual blocks without the `- ` prefix.)' : ''}
- Let **m** = marks from the stem line in this batch. Choose density by **m**:
  • **m = 10** (short): **5–8 bullets**; ~150 words total; each bullet one crisp fact or judgement.
  • **m = 15** (long): **8–14 bullets**; ~250 words total; optional grouping with a line **## …** section heading **or** a bullet starting with **bold** mini-label using **…** inside that bullet only.
  • **m = 20** (case / ethics-style when applicable): numbered phases OK as lines like **"- Phase 1: …"** still using "- " prefix for main lines; ~250-300 words total.
- **Bold** only for 3–6 word labels inside a bullet (**…**), never whole paragraphs.
- Same point layout rules for **both** variants; variants differ by **angle / ordering / example**, not by turning bullets into prose.
`.trim();

const SUBJECT_LENS = `
CROSS-PAPER DISCIPLINE (infer from unit / stem — apply what fits; never invent facts)
- History / culture / medieval / ancient: weave **political–administrative, socio-religious, economic (agrarian, trade, revenue), architectural & urban form, cultural production (language, art, syncretism)** only when syllabus-linked and exam-safe.
- Geography / environment: **physical basis → human response → regional variation → India/National link if honest** (relief, climate, drainage, resources, hazards, planning tools); maps & directional anchors in prose (no fake coordinates).
- Polity / governance: **constitutional–institutional–federal–India/National local self-gov** chain; avoid partisan rhetoric.
- Economy / planning: **concept → mechanism → outcome → India/National/state scheme only when standard**; data only if widely cited / NCERT-class safe.
- Ethics / philosophy (Paper IV): **stakeholders → values → framework → proportionate action → precedent/classification**; case hooks only as generic patterns.
- Science–tech / India/National-specific themes: **definition → Indian/India/National context → limitation → way forward**; no speculative “reports”.
`.trim();

const JSON_SAFETY_ADDENDUM = `
JSON SAFETY ADDENDUM
- Output one raw JSON object only. No markdown fences, no commentary, no code block markers.
- Never escape key names. Write "question_id":, not \\"question_id\\": or "question_id\\":.
- Keep exact field names from the schema: schema_version, paper_number, exam_year, items, question_id, marks, expert_insights_hi, expert_insights_en, value_addition_kit_en, value_addition_kit_hi, current_affairs_data_en, current_affairs_data_hi, variants, variant_slot, style_label_hi, style_label_en, answer_hi, answer_en.
- If a string is getting risky because of quotes, replace inner double quotes with single quotes or shorten the sentence.
- Do not add extra wrapper keys, notes, or explanatory text outside the schema.`.trim();

const CURRENT_AFFAIRS_RULES = `
VALUE ADDITION KIT (CRITICAL UPSC EXTRA MARKS)
- You must enrich the answer with a highly concentrated "Value Addition Kit" AND an applied "Current Affairs Intro/Conclusion" format.
- Provide the output in BOTH English and simple, easily understandable Hindi.

★★★ STRICT COMPLETENESS & PREMIUM QUALITY RULE (NEW & MANDATORY) ★★★
1. NO EMPTY OBJECTS: You MUST populate AT LEAST ONE OR TWO arrays in the \`value_addition_kit\` for EVERY question. 
   - If it's a static History question, use ASI Excavations, UNESCO sites, Tourism initiatives, or Historiography quotes as your "data".
   - If it's a static Geography question, use IMD trends, NDMA guidelines, or NITI Aayog indices.
2. EXPERT UPSC INTRO/CONCLUSION (TOPPER STYLE): The \`intro_hook\` and \`conclusion_way_forward\` MUST ALWAYS BE FILLED. NEVER output an empty string. 
   - The quality MUST justify a premium purchase. Write like a Top 10 UPSC Topper. 
   - Intros should instantly hook the examiner using current context, data, or constitutional framework.
   - Conclusions should be visionary, linking to national goals (e.g., $5 Trillion Economy, Amrit Kaal, Vision 2047, SDGs, Smart Cities).
3. PAIRING IS COMPULSORY: Every question that gets an intro_hook MUST also get a conclusion_way_forward. They work together.
4. BREVITY: Kit points MUST be under 15 words. Intro/Conclusion under 35 words.

CRITICAL UPSC SUBJECT-WISE RULES (VALUE ADDITION STRATEGY):
- PAPER 2 (Polity, Constitution, Health, Education, Sociology): MANDATORY to quote relevant Articles, Fundamental Rights (FR), Fundamental Duties (FD), or DPSP. Link to SDGs (3, 4, 5, 10, 16). Cite SC landmark verdicts, Law Commission, ASER, NFHS-5 data.
- PAPER 4 (Ethics, Thinkers, Psychology & PubAd): ALWAYS integrate 2nd ARC Reports (e.g., 4th, 12th). Explicitly use Nolan Committee's 7 Principles or Max Weber's traits. Cite real-world cases (Swachh Bharat, Operation Ganga). Skip SDGs/Articles here.
- PAPER 3 (Economy, Science, Tech, Environment): MANDATORY SDGs (7, 8, 9, 13). STRICTLY use National Economic Survey data, Union Budget highlights, or NITI Aayog Poverty Index. Mention National Renewable targets, ISRO missions, Kuno Cheetah.
- PAPER 1 (History & Geography): History: Focus on India's cultural pride (GI Tags, UNESCO sites, ASI excavations), Tribal Heroes. Professionalism: Use historiography (quote Max Müller, Kautilya). Presentation: flowcharts for timelines. Geography: Quote IMD climate data, National disaster stats, NITI Aayog Water Index.
`.trim();

/**
 * One AI user message: batch of official stems → JSON with 2 variants per stem (HI + EN) + optional expert insights per stem.
 * Paper/part “expert lens” slices come from `scratch/prompt-segregation-paper-*.txt` (same modules as /mains topic AI).
 */
export function buildPyqAnswersBatchUserPrompt(args: {
  paperNumber: number;
  examYear: number;
  examLabel: string | null;
  questions: PyqBatchQuestion[];
}): string {
  const lensBlocks: string[] = [];

  const expertAddon = getMainsPaperExpertAddon(args.paperNumber);
  if (expertAddon.trim()) {
    lensBlocks.push(
      `\n========== PAPER ${args.paperNumber} — DYNAMIC EXPERT RULES ==========\n${expertAddon}\n`
    );
  }

  const stems = args.questions
    .map(
      (q, i) =>
        `### Q${i + 1} [id=${q.id}]\n- ${q.marks} marks · Part ${q.part} · Unit ${q.unitNumber} · ${q.questionType}\n- HI: ${q.questionHi}\n- EN: ${q.questionEn ?? '(none)'}\n`
    )
    .join('\n');

  const isPureHindi = args.paperNumber === 5 || args.paperNumber === 6;
  const isEssay = args.paperNumber === 6;

  return `You are an UPSC Mains selected-expert (top 0.1% answer quality). Output ONE raw JSON object only — no markdown fences, no commentary outside JSON.

════════════════════════════════════════════════════════════════════════════════
🚨 MANDATORY JSON OUTPUT PROTOCOL — NON-NEGOTIABLE 🚨
════════════════════════════════════════════════════════════════════════════════
1. **STRUCTURAL QUOTES**: Use ONLY clean double-quotes (") for keys and string boundaries.
   - CORRECT: "question_id": "8b1f..."
   - INCORRECT: \"question_id\": \"8b1f...\" (DO NOT ESCAPE KEYS)
2. **INTERIOR QUOTES**: NEVER use double-quotes (") inside a string value. Use single quotes (') instead.
3. **NO TRAILING COMMAS**: Ensure the last item in an array or object has no comma.
4. **COMPACT CONTENT**: Keep bullets short (1-2 lines) to prevent response truncation.
════════════════════════════════════════════════════════════════════════════════

EXAM: ${args.examYear} ${args.examLabel ?? 'UPSC Mains'} · PAPER ${args.paperNumber}

${MARK_POINT_PRESENTATION(isEssay)}

${SUBJECT_LENS}

${CURRENT_AFFAIRS_RULES}

${lensBlocks.join('\n')}

${JSON_SAFETY_ADDENDUM}

STEMS IN THIS BATCH (${args.questions.length}):
${stems}

--- REQUIRED JSON SHAPE (strict) ---
{
  "schema_version": "mains_pyq_answers_batch_v2",
  "paper_number": ${args.paperNumber},
  "exam_year": ${args.examYear},
  "items": [
    {
      "question_id": "<exact id from [id=…] above>",
      "marks": <number>,
      "expert_insights_hi": "<long structured Hindi — see EXPERT INSIGHTS CONTRACT below>",
      "expert_insights_en": ${isPureHindi ? "null" : '"<same strategic depth in independent English — NOT translation>"'},
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
        "intro_hook": "उत्तर की शुरुआत के लिए डेटा, इंडेक्स या अनुच्छेद का उपयोग कैसे करें। (Max 25 words in simple Hindi)",
        "conclusion_way_forward": "उत्तर के अंत में योजना, रिपोर्ट या SDG का उपयोग कैसे करें। (Max 25 words in simple Hindi)",
        "keywords": ["टैग1", "टैग2", "टैग3"]
      },
      "variants": [
        {
          "variant_slot": 1,
          "style_label_hi": "2–6 शब्द · शुद्ध Hindi · same strategic angle · NOT transliteration-only",
          "style_label_en": ${isPureHindi ? "null" : '"2–6 words English — examiner-style angle chip (e.g. definition-first)"'},
          "answer_hi": "ready-to-write Hindi answer string",
          "answer_en": ${isPureHindi ? "null" : '"ready-to-write English answer string"'}
        },
        {
          "variant_slot": 2,
          "style_label_hi": "same idea in independent Hindi wording",
          "style_label_en": ${isPureHindi ? "null" : '"different English angle chip"'},
          "answer_hi": "…",
          "answer_en": ${isPureHindi ? "null" : '"…"'}
        }
      ]
    }
  ]
}

EXPERT INSIGHTS CONTRACT (both languages — readable coaching; ~1000–2600 characters each language typical)
Goal: student should feel guided (not lectured), grasp the play quickly, and trust the structure. **Plain, human language first** — simple words, short lines, natural rhythm — yet every line should still sound mains-ready and professional (no slang, no fluff).

Format for **expert_insights_en** and **expert_insights_hi** (inside the JSON string — still no raw ASCII " in values):
- Use ONLY **##** (level-2) headings — **exactly nine, in this fixed order**, emoji + title. English insights use the EN title line; Hindi insights use the HI title line.

**EN heading lines (copy numbering + emoji; after the title you may shorten in body only, not the heading line):**
## 1 🔍 Stem decoding
## 2 🧩 Pattern recognition
## 3 🏗️ Answer skeleton
## 4 ✅ Intro · body · closure checklist
## 5 📚 Sources & evidence mindset
## 6 📍 India/National lens (only if honest)
## 7 ⏱️ Word limit trade-offs
## 8 ✨ Value‑add toolbox
## 9 📖 Topic reading map

**HI heading lines (same numbering/emojis — Hindi titles):**
## 1 🔍 प्रश्न की धुरी क्या है
## 2 🧩 पैटर्न और घुमाव
## 3 🏗️ उत्तर की रूपरेखा
## 4 ✅ भूमिका · मुख्य बिंदु · अंत — चेकलिस्ट
## 5 📚 साक्ष्य और स्रोत की सोच
## 6 📍 मध्यप्रदेश कोण ‑ केवल सटीक
## 7 ⏱️ शब्द सीमा — क्या छूटे, क्या नहीं
## 8 ✨ वैल्यू‑ऐड औज़ार
## 9 📖 आगे क्या पढ़ें

Under EACH of the nine sections you MUST deliver:
1) **2–4 bullets** starting with **"- "** (easily scannable — our UI renders them softly like tiles).
2) **Mandatory mini-examples**: in every section include at least one bullet whose text starts with **- Example:** (English) or **- उदाहरण:** (Hindi) — that prefix must be exact — then one ultra-short examiner-style illustration (one clause or single sentence max) showing *how that idea shows up on paper for THIS stem’s marks—not abstract theory*.
3) No walls of prose between headings; paragraphs only if unavoidable and ≤ 2 sentences.
4) **Tone**: sound like someone who cracked mains explaining at chai speed — warmth, clarity, zero intimidation jargon; no fake report names/data (see RULES).

LANGUAGE QUALITY (non‑negotiable)
- **Hindi**: शुद्ध, परीक्षा-उपयुक्त, प्राकृतिक बोलचाल से मिलता प्रवाह — **not** English-to-Hindi calque of the EN insight file; वही रणनीति, स्वाभाविक Hindi.
${isPureHindi ? '- **English**: STRICTLY PROHIBITED. All \`_en\` keys must be null. Do not use English anywhere.' : '- **English**: warm, examiner-sharp; short sentences where possible — still paper-quality.'}
- Model answers (**answer_hi / answer_en**): **ONLY "- " lines** as per MARK_POINT_PRESENTATION; use **double asterisks** only for 3–6 word labels inside a bullet (UI renders bold — no stray single asterisks).

VARIANT STYLE LABELS (for student UI beside “Variant 1/2”; required per variant)
- **style_label_hi** — short Hindi angle (exam register); natively written; parallels the English label’s meaning.
- **style_label_en** — short English angle; tight editorial chip.

MARK / LENGTH DISCIPLINE
- Obey **MARK_POINT_PRESENTATION** first; then match word economy to **m** (10m short ≈150 words; 15m long ≈250 words; 20m case-style where relevant).
- **Exactly 2 variants** per question; **variant_slot** must be 1 and 2.
- **question_id** must match the batch list exactly (for admin paste).

RULES
- **Valid JSON (critical)**: 
  - **STRUCTURAL QUOTES**: Use ONLY clean double-quotes (") for keys and string boundaries (e.g. "question_id": "8b1f..."). NEVER escape them (NOT \"question_id\":). NEVER add backslashes near colons (NOT "key\":).
  - **INTERIOR QUOTES**: NEVER use double-quotes (") inside a string value. Use single quotes (') instead.
  - **NO HALLUCINATIONS**: Do NOT add stray backslashes (\) anywhere in the JSON structure.
  - **NO TRAILING COMMAS**: Verify the last element in any object or array does not have a trailing comma.
- Cite only exam-safe, standard sources; no fabricated bodies or URLs.
- Both variants must differ in **opening move**, **ordering**, and **examples** — not shallow paraphrase.
`.trim();
}
