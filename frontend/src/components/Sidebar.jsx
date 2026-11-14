import React from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  savedCount = 0,
  applicationsCount = 0,
  onOpenAdmin,
  isOpenMobile,
  onCloseMobile,
}) {
  const navItems = [
    {
      id: 'radar',
      label: 'Opportunity Stream',
      icon: 'radar',
      badge: null,
    },
    {
      id: 'pipeline',
      label: 'Active Pipeline',
      icon: 'view_kanban',
      badge: applicationsCount > 0 ? applicationsCount : null,
      badgeColor: 'bg-primary-container text-on-primary',
    },
    {
      id: 'saved',
      label: 'Saved Opportunities',
      icon: 'bookmark',
      badge: savedCount > 0 ? savedCount : null,
      badgeColor: 'bg-surface-container-highest text-secondary',
    },
    {
      id: 'scrapers',
      label: 'Crawler Topology',
      icon: 'hub',
      badge: 'LIVE',
      badgeColor: 'bg-tertiary-container/30 text-tertiary',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden animate-in fade-in duration-150"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 max-w-[80vw] bg-surface-container-lowest z-50 lg:z-40 flex flex-col justify-between pt-16 lg:pt-20 pb-6 px-4 border-r border-hairline transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-5 sm:gap-6">
          {/* Header indicator & mobile close button */}
          <div className="px-3 flex items-center justify-between">
            <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
              Telemetry Feeds
            </span>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-md text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold shadow-sm border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-body-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    <span className="text-body-sm">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`font-mono-micro text-mono-micro px-1.5 py-0.5 rounded font-bold ${
                        item.badgeColor || 'bg-surface-container-highest text-secondary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Block */}
        <div className="flex flex-col gap-3 px-2">
          {/* Engine health gauge */}
          <div className="p-3 rounded-lg bg-surface-container-low border border-hairline flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-micro text-mono-micro text-on-surface-variant">
                SYNC ENGINE
              </span>
              <span className="font-mono-micro text-mono-micro text-tertiary font-bold">
                99.98%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full w-[94%] transition-all"></div>
            </div>
            <span className="font-mono-micro text-mono-micro text-outline text-[10px]">
              5 sources • 24h cron active
            </span>
          </div>

          {/* Admin console button */}
          <button
            onClick={() => {
              if (onOpenAdmin) onOpenAdmin();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-body-sm"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">
                shield
              </span>
              <span>Admin Console</span>
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">
              lock
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
