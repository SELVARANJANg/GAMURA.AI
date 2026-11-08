import React, { useRef, useEffect, useState } from 'react';
import { Mic, Sparkles, ArrowUp, Square, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import { Connector, PERSONAS } from '../types';
import { getDailyUsage, getDailyImageUsage, incrementDailyImageUsage } from '../utils/usageLimit';

interface DockInputProps {
  connectedConnectors: Connector[];
  currentConnectorId: string;
  onSelectConnector: (id: string) => void;
  selectedPersona: string;
  onOpenPersonaModal: () => void;
  mode: 'chat' | 'compare' | 'council';
  isBusy: boolean;
  onSend: (text: string, images?: string[]) => void;
  onStop: () => void;
  onImprovePrompt: (currentText: string, onUpdate: (newText: string) => void) => void;
  onShowToast: (msg: string) => void;
}

export const DockInput: React.FC<DockInputProps> = ({
  connectedConnectors,
  currentConnectorId,
  onSelectConnector,
  selectedPersona,
  onOpenPersonaModal,
  mode,
  isBusy,
  onSend,
  onStop,
  onImprovePrompt,
  onShowToast,
}) => {
  const [text, setText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea smoothly
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text, attachedImages]);

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    const imageUsage = getDailyImageUsage();
    if (imageUsage.isExceeded || attachedImages.length >= imageUsage.remaining) {
      onShowToast(
        `Daily image limit reached (3/3 used today). Resets in ${imageUsage.timeUntilReset} at midnight.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('Image size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        setAttachedImages((prev) => [...prev, dataUrl]);
        onShowToast('Image attached!');
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Support pasting image directly from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const imageUsage = getDailyImageUsage();
          if (imageUsage.isExceeded || attachedImages.length >= imageUsage.remaining) {
            onShowToast(
              `Daily image limit reached (3/3 used today). Resets in ${imageUsage.timeUntilReset}.`
            );
            return;
          }
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            if (dataUrl) {
              setAttachedImages((prev) => [...prev, dataUrl]);
              onShowToast('Image pasted from clipboard!');
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Speech Recognition setup with robust fallback
  const toggleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast('Voice recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      const initialBase = text ? text.trim() + ' ' : '';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(initialBase + transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      onShowToast('Listening... Speak now');
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
      onShowToast('Microphone access unavailable');
    }
  };

  const dailyUsage = getDailyUsage();
  const dailyImageUsage = getDailyImageUsage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) {
      onStop();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && attachedImages.length === 0) return;

    if (dailyUsage.isExceeded) {
      onShowToast(
        `Daily limit of 3 messages reached today. Resets in ${dailyUsage.timeUntilReset} at midnight.`
      );
      return;
    }

    if (attachedImages.length > 0) {
      incrementDailyImageUsage(attachedImages.length);
    }

    onSend(trimmed, attachedImages.length > 0 ? attachedImages : undefined);
    setText('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't submit on mobile touch keyboards
      if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleWandClick = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      onShowToast('Type a prompt first to enhance it');
      return;
    }
    setIsImproving(true);
    try {
      await onImprovePrompt(trimmed, (updated) => {
        setText(updated);
      });
      onShowToast('Prompt optimized & structured!');
    } catch (err) {
      onShowToast('Could not optimize prompt');
    } finally {
      setIsImproving(false);
    }
  };

  const personaTitle = PERSONAS[selectedPersona]?.title || 'Assistant';

  return (
    <div id="dock" className="shrink-0 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-2 select-none z-20">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Chips row */}
      <div
        id="chips"
        className="flex gap-2 overflow-x-auto px-2 py-1.5 pb-2.5 no-scrollbar scroll-smooth items-center"
      >
        {/* Daily message limit badge */}
        <div
          className={`shrink-0 py-1 px-3 rounded-full text-[11.5px] font-bold flex items-center gap-1.5 border transition-all ${
            dailyUsage.isExceeded
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              : 'bg-[var(--bg3)] text-[var(--tx)] border-[var(--ln)]'
          }`}
          title={`Daily message limit: 3 messages per day. Resets at midnight (${dailyUsage.timeUntilReset} remaining)`}
        >
          <span className={dailyUsage.isExceeded ? 'text-rose-400' : 'text-[var(--ac)]'}>⚡</span>
          <span>{dailyUsage.remaining} / 3 chats left</span>
        </div>

        {/* Daily image limit badge */}
        <div
          className={`shrink-0 py-1 px-3 rounded-full text-[11.5px] font-bold flex items-center gap-1.5 border transition-all ${
            dailyImageUsage.isExceeded
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              : 'bg-[var(--bg3)] text-[var(--tx)] border-[var(--ln)]'
          }`}
          title={`Daily image limit: 3 images per day. Resets at midnight (${dailyImageUsage.timeUntilReset} remaining)`}
        >
          <span className={dailyImageUsage.isExceeded ? 'text-rose-400' : 'text-[#0a84ff]'}>📷</span>
          <span>{dailyImageUsage.remaining} / 3 images left</span>
        </div>

        <div className="w-[1px] h-4 bg-[var(--ln)] shrink-0 my-auto" />

        {/* Persona Pill */}
        <button
          onClick={onOpenPersonaModal}
          className="shrink-0 py-1.5 px-3 rounded-full text-[12.5px] font-semibold bg-[var(--bg3)] text-[var(--tx)] hover:bg-[var(--bg2)] transition-all flex items-center gap-1 border border-[var(--ln)] shadow-xs active:scale-95"
          aria-label="Select Persona"
        >
          <span>{personaTitle}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--mu)]" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--ln)] shrink-0 my-auto" />

        {/* Core Model Chips: GAMURA, BUBUBAI, SR */}
        {connectedConnectors.map((c) => {
          const isSelected = c.id === currentConnectorId;
          const isInMultiMode = mode !== 'chat';

          let chipClass = 'bg-[var(--bg3)] text-[var(--tx)] hover:bg-[var(--bg2)] border border-[var(--ln)]';
          if (isSelected) {
            chipClass = 'bg-[var(--ac)] text-[var(--fg)] shadow-sm font-bold border-transparent';
          } else if (isInMultiMode) {
            chipClass = 'bg-[var(--bg3)] text-[var(--tx)] ring-1 ring-[var(--ac)]/60 font-medium';
          }

          return (
            <button
              key={c.id}
              onClick={() => onSelectConnector(c.id)}
              className={`shrink-0 py-1.5 px-3.5 rounded-full text-[12.5px] transition-all flex items-center gap-1.5 active:scale-95 ${chipClass}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? 'currentColor' : c.color }}
              />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Input Form Container with Attached Image Previews */}
      <div
        className={`glass rounded-[26px] border shadow-lg transition-all flex flex-col p-1.5 ${
          dailyUsage.isExceeded
            ? 'border-rose-500/40 focus-within:border-rose-500/70'
            : 'border-[var(--ln)] focus-within:border-[var(--ac)]/70 focus-within:shadow-[0_0_15px_rgba(25,208,127,0.12)]'
        }`}
      >
        {/* Attached Images Preview Strip */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 overflow-x-auto no-scrollbar">
            {attachedImages.map((imgUrl, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={imgUrl}
                  alt={`Upload preview ${idx + 1}`}
                  className="w-14 h-14 object-cover rounded-[14px] border border-white/20 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-1.5 w-full">
          {/* Image Upload Button (3 images per day) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={dailyImageUsage.isExceeded || attachedImages.length >= dailyImageUsage.remaining}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
              attachedImages.length > 0
                ? 'bg-[#0a84ff] text-white shadow-sm'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
            aria-label="Add image (max 3/day)"
            title={
              dailyImageUsage.isExceeded
                ? `Daily image limit reached (resets in ${dailyImageUsage.timeUntilReset})`
                : `Add image (${dailyImageUsage.remaining} remaining today)`
            }
          >
            <ImageIcon className="w-4.5 h-4.5" />
          </button>

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={dailyUsage.isExceeded}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
              isRecording
                ? 'bg-[var(--rd)] text-white rec-pulse shadow-md'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic className="w-4.5 h-4.5" />
          </button>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={dailyUsage.isExceeded}
            placeholder={
              dailyUsage.isExceeded
                ? `Daily limit reached (3/3 chats used). Resets in ${dailyUsage.timeUntilReset}.`
                : mode === 'compare'
                ? 'Ask GAMURA, BUBUBAI, and SR side by side...'
                : mode === 'council'
                ? 'Ask the AI Council to deliberate...'
                : 'Message GAMURA, BUBUBAI, or SR...'
            }
            className="flex-1 resize-none border-0 outline-none bg-transparent py-2 px-1 text-[var(--tx)] placeholder:text-[var(--mu)] min-h-[36px] max-h-[140px] leading-relaxed text-[15px] disabled:opacity-50"
          />

          {/* Sparkle Wand Button */}
          <button
            type="button"
            onClick={handleWandClick}
            disabled={isImproving || !text.trim() || dailyUsage.isExceeded}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-30 disabled:pointer-events-none active:scale-90 ${
              isImproving
                ? 'text-[var(--ac)] animate-spin'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
            aria-label="Improve my prompt"
            title="Improve my prompt with AI"
          >
            <Sparkles className="w-4.5 h-4.5" />
          </button>

          {/* Send / Stop Button */}
          <button
            type="submit"
            disabled={!isBusy && (!text.trim() && attachedImages.length === 0 || dailyUsage.isExceeded)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
              isBusy
                ? 'bg-[var(--rd)] text-white shadow-md'
                : dailyUsage.isExceeded
                ? 'bg-[var(--bg3)] text-[var(--mu)] cursor-not-allowed'
                : 'bg-[var(--ac)] text-[var(--fg)] shadow-sm font-bold cursor-pointer'
            }`}
            aria-label={isBusy ? 'Stop' : 'Send'}
            title={dailyUsage.isExceeded ? 'Daily limit reached' : isBusy ? 'Stop' : 'Send'}
          >
            {isBusy ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
