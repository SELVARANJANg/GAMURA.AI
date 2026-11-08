import React, { useState, useEffect } from 'react';
import { Search, Sparkles, CheckCheck } from 'lucide-react';
import { Connector, ACCENTS } from '../types';

interface ConnectorsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'c' | 's';
  onTabChange: (tab: 'c' | 's') => void;
  allConnectors: Connector[];
  connectedIds: string[];
  onToggleConnector: (id: string) => void;
  onConnectAll: () => void;
  onRemoveCustomConnector: (id: string) => void;
  onAddCustomConnector: (name: string, model: string) => void;
  userNickname?: string | null;
  userEmail?: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  theme: 'auto' | 'light' | 'dark';
  onThemeChange: (theme: 'auto' | 'light' | 'dark') => void;
  accent: 'emerald' | 'blue' | 'violet' | 'orange' | 'pink';
  onAccentChange: (accent: 'emerald' | 'blue' | 'violet' | 'orange' | 'pink') => void;
  size: 's' | 'm' | 'l';
  onSizeChange: (size: 's' | 'm' | 'l') => void;
  onExportChat: () => void;
  onDeleteAllChats: () => void;
  onShowToast: (msg: string) => void;
}

export const ConnectorsSheet: React.FC<ConnectorsSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  allConnectors,
  connectedIds,
  onToggleConnector,
  onConnectAll,
  onRemoveCustomConnector,
  onAddCustomConnector,
  userNickname,
  userEmail,
  onOpenAuth,
  onSignOut,
  theme,
  onThemeChange,
  accent,
  onAccentChange,
  size,
  onSizeChange,
  onExportChat,
  onDeleteAllChats,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customModel, setCustomModel] = useState('');

  const handleAddConnector = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const model = customModel.trim();
    if (!name || !model) {
      onShowToast('Enter a name and a model id');
      return;
    }
    onAddCustomConnector(name, model);
    setCustomName('');
    setCustomModel('');
    onShowToast(`Added model ${name}`);
  };

  const filteredConnectors = allConnectors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.by.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet Modal */}
      <section
        className={`fixed left-0 right-0 bottom-0 top-[max(env(safe-area-inset-top,0px),24px)] max-w-[680px] mx-auto z-50 bg-[var(--bg)] border border-[var(--ln)] rounded-t-[24px] shadow-2xl flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-[105%]'
        }`}
        aria-label="Connectors and settings"
      >
        {/* Sheet Top Bar */}
        <div className="flex items-center gap-3 p-3.5 px-4 pb-2.5 border-b border-[var(--ln)] shrink-0">
          <div className="flex-1 flex bg-[var(--bg3)] rounded-[10px] p-[2px] gap-[2px]">
            <button
              onClick={() => onTabChange('c')}
              className={`flex-1 py-1.5 px-3 rounded-[8px] text-[13px] font-semibold transition-all ${
                activeTab === 'c'
                  ? 'bg-[var(--bg2)] text-[var(--tx)] shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              Connectors ({connectedIds.length})
            </button>
            <button
              onClick={() => onTabChange('s')}
              className={`flex-1 py-1.5 px-3 rounded-[8px] text-[13px] font-semibold transition-all ${
                activeTab === 's'
                  ? 'bg-[var(--bg2)] text-[var(--tx)] shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              Settings
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--ac)] font-bold text-[15px] px-2 py-1 transition-opacity hover:opacity-80 active:scale-95"
          >
            Done
          </button>
        </div>

        {/* Sheet Scroll Body */}
        <div className="flex-1 overflow-y-auto pb-[calc(30px+env(safe-area-inset-bottom,0px))]">
          {activeTab === 'c' ? (
            /* TAB 1: CONNECTORS */
            <div>
              {/* Account Status Card with Apple ID / Firebase */}
              <div className="mx-4 mt-3.5 bg-[var(--bg2)] rounded-[16px] border border-[var(--ln)] p-3 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[var(--ac)] text-[var(--fg)] flex items-center justify-center font-black text-[17px] shrink-0">
                    {userNickname ? userNickname[0].toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <b className="text-[14.5px] text-[var(--tx)] truncate">
                        {userNickname || 'Guest User'}
                      </b>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        userNickname ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--bg3)] text-[var(--mu)]'
                      }`}>
                        {userNickname ? 'Cloud Synced' : 'Local Guest'}
                      </span>
                    </div>
                    <small className="block text-[var(--mu)] text-[12px] truncate mt-0.5">
                      {userEmail || 'Sign in to sync your chats across devices in real time'}
                    </small>
                  </div>
                </div>

                {userNickname ? (
                  <button
                    onClick={onSignOut}
                    className="py-1 px-3 rounded-full bg-[var(--bg3)] hover:bg-[var(--rd)] hover:text-white text-[var(--tx)] font-semibold text-[12px] transition-colors shrink-0"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="py-1 px-3.5 rounded-full bg-[var(--ac)] text-[var(--fg)] font-bold text-[12px] transition-transform active:scale-95 shrink-0 shadow-sm"
                  >
                    Sign in
                  </button>
                )}
              </div>

              {/* Search & Bulk Toggle Header */}
              <div className="mx-4 mt-4 mb-2 flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AI models (GAMURA, BUBUBAI, SR...)"
                    className="w-full py-1.5 px-3 pl-8 text-[13px] rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] placeholder:text-[var(--mu)] outline-none focus:ring-1 focus:ring-[var(--ac)]"
                  />
                  <Search className="w-3.5 h-3.5 text-[var(--mu)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={onConnectAll}
                  className="py-1.5 px-3 rounded-[10px] bg-[var(--bg3)] hover:bg-[var(--ac)]/15 text-[var(--ac)] text-[12px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                  title="Enable all models"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Connect All</span>
                </button>
              </div>

              {/* AI Connectors List */}
              <div className="bg-[var(--bg2)] rounded-[16px] mx-4 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)]">
                {filteredConnectors.length === 0 ? (
                  <p className="text-center text-[var(--mu)] text-[13.5px] py-6">
                    No models matching "{searchQuery}"
                  </p>
                ) : (
                  filteredConnectors.map((c) => {
                    const isEnabled = connectedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-3 min-h-[56px] hover:bg-[var(--bg3)]/30 transition-colors"
                      >
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-[12px] flex items-center justify-center font-extrabold text-[15px] shrink-0 text-white shadow-sm"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5">
                            <b className="text-[14.5px] text-[var(--tx)] truncate">{c.name}</b>
                            {c.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--bg3)] text-[var(--mu)] uppercase tracking-wide">
                                {c.badge}
                              </span>
                            )}
                          </div>
                          <small className="block text-[var(--mu)] text-[12px] truncate leading-tight mt-0.5">
                            {c.by} • {c.desc}
                          </small>
                        </div>

                        {c.custom && (
                          <button
                            onClick={() => onRemoveCustomConnector(c.id)}
                            className="py-1 px-2.5 rounded-full bg-[var(--bg3)] text-[var(--rd)] text-[11.5px] font-semibold hover:bg-[var(--rd)] hover:text-white transition-colors"
                          >
                            Remove
                          </button>
                        )}

                        {/* iOS Style Switch */}
                        <label className="relative inline-block w-[48px] h-[28px] shrink-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => onToggleConnector(c.id)}
                            className="sr-only peer"
                          />
                          <span className="absolute inset-0 rounded-full bg-[var(--bg3)] transition-colors duration-200 peer-checked:bg-[var(--ac)]" />
                          <span className="absolute top-[2px] left-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[20px]" />
                        </label>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add your own Section */}
              <p className="mx-5 mt-5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--ac)]" />
                <span>Add any Custom Model</span>
              </p>
              <form
                onSubmit={handleAddConnector}
                className="bg-[var(--bg2)] rounded-[16px] mx-4 overflow-hidden border border-[var(--ln)] p-3 space-y-2.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name, e.g. Cohere Command R+"
                    className="flex-1 min-w-0 py-2 px-3 rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] text-[13.5px] placeholder:text-[var(--mu)] outline-none focus:ring-1 focus:ring-[var(--ac)]"
                  />
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="Model ID, e.g. cohere/command-r-plus"
                    className="flex-1 min-w-0 py-2 px-3 rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] text-[13.5px] placeholder:text-[var(--mu)] outline-none focus:ring-1 focus:ring-[var(--ac)]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[var(--mu)]">
                    Works seamlessly in Chat, Compare & Council
                  </span>
                  <button
                    type="submit"
                    className="py-1.5 px-4 rounded-full bg-[var(--ac)] text-[var(--fg)] font-bold text-[13px] transition-transform active:scale-95 shadow-sm"
                  >
                    Add model
                  </button>
                </div>
              </form>

              <p className="mx-5 my-3 text-[12px] text-[var(--mu)] leading-relaxed">
                Tip: Type <code>@gamura</code>, <code>@bububai</code>, or <code>@sr</code> at the start of any prompt to query that AI instantly.
              </p>
            </div>
          ) : (
            /* TAB 2: SETTINGS */
            <div>
              {/* Appearance Section */}
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Appearance
              </p>
              <div className="bg-[var(--bg2)] rounded-[16px] mx-4 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)] shadow-sm">
                {/* Theme Switcher */}
                <div className="flex items-center justify-between p-3.5 min-h-[54px]">
                  <span className="text-[14.5px] text-[var(--tx)] font-medium">Theme</span>
                  <div className="flex bg-[var(--bg3)] rounded-[10px] p-[2px] gap-[2px]">
                    {(['auto', 'light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onThemeChange(t)}
                        className={`py-1.5 px-3 rounded-[8px] text-[13px] font-semibold transition-all capitalize ${
                          theme === t
                            ? 'bg-[var(--bg2)] text-[var(--tx)] shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Swatches */}
                <div className="flex items-center justify-between p-3.5 min-h-[54px]">
                  <span className="text-[14.5px] text-[var(--tx)] font-medium">Accent</span>
                  <div className="flex items-center gap-2.5">
                    {Object.entries(ACCENTS).map(([key, colors]) => {
                      const isSelected = accent === key;
                      return (
                        <button
                          key={key}
                          onClick={() => onAccentChange(key as any)}
                          style={{ backgroundColor: colors[0] }}
                          className={`w-7 h-7 rounded-full transition-transform active:scale-90 ${
                            isSelected
                              ? 'ring-2 ring-[var(--bg2)] ring-offset-2 ring-offset-[var(--tx)] shadow-md scale-105'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                          aria-label={key}
                          title={key}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Text Size */}
                <div className="flex items-center justify-between p-3.5 min-h-[54px]">
                  <span className="text-[14.5px] text-[var(--tx)] font-medium">Text size</span>
                  <div className="flex bg-[var(--bg3)] rounded-[10px] p-[2px] gap-[2px]">
                    {(
                      [
                        ['s', 'Small'],
                        ['m', 'Medium'],
                        ['l', 'Large'],
                      ] as const
                    ).map(([sz, label]) => (
                      <button
                        key={sz}
                        onClick={() => onSizeChange(sz)}
                        className={`py-1.5 px-3 rounded-[8px] text-[13px] font-semibold transition-all ${
                          size === sz
                            ? 'bg-[var(--bg2)] text-[var(--tx)] shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chats Section */}
              <p className="mx-5 mt-5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Chats & Privacy
              </p>
              <div className="bg-[var(--bg2)] rounded-[16px] mx-4 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)] shadow-sm">
                <button
                  onClick={onExportChat}
                  className="w-full text-left p-3.5 min-h-[54px] text-[14.5px] text-[var(--tx)] hover:bg-[var(--bg3)]/50 transition-colors font-medium flex items-center justify-between"
                >
                  <span>Export this chat as Markdown (.md)</span>
                  <span className="text-[12px] text-[var(--mu)] font-normal">Download</span>
                </button>
                <button
                  onClick={onDeleteAllChats}
                  className="w-full text-left p-3.5 min-h-[54px] text-[14.5px] text-[var(--rd)] hover:bg-[var(--bg3)]/50 transition-colors font-semibold"
                >
                  Delete all chats on this device
                </button>
              </div>

              <p className="mx-5.5 my-3 text-[12px] text-[var(--mu)] leading-relaxed">
                Gamura AI stores chat sessions securely on this browser only. AI streams run free and uncapped via high-performance backend pipelines.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
