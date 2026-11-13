import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  RefreshCw,
  Power
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scraper Engine & Source Management</h2>
              <p className="text-xs text-slate-500">PRD §FR-9: Administrative Controls & Scraper Execution Logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 mt-4 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sources'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configured Sources ({sources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'sources' ? (
            <div className="space-y-3">
              {sources.map((src) => {
                const isActive = src.status === 'active';
                return (
                  <div
                    key={src.id}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm capitalize">
                          {src.name.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-full text-slate-600 uppercase">
                          {src.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {src.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        URL: <a href={src.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{src.url}</a>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Last Run: {src.last_scraped ? new Date(src.last_scraped).toLocaleString() : 'Never'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggle(src.name)}
                      disabled={togglingSource === src.name}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition ${
                        isActive
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Disable' : 'Enable'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Started</th>
                    <th className="py-2.5 px-3">Found</th>
                    <th className="py-2.5 px-3">Added</th>
                    <th className="py-2.5 px-3">Duplicates</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900 capitalize">
                        {log.source_name}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {log.started_at ? new Date(log.started_at).toLocaleTimeString() : '-'}
                      </td>
                      <td className="py-2 px-3 font-medium">{log.records_found}</td>
                      <td className="py-2 px-3 text-emerald-600 font-semibold">+{log.records_added}</td>
                      <td className="py-2 px-3 text-slate-500">{log.duplicates}</td>
                      <td className="py-2 px-3">
                        {log.errors > 0 ? (
                          <span className="inline-flex items-center text-rose-600 font-semibold" title={log.error_detail}>
                            <AlertTriangle className="w-3 h-3 mr-1" /> Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
