import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { SuggestionCards } from './SuggestionCards';
import { ContextSummarizerBadge } from './ContextSummarizerBadge';
import { extractContextTopics } from '../utils/contextSummarizer';

interface VirtualizedChatProps {
  messages: Message[];
  threadTitle?: string;
  isBusy: boolean;
  onSendSuggestion: (prompt: string) => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onRedo: (index: number) => void;
}

interface ItemData {
  messages: Message[];
  isBusy: boolean;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onRedo: (index: number) => void;
  sizeMap: Map<number, number>;
  listRef: React.RefObject<List | null>;
}

// Measured Row component rendering memoized MessageItem inside react-window virtual item
const VirtualizedRow = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const msg = data.messages[index];
  const isLast = index === data.messages.length - 1;

  useEffect(() => {
    if (rowRef.current) {
      const height = rowRef.current.getBoundingClientRect().height;
      const current = data.sizeMap.get(index);
      if (height > 0 && Math.abs((current || 0) - height) > 4) {
        data.sizeMap.set(index, height);
        data.listRef.current?.resetAfterIndex(index, false);
      }
    }
  });

  if (!msg) return null;

  return (
    <div style={style} className="px-3.5 py-1.5 flex flex-col justify-start">
      <div ref={rowRef} className="w-full flex flex-col">
        <MessageItem
          message={msg}
          index={index}
          isLast={isLast}
          isBusy={data.isBusy}
          onCopy={data.onCopy}
          onSpeak={data.onSpeak}
          onRedo={data.onRedo}
        />
      </div>
    </div>
  );
};

export const VirtualizedChat: React.FC<VirtualizedChatProps> = ({
  messages,
  threadTitle,
  isBusy,
  onSendSuggestion,
  onCopy,
  onSpeak,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List | null>(null);
  const sizeMapRef = useRef<Map<number, number>>(new Map());
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isAtBottomRef = useRef(true);

  // Extract key topics for thread context summarizer badge
  const topics = useMemo(
    () => extractContextTopics(messages, threadTitle),
    [messages, threadTitle]
  );

  // Measure container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 360,
          height: containerRef.current.clientHeight || 500,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute estimated item size if not yet measured
  const getItemSize = useCallback(
    (index: number) => {
      const cached = sizeMapRef.current.get(index);
      if (cached && cached > 20) return cached + 12;

      const msg = messages[index];
      if (!msg) return 80;

      if (msg.role === 'user') {
        const charLen = msg.content?.length || 1;
        const lines = Math.ceil(charLen / 36);
        return Math.max(64, lines * 24 + 32);
      }

      if (msg.kind === 'compare') {
        return 380;
      }

      if (msg.kind === 'council') {
        const charLen = msg.content?.length || 80;
        const lines = Math.ceil(charLen / 46);
        return Math.max(220, lines * 26 + 180);
      }

      // Standard assistant message
      const charLen = msg.content?.length || 80;
      const lines = Math.ceil(charLen / 45);
      return Math.max(96, lines * 26 + 68);
    },
    [messages]
  );

  // Auto-scroll to bottom on streaming or new messages when user was at bottom
  useEffect(() => {
    if (!listRef.current || messages.length === 0) return;

    if (isAtBottomRef.current) {
      // Reset list sizes if content expanded
      listRef.current.resetAfterIndex(Math.max(0, messages.length - 2), false);
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages, isBusy]);

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
      if (scrollUpdateWasRequested) return;

      const estimatedTotalHeight = messages.reduce((acc, _, idx) => acc + getItemSize(idx), 0);
      const distanceFromBottom = estimatedTotalHeight - (scrollOffset + dimensions.height);

      isAtBottomRef.current = distanceFromBottom < 120;
      // Show Jump to Bottom if scrolled away from bottom
      setShowScrollBottom(distanceFromBottom > 280);
      // Show Back to Top if scrolled significantly down into the list
      setShowScrollTop(scrollOffset > 320);
    },
    [messages, getItemSize, dimensions.height]
  );

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      isAtBottomRef.current = true;
      listRef.current.scrollToItem(messages.length - 1, 'end');
      setShowScrollBottom(false);
    }
  }, [messages.length]);

  const scrollToTop = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(0, 'start');
      setShowScrollTop(false);
    }
  }, [messages.length]);

  const itemData = useMemo<ItemData>(
    () => ({
      messages,
      isBusy,
      onCopy,
      onSpeak,
      onRedo,
      sizeMap: sizeMapRef.current,
      listRef,
    }),
    [messages, isBusy, onCopy, onSpeak, onRedo]
  );

  if (!messages || messages.length === 0) {
    return (
      <div
        ref={containerRef}
        id="chat"
        className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-3 scroll-smooth"
      >
        <SuggestionCards onSelectSuggestion={onSendSuggestion} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="chat"
      className="relative flex-1 w-full h-full overflow-hidden"
      aria-live="polite"
      role="log"
    >
      {/* Non-intrusive Context Summarizer Badge atop chat */}
      {topics.length > 0 && (
        <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-auto">
          <ContextSummarizerBadge topics={topics} />
        </div>
      )}

      {dimensions.height > 0 && dimensions.width > 0 && (
        <List
          ref={listRef}
          height={dimensions.height}
          width={dimensions.width}
          itemCount={messages.length}
          itemSize={getItemSize}
          itemData={itemData}
          onScroll={handleScroll}
          overscanCount={4}
          className="no-scrollbar scroll-smooth"
        >
          {VirtualizedRow}
        </List>
      )}

      {/* Floating Action Buttons: Back to Top & Jump to Bottom */}
      <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom,0px))] right-4 z-20 flex flex-col gap-2">
        {/* Floating Back to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-9 h-9 rounded-full bg-[var(--bg3)] text-[var(--tx)] border border-[var(--ln)] shadow-lg flex items-center justify-center hover:bg-[var(--ac)] hover:text-[var(--fg)] active:scale-90 transition-all cursor-pointer backdrop-blur-md"
            aria-label="Scroll back to top"
            title="Back to Top"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Floating Jump to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="w-9 h-9 rounded-full bg-[var(--bg3)] text-[var(--tx)] border border-[var(--ln)] shadow-lg flex items-center justify-center hover:bg-[var(--ac)] hover:text-[var(--fg)] active:scale-90 transition-all cursor-pointer backdrop-blur-md"
            aria-label="Scroll to newest message"
            title="Jump to bottom"
          >
            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
