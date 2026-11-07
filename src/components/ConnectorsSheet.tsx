import React, { useState, useEffect } from 'react';
import { Connector, ACCENTS } from '../types';

interface ConnectorsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'c' | 's';
  onTabChange: (tab: 'c' | 's') => void;
  allConnectors: Connector[];
  connectedIds: string[];
  onToggleConnector: (id: string) => void;
  onRemoveCustomConnector: (id: string) => void;
  onAddCustomConnector: (name: string, model: string) => void;
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
  onRemoveCustomConnector,
  onAddCustomConnector,
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
  const [customName, setCustomName] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [puterStatus, setPuterStatus] = useState<string>('Checking...');
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check Puter status
  const checkPuter = async () => {
    if (typeof window === 'undefined' || !window.puter) {
      setPuterStatus('Built-in Gemini Active (Puter optional)');
      return;
    }
    try {
      if (window.puter.auth && window.puter.auth.isSignedIn()) {
        const user = await window.puter.auth.getUser();
        setPuterStatus(`Signed in as ${user.username || 'user'}`);
        setIsSignedIn(true);
      } else {
        setPuterStatus('Sign in to unlock third-party models');
        setIsSignedIn(false);
      }
    } catch (e) {
      setPuterStatus('Built-in Gemini Active & Fast');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkPuter();
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    if (typeof window !== 'undefined' && window.puter?.auth) {
      try {
        await window.puter.auth.signIn();
        await checkPuter();
        onShowToast('Signed in successfully');
      } catch (err: any) {
        onShowToast('Sign in cancelled or unavailable');
      }
    } else {
      onShowToast('Puter service not detected; built-in Gemini is active');
    }
  };

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
    onShowToast(`Added connector ${name}`);
  };

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
        className={`fixed left-0 right-0 bottom-0 top-[max(env(safe-area-inset-top,0px),28px)] max-w-[680px] mx-auto z-50 bg-[var(--bg)] border border-[var(--ln)] rounded-t-[24px] shadow-2xl flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
              Connectors
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
              {/* Account Section */}
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Account
              </p>
              <div className="bg-[var(--bg2)] rounded-[14px] mx-3.5 overflow-hidden border border-[var(--ln)]">
                <div className="flex items-center gap-3 p-3 min-h-[54px]">
                  <div className="w-[38px] h-[38px] rounded-[11px] bg-[var(--ac)] text-[var(--fg)] grid place-items-center font-extrabold text-[16px] shrink-0">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="block text-[15px] text-[var(--tx)]">Puter & AI Engine</b>
                    <small className="block text-[var(--mu)] text-[12.5px] truncate">
                      {puterStatus}
                    </small>
                  </div>
                  {!isSignedIn && (
                    <button
                      onClick={handleSignIn}
                      className="py-1.5 px-3.5 rounded-full bg-[var(--ac)] text-[var(--fg)] font-bold text-[13px] transition-transform active:scale-95 shadow-sm"
                    >
                      Sign in
                    </button>
                  )}
                </div>
              </div>

              {/* AI Connectors Section */}
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                AI connectors
              </p>
              <div className="bg-[var(--bg2)] rounded-[14px] mx-3.5 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)]">
                {allConnectors.map((c) => {
                  const isEnabled = connectedIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 min-h-[54px] hover:bg-[var(--bg3)]/30 transition-colors"
                    >
                      <div
                        className="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-extrabold text-[16px] shrink-0 text-white"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <b className="block text-[15px] text-[var(--tx)]">{c.name}</b>
                        <small className="block text-[var(--mu)] text-[12.5px] truncate">
                          {c.by} – {c.desc || c.model}
                        </small>
                      </div>

                      {c.custom && (
                        <button
                          onClick={() => onRemoveCustomConnector(c.id)}
                          className="py-1 px-2.5 rounded-full bg-[var(--bg3)] text-[var(--tx)] text-[12px] font-semibold hover:bg-[var(--rd)] hover:text-white transition-colors"
                        >
                          Remove
                        </button>
                      )}

                      {/* iOS Style Switch */}
                      <label className="relative inline-block w-[51px] h-[31px] shrink-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => onToggleConnector(c.id)}
                          className="sr-only peer"
                        />
                        <span className="absolute inset-0 rounded-full bg-[var(--bg3)] transition-colors duration-250 peer-checked:bg-[var(--ac)]" />
                        <span className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-250 peer-checked:translate-x-[20px]" />
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Add your own Section */}
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Add your own
              </p>
              <form
                onSubmit={handleAddConnector}
                className="bg-[var(--bg2)] rounded-[14px] mx-3.5 overflow-hidden border border-[var(--ln)] p-3 space-y-2.5"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name, e.g. Qwen"
                    className="flex-1 min-w-0 py-2 px-3 rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] text-[14px] placeholder:text-[var(--mu)] outline-none focus:ring-1.5 focus:ring-[var(--ac)]"
                  />
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="Puter model id"
                    className="flex-1 min-w-0 py-2 px-3 rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] text-[14px] placeholder:text-[var(--mu)] outline-none focus:ring-1.5 focus:ring-[var(--ac)]"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="py-1.5 px-4 rounded-full bg-[var(--ac)] text-[var(--fg)] font-bold text-[13px] transition-transform active:scale-95 shadow-sm"
                  >
                    Add connector
                  </button>
                </div>
              </form>

              <p className="mx-5.5 my-3 text-[12.5px] text-[var(--mu)]">
                Tip: type @claude or @gemini at the start of a message to ask one AI directly.
              </p>
            </div>
          ) : (
            /* TAB 2: SETTINGS */
            <div>
              {/* Appearance Section */}
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Appearance
              </p>
              <div className="bg-[var(--bg2)] rounded-[14px] mx-3.5 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)]">
                {/* Theme Switcher */}
                <div className="flex items-center justify-between p-3 min-h-[54px]">
                  <span className="text-[15px] text-[var(--tx)] font-medium">Theme</span>
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
                <div className="flex items-center justify-between p-3 min-h-[54px]">
                  <span className="text-[15px] text-[var(--tx)] font-medium">Accent</span>
                  <div className="flex items-center gap-2.5">
                    {Object.entries(ACCENTS).map(([key, colors]) => {
                      const isSelected = accent === key;
                      return (
                        <button
                          key={key}
                          onClick={() => onAccentChange(key as any)}
                          style={{ backgroundColor: colors[0] }}
                          className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${
                            isSelected
                              ? 'ring-2 ring-[var(--bg2)] ring-offset-2 ring-offset-[var(--tx)] shadow-md'
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
                <div className="flex items-center justify-between p-3 min-h-[54px]">
                  <span className="text-[15px] text-[var(--tx)] font-medium">Text size</span>
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
              <p className="mx-5 mt-4.5 mb-1.5 text-[13px] text-[var(--mu)] font-semibold">
                Chats
              </p>
              <div className="bg-[var(--bg2)] rounded-[14px] mx-3.5 overflow-hidden border border-[var(--ln)] divide-y divide-[var(--ln)]">
                <button
                  onClick={onExportChat}
                  className="w-full text-left p-3.5 min-h-[54px] text-[15px] text-[var(--tx)] hover:bg-[var(--bg3)]/50 transition-colors font-medium"
                >
                  Export this chat
                </button>
                <button
                  onClick={onDeleteAllChats}
                  className="w-full text-left p-3.5 min-h-[54px] text-[15px] text-[var(--rd)] hover:bg-[var(--bg3)]/50 transition-colors font-semibold"
                >
                  Delete all chats
                </button>
              </div>

              <p className="mx-5.5 my-3 text-[12.5px] text-[var(--mu)]">
                Gamura AI keeps chats on this device only. AI replies come through your Puter account or fast built-in Gemini.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
