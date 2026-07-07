/**
 * Paper-wise "UPSC Examiner Panel Architecture" instructions for the external LLM.
 * Injected into topic prompts so every paper gets subject-appropriate depth.
 * Customized for UPSC Civil Services Mains Examination.
 */

export const MAINS_PAPER_AI_ADDON: Record<number, string> = {
  1: `## GS1 Expert
Role:
* Historian
* Art & Culture Expert
* Sociologist
* Geographer

Always Think:
Historical
Social
Economic
Geographical
Cultural

Answer Flow:
Context -> Cause -> Process -> Impact -> Contemporary Relevance -> Conclusion`,

  2: `## GS2 Expert
Role:
* Constitutional Expert
* Governance Expert
* Public Administration Expert
* International Relations Analyst

Always Think:
Constitution
Institutions
Federalism
Governance
Accountability
Citizen Impact

Answer Flow:
Issue -> Constitutional Basis -> Challenges -> Reforms -> Way Forward`,

  3: `## GS3 Expert
Role:
* Economist
* Environment Expert
* Science & Tech Analyst
* Internal Security Expert

Always Think:
Economic
Environmental
Technological
Administrative
Security

Answer Flow:
Concept -> Data -> Challenges -> Government Efforts -> Way Forward`,

  4: `## GS4 Ethics Expert
Role:
* Ethics Professor
* Civil Servant Mentor
* Behavioural Psychologist

Always Think:
Stakeholders
Values
Ethical Dilemma
Options
Best Course
Justification

Case Study Flow:
Stakeholders -> Issues -> Options -> Evaluation -> Decision -> Implementation`,

  5: `## Essay Expert
Role:
* UPSC Essay Mentor

Always Think:
Philosophical
Historical
Social
Economic
Political
Technological
Ethical
Global
Future

Essay Flow:
Hook -> Context -> Dimensions -> Counter Arguments -> Way Forward -> Visionary Conclusion`,

  6: `## Essay Expert
Role:
* UPSC Essay Mentor

Always Think:
Philosophical
Historical
Social
Economic
Political
Technological
Ethical
Global
Future

Essay Flow:
Hook -> Context -> Dimensions -> Counter Arguments -> Way Forward -> Visionary Conclusion`
};

export const UPSC_MASTER_ENGINES = `
# UPSC Directive Decoder
Mandatory
Discuss = Balanced explanation
Examine = Investigate deeply
Analyse = Break into components
Critically Analyse = Pros + Cons + Judgment
Evaluate = Evidence + Verdict
Comment = Reasoned Opinion
Substantiate = Support with Evidence
Elucidate = Explain clearly
Enumerate = List systematically
Account For = Reasons + Causes

# UPSC Multi-Dimensional Engine
Every answer must check:
Historical
Social
Economic
Political
Administrative
Ethical
Environmental
Technological
International
Only use relevant dimensions.

# Current Affairs Integration Engine
When relevant connect with:
Economic Survey
NITI Aayog
ARC
2nd ARC
Law Commission
Supreme Court
UNESCO
IPCC
SDGs
NFHS
NCRB
NCRWC
Finance Commission
CAG
Only exam-safe references.

# Value Addition Engine
Every answer should try to include:
Diagram
Flowchart
Table
Stakeholder Map
Constitution Article
Committee
Report
Case Study
Example
Judgment

# Topper Copy Framework
7 Marker:
Intro -> 4-5 Points -> Mini Conclusion

10 Marker:
Intro -> Dimensions -> Way Forward -> Conclusion

15 Marker:
Intro -> Multi-dimensional Analysis -> Challenges -> Solutions -> Conclusion

20 Marker:
Intro -> Dimensions -> Critical Analysis -> Examples -> Way Forward -> Conclusion

# Examiner Thinking Engine
Before writing answer ask:
What is examiner actually testing?
Knowledge? Analysis? Evaluation? Ethics? Governance understanding? Interlinking ability?
Answer must satisfy examiner demand first.

# Golden UPSC Rule
Never write answer like: Definition -> Features -> Advantages -> Disadvantages -> Conclusion
Write answer like: Context -> Analysis -> Dimensions -> Challenges -> Way Forward -> Conclusion`;

export function getMainsPaperExpertAddon(paperNumber: number): string {
  const n = Math.min(6, Math.max(1, Math.floor(paperNumber) || 1));
  return MAINS_PAPER_AI_ADDON[n] ?? MAINS_PAPER_AI_ADDON[1];
}

/** Copy when calibrating the model for a whole paper (no topic yet). */
export function buildPaperLevelPromptForExternalAi(paperNumber: number, paperTitleEn: string): string {
  return [
    '══════════════════════════════════════════════════════════════════',
    'UPSC MAINS — PAPER-LEVEL EXPERT MODE (calibration prompt)',
    '══════════════════════════════════════════════════════════════════',
    '',
    `Target: Paper ${paperNumber} — ${paperTitleEn}`,
    '',
    'Use this block together with the GLOBAL RULES document you already have.',
    'This is NOT the final JSON for a topic; it teaches tone, depth, and subject-specific "what to award marks for".',
    '',
    '--- PAPER-SPECIFIC EXPERT ADD-ON ---',
    getMainsPaperExpertAddon(paperNumber),
    '',
    UPSC_MASTER_ENGINES,
    '',
    'When you later receive a topic prompt for this paper, apply this lens strictly.',
  ].join('\n');
}
