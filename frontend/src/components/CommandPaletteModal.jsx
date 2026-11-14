import React, { useState, useEffect, useRef } from 'react';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  opportunities = [],
  onSelectOpportunity,
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut listener for ⌘K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via document event or props
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = opportunities
    .filter((opp) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const text = `${opp.title} ${opp.organization} ${(opp.skills || []).join(' ')} ${opp.category} ${opp.domain || ''}`.toLowerCase();
      return text.includes(q);
    })
    .slice(0, 8);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-low border border-hairline rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-hairline flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-secondary">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a role, company, or skill (e.g. Stripe, AI, Python)..."
            className="flex-1 bg-transparent text-on-surface font-body-md text-body-md focus:outline-none placeholder:text-outline"
          />
          <kbd className="font-mono-micro text-mono-micro px-2 py-0.5 rounded bg-surface-container-highest text-outline border border-hairline">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-hairline">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-mono-micro text-body-sm">
              No matching opportunities found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  onSelectOpportunity(opp);
                  onClose();
                }}
                className="p-3 rounded-lg hover:bg-surface-container transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body-sm font-semibold text-on-surface group-hover:text-primary transition truncate">
                      {opp.title}
                    </span>
                    <span className="font-mono-micro text-mono-micro px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant uppercase">
                      {opp.category}
                    </span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant truncate mt-0.5">
                    {opp.organization} • {opp.location || 'Remote'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {opp.matchScore > 0 && (
                    <span className="font-mono-micro text-mono-micro px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary border border-secondary/30 font-bold">
                      {opp.matchScore}%
                    </span>
                  )}
                  {opp.deadline && (
                    <span className="font-mono-micro text-mono-micro text-primary">
                      {opp.deadline}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface group-hover:translate-x-0.5 transition">
                    chevron_right
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Hotkey Info */}
        <div className="p-2.5 bg-surface-container-lowest border-t border-hairline flex items-center justify-between font-mono-micro text-mono-micro text-outline px-4">
          <span>Navigate with mouse or click to inspect</span>
          <span>{filtered.length} results displayed</span>
        </div>
      </div>
    </div>
  );
}
