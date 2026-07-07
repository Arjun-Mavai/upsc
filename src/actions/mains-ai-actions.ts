'use server';

import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { db } from '@/db';
import { mainsTopics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { upsertMainsContent } from '@/actions/mains-actions';
import {
  composeExpertStrategyFromRich,
  extractModelAnswersForValidation,
  extractModelAnswersEn,
  isHistoryRichPayload,
  stripServerFields,
} from '@/lib/mains-history-rich-normalize';
import { isEurekaPayload, composeEurekaConcept, composeEurekaStrategy, extractEurekaModels } from '@/lib/mains-eureka-normalize';
import { structuredKeyTermsToString } from '@/lib/mains-key-terms-flash';
import {
  repairInteriorDoubleQuotesInMappedStrings,
  repairEscapedJsonObjectKeys,
  jsonParseSnippetContext,
} from '@/lib/mains-pyq-paste-json-parse';

function stripCodeFence(s: string) {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function normalizeAiPayload(raw: Record<string, unknown>) {
  const conceptHi = String(raw.concept_hi ?? raw.conceptHi ?? '').trim();
  const conceptEn = String(raw.concept_en ?? raw.conceptEn ?? '').trim();
  const modelAnswers = extractModelAnswersForValidation(raw);
  return {
    conceptHi,
    conceptEn,
    expertStrategyHi: String(raw.expert_strategy_hi ?? raw.expertStrategyHi ?? '').trim() || null,
    expertStrategyEn: String(raw.expert_strategy_en ?? raw.expertStrategyEn ?? '').trim() || null,
    modelAnswers,
    keyTermsHi: (raw.key_terms_hi ?? raw.keyTermsHi) as string | null | undefined,
    keyTermsEn: (raw.key_terms_en ?? raw.keyTermsEn) as string | null | undefined,
    practiceQuestions: (raw.practice_questions ?? raw.practiceQuestions) as unknown,
  };
}

function parseContentJson(rawText: string): Record<string, unknown> {
  const sanitized = rawText
    .replace(/^\uFEFF/, '') // Remove UTF-8 BOM if present
    .replace(/\u0000/g, '') // Remove NULL bytes
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const stripped = stripCodeFence(sanitized);
  // CRITICAL FIX: Apply escaped-key repair BEFORE all parsing attempts.
  // AI sometimes outputs malformed keys like \"question_id\": or "question_id\":
  // This pre-pass normalizes them to "question_id": so subsequent parsers don't choke.
  // See: src/lib/mains-pyq-paste-json-parse.ts repairEscapedJsonObjectKeys() for details.
  const escapedKeysFixed = repairEscapedJsonObjectKeys(stripped);

  // Phase 1: Try raw parsing WITHOUT jsonrepair first (to avoid premature truncation by jsonrepair)
  const rawTries = [
    { label: 'JSON.parse raw', run: () => JSON.parse(escapedKeysFixed) },
    { label: 'JSON5.parse raw', run: () => JSON5.parse(escapedKeysFixed) },
  ];

  for (const t of rawTries) {
    try {
      const val = t.run();
      if (val && typeof val === 'object') {
        return val as Record<string, unknown>;
      }
    } catch {
      // Continue
    }
  }

  // Phase 2: Patch unescaped quotes in mapped strings and try clean parsing (WITHOUT jsonrepair)
  const patched = repairInteriorDoubleQuotesInMappedStrings(escapedKeysFixed);
  const patchTries = [
    { label: 'JSON.parse patched', run: () => JSON.parse(patched) },
    { label: 'JSON5.parse patched', run: () => JSON5.parse(patched) },
  ];

  for (const t of patchTries) {
    try {
      const val = t.run();
      if (val && typeof val === 'object') {
        return val as Record<string, unknown>;
      }
    } catch {
      // Continue
    }
  }

  // Phase 3: Try jsonrepair as a last resort on patched/raw versions (in case of true truncation/missing brackets)
  const repairTries = [
    { label: 'jsonrepair + JSON.parse patched', run: () => JSON.parse(jsonrepair(patched)) },
    { label: 'jsonrepair + JSON5.parse patched', run: () => JSON5.parse(jsonrepair(patched)) },
    { label: 'jsonrepair + JSON.parse raw', run: () => JSON.parse(jsonrepair(escapedKeysFixed)) },
    { label: 'jsonrepair + JSON5.parse raw', run: () => JSON5.parse(jsonrepair(escapedKeysFixed)) },
  ];

  for (const t of repairTries) {
    try {
      const val = t.run();
      if (val && typeof val === 'object') {
        return val as Record<string, unknown>;
      }
    } catch {
      // Continue
    }
  }

  // Phase 4: Everything failed. Let's find the error in the PATCHED version since it's our best bet.
  let lastErrorMsg = 'Invalid JSON';
  let errorIndex: number | undefined;

  try {
    JSON.parse(patched);
  } catch (e) {
    if (e instanceof Error) {
      lastErrorMsg = e.message;
      const m = lastErrorMsg.match(/\bposition\s+(\d+)/i);
      if (m) errorIndex = parseInt(m[1]!, 10);
    }
  }

  const context = jsonParseSnippetContext(patched, errorIndex, 120);
  throw new Error(`JSON Parsing Failed: ${lastErrorMsg}\n\n${context}\n\n💡 HINT: There is an unescaped double quote (") inside a Hindi/English string. Even our auto-repairer couldn't fix it. Please ask the AI to use single quotes (') for emphasis instead of double quotes (").`);
}

function getDiagnostics(parsed: Record<string, unknown>, ma: ReturnType<typeof extractModelAnswersForValidation>): string {
  const rootKeys = Object.keys(parsed);
  const findMaObj = (
    parsed.model_answers_hi ??
    parsed.model_answer_hi ??
    parsed.modelanswers_hi ??
    parsed.model_answers ??
    parsed.model_answer ??
    parsed.modelAnswers ??
    parsed.modelAnswer ??
    parsed.modelanswers
  ) as Record<string, unknown> | undefined;
  const maKeys = findMaObj && typeof findMaObj === 'object' ? Object.keys(findMaObj) : [];
  return `[Diagnostics — schema_version: "${parsed.schema_version ?? 'missing'}", has_model_answers_hi: ${!!parsed.model_answers_hi}, has_model_answers: ${!!parsed.model_answers}, root_keys: [${rootKeys.join(', ')}], ma_subkeys: [${maKeys.join(', ')}], counted_models: 10m=${ma['10m'].length}, 15m=${ma['15m'].length}, 20m=${ma['20m'].length}, case18=${ma.case18.length}]`;
}

function validateModelShape(
  pn: number,
  ma: ReturnType<typeof extractModelAnswersForValidation>
): string | null {
  const hasModels =
    ma['10m'].length +
      ma['15m'].length +
      ma['20m'].length +
      ma.case18.length >
    0;
  // Relaxing strict paper-based validation for UPSC as the schema is evolving to 10m / 15m format.
  // We just ensure at least one model answer exists.
  if (!hasModels) return 'model_answers empty — add at least one block (use 10m or 11m fallback for now if schema expects it)';
  return null;
}

/** Paste AI JSON → validate → save to `mains_content` (admin-only via upsert). */
export async function adminApplyMainsContentJson(topicId: string, rawText: string) {
  try {
    const parsed = parseContentJson(rawText);

    const topicRow = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.id, topicId),
      with: { unit: { with: { paper: true } } },
    });
    const pn = topicRow?.unit?.paper?.paperNumber ?? 1;

    if (isHistoryRichPayload(parsed)) {
      const graspHi = String(parsed.syllabus_grasp_hi ?? '').trim();
      const graspEn = String(parsed.syllabus_grasp_en ?? '').trim();
      const cognitiveHi = String(parsed.cognitive_intro_hi ?? '').trim();
      const cognitiveEn = String(parsed.cognitive_intro_en ?? '').trim();
      
      // Require at least one concept source per language (grasp takes precedence, falls back to cognitive)
      const openerHi = graspHi || cognitiveHi;
      const openerEn = graspEn || cognitiveEn;
      const isPaper5or6 = pn >= 5;

      if (!openerHi || (!openerEn && !isPaper5or6)) {
        return {
          success: false as const,
          error: isPaper5or6
            ? 'History‑rich JSON: supply cognitive_intro_hi and/or syllabus_grasp_hi in Hindi (at least one non-empty).'
            : 'History‑rich JSON: supply cognitive_intro_* and/or syllabus_grasp_* in BOTH languages (at least one non-empty per language).',
        };
      }
      const conceptHi = [graspHi, cognitiveHi].filter(Boolean).join('\n\n');
      const conceptEn = [graspEn, cognitiveEn].filter(Boolean).join('\n\n');

      const ma = extractModelAnswersForValidation(parsed);
      const err = validateModelShape(pn, ma);
      if (err) {
        const diag = getDiagnostics(parsed, ma);
        return { 
          success: false as const, 
          error: `${err}\n\n💡 HINT: AI output might have been truncated (cut off). Check if the JSON ends abruptly. If so, ask the AI to "Continue generating from where you left off" or move 'model_answers_hi/en' higher in your prompt.\n\n${diag}` 
        };
      }

      const rawKeyHi = parsed.key_terms_hi ?? parsed.keyTermsHi;
      const rawKeyCardsHi = parsed.key_terms_cards_hi ?? parsed.keyTermsCardsHi;
      const rawKeyEn = parsed.key_terms_en ?? parsed.keyTermsEn;
      const rawKeyCardsEn = parsed.key_terms_cards_en ?? parsed.keyTermsCardsEn;

      // 🔄 SMART REPAIR: If AI gave us array of strings for key_terms but no structured cards,
      // we convert them to cards so the UI (flashcards) doesn't look empty.
      let finalKeyCardsHi = rawKeyCardsHi;
      let finalKeyCardsEn = rawKeyCardsEn;

      if (!finalKeyCardsHi && Array.isArray(rawKeyHi)) {
        finalKeyCardsHi = rawKeyHi.map(s => {
          const line = String(s).replace(/^[-•*]\s*/, '').trim();
          const match = line.match(/^(\S+)\s+(.+?):\s+(.+)$/) || line.match(/^(.+?):\s+(.+)$/);
          if (match && match.length >= 3) {
             const hasEmoji = match.length === 4;
             return {
               emoji: hasEmoji ? match[1] : undefined,
               term: hasEmoji ? match[2] : match[1],
               hint: hasEmoji ? match[3] : match[2]
             };
          }
          return { term: 'Term', hint: line };
        });
      }
      if (!finalKeyCardsEn && Array.isArray(rawKeyEn)) {
        finalKeyCardsEn = rawKeyEn.map(s => {
          const line = String(s).replace(/^[-•*]\s*/, '').trim();
          const match = line.match(/^(\S+)\s+(.+?):\s+(.+)$/) || line.match(/^(.+?):\s+(.+)$/);
          if (match && match.length >= 3) {
             const hasEmoji = match.length === 4;
             return {
               emoji: hasEmoji ? match[1] : undefined,
               term: hasEmoji ? match[2] : match[1],
               hint: hasEmoji ? match[3] : match[2]
             };
          }
          return { term: 'Term', hint: line };
        });
      }

      const keyHi = (Array.isArray(rawKeyHi)
        ? rawKeyHi.join('\n').trim()
        : String(rawKeyHi ?? '').trim()) ||
        structuredKeyTermsToString(finalKeyCardsHi).trim();
        
      const keyEn = (Array.isArray(rawKeyEn)
        ? rawKeyEn.join('\n').trim()
        : String(rawKeyEn ?? '').trim()) ||
        structuredKeyTermsToString(finalKeyCardsEn).trim();
      
      // Relaxed requirement: allow saving even if key terms are missing, but warn if one is missing while other exists
      if (!keyHi || !keyEn) {
        // If we have at least one language but not both, or both missing, we still allow save
        // but it's good to log for diagnostics
        const rKeys = Object.keys(parsed);
        console.warn(`Mains save: Some key terms missing. hasKeyHi=${!!keyHi}, hasKeyEn=${!!keyEn}. Root keys: [${rKeys.join(', ')}]`);
      }

      // Validate English model answers (bilingual requirement, relaxed for Paper 5 & 6)
      const maEn = extractModelAnswersEn(parsed);
      const needEn =
        maEn['10m'].length + maEn['15m'].length + maEn['20m'].length + maEn.case18.length;
      
      if (needEn === 0 && !isPaper5or6) {
        return {
          success: false as const,
          error: 'model_answers_en required for bilingual History‑rich saves',
        };
      }
      
      if (needEn > 0) {
        const enErr = validateModelShape(pn, maEn);
        if (enErr) {
          const diag = getDiagnostics(parsed, maEn);
          return {
            success: false as const,
            error: `English models: ${enErr} ${diag}`,
          };
        }
      }

      // Update richPayload with the repaired cards if necessary
      const finalParsed = { ...parsed };
      if (finalKeyCardsHi) finalParsed.key_terms_cards_hi = finalKeyCardsHi;
      if (finalKeyCardsEn) finalParsed.key_terms_cards_en = finalKeyCardsEn;

      const res = await upsertMainsContent(topicId, {
        conceptHi,
        conceptEn,
        expertStrategyHi: composeExpertStrategyFromRich(parsed, 'hi'),
        expertStrategyEn: composeExpertStrategyFromRich(parsed, 'en'),
        modelAnswers: ma,
        keyTermsHi: keyHi || null,
        keyTermsEn: keyEn || null,
        practiceQuestions: (parsed.practice_questions ?? parsed.practiceQuestions) as unknown,
        richPayload: stripServerFields(finalParsed),
        examType: 'upsc',
      });
      return res;
    } else if (isEurekaPayload(parsed)) {
      const conceptHi = composeEurekaConcept(parsed, 'hi');
      const conceptEn = composeEurekaConcept(parsed, 'en');
      const strategyHi = composeEurekaStrategy(parsed, 'hi');
      const strategyEn = composeEurekaStrategy(parsed, 'en');
      
      const maHi = extractEurekaModels(parsed, 'hi');
      const rawCards = parsed.key_terms_cards || [];
      const keyStr = structuredKeyTermsToString(rawCards);

      const res = await upsertMainsContent(topicId, {
        conceptHi,
        conceptEn,
        expertStrategyHi: strategyHi,
        expertStrategyEn: strategyEn,
        modelAnswers: maHi,
        keyTermsHi: keyStr || null,
        keyTermsEn: keyStr || null,
        practiceQuestions: [],
        richPayload: parsed,
        examType: 'upsc',
      });
      return res;
    }

    const n = normalizeAiPayload(parsed);
    // Bilingual content is mandatory; require both languages (relaxed for Paper 5 & 6)
    const isPaper5or6 = pn >= 5;
    if (!n.conceptHi || (!n.conceptEn && !isPaper5or6)) {
      return { 
        success: false as const, 
        error: isPaper5or6 ? 'concept_hi required' : 'concept_hi / concept_en required' 
      };
    }
    // Validate model answers match paper requirements
    const err = validateModelShape(pn, n.modelAnswers);
    if (err) {
      const diag = getDiagnostics(parsed, n.modelAnswers);
      return { success: false as const, error: `${err} ${diag}` };
    }

    const res = await upsertMainsContent(topicId, {
      conceptHi: n.conceptHi,
      conceptEn: n.conceptEn,
      expertStrategyHi: n.expertStrategyHi,
      expertStrategyEn: n.expertStrategyEn,
      modelAnswers: n.modelAnswers,
      keyTermsHi: n.keyTermsHi ?? null,
      keyTermsEn: n.keyTermsEn ?? null,
      practiceQuestions: n.practiceQuestions ?? null,
      richPayload: null,
      examType: 'upsc',
    });
    return res;
  } catch (e) {
    console.error('adminApplyMainsContentJson', e);
    return { success: false as const, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
