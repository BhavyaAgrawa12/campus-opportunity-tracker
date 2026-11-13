import React from 'react';
import { Clock, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

export default function DeadlineSidebar({ opportunities = [], onSelectOpportunity }) {
  // Filter and sort items with valid deadlines
  const upcoming = opportunities
    .filter((opp) => opp.deadline)
    .map((opp) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadDate = new Date(opp.deadline);
      deadDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...opp, diffDays };
    })
    .filter((opp) => opp.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
          <p className="text-[11px] text-slate-400">Act quickly before applications close</p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No deadlines approaching in the next 30 days.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectOpportunity(item)}
              className="group p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition cursor-pointer flex items-center justify-between"
            >
              <div className="pr-2 min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.organization}</p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.diffDays <= 3
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : item.diffDays <= 7
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.diffDays === 0 ? 'Today!' : `${item.diffDays}d left`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(item.deadline).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
