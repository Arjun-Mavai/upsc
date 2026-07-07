export const MAINS_EUREKA_VERSION = 'mains_eureka_v2';

export function isEurekaPayload(raw: Record<string, unknown>): boolean {
  return raw.schema_version === MAINS_EUREKA_VERSION;
}

function mdList(arr: unknown): string {
  if (!Array.isArray(arr)) return '';
  return arr.map(x => String(x).startsWith('-') ? x : `- ${x}`).join('\n');
}

export function composeEurekaConcept(parsed: any, lang: 'hi' | 'en'): string {
  const anatomy = parsed.concept_anatomy || {};
  const grasp = parsed.syllabus_grasp || {};
  const root = anatomy[`etymological_root_${lang}`] || '';
  const logic = anatomy[`the_eureka_logic_${lang}`] || '';
  
  let out = '';
  if (root || logic) {
    out += lang === 'hi' ? `## कॉन्सेप्ट की जड़ें (Concept Anatomy)\n` : `## Concept Anatomy\n`;
    if (root) out += `**${lang === 'hi' ? 'मूल अर्थ' : 'Root Meaning'}:** ${root}\n\n`;
    if (logic) out += `**${lang === 'hi' ? 'यूरेका लॉजिक' : 'The Eureka Logic'}:** ${logic}\n\n`;
  }
  
  if (grasp.core_essence || grasp.upsc_hidden_intent) {
    out += lang === 'hi' ? `## सिलेबस की पकड़\n` : `## Syllabus Grasp\n`;
    if (grasp.core_essence) {
      out += `### ${lang === 'hi' ? 'मूल सार' : 'Core Essence'}\n${mdList(grasp.core_essence)}\n\n`;
    }
    if (grasp.upsc_hidden_intent) {
      out += `### ${lang === 'hi' ? 'UPSC का छिपा हुआ इरादा' : 'UPSC Hidden Intent'}\n${mdList(grasp.upsc_hidden_intent)}\n\n`;
    }
    if (grasp.out_of_scope) {
      out += `### ${lang === 'hi' ? 'क्या नहीं पढ़ना है' : 'Out of Scope'}\n${mdList(grasp.out_of_scope)}\n\n`;
    }
  }
  return out.trim();
}

export function composeEurekaStrategy(parsed: any, lang: 'hi' | 'en'): string {
  let out = '';
  const synthesis = parsed.deep_synthesis || {};
  const synth = synthesis[`macro_to_micro_${lang}`];
  if (synth) {
    out += lang === 'hi' ? `## गहन विश्लेषण (Deep Synthesis)\n` : `## Deep Synthesis\n`;
    out += `${mdList(synth)}\n\n`;
  }
  
  const pyq = parsed.pyq_trend_analysis || {};
  const pyqLines = pyq[lang];
  if (pyqLines) {
    out += lang === 'hi' ? `## PYQ ट्रेंड\n` : `## PYQ Trend\n`;
    out += `${mdList(pyqLines)}\n\n`;
  }
  
  const dims = parsed.dynamic_dimensions;
  if (Array.isArray(dims)) {
    out += lang === 'hi' ? `## डायनैमिक आयाम\n` : `## Dynamic Dimensions\n`;
    for (const d of dims) {
      if (d.dimension) {
        out += `### ${d.dimension}\n`;
        out += `${mdList(d.bullets)}\n\n`;
      }
    }
  }
  
  const topper = parsed.topper_x_factor || {};
  if (topper[lang]) {
    out += lang === 'hi' ? `## टॉपर X-factor\n` : `## Topper X-factor\n`;
    out += `${topper[lang]}\n\n`;
  }
  return out.trim();
}

export function extractEurekaModels(parsed: any, lang: 'hi' | 'en'): Record<string, any[]> {
  const res: Record<string, any[]> = { '10m': [], '15m': [], '20m': [], 'case18': [] };
  const models = parsed.model_answers || {};
  
  for (const mark of ['10m', '15m', '20m']) {
    const m = models[mark];
    if (m && typeof m === 'object' && m.question) {
      // In eureka, there is no language split in the model answers object directly,
      // it just has "10m": { "question": "...", "thesis_statement": "..." }.
      // This implies the model answer is NOT explicitly bilingual in their schema, 
      // or we just wrap it into both! Wait, if the user's prompt schema doesn't specify language
      // for model answers, I will map it to both or English by default, but wait, the db expects
      // separate Hi/En variants. The user wrote "and mains ke qeutiosn upsc khi hi ho" meaning
      // maybe they want it bilingual? 
      // Let's format the single object into a Markdown string for the text field.
      let text = `**Thesis**: ${m.thesis_statement || ''}\n\n`;
      if (Array.isArray(m.structure)) {
        text += mdList(m.structure) + '\n\n';
      }
      text += `**Conclusion**: ${m.conclusion || ''}`;
      res[mark].push({ stem: m.question, text: text.trim() });
    }
  }
  return res;
}
