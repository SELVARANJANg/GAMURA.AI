import React from 'react';
import { PERSONAS } from '../types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersona: string;
  onSelectPersona: (key: string) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  selectedPersona,
  onSelectPersona,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[360px] bg-[var(--bg2)] rounded-2xl border border-[var(--ln)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="py-2 divide-y divide-[var(--ln)]">
          {Object.entries(PERSONAS).map(([key, info]) => {
            const isSelected = selectedPersona === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onSelectPersona(key);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--bg3)] transition-colors active:bg-[var(--bg3)]"
              >
                <div>
                  <span className="text-[16px] font-medium text-[var(--tx)] block">
                    {info.title}
                  </span>
                </div>

                {/* Radio Indicator */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[var(--ac)]'
                      : 'border-[var(--mu)]/60'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--ac)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
