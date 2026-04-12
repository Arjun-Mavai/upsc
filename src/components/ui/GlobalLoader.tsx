'use client';

// Explicit re-export so bundlers (e.g. Turbopack) always see a real `GlobalLoader` named export.
import { PYQFactsLoader } from '@/components/ui/PYQFactsLoader';

export const GlobalLoader = PYQFactsLoader;
export default PYQFactsLoader;
