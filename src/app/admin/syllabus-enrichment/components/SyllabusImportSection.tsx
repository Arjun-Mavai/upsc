import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SyllabusImportSectionProps {
  adminKey: string;
  setAdminKey: (k: string) => void;
  targetUnit: string;
  setTargetUnit: (u: string) => void;
  targetTopic: string;
  setTargetTopic: (t: string) => void;
  importJson: string;
  setImportJson: (j: string) => void;
  isUploading: boolean;
  handleUpload: () => void;
  units: Record<string, any>;
  unitKeys: string[];
}

export function SyllabusImportSection({
  adminKey,
  setAdminKey,
  targetUnit,
  setTargetUnit,
  targetTopic,
  setTargetTopic,
  importJson,
  setImportJson,
  isUploading,
  handleUpload,
  units,
  unitKeys,
}: SyllabusImportSectionProps) {
  return (
    <section className="space-y-6 border-t border-slate-200 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          3
        </span>
        <h2 className="text-2xl font-bold text-slate-800">Import AI Content</h2>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Admin Secret Key</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              placeholder="Enter the backend admin secret..."
            />
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3"/> Required for importing or deleting.
            </p>
          </div>

          {/* Specific Target Selection */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Upload Target
              </label>
              {targetTopic !== 'auto' && (
                <button onClick={() => setTargetTopic('auto')} className="text-xs text-indigo-600 hover:underline font-bold">Reset to Auto</button>
              )}
            </div>
            
            <div className="flex gap-2">
              <select 
                value={targetUnit}
                onChange={(e) => {
                  setTargetUnit(e.target.value);
                  setTargetTopic('auto'); // Reset topic when unit changes
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="auto">Auto-detect (Array Mode)</option>
                {unitKeys.map(u => (
                  <option key={u} value={u}>{u.replace('_', ' ')}</option>
                ))}
              </select>

              {targetUnit !== 'auto' && (
                <select 
                  value={targetTopic}
                  onChange={(e) => setTargetTopic(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="auto">Select a topic...</option>
                  {units[targetUnit]?.topics.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.hasAiContent ? '✅ ' : '⏳ '} 
                      {t.topic_title.substring(0, 30)}{t.topic_title.length > 30 ? '...' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <p className="text-[10px] text-slate-500 leading-tight">
              {targetTopic !== 'auto' 
                ? "Target locked! You can now paste just the content object (without ID). The system will map it to this specific topic."
                : "Auto Mode: Paste the full JSON array from ChatGPT. The system will automatically map IDs."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Paste AI JSON Output</label>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="h-[300px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-xs transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            placeholder={targetTopic !== 'auto' ? '{\n  "content_hindi": { ... },\n  "content_english": { ... }\n}' : '[ { "id": "...", "content_hindi": { ... } } ]'}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto text-white shadow-lg shadow-emerald-600/20"
        >
          {isUploading ? 'Uploading & Updating DB...' : (targetTopic !== 'auto' ? 'Push Individual Topic to DB' : 'Push Batch to Database')}
        </Button>
      </div>
    </section>
  );
}
