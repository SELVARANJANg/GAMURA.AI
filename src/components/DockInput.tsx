import React, { useRef, useEffect, useState } from 'react';
import { Mic, Sparkles, ArrowUp, Square } from 'lucide-react';
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

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  // Speech Recognition setup
  const toggleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast('Voice input is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
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
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
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
      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleWandClick = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      onShowToast('Type a prompt first');
      return;
    }
    setIsImproving(true);
    try {
      await onImprovePrompt(trimmed, (updated) => {
        setText(updated);
      });
      onShowToast('Prompt improved!');
    } catch (err) {
      onShowToast('Could not improve prompt');
    } finally {
      setIsImproving(false);
    }
  };

  const personaTitle = PERSONAS[selectedPersona]?.title || 'Assistant';

  return (
    <div id="dock" className="shrink-0 pb-[calc(10px+env(safe-area-inset-bottom,0px))] select-none">
      {/* Chips row */}
      <div
        id="chips"
        className="flex gap-2 overflow-x-auto px-3.5 py-1.5 pb-2 no-scrollbar"
      >
        {connectedConnectors.map((c) => {
          const isSelected = c.id === currentConnectorId;
          const isInMultiMode = mode !== 'chat';

          let chipClass = 'bg-[var(--bg3)] text-[var(--tx)]';
          if (isSelected) {
            chipClass = 'bg-[var(--ac)] text-[var(--fg)] shadow-sm';
          } else if (isInMultiMode) {
            chipClass = 'bg-[var(--bg3)] text-[var(--tx)] ring-1.5 ring-[var(--ac)]';
          }

          return (
            <button
              key={c.id}
              onClick={() => onSelectConnector(c.id)}
              className={`shrink-0 py-1.5 px-3.5 rounded-full text-[13px] font-semibold transition-all ${chipClass}`}
            >
              {c.name}
            </button>
          );
        })}

        {/* Persona Pill */}
        <button
          onClick={onOpenPersonaModal}
          className="shrink-0 py-1.5 px-3.5 rounded-full text-[13px] font-semibold bg-[var(--bg3)] text-[var(--tx)] hover:bg-[var(--bg2)] transition-all flex items-center gap-1.5"
          aria-label="Select Persona"
        >
          <span>{personaTitle}</span>
        </button>
      </div>

      {/* Input Form Pill */}
      <form
        onSubmit={handleSubmit}
        className="glass flex items-end gap-1.5 mx-2.5 p-1.5 rounded-[26px] border border-[var(--ln)] shadow-lg transition-all focus-within:border-[var(--ac)]/60"
      >
        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-[var(--rd)] text-white rec-pulse'
              : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Gamura AI"
          className="flex-1 resize-none border-0 outline-none bg-transparent py-2 px-1 text-[var(--tx)] placeholder:text-[var(--mu)] min-h-[36px] max-h-[140px] leading-relaxed text-[15.5px]"
        />

        {/* Sparkle Wand Button */}
        <button
          type="button"
          onClick={handleWandClick}
          disabled={isImproving}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isImproving
              ? 'text-[var(--ac)] animate-spin'
              : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="Improve my prompt"
        >
          <Sparkles className="w-4.5 h-4.5" />
        </button>

        {/* Submit or Stop Button */}
        <button
          type="submit"
          disabled={!isBusy && !text.trim()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
            isBusy
              ? 'bg-[var(--rd)] text-white'
              : 'bg-[var(--ac)] text-[var(--fg)] shadow-sm'
          }`}
          aria-label={isBusy ? 'Stop' : 'Send'}
        >
          {isBusy ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
};
