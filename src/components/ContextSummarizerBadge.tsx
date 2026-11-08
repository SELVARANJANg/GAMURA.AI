import React, { useState } from 'react';
import { Sparkles, ChevronRight, Hash } from 'lucide-react';

interface ContextSummarizerBadgeProps {
  topics: string[];
}

export const ContextSummarizerBadge: React.FC<ContextSummarizerBadgeProps> = ({ topics }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!topics || topics.length === 0) return null;

  return (
    <div className="sticky top-2 z-20 mx-auto px-2 max-w-fit animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[var(--gl)]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-[12px] text-[var(--tx)] select-none">
        <Sparkles className="w-3.5 h-3.5 text-[var(--ac)] shrink-0 animate-pulse" />

        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1 text-[var(--mu)] hover:text-[var(--tx)] font-semibold cursor-pointer"
          >
            <span>{topics.length} Key Topics</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[var(--mu)] text-[11px] uppercase tracking-wider">
              Context:
            </span>
            {topics.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[var(--bg3)]/80 text-[var(--tx)] text-[11.5px] font-semibold border border-white/5"
              >
                <Hash className="w-2.5 h-2.5 text-[var(--ac)] opacity-70" />
                <span>{t}</span>
              </span>
            ))}
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-[10px] text-[var(--mu)] hover:text-[var(--tx)] ml-1 px-1 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              title="Collapse topics"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
