'use client';

import { useRef, useEffect } from 'react';
import { OLEDAnimation, animations } from '@/data/animations';
import OLEDCanvas from './OLEDCanvas';

const CATEGORIES = ['all', 'emoji', 'icons', 'loaders', 'indian', 'festival', 'text_fx'];
const SIZES = [32, 48, 64] as const;

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

  const filteredAnimations = animations.filter(anim => {
    // 1. Filter by category
    if (activeCategory !== 'all' && anim.category !== activeCategory) return false;
    
    // 2. Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = anim.name.toLowerCase().includes(q);
      const matchTag = anim.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }

    // 3. Filter implicitly by size (only show if it supports activeSize)
    if (!anim.supportedSizes.includes(activeSize)) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full w-full lg:w-[52%] lg:border-r border-border bg-bg">
      {/* Filter Bar */}
      <div className="sticky top-0 bg-surface border-b border-border z-10">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-3 text-sm transition-colors ${
                activeCategory === cat
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-dim hover:text-text'
              }`}
            >
              {"//"} {cat}
            </button>
          ))}
        </div>
        
        {/* Count Indicator */}
        <div className="px-4 py-1 text-[10px] text-dim border-b border-border">
          {"//"} {filteredAnimations.length} animations found
        </div>
        
        {/* Sub-filters (Size & Search) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
          {/* Size Selector */}
          <div className="flex items-center space-x-2">
            {SIZES.map(size => (
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
            {"//"} no animations found for query
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredAnimations.map((anim) => {
              const isSelected = selectedAnimation.id === anim.id;
              
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
                    <div className={`text-xs mb-1 transition-colors ${isSelected ? 'text-accent' : 'text-text'}`}>
                      {anim.name}
                    </div>
                    <div className="text-dim text-[11px]">
                      {"//"} GFX · {anim.totalFrames} frames · {Math.round(1000/anim.fps)}ms
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
