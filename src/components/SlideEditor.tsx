import React, { useState } from 'react';
import { Slide } from '../types/presentation';
import {
  StickyNote,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

interface SlideEditorProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  onChangeText: (text: string) => void;
  onChangeNotes?: (notes: string) => void;
  onAddSlide?: () => void;
  onOpenPhotoSearch?: () => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  slideIndex,
  totalSlides,
  onChangeText,
  onChangeNotes,
  onOpenPhotoSearch,
}) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPhasesOpen, setIsPhasesOpen] = useState(true);

  const wordCount = slide.rawText?.trim() ? slide.rawText.trim().split(/\s+/).length : 0;
  const notesWordCount = slide.notes?.trim() ? slide.notes.trim().split(/\s+/).length : 0;
  const hasNotes = Boolean(slide.notes?.trim());
  const isTimeline = slide.layout === 'timeline';

  // Extract phase items for timeline layout
  const phaseItems = isTimeline
    ? (slide.columns && slide.columns.length > 0
        ? slide.columns
        : slide.content
            .filter((s) => s && s.trim() !== '')
            .map((step, idx) => {
              const colonMatch = step.match(/^([^:–—\n]{1,50})\s*[:–—]\s*([\s\S]+)$/);
              if (colonMatch) {
                return { title: colonMatch[1].trim(), description: colonMatch[2].trim() };
              }
              const lines = step.split('\n').map((l) => l.trim()).filter(Boolean);
              if (lines.length > 1) {
                return { title: lines[0], description: lines.slice(1).join('\n') };
              }
              return { title: `Fase ${idx + 1}`, description: step };
            }))
    : [];

  const handleUpdatePhase = (index: number, newTitle: string, newDesc: string) => {
    const updated = [...phaseItems];
    if (!updated[index]) {
      updated[index] = { title: newTitle, description: newDesc };
    } else {
      updated[index] = { ...updated[index], title: newTitle, description: newDesc };
    }
    // Reconstruct rawText: Title + Subtitle + Phases
    const lines: string[] = [];
    if (slide.title) lines.push(slide.title);
    if (slide.subtitle) lines.push(`Sottotitolo: ${slide.subtitle}`);
    lines.push(''); // blank line
    updated.forEach((p) => {
      lines.push(`${p.title.trim()}: ${p.description.trim()}`);
      lines.push('');
    });
    onChangeText(lines.join('\n').trim());
  };

  const handleAddPhase = () => {
    const nextIdx = phaseItems.length + 1;
    handleUpdatePhase(phaseItems.length, `Fase ${nextIdx}`, 'Descrizione del nuovo step');
  };

  const handleRemovePhase = (index: number) => {
    const updated = phaseItems.filter((_, i) => i !== index);
    const lines: string[] = [];
    if (slide.title) lines.push(slide.title);
    if (slide.subtitle) lines.push(`Sottotitolo: ${slide.subtitle}`);
    lines.push('');
    updated.forEach((p) => {
      lines.push(`${p.title.trim()}: ${p.description.trim()}`);
      lines.push('');
    });
    onChangeText(lines.join('\n').trim());
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Clean Top Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-200 tracking-wide">
            Testo Diapositiva {slideIndex + 1}
          </span>
          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full">
            {slideIndex + 1} di {totalSlides}
          </span>
          {isTimeline && (
            <span className="text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              Layout Fasi
            </span>
          )}
        </div>

        {/* Quick Photo Search Button in Editor */}
        {onOpenPhotoSearch && (
          <button
            onClick={onOpenPhotoSearch}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Cerca e inserisci foto da Unsplash o web"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Cerca Foto</span>
          </button>
        )}
      </div>

      {/* Main Clean Typing Textarea */}
      <div className="relative flex-1 p-5 flex flex-col min-h-0">
        <textarea
          value={slide.rawText || ''}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={
            isTimeline
              ? `Scrivi qui le fasi della slide. Esempio:
Roadmap di Progetto

Discovery: Ricerca utenti e analisi requisiti
Sviluppo: Creazione MVP e prime feature
Lancio: Pubblicazione e go-to-market

Puoi anche modificare i titoli delle fasi nel riquadro sottostante!`
              : `Scrivi qui il contenuto della slide...
Vai a capo due volte (doppio Invio) per separare caselle di testo indipendenti.
Scrivi \\n per creare una riga o paragrafo vuoto.`
          }
          className="w-full flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 text-base leading-relaxed focus:outline-none resize-none selection:bg-neutral-700 selection:text-white font-sans"
          spellCheck={false}
          autoFocus
        />
      </div>

      {/* Interactive Phase Titles Editor for Timeline Layout */}
      {isTimeline && (
        <div className="border-t border-neutral-800 bg-neutral-950/70 shrink-0">
          <button
            type="button"
            onClick={() => setIsPhasesOpen(!isPhasesOpen)}
            className="w-full flex items-center justify-between px-5 py-2 hover:bg-neutral-850 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-medium text-neutral-200">
                Titoli ed etichette fasi ({phaseItems.length})
              </span>
              <span className="text-[10px] text-neutral-400">
                (sostituiscono "Fase 1", "Fase 2", ecc.)
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                isPhasesOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isPhasesOpen && (
            <div className="px-5 pb-3.5 pt-1 space-y-2 max-h-48 overflow-y-auto">
              {phaseItems.map((phase, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2"
                >
                  <span className="text-[10px] font-mono text-neutral-400 w-5 shrink-0 text-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={phase.title}
                    onChange={(e) => handleUpdatePhase(idx, e.target.value, phase.description)}
                    placeholder="Titolo etichetta (es. Discovery, Analisi)..."
                    className="w-1/3 bg-neutral-950/80 border border-neutral-700/80 focus:border-sky-500 rounded-lg px-2.5 py-1 text-xs font-semibold text-sky-200 placeholder:text-neutral-600 focus:outline-none"
                    title="Titolo che compare sull'etichetta al posto di 'Fase'"
                  />
                  <input
                    type="text"
                    value={phase.description}
                    onChange={(e) => handleUpdatePhase(idx, phase.title, e.target.value)}
                    placeholder="Descrizione del passaggio..."
                    className="flex-1 bg-neutral-950/50 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-1 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
                    title="Descrizione della fase"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(idx)}
                    className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 rounded-md transition-colors"
                    title="Rimuovi questa fase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-sky-500/30 hover:border-sky-500/60 bg-sky-950/30 hover:bg-sky-900/50 text-xs font-medium text-sky-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Aggiungi fase</span>
                </button>
                <span className="text-[10px] text-neutral-400">
                  Le modifiche si sincronizzano istantaneamente con il testo e le slide
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Speaker Notes (Note del Relatore) Section */}
      <div className="border-t border-neutral-800 bg-neutral-950/60 shrink-0">
        <button
          type="button"
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-neutral-850 transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <StickyNote className={`w-3.5 h-3.5 transition-colors ${hasNotes ? 'text-amber-400' : 'text-neutral-500 group-hover:text-amber-400'}`} />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-neutral-100">
              Note del relatore
            </span>
            {hasNotes ? (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-medium">
                {notesWordCount} parole
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400">
                (promemoria per la presentazione)
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isNotesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isNotesOpen && (
          <div className="px-5 pb-3.5 pt-1 animate-in fade-in duration-150">
            <textarea
              value={slide.notes || ''}
              onChange={(e) => onChangeNotes?.(e.target.value)}
              placeholder="Inserisci qui gli appunti per il discorso, punti chiave da spiegare a voce, spunti o domande per il pubblico...
Queste note saranno visibili nella modalità presentazione premendo 'N' o aprendo il pannello relatore."
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-amber-500/60 transition-colors resize-y leading-relaxed font-sans"
            />
          </div>
        )}
      </div>

      {/* Minimal Clean Footer */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>{wordCount} parole</span>
          <span>{(slide.rawText || '').length} caratteri</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
          {isTimeline ? 'Titolo: Descrizione = nuova fase' : 'Doppio Invio = nuova casella | \\n = riga vuota'}
        </span>
      </div>
    </div>
  );
};
