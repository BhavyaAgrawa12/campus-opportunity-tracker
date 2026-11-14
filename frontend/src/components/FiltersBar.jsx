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
    <div className="bg-surface-container-low border border-hairline rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
      {/* Top row: Search input + Sorting + Live/Expired Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3.5 top-2.5">
            search
          </span>
          <input
            type="text"
            placeholder="Filter roles, companies, or skills (e.g. Stripe, Python, React, AI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-body-sm bg-surface-container border border-hairline rounded-lg text-on-surface focus:outline-none focus:border-secondary placeholder:text-outline"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-outline hover:text-on-surface transition"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Pills: Live vs All vs Expired */}
        <div className="flex items-center gap-1 bg-surface-container-highest p-1 rounded-lg border border-hairline w-full md:w-auto justify-center">
          <button
            onClick={() => setStatusFilter('live')}
            className={`px-3 py-1 rounded font-mono-micro text-mono-micro uppercase transition ${
              statusFilter === 'live'
                ? 'bg-secondary-container text-on-secondary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Live Only
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded font-mono-micro text-mono-micro uppercase transition ${
              statusFilter === 'all'
                ? 'bg-surface-container-high text-on-surface font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Feeds
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1 rounded font-mono-micro text-mono-micro uppercase transition ${
              statusFilter === 'expired'
                ? 'bg-surface-container-high text-outline font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expired
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-mono-micro text-mono-micro text-on-surface-variant uppercase hidden sm:inline">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-body-sm bg-surface-container border border-hairline rounded-lg text-on-surface focus:outline-none focus:border-secondary font-mono-micro"
          >
            <option value="posted_at" className="bg-surface-container">Recently Ingested</option>
            <option value="deadline" className="bg-surface-container">Closing Soonest</option>
            <option value="title" className="bg-surface-container">Role Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Category chips + Paid toggle + Clear filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-mono-micro font-mono-micro uppercase transition ${
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
        <div className="flex items-center gap-3">
          {/* Paid / Stipend toggle */}
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPaidOnly}
              onChange={(e) => setIsPaidOnly(e.target.checked)}
              className="rounded bg-surface-container border-hairline text-secondary focus:ring-0 cursor-pointer"
            />
            <span className="font-mono-micro text-mono-micro uppercase">Paid / Stipend Only</span>
          </label>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-mono-micro text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
