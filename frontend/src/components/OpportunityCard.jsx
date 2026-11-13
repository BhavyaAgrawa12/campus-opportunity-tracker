import React from 'react';
import {
  Calendar,
  MapPin,
  Briefcase,
  Trophy,
  Users,
  ExternalLink,
  Bookmark,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_STYLES = {
  hackathon: 'bg-purple-50 text-purple-700 border-purple-200',
  job: 'bg-blue-50 text-blue-700 border-blue-200',
  internship: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scholarship: 'bg-amber-50 text-amber-700 border-amber-200',
  nomination: 'bg-rose-50 text-rose-700 border-rose-200',
  workshop: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  competition: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
};

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
  } = opportunity;

  const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;

  // Compute days remaining until deadline
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

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header: Category Badge & Urgency / Save button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${categoryStyle}`}
            >
              {category}
            </span>

            {isClosingSoon && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Closing in {daysRemaining}d</span>
              </span>
            )}

            {isPast && (
              <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 rounded-full">
                Expired
              </span>
            )}

            {matchScore > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1 shadow-xs">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{matchScore}% Match</span>
              </span>
            )}
          </div>


          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(opportunity);
            }}
            title={isSaved ? 'Remove bookmark' : 'Bookmark this opportunity'}
            className={`p-2 rounded-xl transition ${
              isSaved
                ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title and Organization */}
        <div className="cursor-pointer" onClick={() => onSelect(opportunity)}>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition leading-snug">
            {title}
          </h4>
          <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center space-x-1.5">
            <span>{organization}</span>
            <span>•</span>
            <span className="capitalize text-slate-400 font-normal">{source}</span>
          </p>
        </div>

        {/* Key Highlights (Location, Mode, Prize/Stipend, Team size) */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          {location && (
            <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{location}</span>
            </div>
          )}

          {mode && (
            <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 capitalize">
              <span>{mode}</span>
            </div>
          )}

          {prize && (
            <div className="flex items-center space-x-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-md border border-amber-200">
              <Trophy className="w-3 h-3 text-amber-600" />
              <span className="font-medium truncate max-w-[180px]">{prize}</span>
            </div>
          )}

          {team_size && (
            <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Users className="w-3 h-3 text-slate-400" />
              <span>Team of {team_size}</span>
            </div>
          )}

          {is_paid === true && (
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200">
              <span className="font-medium">Paid</span>
            </div>
          )}
        </div>

        {/* Skills Chips */}
        {skills && skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {skills.slice(0, 4).map((skill) => {
              const isMatched = matchedSkills.includes(skill.toLowerCase());
              return (
                <span
                  key={skill}
                  className={`px-2 py-0.5 text-[11px] rounded-md transition ${
                    isMatched
                      ? 'font-bold bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'font-medium bg-slate-100 text-slate-600'
                  }`}
                >
                  #{skill}
                </span>
              );
            })}
            {skills.length > 4 && (
              <span className="text-[11px] text-slate-400 py-0.5">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}

      </div>

      {/* Footer: Deadline & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {deadline ? `Deadline: ${new Date(deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : 'Rolling deadline'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick tracker status pill if tracked */}
          {applicationStatus && (
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-200 capitalize">
              {applicationStatus}
            </span>
          )}

          <a
            href={application_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-sm transition"
          >
            <span>Apply</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
