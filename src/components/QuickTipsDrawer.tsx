import React, { useEffect } from 'react';
import {
  X,
  Keyboard,
  Move,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  Compass,
  Anchor,
  Sparkles,
  MousePointer,
  HelpCircle,
} from 'lucide-react';

interface QuickTipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTipsDrawer: React.FC<QuickTipsDrawerProps> = ({ isOpen, onClose }) => {
  // Listen for Escape key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Guida Rapida & Scorciatoie</h2>
              <p className="text-[11px] text-neutral-400">Tutti i trucchi per comporre slide perfette</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Chiudi guida (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs text-neutral-300">
          {/* Section 1: Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <Keyboard className="w-4 h-4 text-sky-400" />
              <span>Scorciatoie da Tastiera</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Presentazione a schermo intero</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-sky-300 font-bold shadow-sm">
                  F5
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Esci da presentazione / Chiudi pannelli</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-200 shadow-sm">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Diapositiva successiva</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-200">
                    →
                  </kbd>
                  <span className="text-neutral-500 text-[10px]">o</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-200">
                    Spazio
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Diapositiva precedente</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-200">
                  ←
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Apri/chiudi Guida Rapida</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-amber-300 shadow-sm">
                  ?
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 2: Drag & Drop Interactions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <Move className="w-4 h-4 text-emerald-400" />
              <span>Spostamento Fluido & Anti-Sovrapposizione</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <p className="leading-relaxed">
                <strong className="text-white">Trascina e rilascia:</strong> Clicca su qualsiasi testo sul canvas e trascinalo liberamente.
              </p>
              <p className="leading-relaxed">
                <strong className="text-emerald-300">Calamita intelligente:</strong> In modalità predefinita, le linee magnetiche agganciano il testo a sinistra (60px), al centro (480px), a destra (900px) o ordinatamente accanto/sotto alle altre caselle.
              </p>
              <p className="leading-relaxed">
                <strong className="text-sky-300">Nessuna sovrapposizione:</strong> L'algoritmo di collisione impedisce che due caselle si accavallino, trovando istantaneamente lo spazio libero ideale con un margine di respiro di 16px.
              </p>
            </div>
          </div>

          {/* Section 3: Horizontal Resizing Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <MousePointer className="w-4 h-4 text-cyan-400" />
              <span>Stringere le Caselle (Barra a Destra)</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <p className="leading-relaxed">
                Passa il mouse sul <strong className="text-white">bordo destro</strong> di qualsiasi casella: compare una comoda barra di presa azzurra.
              </p>
              <p className="leading-relaxed">
                Trascina verso <strong className="text-cyan-300">sinistra per stringere</strong> la casella e mandare il testo a capo, o verso <strong className="text-cyan-300">destra per allargarla</strong>.
              </p>
              <p className="text-[11px] text-neutral-400">
                💡 <span className="text-neutral-300">Suggerimento:</span> Fai doppio clic sulla barra per ripristinare la larghezza automatica fluida.
              </p>
            </div>
          </div>

          {/* Section 4: Text Zoom & Reset */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <ZoomIn className="w-4 h-4 text-violet-400" />
              <span>Zoom Tipografico & Reset</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <p className="leading-relaxed">
                <strong className="text-violet-300">Rotella del mouse:</strong> Posiziona il cursore sull'anteprima e ruota la rotella del mouse per ingrandire o rimpicciolire il testo in tempo reale.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Pulsanti rapiti:</strong> Usa i controlli <span className="font-mono text-sky-400 font-bold">-</span> e <span className="font-mono text-sky-400 font-bold">+</span> nella barra superiore del canvas.
              </p>
              <p className="leading-relaxed">
                <strong className="text-amber-300">Doppio clic:</strong> Fai doppio clic su una casella spostata per riportarla istantaneamente alla sua posizione originale del layout.
              </p>
            </div>
          </div>

          {/* Section 5: Experimental Mode & Content Anchoring */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <Compass className="w-4 h-4 text-pink-400" />
              <span>Modalità Sperimentale & Ancoraggio</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5">
              <div>
                <span className="text-pink-300 font-semibold">🧪 Modalità Sperimentale (Libera):</span>
                <p className="leading-relaxed text-neutral-300 mt-0.5">
                  Attiva il pulsante <em>Sperimentale</em> per disattivare l'attrazione magnetica alla griglia. Le caselle possono essere posizionate liberamente al pixel esatto dove le rilasci.
                </p>
              </div>
              <div className="pt-1 border-t border-neutral-800/60">
                <span className="text-indigo-300 font-semibold">⚓ Ancoraggio Contenuto (Centro / In alto):</span>
                <p className="leading-relaxed text-neutral-300 mt-0.5">
                  Scegli se la composizione della diapositiva deve tendere al <strong className="text-white">Centro</strong> (predefinito, bilanciamento verticale) o essere ancorata <strong className="text-white">In alto</strong> (layout tradizionale dall'alto verso il basso).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">SlideZen Presentation Studio</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};
