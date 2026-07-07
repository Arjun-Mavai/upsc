/**
 * Default “Live Preview: Last Upgraded Question” data — Ganges / Indian Geography
 * (matches mppsc_expert shape used by StructuredExplanation)
 */
export const GANGA_DEMO_CLASSIC = {
  hi: `गंगा हिमालय से निकलकर पूर्वी भारत के मैदानों से गुजरती 2,500 किमी से अधिक लंबी नदी है; भागीरथी-अलकनन्दा के संगम के बाद नाम *गंगा*। प्रमुख वाम किनारा सहायक: रामगंगा, गोमती, घाघरा, गंडक व कोसी; दक्षिण/दायां: यमुना, सोन, पुनपुन। श्रृंगवेरपुर, प्रयाग, वाराणसी, पाटलिपुत्र जैसे ऐतिहासिक-धार्मिक केन्द्र। डेल्टा बंगाल की खाड़ी में; निचले मैदान अधिक ढाल वाले — बाढ़, तलछट व जल-प्रबंधन पेपर-हैट पूछे जाते।`,
  en: `The Ganga rises in the Himalayas, flows over 2,500 km through the northern plain, and is formed after the Devprayag confluence of Bhagirathi and Alaknanda. Key left-bank Himalayan tributaries include Ramganga, Ghaghara, Gandak, and Kosi; the Yamuna and Son join from the right/south. Cities like Prayagraj and Varanasi, plus the Sundarbans delta, are exam staples. Expect traps on: which stream is the “source” line (Bhagirathi vs. longer Alaknanda), bank-wise tributaries, and the Farakka–Ganga silt / flood narrative.`,
} as const;

export const GANGA_UPGRADED_EXPERT_PREVIEW = {
  stream: 'mppsc_expert' as const,
  topic_micro_mapping_hi: 'भारतीय भूगोल - अपवाह (गंगा नदी तंत्र)',
  topic_micro_mapping_en: 'Indian Geography - Drainage (Ganga River System)',
  conceptual_depth_hi:
    'उद्गम: गोमुख (गंगोत्री हिमनद) से *भागीरथी*; देवप्रयाग पर *भागीरथी* व *अलकनन्दा* (वास्तव में लंबा हिमनदी खण्ड) के संगम के बाद नाम *गंगा*। हरिद्वार के बाद मैदान; प्रयाग, वाराणसी, पाटलिपुत्र (पटना) → फरक्का → बांग्लादेश में पद्मा/मेघना के रूप में बंगाल की खाड़ी। लगभग 2525 किमी, विशाल जलग्रहण क्षेत्र, उर्वरा मैदानी मिट्टी।',
  conceptual_depth_en:
    '**Headwaters:** Gomukh (Gangotri glacier) gives the *Bhagirathi*; at *Devprayag* the Bhagirathi meets the longer *Alaknanda*, and the combined stream is called the *Ganga* plainwards. The river crosses Haridwar, Prayagraj, Varanasi, Patna, then the Farakka barrage, entering Bangladesh (Padma/Meghna) before the Bay of Bengal. ~2,525 km, vast basin, silt-laden, lifeline of the Gangetic plain.',
  interdisciplinary_link_hi:
    '— *इतिहास/संस्कृति:* हर-हर गंगे, मघ मेला, पाटलिपुत्र-वाराणसी। — *पर्यावरण:* नमामि गंगे, जल प्रदूषण, E-Flow, Dolphin। — *अर्थव्यवस्था:* सिंचाई, नदी परिवहन (NW-1), बिजली (देहरादून-हरिद्वार जोन)।',
  interdisciplinary_link_en:
    '— *History & culture:* Kumbh/Magh mela, ancient capitals (Pataliputra), riparian pilgrimage towns. — *Environment:* Namami Gange, e-flow norms, coliform/ industrial loads, Ganges river dolphin. — *Economy & policy:* Inland waterway NW-1, irrigation commands, inter-state Farakka water-sharing as a *current affairs* link.',
  elimination_strategy_hi:
    '1) *“स्रोत पंक्ति (Source tract)”* पूछे तो *अलकनन्दा* (लंबा हिमनदी) बनाम *भागीरथी* (धार्मिक/symbolic) में उलझाए; लम्बाई = अक्सर **अलकनन्दा**। 2) *दाएँ किनारा* = यमुना, सोन, पुनपुन, चम्बल, बेतवा, केन-जोड़; *बाएँ* = रामगंगा, गोमती, घाघरा, व गंडक/कोसी (हिमालय से)। 3) “गंगा=सबसे लंबी” भारत में नहीं (गोदावरी/ ब्रह्मपुत्र ट्रैप)। 4) एम्सटर्डम जैसे तुलना-प्रशन में भौगोलिक mismatch हटा दें।',
  elimination_strategy_en:
    '1) **Source-tract traps:** *Devprayag* is the *naming* confluence, but the **longer** upper stem is classically the **Alaknanda** (not Bhagirathi) — prelims love this. 2) **Banking:** R **Yamuna / Son** vs L **Ramganga / Ghaghara / Gandak** — do not mix with Narmada (west flowing). 3) *Length ranking:* Ganga is huge, but do not call it *India’s longest* in trick MCQs: Godavari (peninsular) / Brahmaputra (different system) get used as distractors. 4) *Delta / Bangladesh:* remember Padma-Meghna, not just “Ganga ends”.',
  historical_trend_hi:
    'यूपीएससी/_State PSC बार-बार *उद्गम-संवहन, किनारा-क्रम, शहर-क्रम* और *मानचित्र आधारित* one-liners पूछते हैं; हाल में नमामि गंगे व जल-भण्डारण/प्रदूषण संख्याएं combine होतीं। *गोदान* में गंगा नदी के नाम-परिवर्तन (भागीरथी→गंगा) + प्रमुख सहायक नदियों की याद रखें।',
  historical_trend_en:
    'UPSC and State PSCs repeat **confluences, left/right tributaries, city sequence, and map-based** facts. *Contemporary* hooks: Namami Gange milestones, e-flow, fecal coliform, industrial clusters. Pair **Classical** drainage chapters with **Current** river-rejuvenation data for a single *interdisciplinary* sentence in Mains-style answers.',
  memory_mnemonic_hi:
    '**"Ra-Gho-Ga-Ga-Ko" (बाएँ / हिमालयी किनारा सेट):** *राम*गंगा, *घा*घरा, *गं*डक, *को*सी। नीचे बहते क्रम याद: *हरि → प्र → वा → पा* (हरिद्वार → प्रयाग → वाराणसी → पटना)। दाएँ सबसे मोटा *यमुना* प्रयाग पर।',
  memory_mnemonic_en:
    '**"HAR-PRI-VA-PA"** = downstream *plain* sequence: **H**aridwar → **P**rayagraj → **V**aranasi → **P**atna (before the delta split). *Left bank (north):* **"Ram goes home late"** → **R**amganga, **G**haghara, *G*and**a**k, **K**osi (mnemonic, not a literal acronym). *Right join:* **Yamuna at Prayagraj** (big one).',
  ncert_reference_hi: 'NCERT — Fundamentals of Physical Geography (Class XI) अध्याय 3 (अपवाह) + भारत: भौगोलिक परिचय (Class XI)। जल-प्रबंधन/वर्तमान: nmcg.nic.in (नमामि गंगे)।',
  ncert_reference_en: 'NCERT Class XI — *India: Physical Environment* (Drainage) + *Fundamentals of Physical Geography*. Official context: nmcg.nic.in (Namami Gange) & IWAI for National Waterway-1 *fact-checks* on navigation stretches.',
  high_yield_facts_hi: [
    'उद्गम श्रंखला: भागीरथी (गोमुख) + अलकनन्दा → देवप्रयाग पर *गंगा*।',
    'लगभग 2,525 किमी; सबसे बड़ा भारतीय नदी जलग्रहण क्षेत्र (लगभग 10.86 लाख वर्ग किमी आसपास)।',
    'प्रयाग: गंगा-यमुना संगम; वाराणसी: मध्य गंगा मैदान; फरक्का: पानी-विभाजन/नियंत्रण।',
    'हिमालयी सहायक: रामगंगा, कोसी, गंडक, घाघरा (सामान्यत: वाम/उत्तर)।',
  ],
  high_yield_facts_en: [
    '**Devprayag** names the *Ganga* after Bhagirathi + Alaknanda join (Alaknanda = longer headreach).',
    '**~2,525 km** total; **largest** drainage basin *among Indian rivers*.',
    '**Prayagraj** = Ganga–Yamuna confluence; **Varanasi** mid-plain; **Farakka** barrage = India–Bangladesh silt/flow *exam hotspot*.',
    'Major **left-bank** Himalayan feeders: *Ramganga, Ghaghara, Gandak, Kosi*; **Yamuna** = largest **right**-bank tributary system.',
  ],
  mains_application_hi:
    'UPSC (General Studies-1) में: *जल-प्रदूषण, अंतरराज्यीय जल विवाद, सूक्ष्म जलवायु व तटीय पारिस्थितिकी* के साथ गंगा को जोड़ें—डेल्टा कृषि, मछली पालन, बाढ़ नियंत्रण व अनुकूलन (adaptation)।',
  mains_application_en:
    '**GS1 (Geography):** Frame a *river as system*: **headwaters → usage → pollution → inter-state/ international** (Farakka) → *delta vulnerability* to cyclones/ salt intrusion. One solid multi-layer paragraph beats five isolated facts.',
  toppers_mantra_hi:
    '**एक मानचित्र-पटल पर** गंगा रेखा खींचें, हर *मोड़* पर 1) मुख्य सहायक नदी, 2) एक शहर, 3) एक परियोजना/घटना (नमामि गंगे) लिखें—प्रीलिम्स में कन्फ्यूजन *शून्य*।',
  toppers_mantra_en:
    "Draw a **single scratch-map** of the *Ganga core bend* (Devprayag → Patna) and label **3 left / 2 right** tributaries + **3 cities** — in the exam, *spatial ordering* beats rote *isolated* names every time.",
};
