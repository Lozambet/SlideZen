import React, { useState } from 'react';
import { Slide, SlideLayout } from '../types/presentation';
import { Sparkles, Layout, Image, Code2, Check, X, Wand2 } from 'lucide-react';

interface GraphicSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide;
  onApplyLayout: (layout: SlideLayout) => void;
  onApplySvgDiagram: (svgCode: string) => void;
  onApplyColumns: (columns: { title: string; description: string }[]) => void;
  onApplyImage: (imageUrl: string) => void;
}

export const GraphicSuggestionsModal: React.FC<GraphicSuggestionsModalProps> = ({
  isOpen,
  onClose,
  slide,
  onApplyLayout,
  onApplySvgDiagram,
  onApplyColumns,
  onApplyImage,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  React.useEffect(() => {
    if (isOpen && slide) {
      fetchGraphicSuggestions();
    }
  }, [isOpen, slide?.id]);

  const fetchGraphicSuggestions = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const res = await fetch('/api/suggest-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideTitle: slide.title,
          slideContent: slide.content,
          graphicNotes: slide.graphicNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data);
      }
    } catch (e) {
      console.error('Error fetching graphic suggestions:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateSlideImage = async (prompt: string) => {
    setGeneratingImage(true);
    try {
      const res = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          onApplyImage(data.imageUrl);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-800/80 flex items-center justify-center text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                Suggerimenti Grafici & Visivi
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ottimizzazione del layout, schemi a blocchi e immagini basati sulle tue indicazioni.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Slide Info */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-mono">Slide attiva:</span>{' '}
            <strong className="text-neutral-200">{slide.title}</strong>
            {slide.graphicNotes && (
              <div className="mt-1 text-violet-300">
                <span className="text-neutral-500">Indicazione grafica utente:</span> "{slide.graphicNotes}"
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-300 font-medium">
                Generazione proposte grafiche in corso...
              </p>
              <p className="text-xs text-neutral-500">
                Studio della composizione, schemi visivi e palette in base al tuo contenuto.
              </p>
            </div>
          ) : suggestion ? (
            <div className="space-y-6">
              {/* Concept recommendation */}
              <div className="p-4 bg-violet-950/20 border border-violet-900/40 rounded-xl space-y-1">
                <div className="text-xs font-semibold text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Wand2 className="w-3.5 h-3.5" /> Concetto Visivo Consigliato
                </div>
                <p className="text-sm text-neutral-200">{suggestion.visualConcept}</p>
              </div>

              {/* Layout Options */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-neutral-400" /> Trasforma Layout Slide
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cards', label: '3 Colonne / Card', desc: 'Ideale per pilastri e caratteristiche' },
                    { id: 'stat', label: 'Statistica Evidente', desc: 'Mette in risalto numeri chiave' },
                    { id: 'timeline', label: 'Timeline / Fasi', desc: 'Progressione temporale' },
                    { id: 'split-image', label: 'Testo + Immagine', desc: 'Composizione bilanciata' },
                    { id: 'quote', label: 'Citazione', desc: 'Testimonial o frase celebre' },
                    { id: 'comparison', label: 'Confronto A/B', desc: 'Prima / Dopo o Sfida / Soluzione' },
                    { id: 'bullets', label: 'Punti Elenco', desc: 'Elenco chiaro e pulito' },
                    { id: 'hero', label: 'Slide Hero', desc: 'Impatto di apertura' },
                  ].map((lt) => (
                    <button
                      key={lt.id}
                      onClick={() => {
                        onApplyLayout(lt.id as SlideLayout);
                        onClose();
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        slide.layout === lt.id
                          ? 'border-violet-500 bg-violet-950/40 text-violet-200'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="text-xs font-medium text-neutral-200">{lt.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{lt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Structured Diagram Recommendation */}
              {suggestion.structuredDiagram && suggestion.structuredDiagram.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-neutral-400" /> Schema a Colonne Strutturato
                    </h4>
                    <button
                      onClick={() => {
                        onApplyColumns(suggestion.structuredDiagram);
                        onApplyLayout('cards');
                        onClose();
                      }}
                      className="text-xs px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Applica Schema
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {suggestion.structuredDiagram.map((col: any, idx: number) => (
                      <div key={idx} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                        <span className="text-[10px] font-mono text-violet-400">0{idx + 1}</span>
                        <div className="text-xs font-semibold text-neutral-200">{col.title}</div>
                        <div className="text-[11px] text-neutral-400">{col.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image & Illustration Suggestions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-neutral-400" /> Immagini & Grafiche Consigliate
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.imageKeywords?.map((kw: string, i: number) => (
                    <button
                      key={i}
                      disabled={generatingImage}
                      onClick={() => generateSlideImage(kw)}
                      className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-violet-600 rounded-lg text-xs text-neutral-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      Crea visual: "{kw}"
                    </button>
                  ))}
                </div>
                {generatingImage && (
                  <p className="text-xs text-violet-400 animate-pulse mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    Generazione visual ad alta risoluzione in corso...
                  </p>
                )}
              </div>

              {/* SVG Schema Preview */}
              {suggestion.svgCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-neutral-400" /> Diagramma Vettoriale Minimale (SVG)
                    </h4>
                    <button
                      onClick={() => {
                        onApplySvgDiagram(suggestion.svgCode);
                        onClose();
                      }}
                      className="text-xs px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Inserisci nella Slide
                    </button>
                  </div>
                  <div
                    className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center max-h-48 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: suggestion.svgCode }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-8">
              Impossibile recuperare suggerimenti in questo momento.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 text-xs text-neutral-500">
          <span>L'AI ottimizza la grafica e la disposizione, mantenendo inalterate le tue parole</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
