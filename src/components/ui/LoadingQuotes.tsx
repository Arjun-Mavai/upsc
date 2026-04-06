'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// UPSC related facts + motivation - loading ke time user ko engage rakho
const QUOTES = [
  // --- Geography & Environment ---
  '🗺️ India has **28 States** and **8 Union Territories** after 2019 reorganization.',
  '⛰️ India\'s highest peak: **Kangchenjunga (8,586m)** in Sikkim.',
  '🌊 Longest river: **Ganga (2,525 km)**, Largest delta: **Sundarbans**.',

  // --- Polity Fundamentals ---
  '📜 Constitution has **22 Parts**, **12 Schedules**, and **448 Articles** currently.',
  '⚖️ Supreme Court: **34 judges** (1 CJI + 33). High Courts: **25** across India.',
  '🗳️ Lok Sabha: **543 elected seats**, Rajya Sabha: **245 members**.',

  // --- Exam Strategy ---
  '💡 Pro Tip: UPSC Prelims has **Negative Marking** — 1/3rd for wrong answers!',
  '📚 Current Affairs from last **12-18 months** is crucial for Prelims.',
  '⏳ Loading... Tab tak socho: **Article 370** ka current status kya h?',

  // --- History & Culture ---
  '🏛️ UNESCO World Heritage Sites in India: **42** (34 Cultural + 7 Natural + 1 Mixed).',
  '🎭 Classical dances: Bharatanatyam, Kathak, Kathakali, Kuchipudi, Odissi, Manipuri, Mohiniyattam, Sattriya.',
  '📿 **Ajanta Caves**: Buddhist, **Ellora Caves**: Buddhist + Hindu + Jain.',

  // --- Economy & Current ---
  '💰 India is **5th largest economy** by nominal GDP (2024).',
  '🌾 Green Revolution crops: Wheat & Rice. White Revolution: Milk (Operation Flood).',

  // --- Motivation ---
  '📊 Result calculate ho rahi h... asli competition tumhara khud se h.',
  '🔥 Sabr rakho, **IAS/IPS** wali feeling loading par h...',
  '🏆 Consistency matters! Daily PYQ practice tumhe topper banayega.',
];

export function LoadingQuotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700"></div>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-sm text-base font-medium text-slate-500 sm:text-lg"
        >
          {QUOTES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
