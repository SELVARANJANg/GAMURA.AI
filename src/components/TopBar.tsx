import React from 'react';
import { Menu, Edit3, Plus, User as UserIcon } from 'lucide-react';
import { Connector } from '../types';

interface TopBarProps {
  mode: 'chat' | 'compare' | 'council';
  onModeChange: (mode: 'chat' | 'compare' | 'council') => void;
  isBusy: boolean;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onOpenSheet: (tab?: 'c' | 's') => void;
  connectedCount: number;
  currentConnector?: Connector;
  userNickname?: string | null;
  userPhoto?: string | null;
  onOpenAuth: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onModeChange,
  isBusy,
  onOpenHistory,
  onNewChat,
  onOpenSheet,
  connectedCount,
  currentConnector,
  userNickname,
  userPhoto,
  onOpenAuth,
}) => {
  // Caption based on mode
  let caption = '';
  if (mode === 'chat') {
    caption = currentConnector && connectedCount > 0
      ? `Chatting with ${currentConnector.name}`
      : 'No AI connected. Tap + to add one.';
  } else if (mode === 'compare') {
    caption = `Asking ${Math.min(connectedCount, 4)} AIs side by side`;
  } else {
    caption = `${Math.min(connectedCount, 4)} AIs answer, ${currentConnector ? currentConnector.name : 'Gemini'} merges the best`;
  }

  return (
    <header className="glass shrink-0 border-b border-[var(--ln)] px-3 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2.5 z-10 transition-colors">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="w-9 h-9 rounded-full bg-[var(--bg3)] flex items-center justify-center text-[var(--tx)] transition-transform active:scale-90 hover:opacity-90"
            aria-label="Chat history"
          >
            <Menu className="w-5 h-5 text-[var(--tx)]" />
          </button>
        </div>

        {/* Center Title with official Dragon Logo */}
        <div
          onClick={onNewChat}
          className="flex items-center gap-2 font-bold text-[17px] tracking-[-0.2px] select-none cursor-pointer group"
          title="Gamura AI • New Chat"
        >
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
            <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-[var(--ac)] via-[#0a84ff] to-[#bf5af2] shadow-[0_0_8px_var(--ac)] flex items-center justify-center">
              <img
                src="/assets/gamura-logo.png"
                alt="Gamura AI"
                className={`w-full h-full rounded-full object-cover object-center bg-white shadow-inner transition-transform duration-300 ${
                  isBusy ? 'animate-spin scale-110' : 'group-hover:scale-110'
                }`}
              />
            </div>
          </div>
          <span className="text-[var(--tx)]">Gamura AI</span>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {/* User Account / Apple ID Icon */}
          <button
            onClick={onOpenAuth}
            className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 transition-transform active:scale-90 text-[12.5px] font-semibold border ${
              userNickname
                ? 'bg-[var(--bg3)] text-[var(--tx)] border-[var(--ln)]'
                : 'bg-[var(--bg3)]/60 text-[var(--mu)] hover:text-[var(--tx)] border-transparent'
            }`}
            aria-label={userNickname ? `Signed in as ${userNickname}` : 'Sign in'}
            title={userNickname ? `Account: ${userNickname}` : 'Sign in with Apple / Gamura ID'}
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userNickname || 'User'}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--ac)] text-[var(--fg)] flex items-center justify-center text-[10px] font-bold shrink-0">
                {userNickname ? userNickname[0].toUpperCase() : <UserIcon className="w-3 h-3 text-[var(--fg)]" />}
              </div>
            )}
            <span className="hidden sm:inline max-w-[70px] truncate">
              {userNickname || 'Sign in'}
            </span>
          </button>

          <button
            onClick={onNewChat}
            className="w-9 h-9 rounded-full bg-[var(--bg3)] flex items-center justify-center text-[var(--tx)] transition-transform active:scale-90 hover:opacity-90"
            aria-label="New chat"
          >
            <Edit3 className="w-4 h-4 text-[var(--tx)]" />
          </button>

          <button
            onClick={() => onOpenSheet('c')}
            className="w-9 h-9 rounded-full bg-[var(--ac)] text-[var(--fg)] flex items-center justify-center transition-transform active:scale-90 hover:opacity-95 shadow-sm"
            aria-label="Add AI connectors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Segmented Switcher */}
      <div className="flex bg-[var(--bg3)] rounded-[10px] p-[2px] gap-[2px] mt-2.5 mx-auto max-w-[340px] select-none">
        {(['chat', 'compare', 'council'] as const).map((m) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex-1 py-1.5 px-3 rounded-[8px] text-[13px] font-semibold transition-all capitalize ${
                isActive
                  ? 'bg-[var(--bg2)] text-[var(--tx)] shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Dynamic Subtitle Caption */}
      <p className="text-center text-[12.5px] text-[var(--mu)] mt-1.5 transition-opacity">
        {caption}
      </p>
    </header>
  );
};
