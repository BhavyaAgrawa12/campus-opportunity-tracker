import React from 'react';

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
    <div className="bg-surface-container-low border border-hairline rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-container/20 text-primary border border-primary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">timer</span>
          </div>
          <div>
            <h3 className="font-headline-md text-body-md font-bold text-on-surface">
              Upcoming Deadlines
            </h3>
            <p className="font-mono-micro text-mono-micro text-outline">
              Expiring opportunities radar
            </p>
          </div>
        </div>
        <span className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-high text-primary">
          RADAR
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center text-mono-micro text-outline text-[12px]">
          No deadlines approaching in the next 30 days.
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectOpportunity(item)}
              className="group p-2.5 rounded-lg border border-hairline hover:border-hairline/80 hover:bg-surface-container transition cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="pr-1 min-w-0">
                <p className="text-body-sm font-semibold text-on-surface group-hover:text-primary transition truncate">
                  {item.title}
                </p>
                <p className="font-mono-micro text-mono-micro text-on-surface-variant truncate mt-0.5">
                  {item.organization}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded font-mono-micro text-mono-micro font-bold ${
                    item.diffDays <= 2
                      ? 'bg-primary-container text-on-primary animate-pulse'
                      : item.diffDays <= 5
                      ? 'bg-primary-container/20 text-primary border border-primary-container/40'
                      : 'bg-surface-container-high text-on-surface-variant border border-hairline'
                  }`}
                >
                  {item.diffDays === 0
                    ? 'Today'
                    : `${item.diffDays}d left`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
