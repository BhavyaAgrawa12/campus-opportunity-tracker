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
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-50 border-b border-hairline shadow-[0_1px_8px_rgba(0,0,0,0.35)] w-full max-w-full overflow-hidden">
      <div className="w-full h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger + Cockpit Emblem & Title */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition flex-shrink-0"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <div
            onClick={() => setActiveTab('radar')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group min-w-0"
          >
            {/* Radar emblem icon */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-container-high border border-hairline flex items-center justify-center text-primary group-hover:border-primary/50 transition flex-shrink-0">
              <span className="material-symbols-outlined text-[17px] sm:text-[19px]">
                radar
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 truncate">
              <span className="font-headline-md text-[16px] sm:text-headline-md tracking-tight font-bold text-on-surface truncate">
                RADAR
                <span className="text-primary font-mono text-[13px] sm:text-[14px] hidden xs:inline sm:inline"> // OP-TRACK</span>
              </span>
              <span className="hidden sm:inline-block font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest border border-hairline flex-shrink-0">
                v2.4
              </span>
            </div>
          </div>

          {/* Quick desktop links */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-6 ml-2 lg:ml-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab('radar')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'radar'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Stream
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`font-body-sm text-body-sm transition-colors ${
                activeTab === 'pipeline'
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pipeline {applicationsCount > 0 && `(${applicationsCount})`}
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
              Topology
            </button>
          </nav>
        </div>

        {/* Right side controls: Telemetry Pill, Search ⌘K, Email Sync, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Active matches pill on desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-hairline">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
            </span>
            <span className="font-mono-micro text-mono-micro text-on-surface-variant">
              <span className="text-secondary font-semibold">{matchCount} Matches</span>
              <span className="text-outline mx-1.5">•</span>
              <span className="text-primary font-semibold">{urgentCount} Closing</span>
            </span>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container-high border border-hairline text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all"
            title="Search Opportunities (Press ⌘K or /)"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">
              search
            </span>
            <span className="font-body-sm text-body-sm hidden md:inline">Find</span>
            <kbd className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline border border-hairline hidden md:inline">
              ⌘K
            </kbd>
          </button>

          {/* College Email Sync Modal Button */}
          <button
            onClick={onOpenEmailModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-hairline text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-all text-body-sm"
            title="Manage Poornima / Personal IMAP Mailbox (Nomination tag)"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">
              mail
            </span>
            <span className="hidden xl:inline text-xs font-mono">Mailbox</span>
          </button>

          {/* User Profile or Sign-in button */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-hairline">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-high transition group text-left"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-secondary-container to-primary-container flex items-center justify-center font-bold text-[11px] sm:text-xs text-on-surface shadow-sm">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-tertiary shadow-[0_0_0_2px_#0f131c]"></span>
                </div>
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface group-hover:text-primary transition truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="font-mono-micro text-mono-micro text-on-surface-variant truncate max-w-[100px]">
                    {user.domain || "Poornima '25"}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">login</span>
              <span className="hidden xs:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
