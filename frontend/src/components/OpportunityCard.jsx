import React from 'react';

const CATEGORY_COLORS = {
  hackathon: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
  job: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
  internship: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
  scholarship: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  nomination: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
  workshop: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40',
  competition: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40',
  default: 'bg-surface-container text-on-surface-variant border-hairline',
};

const STAGE_OPTIONS = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'selected', label: 'Selected' },
  { id: 'rejected', label: 'Rejected' },
];

export default function OpportunityCard({
  opportunity,
  isSaved,
  onToggleSave,
  onSelect,
  applicationStatus,
  onUpdateStatus,
  matchScore = 0,
  matchedSkills = [],
}) {
  const {
    id,
    title,
    organization,
    category,
    location,
    deadline,
    skills = [],
    is_paid,
    prize,
    mode,
    source,
    application_url,
  } = opportunity;

  // Days remaining calculation
  let daysRemaining = null;
  let isClosingSoon = false;
  let isPast = false;

  if (deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadDate = new Date(deadline);
    deadDate.setHours(0, 0, 0, 0);
    const diffTime = deadDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      isPast = true;
    } else if (daysRemaining <= 7) {
      isClosingSoon = true;
    }
  }

  const categoryStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

  return (
    <div className="group relative bg-surface-container-low hover:bg-surface-container rounded-xl border border-hairline hover:border-hairline/80 p-3.5 sm:p-5 shadow-sm hover:shadow-bento-card transition-all duration-200 flex flex-col justify-between w-full max-w-full overflow-hidden">
      <div>
        {/* Top Header: Source, Category, Match Score & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`px-2 py-0.5 text-mono-micro font-mono-micro rounded border capitalize font-semibold ${categoryStyle}`}
            >
              {category}
            </span>

            {source && (
              <span className="px-1.5 py-0.5 text-[10px] sm:text-mono-micro font-mono-micro rounded bg-surface-container-high text-on-surface-variant border border-hairline uppercase truncate max-w-[90px]">
                {source}
              </span>
            )}

            {isClosingSoon && (
              <span className="px-1.5 py-0.5 text-[10px] sm:text-mono-micro font-mono-micro font-bold bg-primary-container/20 text-primary border border-primary-container/40 rounded flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
                <span>{daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}</span>
              </span>
            )}

            {isPast && (
              <span className="px-1.5 py-0.5 text-[10px] sm:text-mono-micro font-mono-micro rounded bg-surface-container-highest text-outline flex-shrink-0">
                Expired
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {matchScore > 0 && (
              <div
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-secondary-container/15 border border-secondary/30 text-secondary font-mono-micro text-[10px] sm:text-mono-micro font-bold flex-shrink-0"
                title={`${matchScore}% Match`}
              >
                <span className="material-symbols-outlined text-[12px] sm:text-[13px]">
                  auto_awesome
                </span>
                <span>{matchScore}%</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(opportunity);
              }}
              className={`p-1.5 rounded-lg border transition flex-shrink-0 ${
                isSaved
                  ? 'bg-secondary-container/20 text-secondary border-secondary/40'
                  : 'bg-surface-container-high border-hairline text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save opportunity'}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[17px]">
                {isSaved ? 'bookmark_added' : 'bookmark'}
              </span>
            </button>
          </div>
        </div>

        {/* Title & Organization */}
        <div
          onClick={() => onSelect(opportunity)}
          className="cursor-pointer group/title"
        >
          <h3 className="font-headline-md text-sm sm:text-headline-md font-bold text-on-surface group-hover/title:text-primary transition line-clamp-2 leading-snug break-words">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs sm:text-body-sm mt-1 truncate">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-secondary flex-shrink-0">
              corporate_fare
            </span>
            <span className="font-medium text-on-surface truncate">
              {organization}
            </span>
          </div>
        </div>

        {/* Location, Mode & Compensation Spec Row */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-lg bg-surface-container border border-hairline text-body-sm">
          <div className="flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              Location
            </span>
            <span className="font-body-sm text-on-surface truncate font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-outline">
                pin_drop
              </span>
              {location || 'Remote / Hybrid'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              Comp / Value
            </span>
            <span className="font-mono-code text-mono-code text-secondary font-semibold truncate mt-0.5">
              {prize ? prize : is_paid ? 'Paid' : 'Open / Unpaid'}
            </span>
          </div>
        </div>

        {/* Skills Chips */}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {skills.slice(0, 4).map((skill, index) => {
              const isMatch = (matchedSkills || []).some(
                (ms) => ms.toLowerCase() === skill.toLowerCase()
              );
              return (
                <span
                  key={index}
                  className={`px-2 py-0.5 text-mono-micro font-mono-micro rounded border transition ${
                    isMatch
                      ? 'bg-secondary-container/20 text-secondary border-secondary/40 font-semibold'
                      : 'bg-surface-container-high text-on-surface-variant border-hairline'
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {skills.length > 4 && (
              <span className="px-1.5 py-0.5 text-mono-micro font-mono-micro text-outline">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Pipeline Status Selector & Direct Action */}
      <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
        {/* Quick Pipeline Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase hidden sm:inline">
            Status:
          </span>
          <select
            value={applicationStatus || ''}
            onChange={(e) => {
              e.stopPropagation();
              if (onUpdateStatus) {
                onUpdateStatus(opportunity.id, e.target.value);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-mono-micro font-mono-micro py-1 px-2 bg-surface-container-high border border-hairline rounded-md text-on-surface focus:outline-none focus:border-secondary cursor-pointer capitalize"
          >
            <option value="" className="bg-surface-container text-on-surface-variant">
              Pipeline...
            </option>
            {STAGE_OPTIONS.map((st) => (
              <option
                key={st.id}
                value={st.id}
                className="bg-surface-container text-on-surface"
              >
                {st.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(opportunity)}
            className="px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-medium border border-hairline transition"
          >
            Details
          </button>

          <a
            href={application_url || opportunity.source_url || `https://www.google.com/search?q=${encodeURIComponent(`${title} ${organization} careers`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-secondary border border-hairline transition"
            title="Open application portal"
          >
            <span className="material-symbols-outlined text-[16px] block">
              arrow_outward
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
