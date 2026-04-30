'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { OLEDAnimation, animations } from '@/data/animations';
import OLEDCanvas from './OLEDCanvas';

const CATEGORIES = ['all', 'emoji', 'robot_eyes', 'icons', 'loaders', 'indian', 'festival', 'text_fx'];
const SIZES = [32, 48, 64] as const;

type SortKey = 'recent' | 'most_run' | 'most_viewed';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'recent' },
  { value: 'most_run', label: 'most run' },
  { value: 'most_viewed', label: 'most viewed' },
];

interface Counters {
  views: number | null;
  runs: number | null;
}

interface Props {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeSize: 32 | 48 | 64;
  setActiveSize: (size: 32 | 48 | 64) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAnimation: OLEDAnimation;
  setSelectedAnimation: (anim: OLEDAnimation) => void;
}

const formatCount = (n: number | null): string => {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US');
};

export default function LeftPanel({
  activeCategory,
  setActiveCategory,
  activeSize,
  setActiveSize,
  searchQuery,
  setSearchQuery,
  selectedAnimation,
  setSelectedAnimation
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [counters, setCounters] = useState<Record<string, Counters>>({});

  // Restore saved sort from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pixbyte_sort');
      if (saved === 'recent' || saved === 'most_run' || saved === 'most_viewed') {
        setSort(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist sort changes
  useEffect(() => {
    try {
      localStorage.setItem('pixbyte_sort', sort);
    } catch {
      // ignore
    }
  }, [sort]);

  // Fetch counters once on mount; graceful fallback if endpoint missing
  useEffect(() => {
    let cancelled = false;
    fetch('/api/counters')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.counters) setCounters(data.counters);
      })
      .catch(() => {
        // ignore — counters stay as null/—
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAnimations = useMemo(() => {
    const filtered = animations.filter((anim) => {
      if (activeCategory !== 'all' && anim.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = anim.name.toLowerCase().includes(q);
        const matchTag = anim.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchTag) return false;
      }
      if (!anim.supportedSizes.includes(activeSize)) return false;
      return true;
    });

    if (sort === 'recent') {
      // Newest first by createdAt; falls back to source order on equal dates
      return [...filtered].sort((a, b) => {
        if (a.createdAt === b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    }
    if (sort === 'most_run' || sort === 'most_viewed') {
      const key = sort === 'most_run' ? 'runs' : 'views';
      return [...filtered].sort((a, b) => {
        const av = counters[a.id]?.[key] ?? 0;
        const bv = counters[b.id]?.[key] ?? 0;
        return (bv ?? 0) - (av ?? 0);
      });
    }
    return filtered;
  }, [activeCategory, activeSize, searchQuery, sort, counters]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'recent';

  return (
    <div className="flex flex-col h-full w-full lg:w-[52%] lg:border-r border-border bg-bg">
      {/* Filter Bar */}
      <div className="sticky top-0 bg-surface border-b border-border z-10">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-3 text-sm transition-colors ${
                activeCategory === cat
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-dim hover:text-text'
              }`}
            >
              {'//'} {cat}
            </button>
          ))}
        </div>

        {/* Count + Sort */}
        <div className="px-4 py-1 text-[10px] text-dim border-b border-border flex items-center justify-between gap-2">
          <span>
            {'//'} {filteredAnimations.length} animations found
          </span>
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              onBlur={() => setTimeout(() => setSortOpen(false), 120)}
              className="text-dim hover:text-accent transition-colors"
            >
              {'//'} sort: [{currentSortLabel} {sortOpen ? '▲' : '▼'}]
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-5 bg-surface border border-border z-20 flex flex-col min-w-[140px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onMouseDown={(e) => {
                      // mousedown fires before blur → keeps menu open until commit
                      e.preventDefault();
                      setSort(opt.value);
                      setSortOpen(false);
                    }}
                    className={`text-left px-3 py-1 text-[10px] hover:bg-accent/10 transition-colors ${
                      sort === opt.value ? 'text-accent' : 'text-dim'
                    }`}
                  >
                    {'//'} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sub-filters (Size & Search) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
          {/* Size Selector */}
          <div className="flex items-center space-x-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setActiveSize(size)}
                className={`px-3 py-1 text-xs border ${
                  activeSize === size
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-dim hover:border-accent hover:text-text'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-sm flex items-center bg-bg border border-border px-3 py-1 focus-within:border-accent transition-colors">
            <span className="text-accent text-sm mr-2">&gt;</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search animations_ [/]"
              className="bg-transparent w-full outline-none text-sm text-text placeholder-dim font-mono"
            />
          </div>
        </div>
      </div>

      {/* Animation Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAnimations.length === 0 ? (
          <div className="text-dim text-sm text-center py-8">
            {'//'} no animations found for query
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredAnimations.map((anim) => {
              const isSelected = selectedAnimation.id === anim.id;
              const c = counters[anim.id];
              return (
                <div
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim)}
                  className={`bg-surface border transition-colors cursor-pointer ${
                    isSelected ? 'border-accent' : 'border-border hover:border-text/50'
                  }`}
                >
                  {/* Canvas Preview Area */}
                  <div className="w-full flex justify-center py-2 bg-black border-b border-border">
                    <OLEDCanvas
                      animation={anim}
                      size={activeSize}
                      scale={2}
                      showCounter={false}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`text-xs mb-1 transition-colors truncate ${
                          isSelected ? 'text-accent' : 'text-text'
                        }`}
                      >
                        {anim.name}
                      </div>
                      <Link
                        href={`/a/${anim.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`// open ${anim.name}`}
                        className="text-dim hover:text-accent transition-colors text-[11px] px-1 shrink-0 border border-border hover:border-accent"
                      >
                        [→]
                      </Link>
                    </div>
                    <div className="text-dim text-[11px]">
                      {'//'} by {anim.creator} ·{' '}
                      {anim.category === 'robot_eyes'
                        ? 'rounded_rect'
                        : `${anim.totalFrames} frames`}{' '}
                      · {Math.round(1000 / anim.fps)}ms
                    </div>
                    <div className="text-dim text-[10px] mt-0.5">
                      {'//'} {formatCount(c?.views ?? null)} views ·{' '}
                      {formatCount(c?.runs ?? null)} runs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
