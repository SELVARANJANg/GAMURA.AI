import React from 'react';
import { Copy, Volume2, RotateCcw } from 'lucide-react';
import { Message } from '../types';
import { parseMarkdown } from '../utils/markdown';

interface MessageItemProps {
  message: Message;
  index: number;
  isLast: boolean;
  isBusy: boolean;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onRedo: (index: number) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  isLast,
  isBusy,
  onCopy,
  onSpeak,
  onRedo,
}) => {
  const isUser = message.role === 'user';

  // Get raw text representation for copying or speech
  const getRawText = (): string => {
    if (message.content) return message.content;
    if (message.cmp && message.cmp.length > 0) {
      return message.cmp
        .filter((c) => c.content && !c.err)
        .map((c) => `${c.who}:\n${c.content}`)
        .join('\n\n');
    }
    return '';
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement;
    if (target) {
      const code = decodeURIComponent(target.dataset.code || '');
      if (code) {
        onCopy(code);
        const originalText = target.textContent;
        target.textContent = 'Copied!';
        setTimeout(() => {
          target.textContent = originalText;
        }, 1500);
      }
    }
  };

  if (isUser) {
    return (
      <div className="self-end max-w-[86%] py-2.5 px-4 rounded-[20px] rounded-br-[6px] bg-[var(--ac)] text-[var(--fg)] text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-200">
        {message.content}
      </div>
    );
  }

  // Assistant Message
  const isWide = message.kind === 'compare' || message.kind === 'council';

  return (
    <div
      onClick={handleCopyCode}
      className={`self-start ${
        isWide ? 'w-full max-w-full' : 'max-w-[88%]'
      } py-3 px-4 rounded-[20px] rounded-bl-[6px] bg-[var(--bg2)] border ${
        message.err ? 'border-[var(--rd)]' : 'border-[var(--ln)]'
      } text-[var(--tx)] text-[15px] leading-relaxed break-words shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      {/* Compare Mode */}
      {message.kind === 'compare' && (
        <div>
          <div className="text-[12px] font-bold text-[var(--ac)] mb-1">
            Side by side
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scroll-smooth snap-x snap-mandatory no-scrollbar">
            {message.cmp?.map((card, idx) => (
              <div
                key={idx}
                className="flex-none w-[min(84%,320px)] snap-start bg-[var(--bg3)] rounded-[16px] p-3 max-h-[340px] overflow-y-auto text-[14px]"
              >
                <div className="text-[12px] font-bold text-[var(--ac)] mb-1">
                  {card.who}
                </div>
                {card.err ? (
                  <span className="text-[var(--rd)] text-[13px]">{card.content}</span>
                ) : card.content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(card.content),
                    }}
                  />
                ) : (
                  <span className="dots">
                    <b /><b /><b />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Council Mode */}
      {message.kind === 'council' && (
        <div>
          <div className="text-[12px] font-bold text-[var(--ac)] mb-1">
            Council verdict by {message.judge || 'AI'}
          </div>

          {message.content ? (
            <div
              className="prose-content leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(message.content),
              }}
            />
          ) : (
            <div>
              <span className="dots">
                <b /><b /><b />
              </span>
              {message.step && (
                <em className="block text-[12.5px] text-[var(--mu)] not-italic mt-1">
                  {message.step}
                </em>
              )}
            </div>
          )}

          {/* Collapsible raw answers */}
          {message.cmp && message.cmp.length > 0 && (
            <details className="mt-3 pt-2 border-t border-[var(--ln)] group">
              <summary className="cursor-pointer text-[13px] font-semibold text-[var(--mu)] hover:text-[var(--tx)] select-none">
                See each AI’s answer
              </summary>
              <div className="flex gap-2.5 overflow-x-auto mt-2 pb-1.5 snap-x snap-mandatory no-scrollbar">
                {message.cmp.map((card, idx) => (
                  <div
                    key={idx}
                    className="flex-none w-[min(84%,320px)] snap-start bg-[var(--bg3)] rounded-[16px] p-3 max-h-[340px] overflow-y-auto text-[13.5px]"
                  >
                    <div className="text-[12px] font-bold text-[var(--ac)] mb-1">
                      {card.who}
                    </div>
                    {card.err ? (
                      <span className="text-[var(--rd)] text-[12.5px]">{card.content}</span>
                    ) : card.content ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdown(card.content),
                        }}
                      />
                    ) : (
                      <span className="dots">
                        <b /><b /><b />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Standard Chat Mode */}
      {message.kind !== 'compare' && message.kind !== 'council' && (
        <div>
          <div className="text-[12px] font-bold text-[var(--ac)] mb-1">
            {message.who || 'AI'}
          </div>

          {message.content ? (
            <div
              className="prose-content leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(message.content),
              }}
            />
          ) : (
            <div>
              <span className="dots">
                <b /><b /><b />
              </span>
              {message.step && (
                <em className="block text-[12.5px] text-[var(--mu)] not-italic mt-1">
                  {message.step}
                </em>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {message.done && (
        <div className="flex items-center gap-1 mt-2.5 -ml-1 text-[var(--mu)]">
          <button
            onClick={() => onCopy(getRawText())}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg3)] hover:text-[var(--tx)] transition-colors"
            aria-label="Copy"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSpeak(getRawText())}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg3)] hover:text-[var(--tx)] transition-colors"
            aria-label="Read aloud"
            title="Read aloud"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          {isLast && !isBusy && (
            <button
              onClick={() => onRedo(index)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg3)] hover:text-[var(--tx)] transition-colors"
              aria-label="Try again"
              title="Try again"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
