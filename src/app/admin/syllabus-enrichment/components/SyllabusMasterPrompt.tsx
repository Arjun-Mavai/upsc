import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { copyToClipboard } from './utils';

interface SyllabusMasterPromptProps {
  masterPrompt: string;
}

export function SyllabusMasterPrompt({ masterPrompt }: SyllabusMasterPromptProps) {
  return (
    <section className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          1
        </span>
        <h2 className="text-2xl font-bold text-slate-800">Master Prompt for AI</h2>
      </div>
      
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 mb-8 relative group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-indigo-900">Provide this to ChatGPT/Gemini before starting:</h3>
          <Button 
            onClick={() => copyToClipboard(masterPrompt, 'Master Prompt')}
            variant="outline" 
            size="sm" 
            className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Copy size={14} className="mr-2" /> Copy Master Prompt
          </Button>
        </div>
        <div className="relative">
          <pre className="text-[10px] font-mono text-indigo-800 bg-white p-4 rounded-xl border border-indigo-100 overflow-auto max-h-[200px] whitespace-pre-wrap">
            {masterPrompt}
          </pre>
        </div>
      </div>
    </section>
  );
}
