import React from 'react';

const CATEGORIES = [
  { id: '', label: 'All Roles' },
  { id: 'job', label: 'Jobs' },
  { id: 'internship', label: 'Internships' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'nomination', label: 'Nominations' },
];

export default function FiltersBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDomain,
  setSelectedDomain,
  selectedLocation,
  setSelectedLocation,
  isPaidOnly,
  setIsPaidOnly,
  statusFilter = 'live',
  setStatusFilter,
  sortBy,
  setSortBy,
  onResetFilters,
}) {
  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    selectedDomain ||
    selectedLocation ||
    isPaidOnly ||
    statusFilter !== 'live' ||
    sortBy !== 'posted_at';

  return (
    <div className="bg-surface-container-low border border-hairline rounded-xl p-3 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3 w-full max-w-full overflow-hidden">
      {/* Top row: Search input + Sorting + Live/Expired Filter */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-center justify-between w-full">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <span className="material-symbols-outlined text-[17px] text-secondary absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            placeholder="Search roles, companies, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-body-sm bg-surface-container border border-hairline rounded-lg text-on-surface focus:outline-none focus:border-secondary placeholder:text-outline truncate"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface transition"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Pills: Live vs All vs Expired */}
        <div className="flex items-center gap-1 bg-surface-container-highest p-1 rounded-lg border border-hairline w-full md:w-auto justify-between sm:justify-center flex-shrink-0">
          <button
            onClick={() => setStatusFilter('live')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded font-mono-micro text-[11px] sm:text-mono-micro uppercase transition text-center ${
              statusFilter === 'live'
                ? 'bg-secondary-container text-on-secondary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Live Only
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded font-mono-micro text-[11px] sm:text-mono-micro uppercase transition text-center ${
              statusFilter === 'all'
                ? 'bg-surface-container-high text-on-surface font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Feeds
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded font-mono-micro text-[11px] sm:text-mono-micro uppercase transition text-center ${
              statusFilter === 'expired'
                ? 'bg-surface-container-high text-outline font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expired
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto flex-shrink-0">
          <span className="font-mono-micro text-[11px] sm:text-mono-micro text-on-surface-variant uppercase hidden sm:inline">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-2.5 py-1.5 sm:py-2 text-xs sm:text-body-sm bg-surface-container border border-hairline rounded-lg text-on-surface focus:outline-none focus:border-secondary font-mono-micro"
          >
            <option value="posted_at" className="bg-surface-container">Recently Ingested</option>
            <option value="deadline" className="bg-surface-container">Closing Soonest</option>
            <option value="title" className="bg-surface-container">Role Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Category chips + Paid toggle + Clear filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-hairline w-full">
        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] sm:text-mono-micro font-mono-micro uppercase transition flex-shrink-0 ${
                  isCatActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-hairline'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filters control options */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Paid / Stipend toggle */}
          <label className="flex items-center gap-2 text-xs sm:text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPaidOnly}
              onChange={(e) => setIsPaidOnly(e.target.checked)}
              className="rounded bg-surface-container border-hairline text-secondary focus:ring-0 cursor-pointer"
            />
            <span className="font-mono-micro text-[11px] sm:text-mono-micro uppercase">Paid Only</span>
          </label>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] sm:text-mono-micro text-primary hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]">refresh</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
