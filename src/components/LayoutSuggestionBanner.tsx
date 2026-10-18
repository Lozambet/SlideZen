import React from 'react';
import { SlideLayout } from '../types/presentation';
import { LAYOUT_OPTIONS } from './LayoutDropdown';
import { Sparkles, Check, X, ArrowRight } from 'lucide-react';

interface LayoutSuggestionBannerProps {
  currentLayout: SlideLayout;
  suggestedLayout: SlideLayout;
  reason?: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const LayoutSuggestionBanner: React.FC<LayoutSuggestionBannerProps> = ({
  currentLayout,
  suggestedLayout,
  reason,
  onAccept,
  onDismiss,
}) => {
  const currentOpt = LAYOUT_OPTIONS.find((o) => o.id === currentLayout) || LAYOUT_OPTIONS[0];
  const suggestedOpt = LAYOUT_OPTIONS.find((o) => o.id === suggestedLayout) || LAYOUT_OPTIONS[0];
  const SuggestedIcon = suggestedOpt.icon;

  return (
    <div className="w-full bg-gradient-to-r from-sky-950/60 via-neutral-900 to-sky-950/40 border border-sky-500/40 rounded-xl p-3 shadow-lg flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs text-sky-300 truncate">Consiglio della piattaforma</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onDismiss}
            className="px-2 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
            title="Mantieni il layout attuale e rifiuta il consiglio"
          >
            <X className="w-3.5 h-3.5" />
            <span>Mantieni</span>
          </button>

          <button
            onClick={onAccept}
            className="px-2.5 py-1 text-xs font-semibold text-neutral-950 bg-sky-400 hover:bg-sky-300 active:scale-95 rounded-lg transition-all shadow-sm flex items-center gap-1"
            title={`Accetta il consiglio e applica il layout ${suggestedOpt.label}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accetta Layout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-1 border-t border-neutral-800/80">
        <div className="flex items-center gap-1.5 text-neutral-200">
          <span className="text-neutral-400 text-[11px]">Passa a:</span>
          <span className="flex items-center gap-1 font-semibold text-white bg-sky-950/80 border border-sky-600/40 px-2 py-0.5 rounded-md text-xs">
            <SuggestedIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>{suggestedOpt.label}</span>
          </span>
          <span className="text-neutral-500 text-[11px] hidden sm:inline">(da {currentOpt.label})</span>
        </div>
        {reason && (
          <span className="text-neutral-400 text-[11px] truncate max-w-[240px]" title={reason}>
            {reason}
          </span>
        )}
      </div>
    </div>
  );
};
