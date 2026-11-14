import React from 'react';

export default function PrimeMatchHero({
  opportunity,
  onSelect,
  isSaved,
  onToggleSave,
  applicationStatus,
  onUpdateStatus,
}) {
  if (!opportunity) return null;

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
    team_size,
    mode,
    source,
    application_url,
    matchScore = 94,
    matchedSkills = [],
  } = opportunity;

  // Compute days remaining
  let daysRemaining = null;
  if (deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadDate = new Date(deadline);
    deadDate.setHours(0, 0, 0, 0);
    daysRemaining = Math.ceil((deadDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const compensationText = prize
    ? prize
    : is_paid
    ? 'Stipend / Paid'
    : 'Unpaid / Open';

  // SVG stroke-dasharray calculation for radius 15.9155 (circumference ~ 100)
  const scorePercent = Math.max(10, Math.min(99, matchScore || 85));

  return (
    <div className="rounded-xl bg-surface-container-low border border-hairline p-4 sm:p-5 lg:p-7 relative overflow-hidden flex flex-col justify-between shadow-bento-card w-full max-w-full">
      {/* Corner Atmosphere Radial Flare */}
      <div className="absolute -right-16 -top-16 w-48 sm:w-64 h-48 sm:h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Upper Row: Subtitle Overline & Match Ring */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 z-10">
        <div className="flex flex-col gap-1 max-w-2xl min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-mono-micro text-mono-micro uppercase tracking-wider font-semibold border border-hairline text-[10px] sm:text-mono-micro">
              PRIME MATCH // OP-{id ? String(id).slice(0, 4) : '01'}
            </span>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant text-[10px] sm:text-mono-micro">
              SRC: {source ? source.toUpperCase() : 'VERIFIED'}
            </span>
            <span className="font-mono-micro text-mono-micro px-1.5 py-0.2 rounded bg-tertiary-container/20 text-tertiary text-[10px] sm:text-mono-micro">
              TOP RANKED
            </span>
          </div>

          <h2
            onClick={() => onSelect(opportunity)}
            className="font-headline-lg text-body-lg sm:text-headline-lg text-on-surface font-bold tracking-tight mt-1 hover:text-primary transition cursor-pointer break-words leading-snug"
          >
            {title}
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mt-1 text-on-surface-variant font-body-sm text-xs sm:text-body-sm">
            <span className="flex items-center gap-1 text-on-surface font-medium truncate">
              <span className="material-symbols-outlined text-[15px] sm:text-[17px] text-secondary">
                corporate_fare
              </span>
              {organization}
            </span>
            <span className="text-outline">•</span>
            <span className="flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-outline">
                pin_drop
              </span>
              {location || 'Remote'}
            </span>
            {deadline && (
              <>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1 text-primary font-mono-micro text-[11px] sm:text-mono-micro">
                  <span className="material-symbols-outlined text-[15px]">
                    event
                  </span>
                  {daysRemaining !== null
                    ? daysRemaining > 0
                      ? `${daysRemaining}d left`
                      : 'Today'
                    : deadline}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Match Radial Gauge (Inline SVG) */}
        <div className="flex items-center sm:flex-col bg-surface-container-high/60 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-hairline flex-shrink-0 gap-2 sm:gap-0 self-start sm:self-center">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              {/* Background Track */}
              <path
                className="text-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              {/* Filled Arc */}
              <path
                className="text-secondary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${scorePercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.2"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono-metric text-base sm:text-mono-metric font-bold text-secondary leading-none">
                {scorePercent}
              </span>
              <span className="font-mono-micro text-[8px] sm:text-[9px] text-on-surface-variant">
                % MATCH
              </span>
            </div>
          </div>
          <span className="sm:hidden font-mono-micro text-xs text-on-surface-variant font-medium">
            Candidate Alignment
          </span>
        </div>
      </div>

      {/* Mid Spec Strip: High-Density Meta & Stipend */}
      <div className="my-3 sm:my-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 z-10 w-full">
        <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container border border-hairline flex flex-col min-w-0">
          <span className="font-mono-micro text-[10px] sm:text-mono-micro text-on-surface-variant uppercase truncate">
            COMP / PRIZE
          </span>
          <span className="font-mono-code text-xs sm:text-mono-code text-on-surface font-semibold text-secondary truncate">
            {compensationText}
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container border border-hairline flex flex-col min-w-0">
          <span className="font-mono-micro text-[10px] sm:text-mono-micro text-on-surface-variant uppercase truncate">
            CATEGORY
          </span>
          <span className="font-mono-code text-xs sm:text-mono-code text-on-surface font-medium capitalize truncate">
            {category}
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container border border-hairline flex flex-col min-w-0">
          <span className="font-mono-micro text-[10px] sm:text-mono-micro text-on-surface-variant uppercase truncate">
            LOGISTICS
          </span>
          <span className="font-mono-code text-xs sm:text-mono-code text-on-surface font-medium truncate">
            {mode || (location?.toLowerCase().includes('remote') ? 'Remote' : 'On-Site')}
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container border border-hairline flex flex-col min-w-0">
          <span className="font-mono-micro text-[10px] sm:text-mono-micro text-on-surface-variant uppercase truncate">
            PIPELINE
          </span>
          <span className="font-mono-code text-xs sm:text-mono-code text-primary font-medium capitalize truncate">
            {applicationStatus || 'Radar'}
          </span>
        </div>
      </div>

      {/* Skills Chips */}
      {skills && skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4 z-10 w-full overflow-hidden">
          <span className="font-mono-micro text-[10px] sm:text-mono-micro text-on-surface-variant mr-1">
            SKILLS:
          </span>
          {skills.slice(0, 4).map((skill, i) => {
            const isMatched = (matchedSkills || []).some(
              (ms) => ms.toLowerCase() === skill.toLowerCase()
            );
            return (
              <span
                key={i}
                className={`font-mono-micro text-[10px] sm:text-mono-micro px-1.5 sm:px-2 py-0.5 rounded border transition truncate max-w-[120px] ${
                  isMatched
                    ? 'bg-secondary-container/15 text-secondary border-secondary/30'
                    : 'bg-surface-container-high text-on-surface-variant border-hairline'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {skills.length > 4 && (
            <span className="font-mono-micro text-[10px] text-outline">
              +{skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Action Footer Button Group */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 sm:pt-3 border-t border-hairline z-10 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onSelect(opportunity)}
            className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-xs sm:text-body-sm font-medium"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[17px] text-secondary">
              visibility
            </span>
            <span>Inspect</span>
          </button>

          <button
            onClick={() => onToggleSave(opportunity)}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-hairline transition text-xs sm:text-body-sm ${
              isSaved
                ? 'bg-secondary-container/20 text-secondary border-secondary/40'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[17px]">
              {isSaved ? 'bookmark_added' : 'bookmark'}
            </span>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={application_url || opportunity.source_url || `https://www.google.com/search?q=${encodeURIComponent(`${title} ${organization} careers`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
          >
            <span>Apply</span>
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">
              arrow_outward
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
