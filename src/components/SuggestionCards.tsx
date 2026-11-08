import React from 'react';
import { SUGGESTIONS } from '../types';

interface SuggestionCardsProps {
  onSelectSuggestion: (prompt: string) => void;
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({ onSelectSuggestion }) => {
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="m-auto w-full max-w-[460px] text-left px-1.5 py-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[var(--ac)] via-[#0a84ff] to-[#bf5af2] shadow-[0_8px_20px_rgba(25,208,127,0.35)] shrink-0 flex items-center justify-center">
          <img
            src="/assets/gamura-logo.png"
            alt="Gamura AI Logo"
            className="w-full h-full rounded-full object-cover object-center bg-white shadow-inner"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-[var(--ac)] uppercase tracking-wider">Gamura AI</span>
          <span className="text-[12px] text-[var(--mu)]">Multi-Model Frontier Aggregator</span>
        </div>
      </div>

      <h1 className="text-[34px] font-bold tracking-[-1px] leading-[1.1] bg-gradient-to-br from-[var(--tx)] to-[var(--ac)] bg-clip-text text-transparent">
        {getGreeting()}.<br />
        What can I help with?
      </h1>
      <p className="text-[var(--mu)] text-[14.5px] mt-2 mb-4.5">
        Gemini, Claude, ChatGPT, NVIDIA, Perplexity and more, together in one place.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {SUGGESTIONS.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(item.prompt)}
            className="text-left p-3.5 rounded-[18px] bg-[var(--bg2)] border border-[var(--ln)] text-[13.5px] leading-[1.35] text-[var(--tx)] transition-all active:scale-[0.97] hover:border-[var(--ac)]/40 hover:bg-[var(--bg3)] shadow-sm"
          >
            <b className="block text-[18px] font-bold text-[var(--tx)] mb-1">
              {item.tag}
            </b>
            <span className="text-[var(--mu)] line-clamp-2">
              {item.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
