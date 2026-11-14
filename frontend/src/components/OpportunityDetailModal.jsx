import React, { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved / Radar' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'selected', label: 'Selected / Offer' },
  { value: 'rejected', label: 'Rejected / Archived' },
];

export default function OpportunityDetailModal({
  opportunity,
  onClose,
  isSaved,
  onToggleSave,
  application,
  onSaveApplication,
  user,
  onDeleteOpportunity,
  matchScore = 0,
  matchedSkills = [],
}) {
  if (!opportunity) return null;

  const [currentStatus, setCurrentStatus] = useState(application ? application.status : 'saved');
  const [notes, setNotes] = useState(application ? application.notes || '' : '');
  const [savingTracking, setSavingTracking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${opportunity.title}"? This cannot be undone.`
      )
    ) {
      setDeleting(true);
      try {
        if (onDeleteOpportunity) {
          await onDeleteOpportunity(opportunity.id);
        }
        onClose();
      } catch (err) {
        alert(err.message || 'Failed to delete opportunity');
      } finally {
        setDeleting(false);
      }
    }
  };

  const {
    id,
    title,
    organization,
    category,
    description,
    domain,
    location,
    deadline,
    event_date,
    skills = [],
    is_paid,
    experience,
    eligibility,
    prize,
    team_size,
    mode,
    source,
    application_url,
    source_url,
    created_at,
  } = opportunity;

  const handleUpdateApplication = async () => {
    setSavingTracking(true);
    setSuccessMessage('');
    try {
      if (onSaveApplication) {
        await onSaveApplication(id, currentStatus, notes);
      }
      setSuccessMessage('Pipeline status updated.');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      console.error('Failed to save application status:', err);
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-surface-container-low border border-hairline rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-hairline">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded font-mono-micro text-mono-micro uppercase tracking-wider font-semibold bg-surface-container-high text-secondary border border-hairline">
                OP-{id ? String(id).slice(0, 6) : 'SPEC'}
              </span>
              <span className="px-2 py-0.5 rounded font-mono-micro text-mono-micro uppercase font-semibold bg-primary-container/20 text-primary border border-primary-container/40">
                {category}
              </span>
              {source && (
                <span className="px-1.5 py-0.5 rounded font-mono-micro text-mono-micro bg-surface-container-highest text-on-surface-variant border border-hairline uppercase">
                  SRC: {source}
                </span>
              )}
              {matchScore > 0 && (
                <span className="px-2 py-0.5 rounded-full font-mono-micro text-mono-micro font-bold bg-secondary-container/20 text-secondary border border-secondary/40 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  {matchScore}% Profile Match
                </span>
              )}
            </div>

            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1.5">
              {title}
            </h2>

            <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-medium">
              <span className="material-symbols-outlined text-[17px] text-secondary">
                corporate_fare
              </span>
              <span className="text-on-surface font-semibold">{organization}</span>
              <span className="text-outline">•</span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                pin_drop
              </span>
              <span>{location || 'Remote / Hybrid'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-hairline transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* High-Density Spec Strip */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-surface-container border border-hairline flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              COMPENSATION / PRIZE
            </span>
            <span className="font-mono-code text-mono-code text-secondary font-bold truncate mt-0.5">
              {prize ? prize : is_paid ? 'Paid' : 'Unpaid / Open'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-hairline flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              DEADLINE
            </span>
            <span className="font-mono-code text-mono-code text-primary font-bold truncate mt-0.5">
              {deadline || 'Rolling / Open'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-hairline flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              EVENT DATE
            </span>
            <span className="font-mono-code text-mono-code text-on-surface font-medium truncate mt-0.5">
              {event_date || 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-hairline flex flex-col">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase">
              TEAM SIZE / MODE
            </span>
            <span className="font-mono-code text-mono-code text-on-surface font-medium truncate mt-0.5">
              {team_size || mode || 'Individual'}
            </span>
          </div>
        </div>

        {/* Match Breakdown Callout if user profile exists */}
        {user && matchScore > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-surface-container-high/60 border border-secondary/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">psychology</span>
                Candidate Profile Alignment Matrix
              </span>
              <span className="font-mono-code text-mono-code text-secondary font-bold">
                {matchScore} / 100 PTS
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-body-sm">
              <span className="text-on-surface-variant font-mono-micro text-[11px]">
                Matched Skills:
              </span>
              {matchedSkills.length > 0 ? (
                matchedSkills.map((s, i) => (
                  <span
                    key={i}
                    className="font-mono-micro text-mono-micro px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary/30 font-semibold"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="font-mono-micro text-mono-micro text-outline">
                  General domain match ({domain || user.domain})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Eligibility & Skills */}
        {(eligibility || (skills && skills.length > 0)) && (
          <div className="mb-4 space-y-2">
            {eligibility && (
              <div className="text-body-sm">
                <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase block mb-0.5">
                  Eligibility Criteria:
                </span>
                <p className="text-on-surface font-medium">{eligibility}</p>
              </div>
            )}

            {skills && skills.length > 0 && (
              <div>
                <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase block mb-1">
                  Required / Tagged Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="font-mono-micro text-mono-micro px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface border border-hairline"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Opportunity Description */}
        <div className="mb-6 space-y-1.5">
          <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider block">
            Opportunity Description & Requirements:
          </span>
          <div className="p-4 rounded-xl bg-surface-container border border-hairline text-on-surface font-body-md text-body-md whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {description || 'No detailed description provided by crawler.'}
          </div>
        </div>

        {/* Pipeline & Application Tracking Box */}
        <div className="mb-6 p-4 rounded-xl bg-surface-container-high/40 border border-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-micro text-mono-micro text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              Application Pipeline Status
            </span>
            {successMessage && (
              <span className="font-mono-micro text-mono-micro text-tertiary">
                {successMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Stage
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface text-body-sm focus:outline-none focus:border-secondary capitalize"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Memo / Personal Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Applied via referral, round 1 pending..."
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface text-body-sm focus:outline-none focus:border-secondary"
                />
                <button
                  onClick={handleUpdateApplication}
                  disabled={savingTracking}
                  className="px-3.5 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110 transition flex-shrink-0"
                >
                  {savingTracking ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-hairline">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(opportunity)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hairline transition text-body-sm font-medium ${
                isSaved
                  ? 'bg-secondary-container/20 text-secondary border-secondary/40'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isSaved ? 'bookmark_added' : 'bookmark'}
              </span>
              <span>{isSaved ? 'Saved in Cockpit' : 'Save to Radar'}</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error-container/20 text-error hover:bg-error-container/30 border border-error/30 transition text-body-sm"
                title="Remove invalid or stale scraped record"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {source_url && (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-on-surface text-body-sm font-mono-micro flex items-center gap-1 transition"
              >
                <span>Raw Source</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}

            {application_url && (
              <a
                href={application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
              >
                <span>Direct Application Portal</span>
                <span className="material-symbols-outlined text-[17px]">arrow_outward</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
