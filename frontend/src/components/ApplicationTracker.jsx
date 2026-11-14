import React, { useState } from 'react';

const STAGES = [
  { id: 'saved', label: 'Saved / Radar', color: 'border-outline-variant bg-surface-container text-on-surface' },
  { id: 'applied', label: 'Applied', color: 'border-secondary/40 bg-surface-container text-secondary' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-primary/40 bg-surface-container text-primary' },
  { id: 'interview', label: 'Technical / Interview', color: 'border-primary-container/40 bg-surface-container text-primary-fixed' },
  { id: 'selected', label: 'Selected / Offer', color: 'border-tertiary/40 bg-surface-container text-tertiary' },
  { id: 'rejected', label: 'Archived / Rejected', color: 'border-error/40 bg-surface-container text-error' },
];

export default function ApplicationTracker({
  applications = [],
  onUpdateStatus,
  onDeleteApplication,
  onSelectOpportunity,
  onCreateManualEntry,
}) {
  const [editingId, setEditingId] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualData, setManualData] = useState({
    title: '',
    organization: '',
    category: 'job',
    status: 'applied',
    notes: '',
  });

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
    link.setAttribute('download', `campus-applications-pipeline-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group applications by stage
  const grouped = {};
  STAGES.forEach((s) => {
    grouped[s.id] = [];
  });
  applications.forEach((app) => {
    const s = app.status || 'saved';
    if (grouped[s]) {
      grouped[s].push(app);
    } else {
      grouped['saved'].push(app);
    }
  });

  // Calculate metrics
  const totalInFlight = applications.length;
  const activeInterviews = grouped['interview']?.length || 0;
  const offersSelected = grouped['selected']?.length || 0;
  const appliedCount = grouped['applied']?.length || 0;

  // Move stage left/right
  const handleShiftStage = (app, direction) => {
    const stageIds = STAGES.map((s) => s.id);
    const currentIndex = stageIds.indexOf(app.status || 'saved');
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < stageIds.length) {
      onUpdateStatus(app.id, stageIds[nextIndex]);
    }
  };

  return (
    <div className="space-y-6">
      {/* COCKPIT PIPELINE METRICS & ACTIONS HEADER */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-hairline">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono-micro text-mono-micro px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary tracking-widest uppercase flex items-center gap-1.5 border border-secondary/30">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
                Live Pipeline Stream
              </span>
              <span className="font-mono-micro text-mono-micro text-on-surface-variant">
                // SPRINT &apos;25 CYCLE
              </span>
              <span className="font-mono-micro text-mono-micro text-outline tracking-wider hidden sm:inline">
                BUILD: #8820-STABLE
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface font-extrabold flex items-baseline gap-3">
              APPLICATION PIPELINE
              <span className="font-mono-code text-mono-code text-primary font-normal text-lg">
                v2.54
              </span>
            </h1>
          </div>

          {/* Action Control Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Entry</span>
              <kbd className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-on-primary/20 text-on-primary">
                N
              </kbd>
            </button>

            {applications.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-body-sm"
                title="Export Pipeline CSV"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  download
                </span>
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Bento Telemetry Metrics Quadrants */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Metric 1: Total In Flight */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-hairline flex flex-col gap-2 relative overflow-hidden group hover:bg-surface-container transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Total In Flight
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">
                flight_takeoff
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-metric text-mono-metric font-bold text-on-surface">
                {totalInFlight}
              </span>
              <span className="font-mono-micro text-mono-micro text-tertiary flex items-center">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                active
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full transition-all"
                style={{ width: `${Math.min(100, totalInFlight * 10)}%` }}
              ></div>
            </div>
          </div>

          {/* Metric 2: Active Interviews */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-hairline flex flex-col gap-2 relative overflow-hidden group hover:bg-surface-container transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Active Interviews
              </span>
              <span className="h-2 w-2 rounded-full bg-primary-container animate-ping"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-metric text-mono-metric font-bold text-primary">
                {activeInterviews.toString().padStart(2, '0')}
              </span>
              <span className="font-mono-micro text-mono-micro text-primary-fixed-dim">
                High Priority
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full transition-all"
                style={{ width: `${Math.min(100, activeInterviews * 25)}%` }}
              ></div>
            </div>
          </div>

          {/* Metric 3: Offers / Selected */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-hairline flex flex-col gap-2 relative overflow-hidden group hover:bg-surface-container transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Offers / Selected
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">
                military_tech
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-metric text-mono-metric font-bold text-tertiary">
                {offersSelected.toString().padStart(2, '0')}
              </span>
              <span className="font-mono-micro text-mono-micro px-1.5 py-0.2 rounded bg-tertiary-container/30 text-tertiary">
                Success Node
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full transition-all"
                style={{ width: `${Math.min(100, offersSelected * 33)}%` }}
              ></div>
            </div>
          </div>

          {/* Metric 4: Applied Velocity */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-hairline flex flex-col gap-2 relative overflow-hidden group hover:bg-surface-container transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Submissions
              </span>
              <span className="material-symbols-outlined text-[18px] text-outline">
                speed
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-metric text-mono-metric font-bold text-on-surface">
                {appliedCount}
              </span>
              <span className="font-mono-micro text-mono-micro text-on-surface-variant">
                in pipeline
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-secondary-container h-full transition-all"
                style={{ width: `${Math.min(100, appliedCount * 15)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = grouped[stage.id] || [];
          return (
            <div
              key={stage.id}
              className="bg-surface-container-lowest border border-hairline rounded-xl flex flex-col min-w-[240px]"
            >
              {/* Lane Header */}
              <div className="p-3 border-b border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`}></span>
                  <span className="font-mono-micro text-mono-micro font-bold uppercase tracking-wider text-on-surface">
                    {stage.label}
                  </span>
                </div>
                <span className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  {items.length}
                </span>
              </div>

              {/* Lane Body Cards */}
              <div className="p-2 space-y-2.5 min-h-[140px] max-h-[700px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-mono-micro text-outline text-[11px]">
                    No items in this lane
                  </div>
                ) : (
                  items.map((app) => {
                    const opp = app.opportunity || {};
                    return (
                      <div
                        key={app.id}
                        className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-hairline transition shadow-sm flex flex-col justify-between group"
                      >
                        <div>
                          {/* Role Title */}
                          <div
                            onClick={() => onSelectOpportunity && opp.id && onSelectOpportunity(opp)}
                            className="font-body-sm font-semibold text-on-surface hover:text-primary transition cursor-pointer line-clamp-2 leading-snug"
                          >
                            {opp.title || 'Untitled Role'}
                          </div>

                          {/* Company */}
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] mt-1 font-mono-micro truncate">
                            <span className="material-symbols-outlined text-[13px] text-secondary">
                              corporate_fare
                            </span>
                            <span>{opp.organization || 'Direct'}</span>
                          </div>

                          {/* Notes Preview */}
                          {app.notes && (
                            <div className="mt-2 p-1.5 rounded bg-surface-container-highest/60 text-outline text-[11px] italic line-clamp-2 border border-hairline">
                              &ldquo;{app.notes}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions: Stage shift arrows + Memo button + Delete */}
                        <div className="pt-2.5 mt-2 border-t border-hairline flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleShiftStage(app, -1)}
                              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition disabled:opacity-30"
                              title="Shift lane left"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                arrow_back
                              </span>
                            </button>
                            <button
                              onClick={() => handleShiftStage(app, 1)}
                              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition disabled:opacity-30"
                              title="Shift lane right"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                arrow_forward
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(app)}
                              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition"
                              title="Edit memo / notes"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                edit_note
                              </span>
                            </button>

                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-error transition"
                              title="Remove from tracking"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Memo Notes Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-hairline rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-body-md font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                edit_note
              </span>
              Application Memo & Interview Notes
            </h3>
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Completed online assessment, interview scheduled for Friday 3 PM..."
              className="w-full p-3 rounded-lg bg-surface-container-highest border border-hairline text-on-surface text-body-sm focus:outline-none focus:border-secondary resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-body-sm hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(editingId)}
                className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110"
              >
                Save Memo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-hairline rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-body-md font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                add_task
              </span>
              Record Manual Application Entry
            </h3>

            <div className="space-y-3 text-body-sm">
              <div>
                <label className="block text-mono-micro text-on-surface-variant uppercase mb-1">
                  Role / Opportunity Title *
                </label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="e.g. Associate Software Engineer"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-mono-micro text-on-surface-variant uppercase mb-1">
                  Company / Organizer *
                </label>
                <input
                  type="text"
                  value={manualData.organization}
                  onChange={(e) => setManualData({ ...manualData, organization: e.target.value })}
                  placeholder="e.g. Google India / Unstop Hackathon"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-mono-micro text-on-surface-variant uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={manualData.category}
                    onChange={(e) => setManualData({ ...manualData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option value="job">Job</option>
                    <option value="internship">Internship</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="nomination">Nomination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-mono-micro text-on-surface-variant uppercase mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={manualData.status}
                    onChange={(e) => setManualData({ ...manualData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-mono-micro text-on-surface-variant uppercase mb-1">
                  Memo / Tracking Notes
                </label>
                <textarea
                  rows={2}
                  value={manualData.notes}
                  onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                  placeholder="e.g. Applied via college drive portal..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setManualModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-body-sm hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!manualData.title || !manualData.organization) {
                    alert('Please provide role title and company');
                    return;
                  }
                  if (onCreateManualEntry) {
                    await onCreateManualEntry(manualData);
                  }
                  setManualModalOpen(false);
                  setManualData({
                    title: '',
                    organization: '',
                    category: 'job',
                    status: 'applied',
                    notes: '',
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110"
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
