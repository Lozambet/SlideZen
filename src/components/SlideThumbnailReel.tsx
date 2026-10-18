import React, { useState } from 'react';
import { Slide, PresentationTheme, SlideLayout } from '../types/presentation';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, GripVertical, StickyNote } from 'lucide-react';

interface SlideThumbnailReelProps {
  slides: Slide[];
  currentIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onDuplicateSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  onChangeLayout: (index: number, layout: SlideLayout) => void;
  theme: PresentationTheme;
}

export const SlideThumbnailReel: React.FC<SlideThumbnailReelProps> = ({
  slides,
  currentIndex,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
  theme,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    index: number;
    position: 'before' | 'after';
  } | null>(null);

  // Calculate actual destination index based on relative positions
  const computeTargetIndex = (
    fromIdx: number,
    overIdx: number,
    position: 'before' | 'after'
  ): number => {
    if (fromIdx === overIdx) return fromIdx;
    if (position === 'before') {
      return overIdx > fromIdx ? overIdx - 1 : overIdx;
    } else {
      return overIdx < fromIdx ? overIdx + 1 : overIdx;
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) {
      setDropTarget(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? 'before' : 'after';

    setDropTarget({ index, position });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    // Only clear if leaving the current target
    if (dropTarget?.index === index) {
      // Check if mouse actually left the element
      const rect = e.currentTarget.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      ) {
        setDropTarget(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const fromIndex = draggedIndex;
    const position = dropTarget?.position || (fromIndex < targetIndex ? 'after' : 'before');
    const toIndex = computeTargetIndex(fromIndex, targetIndex, position);

    if (fromIndex !== toIndex && toIndex >= 0 && toIndex < slides.length) {
      onMoveSlide(fromIndex, toIndex);
    }

    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTarget(null);
  };

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-thin select-none">
      {slides.map((slide, index) => {
        const isSelected = index === currentIndex;
        const isDragging = draggedIndex === index;
        const isTarget = dropTarget?.index === index;
        const isDropBefore = isTarget && dropTarget?.position === 'before';
        const isDropAfter = isTarget && dropTarget?.position === 'after';

        return (
          <div
            key={slide.id || index}
            className="relative shrink-0 flex items-center"
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={(e) => handleDragLeave(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Insertion Indicator: BEFORE */}
            {isDropBefore && (
              <div className="absolute -left-1.5 top-0 bottom-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-1.5 h-full bg-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
              </div>
            )}

            {/* Slide Thumbnail Card */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectSlide(index)}
              className={`group relative w-38 h-22 rounded-xl border p-2 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all ${
                isDragging
                  ? 'opacity-40 scale-95 border-dashed border-sky-400 bg-neutral-900/60 shadow-inner'
                  : isSelected
                  ? 'ring-2 ring-sky-500 border-transparent shadow-lg bg-neutral-800'
                  : 'border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 hover:bg-neutral-800/70 hover:shadow-md'
              }`}
              title="Clicca per selezionare • Trascina per spostare l'ordine"
            >
              {/* Top row: Number with Grip Icon & Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-200">
                  <GripVertical className="w-3.5 h-3.5 text-neutral-500 group-hover:text-sky-400 transition-colors" />
                  <span className="text-[10px] font-mono font-medium">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Hover quick action buttons */}
                <div
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  {index > 0 && (
                    <button
                      onClick={() => onMoveSlide(index, index - 1)}
                      className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-700 transition-colors"
                      title="Sposta a sinistra"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      onClick={() => onMoveSlide(index, index + 1)}
                      className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-700 transition-colors"
                      title="Sposta a destra"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateSlide(index)}
                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-700 transition-colors"
                    title="Duplica slide"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={() => onDeleteSlide(index)}
                      className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-700 transition-colors"
                      title="Elimina slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slide title snippet */}
              <div className="min-w-0 pr-1">
                <p className="text-[11px] font-semibold text-neutral-200 truncate">
                  {slide.title || `Slide ${index + 1}`}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mt-0.5">
                  <span className="uppercase tracking-wider font-mono text-[8px] bg-neutral-950/70 px-1 py-0.2 rounded border border-neutral-800">
                    {slide.layout}
                  </span>
                  {slide.imageUrl && <span className="text-sky-400">• foto</span>}
                  {slide.svgCode && <span className="text-violet-400">• diagramma</span>}
                  {slide.notes?.trim() && (
                    <span className="text-amber-400 flex items-center gap-0.5" title="Note relatore presenti">
                      <StickyNote className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Mini accent bar */}
              <div
                className="h-1 w-full rounded-full overflow-hidden transition-all"
                style={{
                  backgroundColor: isSelected ? theme.accent : 'rgba(255,255,255,0.08)',
                }}
              />
            </div>

            {/* Insertion Indicator: AFTER */}
            {isDropAfter && (
              <div className="absolute -right-1.5 top-0 bottom-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-1.5 h-full bg-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
              </div>
            )}
          </div>
        );
      })}

      {/* Add Slide Button */}
      <button
        onClick={onAddSlide}
        className="shrink-0 w-28 h-22 rounded-xl border border-dashed border-neutral-800 hover:border-sky-500/50 bg-neutral-900/40 hover:bg-neutral-800/40 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-sky-400 transition-all text-xs cursor-pointer group"
        title="Aggiungi nuova diapositiva"
      >
        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-medium">Nuova Slide</span>
      </button>
    </div>
  );
};
