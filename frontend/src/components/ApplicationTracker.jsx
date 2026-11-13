import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
  Building,
  Bookmark,
  Download
} from 'lucide-react';


const STAGES = [
  { id: 'saved', label: 'Saved', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { id: 'applied', label: 'Applied', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'interview', label: 'Interview', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { id: 'selected', label: 'Selected', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { id: 'rejected', label: 'Rejected', color: 'border-rose-300 bg-rose-50 text-rose-700' },
];

export default function ApplicationTracker({
  applications = [],
  onUpdateStatus,
  onDeleteApplication,
  onSelectOpportunity,
}) {
  const [editingId, setEditingId] = useState(null);
  const [notesText, setNotesText] = useState('');

  const handleStartEdit = (app) => {
    setEditingId(app.id);
    setNotesText(app.notes || '');
  };

  const handleSaveNotes = async (appId) => {
    await onUpdateStatus(appId, null, notesText);
    setEditingId(null);
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = ['Company', 'Opportunity Title', 'Category', 'Stage', 'Applied Date', 'Notes', 'Link'];
    const rows = applications.map((app) => {
      const opp = app.opportunity || {};
      return [
        `"${(opp.organization || '').replace(/"/g, '""')}"`,
        `"${(opp.title || '').replace(/"/g, '""')}"`,
        `"${(opp.category || '').replace(/"/g, '""')}"`,
        `"${(app.status || '').replace(/"/g, '""')}"`,
        `"${app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN') : ''}"`,
        `"${(app.notes || '').replace(/"/g, '""')}"`,
        `"${(opp.application_url || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus-opportunity-applications-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            <span>Opportunity Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and progress your applications from initial save to final offer
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {applications.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
              title="Export tracking table as CSV for placement cell records"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
            {applications.length} Total Tracked
          </div>
        </div>
      </div>


      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No applications tracked yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Explore opportunities and click "Track" or "Apply" to organize your interview pipeline here.
          </p>
        </div>
      ) : (
        /* Kanban Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage.id);

            return (
              <div
                key={stage.id}
                className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {stageApps.length}
                  </span>
                </div>

                {/* Applications list */}
                <div className="space-y-2.5 overflow-y-auto pr-1">
                  {stageApps.map((app) => {
                    const opp = app.opportunity;
                    if (!opp) return null;

                    return (
                      <div
                        key={app.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="cursor-pointer font-bold text-slate-900 hover:text-brand-600 transition leading-snug line-clamp-2"
                            onClick={() => onSelectOpportunity(opp)}
                          >
                            {opp.title}
                          </div>

                          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mt-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{opp.organization}</span>
                          </div>

                          {opp.deadline && (
                            <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>
                                {new Date(opp.deadline).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}

                          {/* Notes */}
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            {editingId === app.id ? (
                              <div className="space-y-1.5">
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add interview notes, recruiter contact, etc."
                                  className="w-full text-[11px] p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  rows={2}
                                />
                                <div className="flex justify-end space-x-1">
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveNotes(app.id)}
                                    className="px-2 py-0.5 text-[10px] bg-brand-600 text-white font-semibold rounded"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleStartEdit(app)}
                                className="group flex items-start justify-between cursor-pointer text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                <span className="italic line-clamp-2">
                                  {app.notes || 'Click to add notes...'}
                                </span>
                                <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 ml-1" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Change Selector & Delete */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateStatus(app.id, e.target.value, null)}
                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move: {s.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            title="Remove from tracker"
                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
