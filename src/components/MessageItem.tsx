import React, { memo, useMemo } from 'react';
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
  onPreviewCode?: (code: string) => void;
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
  message,
  index,
  isLast,
  isBusy,
  onCopy,
  onSpeak,
  onRedo,
  onPreviewCode,
}) => {
  const isUser = message.role === 'user';

  // Memoize raw text representation for copying or speech
  const rawText = useMemo((): string => {
    if (message.content) return message.content;
    if (message.cmp && message.cmp.length > 0) {
      return message.cmp
        .filter((c) => c.content && !c.err)
        .map((c) => `${c.who}:\n${c.content}`)
        .join('\n\n');
    }
    return '';
  }, [message.content, message.cmp]);

  // Memoize parsed markdown HTML to avoid re-parsing on unrelated parent re-renders
  const parsedContent = useMemo(() => {
    if (!message.content) return '';
    return parseMarkdown(message.content);
  }, [message.content]);

  const handleContainerClick = (e: React.MouseEvent) => {
    // 1. Handle Copy Code
    const copyTarget = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement;
    if (copyTarget) {
      const code = decodeURIComponent(copyTarget.dataset.code || '');
      if (code) {
        onCopy(code);
        const originalText = copyTarget.textContent;
        copyTarget.textContent = 'Copied!';
        setTimeout(() => {
          copyTarget.textContent = originalText;
        }, 1500);
      }
      return;
    }

    // 2. Handle In-Chat Isolated Iframe Modal Preview
    const previewTarget = (e.target as HTMLElement).closest('.preview-code-btn') as HTMLElement;
    if (previewTarget) {
      const code = decodeURIComponent(previewTarget.dataset.code || '');
      if (code) {
        if (onPreviewCode) {
          onPreviewCode(code);
          return;
        }

        // Fallback if modal handler not passed
        let fullHtml = code;
        if (!/<html[\s>]/i.test(code)) {
          fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gamura AI • Live UI Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-4 sm:p-8">
  ${code}
</body>
</html>`;
        }
        try {
          const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        } catch (err) {
          console.error('Error opening code preview:', err);
        }
      }
    }
  };

  if (isUser) {
    return (
      <div
        style={{ contentVisibility: 'auto', containIntrinsicSize: '60px' }}
        className="self-end max-w-[86%] py-2.5 px-4 rounded-[20px] rounded-br-[6px] bg-[var(--ac)] text-[var(--fg)] text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-150 flex flex-col gap-2"
      >
        {/* Attached Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-0.5">
            {message.images.map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt="User attached image"
                className="max-h-48 rounded-xl object-cover border border-white/20 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.open(imgUrl, '_blank')}
                title="Click to view full image in new tab"
              />
            ))}
          </div>
        )}
        {message.content && <div>{message.content}</div>}
      </div>
    );
  }

  // Assistant Message
  const isWide = message.kind === 'compare' || message.kind === 'council';

  return (
    <div
      onClick={handleContainerClick}
      style={{ contentVisibility: 'auto', containIntrinsicSize: isWide ? '180px' : '90px' }}
      className={`self-start ${
        isWide ? 'w-full max-w-full' : 'max-w-[88%]'
      } py-3 px-4 rounded-[20px] rounded-bl-[6px] bg-[var(--bg2)] border ${
        message.err ? 'border-[var(--rd)]' : 'border-[var(--ln)]'
      } text-[var(--tx)] text-[15px] leading-relaxed break-words shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-150`}
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

          {parsedContent ? (
            <div
              className="prose-content leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parsedContent,
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

          {parsedContent ? (
            <div
              className="prose-content leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parsedContent,
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
            onClick={() => onCopy(rawText)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg3)] hover:text-[var(--tx)] transition-colors"
            aria-label="Copy"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSpeak(rawText)}
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

// Optimized React.memo comparison: only re-render if message content, step, done state, or last-message status changes
export const MessageItem = memo(MessageItemComponent, (prevProps, nextProps) => {
  // If last-message status or busy status changed, update
  if (prevProps.isLast !== nextProps.isLast) return false;
  if (prevProps.isBusy !== nextProps.isBusy) return false;
  if (prevProps.index !== nextProps.index) return false;

  const prev = prevProps.message;
  const next = nextProps.message;

  if (prev.content !== next.content) return false;
  if (prev.step !== next.step) return false;
  if (prev.done !== next.done) return false;
  if (prev.err !== next.err) return false;
  if (prev.who !== next.who) return false;
  if (prev.kind !== next.kind) return false;
  if (prev.images !== next.images) return false;

  // For multi-model compare or council, check cmp items
  if (prev.cmp !== next.cmp) {
    if (!prev.cmp || !next.cmp) return false;
    if (prev.cmp.length !== next.cmp.length) return false;
    for (let i = 0; i < prev.cmp.length; i++) {
      if (prev.cmp[i].content !== next.cmp[i].content || prev.cmp[i].err !== next.cmp[i].err) {
        return false;
      }
    }
  }

  return true;
});
