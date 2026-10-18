import React, { useState, useEffect, useRef } from 'react';
import { Slide, PresentationTheme } from '../types/presentation';
import { SlideCanvas } from './SlideCanvas';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  SlidersHorizontal,
  StickyNote,
  Clock,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  theme: PresentationTheme;
}

type TransitionEffect = 'slide' | 'fade' | 'zoom';

export const PresentationMode: React.FC<PresentationModeProps> = ({
  isOpen,
  onClose,
  slides,
  currentIndex,
  onNavigate,
  theme,
}) => {
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>('slide');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const prevIndexRef = useRef<number>(currentIndex);

  // Presenter talk stopwatch timer
  useEffect(() => {
    if (!isOpen) {
      setTimerSeconds(0);
      return;
    }
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine navigation direction
  useEffect(() => {
    if (currentIndex > prevIndexRef.current) {
      setDirection('forward');
    } else if (currentIndex < prevIndexRef.current) {
      setDirection('backward');
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentIndex < slides.length - 1) {
          onNavigate(currentIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        onNavigate(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onNavigate(slides.length - 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsNotesOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, slides.length, onNavigate, onClose]);

  if (!isOpen) return null;

  const currentSlide = slides[currentIndex] || slides[0];
  const nextSlide = slides[currentIndex + 1];

  // Determine transition CSS class
  let transitionClass = 'slide-transition-right';
  if (transitionEffect === 'slide') {
    transitionClass = direction === 'backward' ? 'slide-transition-left' : 'slide-transition-right';
  } else if (transitionEffect === 'fade') {
    transitionClass = 'slide-transition-fade';
  } else if (transitionEffect === 'zoom') {
    transitionClass = 'slide-transition-zoom';
  }

  const progressPercentage = ((currentIndex + 1) / slides.length) * 100;
  const hasNotes = Boolean(currentSlide.notes?.trim());

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Subtle Top Slide Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900/60 z-30">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Top Floating Controls (Revealed on hover) */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-30 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-800 text-xs text-neutral-300 shadow-xl">
            <span className="font-semibold text-white">{theme.name}</span>
            <span className="text-neutral-600">•</span>
            <span>
              Slide {currentIndex + 1} di {slides.length}
            </span>
          </div>

          {/* Talk timer pill */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800 text-xs text-neutral-300 shadow-xl">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-white font-medium">{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-0.5 text-neutral-400 hover:text-white"
              title={isTimerRunning ? 'Metti in pausa timer' : 'Avvia timer'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setTimerSeconds(0)}
              className="p-0.5 text-neutral-400 hover:text-white"
              title="Azzera timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Transition Selector & Screen Controls */}
        <div className="flex items-center gap-2">
          {/* Transition Effect Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur-md px-2 py-1 rounded-full border border-neutral-800 text-xs">
            <span className="text-neutral-400 text-[11px] px-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-sky-400" />
              Transizione:
            </span>
            {(['slide', 'fade', 'zoom'] as TransitionEffect[]).map((t) => (
              <button
                key={t}
                onClick={() => setTransitionEffect(t)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  transitionEffect === t
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={`Effetto transizione: ${t}`}
              >
                {t === 'slide' ? 'Slide' : t === 'fade' ? 'Dissolvenza' : 'Zoom'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-2 rounded-full bg-neutral-900/80 backdrop-blur-md text-neutral-300 hover:text-white border border-neutral-800 transition-colors shadow-xl"
            title="Schermo Intero"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-900/80 backdrop-blur-md text-neutral-300 hover:text-white border border-neutral-800 transition-colors shadow-xl"
            title="Esci dalla Presentazione (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas Container with Smooth CSS Slide Transition */}
      <div className={`w-full h-full max-w-6xl max-h-[85vh] px-4 flex items-center justify-center overflow-hidden transition-all duration-300 ${isNotesOpen ? 'lg:pr-96' : ''}`}>
        <div
          key={`${currentIndex}-${transitionEffect}`}
          className={`w-full h-full flex items-center justify-center ${transitionClass}`}
        >
          <SlideCanvas
            slide={currentSlide}
            theme={theme}
            slideNumber={currentIndex + 1}
            totalSlides={slides.length}
            isPresenterMode={true}
          />
        </div>
      </div>

      {/* Speaker Notes Presenter Panel (Note del Relatore) */}
      {isNotesOpen && (
        <aside className="fixed right-6 bottom-20 top-20 w-84 md:w-96 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-5 flex flex-col z-40 animate-in slide-in-from-right-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                  Note del relatore
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({currentIndex + 1}/{slides.length})
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-400">Tempo: {formatTimer(timerSeconds)}</p>
              </div>
            </div>
            <button
              onClick={() => setIsNotesOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Chiudi note (premi N)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notes Content */}
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {hasNotes ? (
              <div className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans select-text">
                {currentSlide.notes}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 text-neutral-500">
                <StickyNote className="w-8 h-8 text-neutral-700 mb-2 stroke-1" />
                <p className="text-xs font-medium text-neutral-400">Nessuna nota per questa slide</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Puoi inserire promemoria e punti chiave nell'editor prima della presentazione.
                </p>
              </div>
            )}
          </div>

          {/* Next Slide Preview Banner */}
          {nextSlide && (
            <div className="pt-3 border-t border-neutral-800 shrink-0">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Prossima Slide ({currentIndex + 2}):
              </span>
              <p className="text-xs text-neutral-300 font-medium truncate">
                {nextSlide.title || 'Diapositiva successiva'}
              </p>
            </div>
          )}

          <div className="pt-2 text-[10px] text-neutral-500 text-center shrink-0">
            Scorciatoia tastiera: premi <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-300 font-mono">N</kbd> per mostrare/nascondere
          </div>
        </aside>
      )}

      {/* Bottom Floating Navigation Bar */}
      <div className="absolute bottom-6 flex items-center gap-3 z-30 bg-neutral-900/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-neutral-800 shadow-2xl">
        <button
          disabled={currentIndex === 0}
          onClick={() => onNavigate(currentIndex - 1)}
          className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300 transition-colors"
          title="Slide Precedente (← o Backspace)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono font-medium text-neutral-300 px-2">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          disabled={currentIndex === slides.length - 1}
          onClick={() => onNavigate(currentIndex + 1)}
          className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300 transition-colors"
          title="Slide Successiva (→ o Spazio o Invio)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Speaker Notes Toggle Button */}
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
            isNotesOpen
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
              : hasNotes
              ? 'bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title="Mostra / Nascondi note del relatore (Scorciatoia: N)"
        >
          <StickyNote className={`w-3.5 h-3.5 ${hasNotes ? 'text-amber-400' : 'text-neutral-400'}`} />
          <span>Note</span>
          <span className="text-[10px] text-neutral-400 font-mono">N</span>
          {hasNotes && !isNotesOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          onClick={onClose}
          className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          Esci
        </button>
      </div>
    </div>
  );
};
