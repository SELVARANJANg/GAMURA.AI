import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Code2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title?: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  title = 'Live UI Preview',
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Construct isolated, standalone HTML document
  const previewHtml = useMemo(() => {
    if (!code) return '';
    if (/<html[\s>]/i.test(code)) {
      return code;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 1.5rem;
      background-color: #f8fafc;
      color: #0f172a;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }, [code, title]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (code) {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error('Failed to open preview tab:', e);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Code Preview"
    >
      {/* Modal Container */}
      <div
        className={`relative flex flex-col bg-[#0d0d12] border border-white/15 rounded-[24px] sm:rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none sm:rounded-none'
            : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#15151c] border-b border-white/10 shrink-0 gap-2">
          {/* Left: Window Controls & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 mr-1 select-none">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0 text-white font-semibold text-[13.5px]">
              <Code2 className="w-4 h-4 text-[#19d07f] shrink-0" />
              <span className="truncate">{title}</span>
              <span className="hidden md:inline text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#19d07f]/15 text-[#19d07f] border border-[#19d07f]/30 shrink-0">
                Live Isolated Sandbox
              </span>
            </div>
          </div>

          {/* Center: Device Viewport Switcher */}
          <div className="hidden sm:flex items-center bg-[#0d0d12] p-1 rounded-xl border border-white/10 shrink-0 select-none">
            <button
              onClick={() => setViewport('desktop')}
              className={`py-1 px-2.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`py-1 px-2.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`py-1 px-2.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Mobile</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title="Reload preview"
              aria-label="Reload preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Copy Code */}
            <button
              onClick={handleCopy}
              className="h-8 px-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Copy source code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Open in New Window */}
            <button
              onClick={handleOpenInNewTab}
              className="h-8 px-2.5 rounded-full bg-[#19d07f]/15 hover:bg-[#19d07f]/25 text-[#19d07f] text-[12px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-[#19d07f]/30 cursor-pointer"
              title="Open full page in standalone tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open Tab</span>
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer ml-1"
              aria-label="Close"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Frame Area */}
        <div className="flex-1 bg-[#09090c] p-2 sm:p-4 overflow-auto flex items-center justify-center">
          <div
            className={`h-full bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col border border-black/10 ${
              viewport === 'mobile'
                ? 'w-[375px] max-w-full'
                : viewport === 'tablet'
                ? 'w-[768px] max-w-full'
                : 'w-full'
            }`}
          >
            {/* Viewport Status Header */}
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0 select-none">
              <span className="truncate">
                {viewport === 'mobile' ? '375 × 667 (Mobile)' : viewport === 'tablet' ? '768 × 1024 (Tablet)' : '100% (Responsive)'}
              </span>
              <span className="text-emerald-600 font-bold">● Active Sandbox</span>
            </div>

            {/* Sandboxed Iframe */}
            <iframe
              key={refreshKey}
              ref={iframeRef}
              srcDoc={previewHtml}
              title="Live Code Preview"
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
