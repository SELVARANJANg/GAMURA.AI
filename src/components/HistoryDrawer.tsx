import React, { useState } from 'react';
import { Pin, Edit2, Trash2, Search, X } from 'lucide-react';
import { Thread } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  onDeleteThread: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onTogglePin,
  onRenameThread,
  onDeleteThread,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Sort: pinned first, then newest
  const filteredThreads = threads
    .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.t - a.t);

  const handleRename = (thread: Thread) => {
    const newName = window.prompt('Rename chat', thread.title);
    if (newName && newName.trim()) {
      onRenameThread(thread.id, newName.trim().slice(0, 60));
    }
  };

  const handleDelete = (thread: Thread) => {
    if (window.confirm('Delete this chat?')) {
      onDeleteThread(thread.id);
    }
  };

  return (
    <>
      {/* Backdrop Scrim */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[min(88vw,340px)] z-50 bg-[var(--bg)] border-r border-[var(--ln)] flex flex-col p-[calc(14px+env(safe-area-inset-top,0px))] px-3 pb-3.5 transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-[105%]'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[26px] font-bold tracking-[-0.6px] text-[var(--tx)]">
            Chats
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative my-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full py-2 px-3 pl-8 rounded-[10px] bg-[var(--bg3)] text-[var(--tx)] text-[14px] placeholder:text-[var(--mu)] outline-none focus:ring-1.5 focus:ring-[var(--ac)]"
          />
          <Search className="w-4 h-4 text-[var(--mu)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Threads list */}
        <div className="flex-1 overflow-y-auto my-2 space-y-1 pr-1">
          {filteredThreads.length === 0 ? (
            <p className="text-[var(--mu)] text-[14px] p-3 text-center">
              {threads.length === 0 ? 'No chats yet.' : 'No matching chats.'}
            </p>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  className={`flex items-center rounded-[12px] p-0.5 transition-colors group ${
                    isActive ? 'bg-[var(--bg3)] font-medium' : 'hover:bg-[var(--bg3)]/50'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectThread(thread.id);
                      onClose();
                    }}
                    className="flex-1 text-left py-2.5 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] text-[var(--tx)]"
                  >
                    {thread.pin && (
                      <span className="text-[var(--ac)] mr-1.5 font-bold">★</span>
                    )}
                    {thread.title}
                  </button>

                  <button
                    onClick={() => onTogglePin(thread.id)}
                    className="w-7 h-7 flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] transition-colors"
                    aria-label={thread.pin ? 'Unpin' : 'Pin'}
                    title={thread.pin ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${thread.pin ? 'fill-[var(--ac)] text-[var(--ac)]' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleRename(thread)}
                    className="w-7 h-7 flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] transition-colors"
                    aria-label="Rename"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(thread)}
                    className="w-7 h-7 flex items-center justify-center text-[var(--mu)] hover:text-[var(--rd)] transition-colors"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Wide Bottom New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full py-3.5 rounded-[14px] bg-[var(--ac)] text-[var(--fg)] font-bold text-[15.5px] transition-transform active:scale-[0.98] shadow-md hover:opacity-95"
        >
          New chat
        </button>
      </aside>
    </>
  );
};
