import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAuth,
  savedCount = 0,
  applicationsCount = 0,
  onOpenEmailModal,
  onOpenAdminModal,
  onOpenProfile,
  onOpenSearch,
  onToggleMobileSidebar,
  urgentCount = 3,
  matchCount = 14,
}) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-50 border-b border-hairline shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
      <div className="w-full h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Cockpit Emblem & Title */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <div
            onClick={() => setActiveTab('radar')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* Radar emblem icon */}
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-hairline flex items-center justify-center text-primary group-hover:border-primary/50 transition">
              <span className="material-symbols-outlined text-[19px]">radar</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md tracking-tight font-bold text-on-surface">
                RADAR <span className="text-primary font-mono text-[14px]">//</span> OP-TRACK
              </span>
              <span className="hidden sm:inline-block font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest border border-hairline">
                v2.4-PROD
              </span>
            </div>
          </div>

          {/* Quick desktop links */}
          <nav className="hidden xl:flex items-center gap-6 ml-4">
            <button
              onClick={() => setActiveTab('radar')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'radar'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Radar & Feed
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'pipeline'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pipeline & Kanban {applicationsCount > 0 && `(${applicationsCount})`}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'saved'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Saved ({savedCount})
            </button>
            <button
              onClick={() => setActiveTab('scrapers')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'scrapers'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Scraper Health
            </button>
          </nav>
        </div>

        {/* Right side controls: Telemetry Pill, Search ⌘K, Email Sync, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Active matches & closing pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-hairline">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
            </span>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant">
              <span className="text-secondary font-semibold">{matchCount} Active Matches</span>
              <span className="text-outline mx-1.5">•</span>
              <span className="text-primary font-semibold">{urgentCount} Closing &lt;48h</span>
            </span>
          </div>

          {/* Quick Search ⌘K Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-hairline text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all"
            title="Search Opportunities (Press ⌘K or /)"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              search
            </span>
            <span className="font-body-sm text-body-sm hidden sm:inline">Find Roles</span>
            <kbd className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline border border-hairline">
              ⌘K
            </kbd>
          </button>

          {/* College Email Sync Modal Button */}
          <button
            onClick={onOpenEmailModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-hairline text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-all text-body-sm"
            title="Manage Poornima / Personal IMAP Mailbox (Nomination tag)"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">
              mail
            </span>
            <span className="hidden lg:inline text-xs font-mono">Mailbox</span>
          </button>

          {/* Admin shortcut on lg */}
          <button
            onClick={onOpenAdminModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-body-sm"
            title="Admin Console & Ingest Controls"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span className="text-xs">Admin</span>
          </button>

          {/* User Profile or Sign-in button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-hairline">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-high transition group text-left"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-secondary-container to-primary-container flex items-center justify-center font-bold text-xs text-on-surface shadow-sm">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-tertiary shadow-[0_0_0_2px_#0f131c]"></span>
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface group-hover:text-primary transition truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="font-mono-micro text-mono-micro text-on-surface-variant truncate max-w-[120px]">
                    {user.domain || "Poornima '25"}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant hidden lg:inline">
                  expand_more
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
