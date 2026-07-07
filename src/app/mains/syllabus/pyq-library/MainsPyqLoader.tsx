'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Hourglass } from 'lucide-react';

const HI_QUOTES = [
  '✍️ **मेंस मूलमंत्र:** 2 अंक वाले प्रश्नों में सीधा सटीक उत्तर लिखें, किसी भी प्रकार की भूमिका (intro) बनाने से बचें।',
  '⏱️ **टाइम मैनेजमेंट:** GS I-III में 7-mark प्रश्नों को 7-8 मिनट और 10-mark प्रश्नों को 11-12 मिनट में पूरा करने का अभ्यास करें।',
  '🗺️ **भूगोल टिप:** प्राकृतिक भूगोल या MP के भूगोल के उत्तरों में एक छोटा रफ मैप या स्कीमेटिक डायग्राम 1 से 1.5 अंक बढ़ा सकता है!',
  '📜 **इतिहास रणनीति:** प्राचीन व मध्यकालीन इतिहास में शासकों के नाम के साथ उनके समकालीन साहित्यिक स्रोतों या अभिलेखों का संदर्भ दें।',
  '⚖️ **राजव्यवस्था (Polity):** उत्तर की प्रामाणिकता बढ़ाने के लिए महत्वपूर्ण अनुच्छेदों (Articles) और सुप्रीम कोर्ट के निर्णयों का उल्लेख करें।',
  '💡 **एथिक्स (Paper 4):** दार्शनिकों के सिद्धांतों को प्रशासनिक निर्णयों और वास्तविक जीवन की केस स्टडीज से जोड़कर लिखें।',
  '🌾 **MP अर्थव्यवस्था:** मध्य प्रदेश की कृषि योजनाओं (जैसे बलराम ताल योजना) और नवीनतम आर्थिक सर्वेक्षण के आंकड़ों का प्रयोग करें।',
  '⚙️ **प्रारूप लेखन (Paper 6):** शासकीय पत्र, अर्धशासकीय पत्र और प्रतिवेदन के सटीक फॉर्मेट का बार-बार अभ्यास करें, यह अत्यंत स्कोरिंग है।',
  '📝 **निबंध लेखन:** निबंध की शुरुआत किसी प्रासंगिक कविता, संस्कृत श्लोक या महान व्यक्तित्व के कथन से करें।',
  '🧠 **विश्लेषण क्षमता:** मुख्य परीक्षा में केवल रटने से काम नहीं चलता, विषयों के अंतर्संबंध (Interlinking) और गहरी समझ का महत्व है।',
  '🔥 **धैर्य रखें:** डिप्टी कलेक्टर वाली फीलिंग लोडिंग पर है... आपकी आज की मेहनत ही कल का परिणाम तय करेगी!'
];

const EN_QUOTES = [
  '✍️ **Mains Golden Rule:** Write direct, precise answers for 2-mark questions. Avoid writing unnecessary introductions.',
  '⏱️ **Time Management:** Practice completing 7-mark questions in 7-8 minutes and 10-mark questions in 11-12 minutes.',
  '🗺️ **Geography Tip:** Drawing a quick rough map or a schematic diagram in Geography questions can fetch you an extra 1-1.5 marks!',
  '📜 **History Strategy:** Always back your historical arguments with references to contemporary literary sources or inscriptions.',
  '⚖️ **Polity Boost:** Integrate relevant Constitutional Articles and landmark Supreme Court judgements to make your answers authoritative.',
  '💡 **Ethics (Paper 4):** Connect philosophical concepts directly to administrative decision-making and practical case scenarios.',
  '🌾 **MP Economy:** Quote authentic statistics from the latest MP Economic Survey and name-drop state agriculture schemes.',
  '⚙️ **Drafting (Paper 6):** Memorize and practice the exact layout of official letters, demi-official letters, and secretarial memos.',
  '📝 **Essay Strategy:** Begin your essay with a powerful quote, a relevant poem, or a philosophical statement to grab the examiner\'s eye.',
  '🧠 **Analyze & Connect:** Rote memorization fails in Mains. Develop the ability to link different syllabus topics analytically.',
  '🔥 **Keep Believing:** Your Deputy Collector feeling is loading... Consistency in answer writing separates the selected from the rest!'
];

interface MainsPyqLoaderProps {
  hi: boolean;
  themeDeep: boolean;
}

export function MainsPyqLoader({ hi, themeDeep }: MainsPyqLoaderProps) {
  const quotes = hi ? HI_QUOTES : EN_QUOTES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Shuffle or select a random start index
    setIndex(Math.floor(Math.random() * quotes.length));
  }, [quotes.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Helper to parse simple markdown bold **text** into JSX
  const formatQuote = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className={themeDeep ? 'text-amber-300 font-extrabold' : 'text-amber-600 font-extrabold'}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div 
      className={`relative mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[2.25rem] border p-8 text-center transition-all duration-300 sm:rounded-[2.5rem] sm:p-12 shadow-xl ${
        themeDeep 
          ? 'border-slate-800 bg-[#090e18]/80 text-slate-100 shadow-black/40' 
          : 'border-slate-200/80 bg-white text-slate-900 shadow-slate-200/50'
      }`}
    >
      {/* Premium Ambient Light behind Loader */}
      <div className={`pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full blur-3xl opacity-20 ${
        themeDeep ? 'bg-amber-500' : 'bg-amber-300'
      }`} />
      
      {/* Spinner & Icons Group */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Glowing Pulsing Ring */}
        <div className={`absolute inset-0 animate-pulse rounded-full opacity-10 ${
          themeDeep ? 'bg-amber-400' : 'bg-amber-600'
        }`} />
        
        {/* Dynamic Rotation Spinner */}
        <div className={`h-16 w-16 animate-spin rounded-full border-4 border-t-transparent ${
          themeDeep 
            ? 'border-amber-500/20 border-t-amber-400' 
            : 'border-slate-100 border-t-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.15)]'
        }`} />
        
        {/* Floating Icons Inside */}
        <div className="absolute flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index % 3}
              initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.5 }}
            >
              {index % 3 === 0 && <Trophy className="h-6 w-6 text-amber-500" />}
              {index % 3 === 1 && <Sparkles className="h-6 w-6 text-amber-500" />}
              {index % 3 === 2 && <Hourglass className="h-6 w-6 text-amber-500" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Loading Status Text */}
      <p className={`mt-6 text-xs font-black tracking-[0.25em] uppercase ${
        themeDeep ? 'text-amber-400/90' : 'text-amber-600'
      }`}>
        {hi ? 'मेंस ज्ञानकोश विश्लेषण...' : 'Analyzing Mains Database...'}
      </p>

      {/* Beautiful Quotes Board */}
      <div className="mt-6 min-h-[70px] w-full flex items-center justify-center px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`max-w-xl text-sm sm:text-base leading-relaxed font-bold ${
              themeDeep ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {formatQuote(quotes[index] || '')}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modern Horizontal Line Indicator */}
      <div className={`mt-8 h-1 w-24 overflow-hidden rounded-full ${
        themeDeep ? 'bg-slate-800' : 'bg-slate-100'
      }`}>
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'easeInOut'
          }}
          className="h-full w-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
}
