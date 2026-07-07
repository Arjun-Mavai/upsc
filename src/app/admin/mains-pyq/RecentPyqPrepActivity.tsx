'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGetRecentMainsPyqActivity } from '@/actions/mains-pyq-prepared-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ChevronDown, ChevronUp, Clock, FileJson } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentPyqPrepActivity() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: ['admin-mains-pyq-recent-activity'],
    queryFn: async () => {
      const r = await adminGetRecentMainsPyqActivity();
      if (!r.success) throw new Error(r.error || 'Failed to fetch activity');
      return r.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="border-amber-100 bg-white shadow-sm overflow-hidden transition-all duration-300 mb-6">
      <div 
        className="bg-amber-50/50 px-4 py-3 border-b border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-600">
            <History className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">Recent PYQ Activity</h3>
              {isOpen ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4 text-amber-400" />}
            </div>
            <p className="text-[10px] font-bold text-amber-600/60 uppercase">Track recent model answer batch saves</p>
          </div>
        </div>
        {!loading && activities.length > 0 && activities[0].updatedAt && (
          <Badge variant="outline" className="text-[10px] font-black border-amber-200 text-amber-700 bg-amber-100">
            Last: {formatDistanceToNow(new Date(activities[0].updatedAt))} ago
          </Badge>
        )}
      </div>

      {isOpen && (
        <div className="p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {loading ? (
            <p className="text-xs text-amber-500 animate-pulse font-bold uppercase">Loading activity feed...</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-amber-500 font-bold uppercase">No recent activity found.</p>
          ) : (
            <div className="grid gap-2">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-amber-100 transition-all group">
                  <div className="p-2 rounded-lg bg-white border border-slate-100 group-hover:border-amber-200">
                    <FileJson className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-600 text-[9px] font-black h-4 text-white border-none">{a.examYear}</Badge>
                        <Badge variant="outline" className="text-[9px] font-black h-4 border-amber-200 text-amber-700">Paper {a.paperNumber}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 text-[8px] font-black h-4 border-none">Slot {a.variantSlot}</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {a.updatedAt ? formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true }) : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate">{a.questionEn || a.questionHi}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                      Batch saved on {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) : 'N/A'}
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
