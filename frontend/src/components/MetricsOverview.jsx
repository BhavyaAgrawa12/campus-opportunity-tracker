import React from 'react';

export default function MetricsOverview({
  counts = {},
  activeCategory,
  onSelectCategory,
  statusFilter = 'live',
}) {
  const getCount = (liveVal, totalVal, expiredVal) => {
    if (statusFilter === 'live') return liveVal ?? totalVal ?? 0;
    if (statusFilter === 'expired') return expiredVal ?? 0;
    return totalVal ?? 0;
  };

  const cards = [
    {
      id: null,
      label: 'All Opportunities',
      count: getCount(counts.liveTotal, counts.total, counts.expiredTotal),
      icon: 'explore',
      color: 'text-secondary',
      accentBg: 'bg-secondary',
    },
    {
      id: 'hackathon',
      label: 'Hackathons',
      count: getCount(counts.liveHackathons, counts.hackathons, counts.expiredHackathons),
      icon: 'trophy',
      color: 'text-purple-400',
      accentBg: 'bg-purple-500',
    },
    {
      id: 'internship',
      label: 'Internships',
      count: getCount(counts.liveInternships, counts.internships, counts.expiredInternships),
      icon: 'auto_awesome',
      color: 'text-tertiary',
      accentBg: 'bg-tertiary',
    },
    {
      id: 'job',
      label: 'Full-time Jobs',
      count: getCount(counts.liveJobs, counts.jobs, counts.expiredJobs),
      icon: 'work',
      color: 'text-primary',
      accentBg: 'bg-primary-container',
    },
    {
      id: 'scholarship',
      label: 'Scholarships',
      count: getCount(counts.liveScholarships, counts.scholarships, counts.expiredScholarships),
      icon: 'school',
      color: 'text-amber-400',
      accentBg: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const isSelected =
          activeCategory === card.id || (!activeCategory && card.id === null);

        return (
          <button
            key={card.label}
            onClick={() => onSelectCategory(card.id)}
            className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
              isSelected
                ? 'bg-surface-container border-secondary/50 shadow-glow-secondary'
                : 'bg-surface-container-low hover:bg-surface-container border-hairline'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono-micro text-mono-micro uppercase tracking-wider text-on-surface-variant group-hover:text-on-surface transition">
                {card.label}
              </span>
              <span className={`material-symbols-outlined text-[18px] ${card.color}`}>
                {card.icon}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono-metric text-mono-metric font-bold text-on-surface">
                {card.count}
              </span>
              <span className="font-mono-micro text-mono-micro text-outline capitalize">
                {statusFilter}
              </span>
            </div>

            {/* Glowing Accent Indicator Stripe */}
            <div className="w-full bg-surface-container-highest h-0.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all ${card.accentBg} ${
                  isSelected ? 'w-full' : 'w-1/4 group-hover:w-1/2'
                }`}
              ></div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
