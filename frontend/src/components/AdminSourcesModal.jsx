import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminSourcesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('sources'); // 'sources' | 'logs'
  const [sources, setSources] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingSource, setTogglingSource] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sources') {
        const data = await api.getSources();
        setSources(data || []);
      } else {
        const logData = await api.getScraperLogs();
        setLogs(logData || []);
      }
    } catch (err) {
      console.error('Failed to load scraper admin data:', err);
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setTogglingSource(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-hairline rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Admin Console & Crawler Governance
              </h2>
              <p className="font-mono-micro text-mono-micro text-outline">
                PRD §FR-9: Administrative Controls & Execution Logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-hairline transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-4 pb-2 border-b border-hairline">
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg font-mono-micro text-mono-micro uppercase transition ${
              activeTab === 'sources'
                ? 'bg-surface-container-high text-primary font-bold border border-hairline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sources Governance
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-mono-micro text-mono-micro uppercase transition ${
              activeTab === 'logs'
                ? 'bg-surface-container-high text-primary font-bold border border-hairline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Audit History Logs
          </button>
        </div>

        {message && (
          <div className="mt-3 p-3 bg-tertiary-container/20 border border-tertiary/40 text-tertiary rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {/* Body */}
        <div className="mt-4">
          {loading ? (
            <div className="py-12 text-center text-mono-micro text-outline">
              Loading administration telemetry...
            </div>
          ) : activeTab === 'sources' ? (
            <div className="space-y-3">
              {sources.map((src) => {
                const isActive = src.status === 'active';
                return (
                  <div
                    key={src.id || src.name}
                    className="p-4 rounded-xl bg-surface-container border border-hairline flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-tertiary animate-pulse' : 'bg-outline'
                          }`}
                        />
                        <h4 className="font-body-md font-bold text-on-surface capitalize">
                          {src.name}
                        </h4>
                        <span className="font-mono-micro text-mono-micro px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant border border-hairline uppercase">
                          {src.type}
                        </span>
                      </div>
                      <p className="font-mono-micro text-mono-micro text-outline mt-1 truncate max-w-md">
                        {src.url || 'Internal RFC822 IMAP Extractor'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggle(src.name)}
                      disabled={togglingSource === src.name}
                      className={`px-3 py-1.5 rounded-lg font-mono-micro text-mono-micro font-bold border transition ${
                        isActive
                          ? 'bg-tertiary-container/20 text-tertiary border-tertiary/40'
                          : 'bg-surface-container-high text-outline border-hairline'
                      }`}
                    >
                      {isActive ? 'ENABLED' : 'PAUSED'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left font-mono-micro text-mono-micro">
                <thead className="bg-surface-container text-on-surface-variant uppercase border-b border-hairline sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Found</th>
                    <th className="py-2 px-3">Added</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logs.map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-surface-container transition">
                      <td className="py-2 px-3 text-on-surface">
                        {log.started_at ? new Date(log.started_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-secondary">{log.source_id || 'System'}</td>
                      <td className="py-2 px-3">{log.records_found ?? 0}</td>
                      <td className="py-2 px-3 text-tertiary">+{log.records_added ?? 0}</td>
                      <td className="py-2 px-3">
                        {log.errors ? (
                          <span className="text-error truncate max-w-[150px] block">
                            {log.errors}
                          </span>
                        ) : (
                          <span className="text-tertiary">Success</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-hairline flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-body-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
