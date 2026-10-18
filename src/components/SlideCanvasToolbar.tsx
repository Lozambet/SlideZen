import React from 'react';
import { RotateCcw, HelpCircle, Magnet, FlaskConical, AlignCenter, AlignVerticalJustifyStart } from 'lucide-react';

interface SlideCanvasToolbarProps {
  currentZoom: number;
  onUpdateTextZoom?: (zoom: number) => void;
  contentAnchor?: 'center' | 'top';
  onUpdateContentAnchor?: (anchor: 'center' | 'top') => void;
  isExperimental?: boolean;
  onToggleExperimentalMode?: () => void;
  hasCustomOffsets?: boolean;
  onResetAllBoxOffsets?: () => void;
  onOpenQuickTips?: () => void;
}

export const SlideCanvasToolbar: React.FC<SlideCanvasToolbarProps> = ({
  currentZoom,
  onUpdateTextZoom,
  contentAnchor = 'center',
  onUpdateContentAnchor,
  isExperimental = false,
  onToggleExperimentalMode,
  hasCustomOffsets = false,
  onResetAllBoxOffsets,
  onOpenQuickTips,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-neutral-950/80 border border-neutral-800/90 rounded-xl text-xs shadow-sm select-none">
      {/* Left controls: Zoom, Anchoring, Snapping Mode */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* 1. Text Zoom Control */}
        {onUpdateTextZoom && (
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-neutral-300 shadow-sm">
            <span className="text-[10px] text-neutral-500 uppercase font-medium tracking-wider mr-0.5">
              Zoom:
            </span>
            <button
              onClick={() => onUpdateTextZoom(Math.max(0.6, +(currentZoom - 0.1).toFixed(2)))}
              className="w-5 h-5 flex items-center justify-center hover:text-white hover:bg-neutral-800 rounded font-bold transition-colors cursor-pointer select-none"
              title="Riduci dimensione testo (-10%)"
            >
              -
            </button>
            <button
              onClick={() => onUpdateTextZoom(1.0)}
              className="text-sky-400 font-bold min-w-[38px] text-center px-1 rounded hover:bg-neutral-800/60 transition-colors cursor-pointer"
              title="Clicca per reimpostare al 100%"
            >
              {Math.round(currentZoom * 100)}%
            </button>
            <button
              onClick={() => onUpdateTextZoom(Math.min(2.0, +(currentZoom + 0.1).toFixed(2)))}
              className="w-5 h-5 flex items-center justify-center hover:text-white hover:bg-neutral-800 rounded font-bold transition-colors cursor-pointer select-none"
              title="Ingrandisci dimensione testo (+10%)"
            >
              +
            </button>
            {currentZoom !== 1.0 && (
              <button
                onClick={() => onUpdateTextZoom(1.0)}
                className="ml-0.5 p-1 text-neutral-400 hover:text-sky-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reimposta zoom testo al 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-neutral-800" />

        {/* 2. Content Anchor (Center vs Top) */}
        {onUpdateContentAnchor && (
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono shadow-sm">
            <span className="text-[10px] text-neutral-500 uppercase font-medium tracking-wider px-1.5">
              Ancora:
            </span>
            <button
              onClick={() => onUpdateContentAnchor('center')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                contentAnchor === 'center'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
              }`}
              title="Ancoraggio centrale verticale (predefinito, bilanciamento elegante)"
            >
              <AlignCenter className="w-3 h-3" />
              <span>Centro</span>
            </button>
            <button
              onClick={() => onUpdateContentAnchor('top')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                contentAnchor === 'top'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
              }`}
              title="Ancoraggio in alto (posiziona il contenuto partendo dal bordo superiore)"
            >
              <AlignVerticalJustifyStart className="w-3 h-3" />
              <span>Sopra</span>
            </button>
          </div>
        )}

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-neutral-800" />

        {/* 3. Grid Magnet Snapping vs Experimental Freeform Mode */}
        {onToggleExperimentalMode && (
          <button
            onClick={onToggleExperimentalMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-sm border cursor-pointer ${
              isExperimental
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800/80 hover:border-neutral-700'
            }`}
            title={
              isExperimental
                ? 'Modalità Sperimentale attiva: Posizionamento 100% libero al pixel, calamita disattivata'
                : 'Modalità Calamita attiva: Aggancio magnetico intelligente alla griglia'
            }
          >
            {isExperimental ? (
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Magnet className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>{isExperimental ? 'Libero (Sperimentale)' : 'Calamita Griglia'}</span>
          </button>
        )}
      </div>

      {/* Right controls: Reset layout & Tips */}
      <div className="flex items-center gap-2">
        {/* 4. Reset All Offsets (Riallinea testo) */}
        {onResetAllBoxOffsets && (
          <button
            disabled={!hasCustomOffsets}
            onClick={onResetAllBoxOffsets}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-sm border cursor-pointer ${
              hasCustomOffsets
                ? 'bg-neutral-900 border-sky-500/40 text-neutral-200 hover:text-white hover:bg-neutral-800 hover:border-sky-400'
                : 'bg-neutral-900/40 border-neutral-800/50 text-neutral-600 cursor-not-allowed opacity-50'
            }`}
            title={
              hasCustomOffsets
                ? 'Ripristina l\'allineamento automatico e le larghezze di tutte le caselle spostate'
                : 'Nessuna casella spostata manualmente su questa diapositiva'
            }
          >
            <RotateCcw className={`w-3.5 h-3.5 ${hasCustomOffsets ? 'text-sky-400' : 'text-neutral-600'}`} />
            <span>Riallinea testo</span>
          </button>
        )}
      </div>
    </div>
  );
};
