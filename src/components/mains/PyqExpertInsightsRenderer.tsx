'use client';

import React from 'react';
import { parseExtendedData } from '@/lib/explanation-parser';
import { coerceExplanationToString } from '@/lib/explanation-text';
import { cn } from '@/lib/utils';
import {
  Layers,
  BookOpen,
  Link2,
  Zap,
  TrendingUp,
  Brain,
  Bookmark,
  PenTool,
  Trophy,
} from 'lucide-react';

interface PyqExpertInsightsRendererProps {
  insightsText: string | null;
  currentAffairsData?: any | null;
  themeDeep: boolean;
  hi: boolean;
}

export function PyqExpertInsightsRenderer({
  insightsText,
  currentAffairsData,
  themeDeep,
  hi,
}: PyqExpertInsightsRendererProps) {
  if (!insightsText && !currentAffairsData) return null;

  // Hotfix for past DB records with Bengali character typo
  const safeInsightsText = insightsText ? insightsText.replace(/मध्यप्रदেশ/g, 'मध्यप्रदेश') : '';

  // Attempt to parse the complex JSON object
  const explanation = parseExtendedData(safeInsightsText);

  // Helper to aggressively strip markdown formatting characters, colons, stars, hashes
  const cleanText = (s: unknown): string => {
    if (!s) return '';
    const rawString = coerceExplanationToString(s, hi ? 'hi' : 'en');
    let cleaned = rawString;

    // Strip all asterisks (*) aggressively to prevent any markdown residue
    cleaned = cleaned.replace(/\*/g, '');
    
    // Strip markdown headers (e.g. ### Header or # Header)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    cleaned = cleaned.replace(/#/g, '');
    
    // Strip underscores (e.g. _italic_)
    cleaned = cleaned.replace(/_/g, '');
    
    // Strip leading colons, bullets, hyphens, and spaces
    cleaned = cleaned.replace(/^[\s:*•\-]+/g, '');
    
    return cleaned.trim();
  };

  // --- Parse Current Affairs & Value Addition Data (Bilingual with fallback) ---
  let parsedCa = currentAffairsData;
  if (typeof parsedCa === 'string') {
    try { parsedCa = JSON.parse(parsedCa); } catch (e) { /* safe fallback */ }
  }
  
  const getArraySafely = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
      if (Array.isArray(obj?.[key])) return obj[key];
    }
    return [];
  };

  const kitData = (hi ? parsedCa?.value_addition_kit_hi : parsedCa?.value_addition_kit_en) || parsedCa?.value_addition_kit || parsedCa;
  const caData = getArraySafely(kitData, 'latest_data_and_facts', 'data_facts_and_evidence');
  const caReports = getArraySafely(kitData, 'reports_and_frameworks', 'reports_frameworks_and_thinkers');
  const caSdgs = getArraySafely(kitData, 'mandatory_sdgs');
  const caArticles = getArraySafely(kitData, 'polity_articles_fr_dpsp');
  const caAnchors = getArraySafely(kitData, 'anchors_sdgs_and_constitution');
  const caMpCases = getArraySafely(kitData, 'national_specific_examples_and_schemes', 'mp_specific_schemes_cases', 'mp_specific_examples_and_schemes');
  const caCaseStudies = getArraySafely(kitData, 'best_practices_and_case_studies');
  
  const caHookData = (hi ? parsedCa?.current_affairs_data_hi : parsedCa?.current_affairs_data_en) || parsedCa;
  const caIntro = caHookData?.intro_hook;
  const caConclusion = caHookData?.conclusion_way_forward;
  const caKeywords = Array.isArray(caHookData?.keywords) ? caHookData.keywords : [];
  const hasCa = caData.length > 0 || caReports.length > 0 || caSdgs.length > 0 || caMpCases.length > 0 || caArticles.length > 0 || caIntro || caConclusion;
  // -------------------------------------------------------------------------------

  const isExpertJSON =
    explanation &&
    (explanation.stream === 'mppsc_expert' ||
      explanation.conceptual_depth ||
      explanation.toppers_mantra ||
      explanation.topic_micro_mapping);

  // Fallback: If it's not valid expert JSON, check if it's the structured 9 points, and render elegantly
  if (!isExpertJSON) {
    const rawCleaned = cleanText(safeInsightsText);
    const parseMainsExpertTips = (text: string) => {
      const sections: {
        number: number;
        title: string;
        emoji: string;
        content: string[];
      }[] = [];

      const standardHeadings = [
        { num: 1, title: hi ? "प्रश्न की धुरी क्या है" : "Core Question Focus", emoji: "🔍" },
        { num: 2, title: hi ? "पैटर्न और घुमाव" : "Pattern & Twists", emoji: "🧩" },
        { num: 3, title: hi ? "उत्तर की रूपरेखा" : "Answer Blueprint", emoji: "🏗️" },
        { num: 4, title: hi ? "भूमिका · मुख्य बिंदु · अंत — चेकलिस्ट" : "Intro · Body · Conclusion — Checklist", emoji: "✅" },
        { num: 5, title: hi ? "साक्ष्य और स्रोत की सोच" : "Sources & Evidence Analysis", emoji: "📚" },
        { num: 6, title: hi ? "मध्य प्रदेश कोण — केवल सटीक" : "Madhya Pradesh Angle — Precise Only", emoji: "📍" },
        { num: 7, title: hi ? "शब्द सीमा — क्या छूटे, क्या नहीं" : "Word Limit Boundaries", emoji: "⏱️" },
        { num: 8, title: hi ? "वैल्यू-ऐड औज़ार" : "Value-Add Tools", emoji: "✨" },
        { num: 9, title: hi ? "आगे क्या पढ़ें" : "What To Read Next", emoji: "📖" },
      ];

      const lines = text.split('\n');
      let currentSection: typeof sections[0] | null = null;
      let hasNumberedSections = false;

      for (let line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if line starts with a number 1-9 without stripping Hindi/Devnagari letters
        const headingMatch = trimmedLine.match(/^(?:###\s+|#+\s+|\*\*)?([1-9])[\s\.\)\]\-~•\s]*(.*)$/);

        if (headingMatch) {
          const num = parseInt(headingMatch[1], 10);
          let title = headingMatch[2].replace(/\*/g, '').trim(); // aggressively clean all stars
          
          // Strip any leading emoji / symbol from the parsed title
          title = title.replace(/^[\p{Emoji}\p{Symbol}\s\u200d\ufe0f]+/gu, '').trim();
          
          const standard = standardHeadings.find(h => h.num === num);

          currentSection = {
            number: num,
            title: title || (standard ? standard.title : `Point ${num}`),
            emoji: standard ? standard.emoji : "💡",
            content: []
          };
          sections.push(currentSection);
          hasNumberedSections = true;
        } else {
          if (currentSection) {
            currentSection.content.push(trimmedLine);
          }
        }
      }

      if (hasCa) {
        const caPoints: string[] = [];
        caData.forEach((d: string) => caPoints.push(`**${hi ? 'नवीनतम डेटा' : 'Data & Facts'}:** ${d}`));
        caReports.forEach((r: string) => caPoints.push(`**${hi ? 'रिपोर्ट/समिति/विचारक' : 'Reports & Frameworks'}:** ${r}`));
        caSdgs.forEach((s: string) => caPoints.push(`**${hi ? 'अनिवार्य SDG' : 'Mandatory SDG'}:** ${s}`));
        caArticles.forEach((a: string) => caPoints.push(`**${hi ? 'अनुच्छेद/FR/DPSP' : 'Constitutional Article'}:** ${a}`));
        caAnchors.forEach((a: string) => caPoints.push(`**${hi ? 'SDG/संविधान अनुच्छेद' : 'SDGs & Constitution'}:** ${a}`));
        caMpCases.forEach((c: string) => caPoints.push(`**${hi ? 'राष्ट्रीय/क्षेत्रीय विशेष' : 'National/Regional Cases'}:** ${c}`));
        caCaseStudies.forEach((c: string) => caPoints.push(`**${hi ? 'केस स्टडी' : 'Case Study'}:** ${c}`));
        if (caIntro) caPoints.push(`**${hi ? 'भूमिका' : 'Intro Hook'}:** ${caIntro}`);
        if (caConclusion) caPoints.push(`**${hi ? 'निष्कर्ष' : 'Conclusion'}:** ${caConclusion}`);
        
        sections.push({
          number: sections.length + 1,
          title: hi ? "करंट अफेयर्स व वैल्यू एडिशन" : "Current Affairs & Value Add",
          emoji: "✨",
          content: caPoints
        });
      }

      return { sections, hasNumberedSections: hasNumberedSections || hasCa };
    };

    const { sections, hasNumberedSections } = parseMainsExpertTips(safeInsightsText);

    if (hasNumberedSections) {
      return (
        <div className="space-y-4 mt-2 pl-0.5 text-left w-full">
          {/* 9 Points alternative colors cards layout */}
          <div className="grid grid-cols-1 gap-4 w-full">
            {sections.map((sec, idx) => {
              const hue = ['pink', 'emerald', 'amber', 'sky'][idx % 4];
              
              const boxStyles = themeDeep ? {
                pink: 'border border-pink-500/25 bg-pink-950/15 text-pink-100 shadow-md shadow-pink-950/10 hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-0.5',
                emerald: 'border border-emerald-500/25 bg-emerald-950/15 text-emerald-100 shadow-md shadow-emerald-950/10 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5',
                amber: 'border border-amber-500/25 bg-amber-950/15 text-amber-50 shadow-md shadow-amber-950/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5',
                sky: 'border border-sky-500/25 bg-sky-950/15 text-sky-100 shadow-md shadow-sky-950/10 hover:border-sky-500/40 transition-all duration-300 hover:-translate-y-0.5',
              }[hue] : {
                pink: 'border border-pink-200/80 bg-pink-50/40 text-pink-900 shadow-sm hover:bg-pink-50/80 transition-all duration-300 hover:-translate-y-0.5',
                emerald: 'border border-emerald-200/80 bg-emerald-50/40 text-emerald-900 shadow-sm hover:bg-emerald-50/80 transition-all duration-300 hover:-translate-y-0.5',
                amber: 'border border-amber-200/80 bg-amber-50/40 text-amber-950 shadow-sm hover:bg-amber-50/80 transition-all duration-300 hover:-translate-y-0.5',
                sky: 'border border-sky-200/80 bg-sky-50/40 text-sky-900 shadow-sm hover:bg-sky-50/80 transition-all duration-300 hover:-translate-y-0.5',
              }[hue];

              const badgeStyles = themeDeep ? {
                pink: 'border-b-[3px] border-r border-pink-400 bg-pink-950 text-pink-300 font-extrabold shadow-[0_4px_12px_rgba(236,72,153,0.4)] ring-1 ring-white/10',
                emerald: 'border-b-[3px] border-r border-emerald-400 bg-emerald-950 text-emerald-300 font-extrabold shadow-[0_4px_12px_rgba(16,185,129,0.4)] ring-1 ring-white/10',
                amber: 'border-b-[3px] border-r border-amber-400 bg-amber-950 text-amber-300 font-extrabold shadow-[0_4px_12px_rgba(245,158,11,0.4)] ring-1 ring-white/10',
                sky: 'border-b-[3px] border-r border-sky-400 bg-sky-950 text-sky-300 font-extrabold shadow-[0_4px_12px_rgba(14,165,233,0.4)] ring-1 ring-white/10',
              }[hue] : {
                pink: 'border-b-[3px] border-r border-pink-500 bg-gradient-to-r from-pink-500/20 to-pink-500/10 text-pink-950 font-black shadow-[0_4px_12px_rgba(236,72,153,0.3)] ring-1 ring-white/60',
                emerald: 'border-b-[3px] border-r border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-950 font-black shadow-[0_4px_12px_rgba(16,185,129,0.3)] ring-1 ring-white/60',
                amber: 'border-b-[3px] border-r border-amber-500 bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-950 font-black shadow-[0_4px_12px_rgba(245,158,11,0.3)] ring-1 ring-white/60',
                sky: 'border-b-[3px] border-r border-sky-500 bg-gradient-to-r from-sky-500/20 to-sky-500/10 text-sky-950 font-black shadow-[0_4px_12px_rgba(14,165,233,0.3)] ring-1 ring-white/60',
              }[hue];

              return (
                <div
                  key={`${sec.number}-${idx}`}
                  className={cn(
                    'rounded-[1.25rem] p-3.5 sm:p-4 space-y-4 relative',
                    boxStyles,
                    (sec.title.includes('Current Affairs') || sec.title.includes('करंट अफेयर्स')) ? 'mt-4' : ''
                  )}
                >
                  {/* NEW CA BADGE for legacy renderer */}
                  {(sec.title.includes('Current Affairs') || sec.title.includes('करंट अफेयर्स')) && (
                    <div className="absolute -top-3.5 right-2 sm:-top-3 sm:-right-3 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-green-600 border-[2px] border-white dark:border-slate-900 px-3 py-1 text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest shadow-lg z-10">
                      {sec.title.includes('करंट अफेयर्स') ? 'नया अपडेट ✨' : 'NEW UPDATE ✨'}
                    </div>
                  )}

                  {/* 3D Premium Badge & Title */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13px] tracking-wide', badgeStyles)}>
                      <span className="text-[14px]">{sec.emoji}</span>
                      <span>{sec.number}. {sec.title}</span>
                    </span>
                    {(sec.title.includes('Current Affairs') || sec.title.includes('करंट अफेयर्स')) && (
                      <span className={cn(
                        "text-[10px] font-bold italic ml-1",
                        themeDeep ? "text-slate-400" : "text-slate-500"
                      )}>
                        ({hi ? '7 व 10 मार्कर के लिए अत्यधिक उपयोगी' : 'Highly useful for 7 & 10 markers'})
                      </span>
                    )}
                  </div>

                  {/* Bullet Points with tight left alignment & alternating colorful dots */}
                  <ul className="space-y-4 pl-0">
                    {sec.content.map((point, pIdx) => {
                      const cleanedPoint = point.replace(/\*/g, '').replace(/^[\s:*•\-~]+/g, '').trim();
                      if (!cleanedPoint) return null;

                      const isExample = cleanedPoint.startsWith('उदाहरण:') || cleanedPoint.startsWith('Example:');
                      const isBoldLabel = cleanedPoint.match(/^([^:]+):(.*)$/);

                      const bulletDotColor = [
                        'bg-pink-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-sky-500',
                        'bg-purple-500',
                        'bg-rose-500',
                        'bg-indigo-500',
                      ][pIdx % 7];
                      
                      return (
                        <li key={pIdx} className="flex items-start gap-2.5 text-[14.5px] sm:text-[15.5px] leading-relaxed px-1 sm:px-1.5">
                          <span className={cn(
                            'mt-2.5 size-2 shrink-0 rounded-full inline-block',
                            bulletDotColor
                          )} />
                          <span className={cn(
                            themeDeep ? 'text-slate-200' : 'text-slate-800',
                            'font-semibold flex-1 min-w-0'
                          )}>
                            {isExample ? (
                              <span className="block mt-1">
                                <span className={cn(
                                  'font-black rounded px-2 py-0.5 text-[12px] uppercase mr-2 inline-block shadow-sm',
                                  themeDeep ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35' : 'bg-amber-100 text-amber-900 border border-amber-200'
                                )}>
                                  {hi ? 'उदाहरण:' : 'Example:'}
                                </span>
                                <span className="italic font-bold">{cleanedPoint.replace(/^(?:उदाहरण:|Example:)\s*/, '')}</span>
                              </span>
                            ) : isBoldLabel ? (
                              <span>
                                <strong className={cn(
                                  themeDeep ? 'text-slate-100' : 'text-slate-900',
                                  // Add squiggly logic for all sections
                                  (() => {
                                    const l = isBoldLabel[1].toLowerCase();
                                    if (l.includes('भूमिका') || l.includes('intro')) return 'underline decoration-wavy decoration-pink-500/80 underline-offset-[3px]';
                                    if (l.includes('निष्कर्ष') || l.includes('conclusion')) return 'underline decoration-wavy decoration-indigo-500/80 underline-offset-[3px]';
                                    if (l.includes('डेटा') || l.includes('data') || l.includes('facts')) return 'underline decoration-wavy decoration-emerald-500/80 underline-offset-[3px]';
                                    if (l.includes('रिपोर्ट') || l.includes('समिति') || l.includes('reports') || l.includes('framework')) return 'underline decoration-wavy decoration-sky-500/80 underline-offset-[3px]';
                                    if (l.includes('sdg') || l.includes('संविधान') || l.includes('अनुच्छेद') || l.includes('article') || l.includes('dpsp')) return 'underline decoration-wavy decoration-amber-500/80 underline-offset-[3px]';
                                    if (l.includes('म.प्र.') || l.includes('mp') || l.includes('योजना')) return 'underline decoration-wavy decoration-purple-500/80 underline-offset-[3px]';
                                    if (l.includes('केस स्टडी') || l.includes('case study')) return 'underline decoration-wavy decoration-fuchsia-500/80 underline-offset-[3px]';
                                    return '';
                                  })()
                                )}>{isBoldLabel[1]}:</strong>
                                {isBoldLabel[2]}
                              </span>
                            ) : (
                              cleanedPoint
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      );
    }


    return (
      <div className="space-y-3.5 mt-3 pl-1 text-left">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest shadow-md',
            themeDeep
              ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>{hi ? 'एक्सपर्ट टिप्स' : 'Expert Tips'}</span>
        </div>
        <p className="text-[15.5px] leading-[1.7] text-slate-800 dark:text-slate-100 font-semibold whitespace-pre-line pl-1">
          {rawCleaned}
        </p>
      </div>
    );
  }

  // Helper to extract bilingual fields safely
  const getField = (base: string) => {
    const fieldHi = explanation[`${base}_hi`] || explanation[base];
    const fieldEn = explanation[`${base}_en`] || explanation[base];
    const raw = hi ? fieldHi : fieldEn;
    return cleanText(raw);
  };

  const topic = getField('topic_micro_mapping');
  const conceptual = getField('conceptual_depth');
  const inter = getField('interdisciplinary_link');
  const elim = getField('elimination_strategy');
  const trend = getField('historical_trend');
  const mnemonic = getField('memory_mnemonic');
  const source = getField('ncert_reference') || getField('source');
  const mains = getField('mains_application');
  const mantra = getField('toppers_mantra');

  const items = [
    {
      key: 'conceptual_depth',
      label: hi ? 'संकल्पनात्मक केंद्र' : 'Conceptual Core',
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
      content: conceptual,
      theme: 'amber' as const,
    },
    {
      key: 'interdisciplinary_link',
      label: hi ? 'अंतःविषय कड़ी' : 'Interdisciplinary Link',
      icon: <Link2 className="h-4 w-4 shrink-0" />,
      content: inter,
      theme: 'sky' as const,
    },
    {
      key: 'elimination_strategy',
      label: hi ? 'एलिमिनेशन रणनीति' : 'Elimination Strategy',
      icon: <Zap className="h-4 w-4 shrink-0" />,
      content: elim,
      theme: 'pink' as const,
    },
    {
      key: 'historical_trend',
      label: hi ? 'अनुभवी की सूझ' : 'Historical Trend',
      icon: <TrendingUp className="h-4 w-4 shrink-0" />,
      content: trend,
      theme: 'rose' as const,
    },
    {
      key: 'memory_mnemonic',
      label: hi ? 'स्मरण भंडार (निमोनिक)' : 'Memory Mnemonic',
      icon: <Brain className="h-4 w-4 shrink-0" />,
      content: mnemonic,
      theme: 'indigo' as const,
    },
    {
      key: 'ncert_reference',
      label: hi ? 'एनसीईआरटी व संदर्भ' : 'NCERT & Reference',
      icon: <Bookmark className="h-4 w-4 shrink-0" />,
      content: source,
      theme: 'slate' as const,
    },
    {
      key: 'mains_application',
      label: hi ? 'मुख्य परीक्षा अनुप्रयोग' : 'Mains Application',
      icon: <PenTool className="h-4 w-4 shrink-0" />,
      content: mains,
      theme: 'purple' as const,
    },
    {
      key: 'toppers_mantra',
      label: hi ? 'टॉपर का मंत्र' : 'Topper\'s Mantra',
      icon: <Trophy className="h-4 w-4 shrink-0" />,
      content: mantra,
      theme: 'gold' as const,
    },
  ].filter((item) => item.content.length > 0);

  return (
    <div className="space-y-8 mt-6 pl-1 text-left">
      {/* 🌟 Value Addition Kit Section */}
      {hasCa && (
        <div className="space-y-4 rounded-[1.25rem] border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 p-5 shadow-sm relative mt-4">
          <div className="absolute -top-3.5 right-2 sm:-top-3 sm:-right-3 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-green-600 border-[2px] border-white dark:border-slate-900 px-3 py-1 text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
            {hi ? 'नया अपडेट ✨' : 'NEW UPDATE ✨'}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              {hi ? 'करंट अफेयर्स व वैल्यू एडिशन' : 'Current Affairs & Value Add'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-300/80 italic ml-1">
              ({hi ? '7 व 10 मार्कर के लिए अत्यधिक उपयोगी' : 'Highly useful for 7 & 10 markers'})
            </span>
          </div>
          
          {caData && caData.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-emerald-500/80 underline-offset-[3px]">
                {hi ? 'नवीनतम डेटा व तथ्य' : 'Data & Facts'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caData.map((d: string, i: number) => <li key={i}><span className="relative -left-1">{d}</span></li>)}
              </ul>
            </div>
          )}

          {caReports && caReports.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-sky-500/80 underline-offset-[3px]">
                {hi ? 'समितियां व रिपोर्ट' : 'Reports & Frameworks'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caReports.map((r: string, i: number) => <li key={i}><span className="relative -left-1">{r}</span></li>)}
              </ul>
            </div>
          )}

          {caSdgs && caSdgs.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-amber-500/80 underline-offset-[3px]">
                {hi ? 'अनिवार्य SDGs' : 'Mandatory SDGs'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caSdgs.map((s: string, i: number) => <li key={i}><span className="relative -left-1">{s}</span></li>)}
              </ul>
            </div>
          )}

          {caArticles && caArticles.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-rose-500/80 underline-offset-[3px]">
                {hi ? 'अनुच्छेद / FR / DPSP' : 'Articles / FR / DPSP'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caArticles.map((s: string, i: number) => <li key={i}><span className="relative -left-1">{s}</span></li>)}
              </ul>
            </div>
          )}

          {caAnchors && caAnchors.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-orange-500/80 underline-offset-[3px]">
                {hi ? 'SDGs / संविधान अनुच्छेद' : 'SDGs & Constitution'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caAnchors.map((s: string, i: number) => <li key={i}><span className="relative -left-1">{s}</span></li>)}
              </ul>
            </div>
          )}

          {caMpCases && caMpCases.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-purple-500/80 underline-offset-[3px]">
                {hi ? 'राष्ट्रीय/क्षेत्रीय विशेष योजनाएं' : 'National/Regional Specific Schemes'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caMpCases.map((c: string, i: number) => <li key={i}><span className="relative -left-1">{c}</span></li>)}
              </ul>
            </div>
          )}

          {caCaseStudies && caCaseStudies.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-fuchsia-500/80 underline-offset-[3px]">
                {hi ? 'केस स्टडी' : 'Case Studies'}
              </span>
              <ul className="list-disc list-outside ml-4 text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 space-y-1 mt-1">
                {caCaseStudies.map((c: string, i: number) => <li key={i}><span className="relative -left-1">{c}</span></li>)}
              </ul>
            </div>
          )}

          {caIntro && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-pink-500/80 underline-offset-[3px]">
                {hi ? 'प्रस्तावना (Intro)' : 'Intro Hook'}
              </span>
              <p className="text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {caIntro}
              </p>
            </div>
          )}

          {caConclusion && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 underline decoration-wavy decoration-indigo-500/80 underline-offset-[3px]">
                {hi ? 'निष्कर्ष (Conclusion)' : 'Conclusion'}
              </span>
              <p className="text-[14.5px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {caConclusion}
              </p>
            </div>
          )}


          
          {caKeywords && Array.isArray(caKeywords) && caKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-emerald-500/20">
              {caKeywords.map((kw: string, i: number) => (
                <span key={i} className="inline-block rounded-md bg-white/60 dark:bg-slate-900/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[10px] font-bold text-emerald-900 dark:text-emerald-300 shadow-sm">
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. Topic Micro-Mapping */}
      {topic && (
        <div className="space-y-3">
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border-2 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest shadow-md',
                themeDeep
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              )}
            >
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>{hi ? 'टॉपिक माइक्रो-मैपिंग' : 'Topic Micro-Mapping'}</span>
            </div>
          </div>
          <p className="text-[15.5px] leading-[1.7] font-bold text-slate-900 dark:text-slate-100 pl-1">
            {topic}
          </p>
        </div>
      )}

      {/* Render each of the remaining fields */}
      {items.map((it) => {
        // Precise alternative background and border-2 colors mapping perfectly to card hues
        const badgeClasses = {
          amber: themeDeep
            ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
            : 'border-amber-300 bg-amber-50 text-amber-800',
          sky: themeDeep
            ? 'border-sky-500/40 bg-sky-950/40 text-sky-300'
            : 'border-sky-300 bg-sky-50 text-sky-800',
          pink: themeDeep
            ? 'border-pink-500/40 bg-pink-950/40 text-pink-300'
            : 'border-pink-300 bg-pink-50 text-pink-800',
          rose: themeDeep
            ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
            : 'border-rose-300 bg-rose-50 text-rose-800',
          indigo: themeDeep
            ? 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300'
            : 'border-indigo-300 bg-indigo-50 text-indigo-800',
          slate: themeDeep
            ? 'border-slate-600 bg-slate-900/60 text-slate-300'
            : 'border-slate-300 bg-slate-50 text-slate-700',
          purple: themeDeep
            ? 'border-purple-500/40 bg-purple-950/40 text-purple-300'
            : 'border-purple-300 bg-purple-50 text-purple-800',
          gold: themeDeep
            ? 'border-amber-400/40 bg-amber-950/60 text-amber-200'
            : 'border-amber-400 bg-amber-50/90 text-amber-900',
        }[it.theme];

        const isMantra = it.key === 'toppers_mantra';
        const isInter = it.key === 'interdisciplinary_link';

        return (
          <div key={it.key} className="space-y-3">
            {/* Themed capsule border-2 box heading */}
            <div>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border-2 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest shadow-md',
                  badgeClasses
                )}
              >
                {it.icon}
                <span>{it.label}</span>
              </div>
            </div>

            {/* Content text directly below the heading box */}
            <p
              className={cn(
                'text-[15.5px] leading-[1.7] pl-1',
                isMantra
                  ? 'font-bold text-slate-900 dark:text-slate-50 text-[16px]'
                  : isInter
                    ? 'font-semibold italic text-slate-700 dark:text-slate-300'
                    : 'font-semibold text-slate-800 dark:text-slate-100'
              )}
            >
              {it.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
