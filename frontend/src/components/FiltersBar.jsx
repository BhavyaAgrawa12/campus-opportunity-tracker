import React from 'react';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'job', label: 'Jobs' },
  { id: 'internship', label: 'Internships' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'workshop', label: 'Workshops' },
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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Top row: Search input + Sorting + Live/Expired Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by role, company, or skills (e.g. Python, React, AI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Toggle: Live vs Expired */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl space-x-1">
            <button
              type="button"
              onClick={() => setStatusFilter('live')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                statusFilter === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'live' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>Live</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                statusFilter === 'expired'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'expired' ? 'bg-white' : 'bg-rose-400'}`} />
              <span>Expired</span>
            </button>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
          >
            <option value="posted_at">Recently Posted</option>
            <option value="deadline">Closest Deadline</option>
            <option value="title">Opportunity Title</option>
          </select>
        </div>
      </div>

      {/* Second row: Category pills + Extra filter dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id || 'all'}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Secondary dropdown filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Domain */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Domains</option>
            <option value="Software Development">Software Dev</option>
            <option value="Web Development">Web Development</option>
            <option value="AI/ML">AI / Machine Learning</option>
            <option value="Cloud / DevOps">Cloud / DevOps</option>
            <option value="Engineering & Tech">Engineering & Tech</option>
          </select>

          {/* Location */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
          </select>

          {/* Paid only checkbox */}
          <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 select-none">
            <input
              type="checkbox"
              checked={isPaidOnly}
              onChange={(e) => setIsPaidOnly(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Paid only</span>
          </label>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
