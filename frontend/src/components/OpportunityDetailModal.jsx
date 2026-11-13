import React, { useState } from 'react';
import {
  X,
  Building,
  MapPin,
  Calendar,
  Trophy,
  Users,
  ExternalLink,
  Bookmark,
  Briefcase,
  CheckCircle,
  Clock,
  Sparkles,
  FileText,
  Trash2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
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
    if (window.confirm(`Are you sure you want to permanently delete "${opportunity.title}"? This cannot be undone.`)) {
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
    posted_at,
  } = opportunity;

  const handleUpdateApplication = async () => {
    setSavingTracking(true);
    try {
      await onSaveApplication(opportunity.id, currentStatus, notes);
      setSuccessMessage('Application tracker updated!');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="pr-4">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wider">
                {category}
              </span>
              {domain && (
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                  {domain}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{title}</h2>
            <p className="text-sm font-semibold text-slate-600 flex items-center space-x-2 mt-1">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{organization}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 capitalize text-xs">Source: {source}</span>
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleSave(opportunity)}
              className={`p-2 rounded-xl transition ${
                isSaved ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Match Score Banner */}
          {matchScore > 0 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="font-bold text-emerald-950">
                    {matchScore}% Profile Match
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Matches your profile skills ({matchedSkills.join(', ') || 'Domain profile'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Grid */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Location</span>
              <p className="text-xs font-semibold text-slate-800 mt-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{location || 'Remote / Unspecified'}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Deadline</span>
              <p className="text-xs font-semibold text-slate-800 mt-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{deadline ? new Date(deadline).toLocaleDateString('en-IN') : 'Rolling'}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Mode</span>
              <p className="text-xs font-semibold text-slate-800 mt-1 capitalize">
                {mode || (is_paid ? 'Paid' : 'Unpaid')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Experience</span>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {experience || (team_size ? `Team: ${team_size}` : 'Open to All')}
              </p>
            </div>
          </div>

          {/* Hackathon Specific: Prize & Event Date */}
          {(prize || event_date) && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
              {prize && (
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="text-[11px] font-semibold text-purple-700 uppercase">Prize / Reward</span>
                    <p className="text-xs font-bold text-slate-900">{prize}</p>
                  </div>
                </div>
              )}
              {event_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="text-[11px] font-semibold text-purple-700 uppercase">Event Date</span>
                    <p className="text-xs font-bold text-slate-900">{new Date(event_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Eligibility */}
          {eligibility && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Eligibility Criteria
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {eligibility}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Opportunity Overview
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Required Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Target Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Application Tracking Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <span>Personal Application Tracker</span>
            </h4>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Application Stage</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Personal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Applied with resume v2, referral from John"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {successMessage ? (
                <span className="text-xs font-semibold text-emerald-600">{successMessage}</span>
              ) : (
                <span className="text-[11px] text-slate-400">Track and manage your progress in your dashboard</span>
              )}

              <button
                onClick={handleUpdateApplication}
                disabled={savingTracking}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                {savingTracking ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Close
            </button>
            {user && (user.role === 'admin' || user.role === 'coordinator') && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
                title="Admin Action: Remove Stale Opportunity (PRD §FR-9.4)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Removing...' : 'Delete Opportunity'}</span>
              </button>
            )}
          </div>


          <a
            href={application_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/25 transition"
          >
            <span>Go to Application Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
