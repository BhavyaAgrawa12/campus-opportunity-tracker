import React from 'react';
import {
  Briefcase,
  Trophy,
  GraduationCap,
  Sparkles,
  Clock,
  Compass
} from 'lucide-react';

export default function MetricsOverview({ counts = {}, activeCategory, onSelectCategory, statusFilter = 'live' }) {
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
      icon: Compass,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'hackathon',
      label: 'Hackathons',
      count: getCount(counts.liveHackathons, counts.hackathons, counts.expiredHackathons),
      icon: Trophy,
      color: 'from-purple-600 to-pink-600',
      bgLight: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'internship',
      label: 'Internships',
      count: getCount(counts.liveInternships, counts.internships, counts.expiredInternships),
      icon: Sparkles,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'job',
      label: 'Full-time Jobs',
      count: getCount(counts.liveJobs, counts.jobs, counts.expiredJobs),
      icon: Briefcase,
      color: 'from-sky-600 to-cyan-600',
      bgLight: 'bg-sky-50 text-sky-700',
    },
    {
      id: 'scholarship',
      label: 'Scholarships',
      count: getCount(counts.liveScholarships, counts.scholarships, counts.expiredScholarships),
      icon: GraduationCap,
      color: 'from-amber-600 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeCategory === card.id;

        return (
          <button
            key={card.label}
            onClick={() => onSelectCategory(card.id)}
            className={`p-4 rounded-2xl border text-left transition duration-200 ${
              isSelected
                ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.bgLight}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">{card.count}</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 truncate">{card.label}</p>
          </button>
        );
      })}
    </div>
  );
}
