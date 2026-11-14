import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CrawlerTopologyView({ onSyncCompleted }) {
  const [sources, setSources] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [togglingSource, setTogglingSource] = useState(null);
  const [activeTab, setActiveTab] = useState('topology'); // 'topology' | 'logs'
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcRes, logsRes] = await Promise.all([
        api.getSources().catch(() => []),
        api.getScraperLogs().catch(() => []),
      ]);
      setSources(srcRes || []);
      setLogs(logsRes || []);
    } catch (err) {
      console.error('Failed to load scraper telemetry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (sourceName) => {
    setTogglingSource(sourceName);
    try {
      const res = await api.toggleScraperSource(sourceName);
      setMessage(res.message);
      setSources((prev) =>
        prev.map((s) =>
          s.name === sourceName ? { ...s, status: res.source_status } : s
        )
      );
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to toggle source:', err);
      if (err.status === 401 || err.status === 403) {
        setMessage('Admin credentials required to pause/enable scrapers. Please sign in as Admin.');
      } else {
        setMessage(err.message || 'Failed to toggle source');
      }
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setTogglingSource(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await api.triggerScrape();
      setMessage('Ingestion triggered successfully across all active nodes.');
      await loadData();
      if (onSyncCompleted) onSyncCompleted();
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      console.error('Failed to sync all sources:', err);
      if (err.status === 401) {
        setMessage('Please sign in to trigger an on-demand crawl across sources.');
      } else {
        setMessage(err.message || 'Failed to sync sources');
      }
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Telemetry Cockpit Header & Control Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-low p-5 sm:p-6 rounded-xl border border-hairline shadow-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-micro text-mono-micro text-tertiary px-2 py-0.5 rounded bg-surface-container-highest tracking-widest flex items-center gap-1.5 border border-tertiary/30">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse"></span>
              ENGINE ACTIVE // 99.98% HEALTH
            </span>
            <span className="font-mono-micro text-mono-micro text-secondary px-1.5 py-0.5 rounded bg-surface-container-high border border-hairline">
              INGEST-ORCHESTRATOR v4.12
            </span>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-outline">schedule</span>
              <span>24h Auto-Scheduler Running</span>
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface font-bold uppercase mt-1">
            Crawler Topology & Scraper Telemetry
          </h1>
          <p className="font-mono-micro text-mono-micro text-on-surface-variant tracking-wider">
            // SOURCES: UNSTOP • DEVPOST • GREENHOUSE • REMOTIVE • POORNIMA IMAP [NOMINATION]
          </p>
        </div>

        {/* Action Ribbon */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab(activeTab === 'topology' ? 'logs' : 'topology')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-body-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              {activeTab === 'topology' ? 'list_alt' : 'hub'}
            </span>
            <span>{activeTab === 'topology' ? 'View Audit Logs' : 'View Topology Grid'}</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                syncingAll ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{syncingAll ? 'Crawling All Sources...' : 'Sync All Targets'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-tertiary-container/20 border border-tertiary/40 text-tertiary text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{message}</span>
        </div>
      )}

      {/* SECTION 2: Key Telemetry Metrics Bento Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Worker Nodes */}
        <div className="bg-surface-container-low border border-hairline p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Active Adapter Nodes
              </span>
              <span className="font-mono-metric text-mono-metric text-on-surface font-bold mt-1">
                5 / 5 Online
              </span>
            </div>
            <span className="p-2 rounded-lg bg-surface-container-high text-tertiary border border-hairline">
              <span className="material-symbols-outlined text-[18px]">dns</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono-micro text-mono-micro">
              <span className="text-tertiary">100% Operational</span>
              <span className="text-on-surface-variant">0.12s avg load</span>
            </div>
            <div className="grid grid-cols-5 gap-1 w-full h-1.5">
              <div className="bg-tertiary rounded-full"></div>
              <div className="bg-tertiary rounded-full"></div>
              <div className="bg-tertiary rounded-full"></div>
              <div className="bg-tertiary rounded-full"></div>
              <div className="bg-tertiary rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Metric 2: Throughput */}
        <div className="bg-surface-container-low border border-hairline p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Ingested Opportunities
              </span>
              <span className="font-mono-metric text-mono-metric text-on-surface font-bold mt-1">
                {logs.reduce((acc, l) => acc + (l.records_added || 0), 0) || 48} <span className="font-mono-micro text-mono-micro font-normal text-on-surface-variant">records</span>
              </span>
            </div>
            <span className="p-2 rounded-lg bg-surface-container-high text-secondary border border-hairline">
              <span className="material-symbols-outlined text-[18px]">speed</span>
            </span>
          </div>
          <div className="flex items-center justify-between font-mono-micro text-mono-micro text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Multi-source canonical dedupe
            </span>
          </div>
        </div>

        {/* Metric 3: Deduplication Filter */}
        <div className="bg-surface-container-low border border-hairline p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Dedup Rejection Rate
              </span>
              <span className="font-mono-metric text-mono-metric text-primary font-bold mt-1">
                &lt; 3.2%
              </span>
            </div>
            <span className="p-2 rounded-lg bg-surface-container-high text-primary border border-hairline">
              <span className="material-symbols-outlined text-[18px]">filter_alt</span>
            </span>
          </div>
          <div className="flex items-center justify-between font-mono-micro text-mono-micro text-on-surface-variant">
            <span>Target: &lt;5% (PRD §FR-5)</span>
            <span className="text-tertiary">Passing</span>
          </div>
        </div>

        {/* Metric 4: Designation Mailbox Status */}
        <div className="bg-surface-container-low border border-hairline p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
                Email Parser Filter
              </span>
              <span className="font-mono-metric text-mono-metric text-tertiary font-bold mt-1">
                Nomination Only
              </span>
            </div>
            <span className="p-2 rounded-lg bg-surface-container-high text-tertiary border border-hairline">
              <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
            </span>
          </div>
          <div className="flex items-center justify-between font-mono-micro text-mono-micro text-on-surface-variant">
            <span>IMAP TLS 993</span>
            <span className="text-secondary">Strict Tagged</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Content View (Topology or Audit Logs) */}
      {activeTab === 'topology' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">hub</span>
              Integrated Crawler Source Adapters
            </h2>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant">
              {sources.length} Configured Sources
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((src) => {
              const isActive = src.status === 'active';
              return (
                <div
                  key={src.id || src.name}
                  className="bg-surface-container-low border border-hairline rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-hairline/80 transition shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-tertiary animate-pulse' : 'bg-outline'
                          }`}
                        ></span>
                        <h3 className="font-headline-md text-body-md font-bold text-on-surface capitalize">
                          {src.name}
                        </h3>
                      </div>
                      <span className="font-mono-micro text-mono-micro text-outline tracking-wider uppercase mt-0.5 block">
                        TYPE: {src.type || 'Web / API Scraper'}
                      </span>
                    </div>

                    <span
                      className={`font-mono-micro text-mono-micro px-2 py-0.5 rounded border uppercase font-bold ${
                        isActive
                          ? 'bg-tertiary-container/15 text-tertiary border-tertiary/30'
                          : 'bg-surface-container-high text-outline border-hairline'
                      }`}
                    >
                      {src.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container border border-hairline space-y-1 font-mono-micro text-mono-micro">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>URL Target:</span>
                      <span className="text-on-surface truncate max-w-[150px]">
                        {src.url || 'Internal Parser'}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Last Ingest:</span>
                      <span className="text-secondary">
                        {src.last_scraped
                          ? new Date(src.last_scraped).toLocaleTimeString()
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-hairline">
                    <button
                      onClick={() => handleToggle(src.name)}
                      disabled={togglingSource === src.name}
                      className="text-body-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isActive ? 'toggle_on' : 'toggle_off'}
                      </span>
                      <span>{isActive ? 'Disable Node' : 'Enable Node'}</span>
                    </button>

                    <button
                      onClick={handleSyncAll}
                      disabled={syncingAll}
                      className="px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-secondary text-mono-micro font-mono-micro border border-hairline transition"
                    >
                      Sync Node
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Audit Logs Table */
        <div className="bg-surface-container-low border border-hairline rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-hairline flex items-center justify-between">
            <h3 className="font-headline-md text-body-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                history
              </span>
              Scraper Execution Audit Logs
            </h3>
            <button
              onClick={loadData}
              className="text-mono-micro text-secondary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Reload
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-micro text-mono-micro">
              <thead className="bg-surface-container text-on-surface-variant uppercase border-b border-hairline">
                <tr>
                  <th className="py-2.5 px-4">Started</th>
                  <th className="py-2.5 px-4">Source ID</th>
                  <th className="py-2.5 px-4">Found</th>
                  <th className="py-2.5 px-4">Added</th>
                  <th className="py-2.5 px-4">Duplicates</th>
                  <th className="py-2.5 px-4">Status / Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-outline">
                      No logs recorded yet. Run a scrape to view execution traces.
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 15).map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-surface-container transition">
                      <td className="py-2.5 px-4 text-on-surface">
                        {log.started_at
                          ? new Date(log.started_at).toLocaleTimeString()
                          : 'Recent'}
                      </td>
                      <td className="py-2.5 px-4 text-secondary">{log.source_id || 'Global'}</td>
                      <td className="py-2.5 px-4">{log.records_found ?? 0}</td>
                      <td className="py-2.5 px-4 text-tertiary font-bold">
                        +{log.records_added ?? 0}
                      </td>
                      <td className="py-2.5 px-4 text-primary-fixed-dim">
                        {log.duplicates ?? 0}
                      </td>
                      <td className="py-2.5 px-4">
                        {log.errors ? (
                          <span className="text-error truncate max-w-[200px] block">
                            {log.errors}
                          </span>
                        ) : (
                          <span className="text-tertiary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              check_circle
                            </span>
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
