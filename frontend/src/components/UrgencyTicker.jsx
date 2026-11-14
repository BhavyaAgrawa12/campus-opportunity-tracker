import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function UrgencyTicker({
  opportunities = [],
  onSelectOpportunity,
  onSyncCompleted,
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [lastSyncTime, setLastSyncTime] = useState('4m ago');

  // Find opportunities with nearest deadlines
  const urgentItems = opportunities
    .filter((opp) => opp.deadline)
    .map((opp) => {
      const today = new Date();
      const deadDate = new Date(opp.deadline);
      const diffMs = deadDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
      return { ...opp, diffDays, diffHours, diffMs };
    })
    .filter((opp) => opp.diffMs > 0)
    .sort((a, b) => a.diffMs - b.diffMs)
    .slice(0, 4);

  const handleInstantSync = async () => {
    setSyncing(true);
    setSyncStatus('Scraping...');
    try {
      await api.triggerScrape();
      setSyncStatus('Updated');
      setLastSyncTime('Just now');
      if (onSyncCompleted) onSyncCompleted();
    } catch (err) {
      console.error('Scrape failed:', err);
      setSyncStatus(err.status === 401 ? 'Auth Req' : 'Error');
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncStatus('Idle');
      }, 3000);
    }
  };

  return (
    <section className="w-full bg-surface-container-lowest border-y border-hairline px-4 lg:px-8 py-2.5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left side: Live Countdown Ticker Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-primary flex-shrink-0 border border-hairline">
            <span className="material-symbols-outlined text-[15px] animate-pulse">
              timer
            </span>
            <span className="font-mono-micro text-mono-micro uppercase tracking-wider font-semibold">
              T-MINUS FEED:
            </span>
          </div>

          {urgentItems.length === 0 ? (
            <div className="text-body-sm text-on-surface-variant font-mono-micro px-2 py-1">
              All deadlines currently stable. Checking telemetry nodes...
            </div>
          ) : (
            urgentItems.map((item, idx) => {
              const isCrit = item.diffDays <= 2;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectOpportunity && onSelectOpportunity(item)}
                  className="group flex items-center gap-2.5 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer flex-shrink-0 border border-hairline shadow-sm"
                >
                  <span className="flex h-2 w-2 relative">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        isCrit ? 'bg-primary-container' : 'bg-secondary'
                      } opacity-75`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isCrit ? 'bg-primary-container' : 'bg-secondary'
                      }`}
                    ></span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition truncate max-w-[140px] sm:max-w-[180px]">
                      {item.title}
                    </span>
                    {isCrit && (
                      <span className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-primary-container text-on-primary font-bold">
                        URGENT
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-mono-code text-mono-code font-bold tracking-tight ${
                      isCrit ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.diffDays <= 1
                      ? `${item.diffHours}h left`
                      : `${item.diffDays}d left`}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right side: Sync engine status & instant trigger button */}
        <div className="flex items-center gap-3.5 flex-shrink-0 self-end lg:self-center">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-low border border-hairline">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant">
              Scrapers Synced <span className="text-tertiary font-semibold">{lastSyncTime}</span>
            </span>
          </div>

          <button
            onClick={handleInstantSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary border border-hairline transition-all text-mono-micro font-mono-micro uppercase"
            title="Trigger multi-source web and email scrape pipeline"
          >
            <span
              className={`material-symbols-outlined text-[15px] ${
                syncing ? 'animate-spin text-primary' : 'text-secondary'
              }`}
            >
              sync
            </span>
            <span>{syncing ? 'Ingesting...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
