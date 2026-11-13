import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Clock, Activity, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Layers, Globe } from 'lucide-react';
import { api } from '../api/client';

export default function ScraperSyncBar({ onSyncCompleted }) {
  const [status, setStatus] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);
  const timerRef = useRef(null);

  // Fetch scraper status from backend
  const fetchStatus = async () => {
    try {
      const data = await api.getScraperStatus();
      setStatus(data);
      if (data && typeof data.seconds_remaining === 'number') {
        setSecondsRemaining(data.seconds_remaining);
      }
      if (data && data.is_running) {
        setIsSyncing(true);
      } else if (!isSyncing) {
        setIsSyncing(false);
      }
    } catch (err) {
      console.warn('Could not fetch scraper status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll backend status every 30 seconds to keep in sync
    const pollInterval = setInterval(fetchStatus, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Live countdown ticker (ticks down every second)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer reached 0; refresh status to pick up the automatic scrape
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Format seconds into HHh MMm SSs
  const formatCountdown = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '--:--:--';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Immediate on-demand scrape trigger
  const handleImmediateScrape = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncToast(null);
    setErrorToast(null);

    try {
      const res = await api.triggerScraperSync();
      if (res && res.scheduler) {
        setStatus(res.scheduler);
        if (typeof res.scheduler.seconds_remaining === 'number') {
          setSecondsRemaining(res.scheduler.seconds_remaining);
        }
      }
      setSyncToast(res.message || 'Scraping run completed successfully!');
      if (onSyncCompleted) {
        onSyncCompleted(res);
      }
    } catch (err) {
      console.error('Scraping trigger failed:', err);
      setErrorToast(err.message || 'Scraping trigger failed. Check backend logs.');
    } finally {
      setIsSyncing(false);
      // Auto-clear toast after 8 seconds
      setTimeout(() => {
        setSyncToast(null);
        setErrorToast(null);
      }, 8000);
    }
  };

  // Format relative last scraped time
  const formatLastScraped = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Banner / Controls */}
      <div className="px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status & 24h Countdown Timer */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isSyncing ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-slate-700 tracking-tight">
              {isSyncing ? 'Syncing Opportunities...' : 'Auto-Scraper Active'}
            </span>
          </div>

          <div className="hidden sm:inline-block h-4 w-px bg-slate-200" />

          {/* 24-hr Countdown Widget */}
          <div
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            title="Campus Opportunity Tracker automatically scans all registered job & hackathon portals every 24 hours."
          >
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-slate-500 font-medium">Next 24h scrape in:</span>
            <span className="font-mono font-bold text-brand-700">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>

          {/* Last scraped timestamp */}
          {status?.last_scraped_at && (
            <span className="hidden lg:inline text-xs text-slate-400">
              Last sync: {formatLastScraped(status.last_scraped_at)}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Refresh / Scrape Now Button */}
          <button
            onClick={handleImmediateScrape}
            disabled={isSyncing}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-xs transition ${
              isSyncing
                ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-98 shadow-brand-500/20'
            }`}
            title="Run an immediate scrape across Unstop, Devpost, Greenhouse, and Remotive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Scraping Sources...' : 'Scrape Now'}</span>
          </button>

          {/* Toggle details drawer */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="View scraper health & source details"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Sources ({status?.sources?.length || 4})</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Notifications / Toast Feedback */}
      {syncToast && (
        <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {errorToast && (
        <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button
            onClick={() => setErrorToast(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expandable Scraper Sources & Pipeline Health Drawer */}
      {expanded && (
        <div className="px-4 py-3 sm:px-6 bg-slate-50/75 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Scraper Sources (Periodic 24h Pipeline)
            </h4>
            <span className="text-[11px] text-slate-400">
              Multi-attribute deduplication & auto-expiry active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-2">
            {(status?.sources || [
              { name: 'unstop', type: 'hackathon', status: 'active' },
              { name: 'devpost', type: 'hackathon', status: 'active' },
              { name: 'company_careers', type: 'company', status: 'active' },
              { name: 'remotive', type: 'job', status: 'active' },
            ]).map((src) => (
              <div
                key={src.name}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-600" />
                    <span className="text-xs font-bold capitalize text-slate-900">
                      {src.name.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                    {src.status || 'Active'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Type: <strong className="capitalize text-slate-700">{src.type}</strong></span>
                  <span>{src.last_scraped ? 'Synced' : 'Ready'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Last run summary metrics if present */}
          {status?.last_run_summary && status.last_run_summary.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs text-slate-600 flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700">Latest Run Audit:</span>
              <span>
                Total Found:{' '}
                <strong>
                  {status.last_run_summary.reduce((acc, r) => acc + (r.records_found || 0), 0)}
                </strong>
              </span>
              <span>
                New Added:{' '}
                <strong className="text-emerald-600">
                  {status.last_run_summary.reduce((acc, r) => acc + (r.records_added || 0), 0)}
                </strong>
              </span>
              <span>
                Duplicates Deduplicated:{' '}
                <strong className="text-brand-600">
                  {status.last_run_summary.reduce((acc, r) => acc + (r.duplicates || 0), 0)}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
