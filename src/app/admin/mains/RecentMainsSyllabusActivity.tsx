'use client';

import { useState, useEffect } from 'react';
import { adminGetRecentMainsActivity } from '@/actions/mains-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentMainsSyllabusActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const r = await adminGetRecentMainsActivity();
      if (r.success) setActivities(r.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Card className="border-indigo-100 bg-white shadow-sm overflow-hidden transition-all duration-300">
      <div 
        className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-800">
            <History className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Syllabus Activity</h3>
              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Track recent expert content uploads</p>
          </div>
        </div>
        {!loading && activities.length > 0 && (
          <Badge variant="outline" className="text-[10px] font-black border-indigo-200 text-indigo-700 bg-indigo-50">
            Last: {formatDistanceToNow(new Date(activities[0].updatedAt))} ago
          </Badge>
        )}
      </div>

      {isOpen && (
        <div className="p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {loading ? (
            <p className="text-xs text-slate-500 animate-pulse font-bold uppercase">Loading activity feed...</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-slate-500 font-bold uppercase">No recent activity found.</p>
          ) : (
            <div className="grid gap-2">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-100 transition-all group">
                  <div className="p-2 rounded-lg bg-white border border-slate-100 group-hover:border-indigo-200">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-900 text-[9px] font-black h-4">Paper {a.paperNumber}</Badge>
                        <Badge variant="outline" className="text-[9px] font-black h-4">Unit {a.unitNumber}{a.unitPart}</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate">{a.topicTitleEn || a.topicTitleHi}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                      Updated on {new Date(a.updatedAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
