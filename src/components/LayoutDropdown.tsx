import React, { useState, useRef, useEffect } from 'react';
import { SlideLayout } from '../types/presentation';
import {
  Layout,
  ChevronDown,
  Sparkles,
  List,
  Columns3,
  BarChart3,
  Quote,
  Clock,
  Image,
  ArrowLeftRight,
  Check,
} from 'lucide-react';

interface LayoutDropdownProps {
  currentLayout: SlideLayout;
  suggestedLayout?: SlideLayout;
  onSelectLayout: (layout: SlideLayout) => void;
}

export const LAYOUT_OPTIONS: {
  id: SlideLayout;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'hero',
    label: 'Copertina Hero',
    description: 'Titolo grande per apertura e presentazioni',
    icon: Sparkles,
  },
  {
    id: 'bullets',
    label: 'Elenco a Punti',
    description: 'Disposizione ordinata ed essenziale',
    icon: List,
  },
  {
    id: 'cards',
    label: '3 Colonne / Card',
    description: 'Ideale per pilastri, vantaggi o caratteristiche',
    icon: Columns3,
  },
  {
    id: 'stat',
    label: 'Statistica in Evidenza',
    description: 'Numero gigante con etichetta e contesto',
    icon: BarChart3,
  },
  {
    id: 'quote',
    label: 'Citazione',
    description: 'Tipografia editoriale per frasi e dichiarazioni',
    icon: Quote,
  },
  {
    id: 'timeline',
    label: 'Timeline / Fasi',
    description: 'Progressione temporale o roadmap a tappe',
    icon: Clock,
  },
  {
    id: 'split-image',
    label: 'Testo + Immagine',
    description: 'Composizione bilanciata con visual o grafica',
    icon: Image,
  },
  {
    id: 'comparison',
    label: 'Confronto A/B',
    description: 'Prima/dopo o problema e soluzione',
    icon: ArrowLeftRight,
  },
];

export const LayoutDropdown: React.FC<LayoutDropdownProps> = ({
  currentLayout,
  suggestedLayout,
  onSelectLayout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = LAYOUT_OPTIONS.find((opt) => opt.id === currentLayout) || LAYOUT_OPTIONS[0];
  const ActiveIcon = activeOption.icon;
  const hasSuggestion = Boolean(suggestedLayout && suggestedLayout !== currentLayout);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors shadow-sm relative"
        title="Scegli il layout della slide"
      >
        <ActiveIcon className="w-3.5 h-3.5 text-sky-400" />
        <span>Layout: <strong>{activeOption.label}</strong></span>
        {hasSuggestion && (
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" title="Nuovo consiglio di layout disponibile" />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-800/80 mb-1 flex items-center justify-between">
            <span>Seleziona Layout Slide</span>
            {hasSuggestion && (
              <span className="text-sky-400 font-normal">Consiglio attivo</span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto py-0.5">
            {LAYOUT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.id === currentLayout;
              const isSuggested = opt.id === suggestedLayout && !isSelected;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectLayout(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 text-white'
                      : isSuggested
                        ? 'bg-sky-950/30 text-neutral-200 hover:bg-sky-950/50'
                        : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-sky-400' : isSuggested ? 'text-sky-300' : 'text-neutral-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium leading-snug flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {isSuggested && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1 py-0.2 rounded">
                            Consigliato
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate mt-0.5">{opt.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
