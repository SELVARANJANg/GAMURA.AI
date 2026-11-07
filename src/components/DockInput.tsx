import React, { useRef, useEffect, useState } from 'react';
import { Mic, Sparkles, ArrowUp, Square, ChevronDown } from 'lucide-react';
import { Connector, PERSONAS } from '../types';

interface DockInputProps {
  connectedConnectors: Connector[];
  currentConnectorId: string;
  onSelectConnector: (id: string) => void;
  selectedPersona: string;
  onOpenPersonaModal: () => void;
  mode: 'chat' | 'compare' | 'council';
  isBusy: boolean;
  onSend: (text: string) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  }, [text]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) {
      onStop();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
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
      {/* Chips row */}
      <div
        id="chips"
        className="flex gap-2 overflow-x-auto px-2 py-1.5 pb-2.5 no-scrollbar scroll-smooth items-center"
      >
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

        {/* Model Chips */}
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

      {/* Input Pill Form */}
      <form
        onSubmit={handleSubmit}
        className="glass flex items-end gap-1.5 p-1.5 rounded-[26px] border border-[var(--ln)] shadow-lg transition-all focus-within:border-[var(--ac)]/70 focus-within:shadow-[0_0_15px_rgba(25,208,127,0.12)]"
      >
        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 ${
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
          placeholder={mode === 'compare' ? 'Ask all connected AIs side by side...' : mode === 'council' ? 'Ask the AI Council to deliberate...' : 'Message Gamura AI...'}
          className="flex-1 resize-none border-0 outline-none bg-transparent py-2 px-1 text-[var(--tx)] placeholder:text-[var(--mu)] min-h-[36px] max-h-[140px] leading-relaxed text-[15px]"
        />

        {/* Sparkle Wand Button */}
        <button
          type="button"
          onClick={handleWandClick}
          disabled={isImproving || !text.trim()}
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
          disabled={!isBusy && !text.trim()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
            isBusy
              ? 'bg-[var(--rd)] text-white shadow-md'
              : 'bg-[var(--ac)] text-[var(--fg)] shadow-sm font-bold'
          }`}
          aria-label={isBusy ? 'Stop' : 'Send'}
          title={isBusy ? 'Stop' : 'Send'}
        >
          {isBusy ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
};
