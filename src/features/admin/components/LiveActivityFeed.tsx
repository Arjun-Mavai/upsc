'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLiveActivity, ActivityEvent } from '@/actions/admin-activity';
import { 
  Zap, 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchActivity = async (isManual = false) => {
    if (isManual) setLoading(true);
    const data = await getLiveActivity();
    setEvents(data);
    setLoading(false);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchActivity();
    // Auto-refresh removed per user request for efficiency
  }, []);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
      <CardHeader 
        className="bg-slate-50/50 border-b border-slate-100 py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-700">
            <Zap className={cn("h-4 w-4 text-amber-500", !isCollapsed && "fill-amber-500")} />
            <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span>Live Activity</span>
              <span className="text-[10px] font-bold normal-case tracking-normal text-indigo-600">
                UPSC Civil Services
              </span>
            </span>
          </CardTitle>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-slate-400">
                {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fetchActivity(true);
              }} 
              className={cn("text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-white", loading && "animate-spin")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <div className="text-slate-400">
               {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide bg-white">
            {loading && events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Search className="h-6 w-6 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {events.map((event, idx) => (
                  <ActivityRow key={`${event.id}-${idx}`} event={event} />
                ))}
              </div>
            )}
          </CardContent>
          <div className="p-2 bg-slate-50/30 border-t border-slate-100 text-center">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               Latest 20 · UPSC-only · Manual refresh
             </p>
          </div>
        </>
      )}
    </Card>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const IconMap: Record<ActivityEvent['type'], LucideIcon> = {
    TEST_SUBMIT: CheckCircle2,
    GUEST_TEST: Zap,
    FEEDBACK: MessageSquare,
    SUPPORT: HelpCircle,
    PAYMENT: CreditCard,
  };

  const ColorMap: Record<ActivityEvent['type'], string> = {
    TEST_SUBMIT: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    GUEST_TEST: 'text-amber-500 bg-amber-50 border-amber-100',
    FEEDBACK: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    SUPPORT: 'text-rose-500 bg-rose-50 border-rose-100',
    PAYMENT: 'text-green-600 bg-green-50 border-green-100',
  };

  const Icon = IconMap[event.type] ?? Zap;
  const colorClass = ColorMap[event.type] ?? 'text-slate-500 bg-slate-50 border-slate-100';

  return (
    <div className="p-3 hover:bg-slate-50/50 transition-colors group">
      <div className="flex gap-3">
        {/* Left: Icon & Line */}
        <div className="flex flex-col items-center gap-1">
          <div className={cn("p-1.5 rounded-lg border", colorClass)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="w-0.5 flex-1 bg-slate-100 rounded-full group-last:hidden" />
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-black text-slate-800 truncate">
              {event.user}
            </p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <Clock className="h-2.5 w-2.5" />
              {formatTimeAgo(event.timestamp)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {event.detail}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-1.5 h-4 border-slate-200 text-slate-400">
              {event.type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date) {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}
