import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Slide, PresentationTheme, TextBoxOffset } from '../types/presentation';
import { computeSlideFontScale } from '../utils/fontScaler';
import { DraggableTextBox, SiblingBoxInfo, ActiveGuideInfo } from './DraggableTextBox';
import {
  ArrowRight,
  Quote,
  Upload,
  Crop,
  Trash2,
  Search,
  Image as ImageIcon,
} from 'lucide-react';

interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  slideNumber: number;
  totalSlides: number;
  isPresenterMode?: boolean;
  isExperimentalMode?: boolean;
  onTriggerUpload?: () => void;
  onOpenCropModal?: () => void;
  onRemoveImage?: () => void;
  onUpdateTextZoom?: (newZoom: number) => void;
  onUpdateBoxOffset?: (boxId: string, offset: TextBoxOffset) => void;
  onResetAllBoxOffsets?: () => void;
  onUpdateContentAnchor?: (anchor: 'center' | 'top') => void;
  onToggleExperimentalMode?: () => void;
  onOpenQuickTips?: () => void;
  onOpenPhotoSearch?: () => void;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  theme,
  slideNumber,
  totalSlides,
  isPresenterMode = false,
  isExperimentalMode,
  onTriggerUpload,
  onOpenCropModal,
  onRemoveImage,
  onUpdateTextZoom,
  onUpdateBoxOffset,
  onResetAllBoxOffsets,
  onUpdateContentAnchor,
  onToggleExperimentalMode,
  onOpenQuickTips,
  onOpenPhotoSearch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const registeredBoxesRef = useRef<Map<string, { label: string; el: HTMLElement }>>(new Map());

  const [scale, setScale] = useState<number>(0.7);
  const [activeGuide, setActiveGuide] = useState<ActiveGuideInfo | null>(null);

  const currentZoom = slide.textZoom ?? 1.0;
  const contentAnchor = slide.contentAnchor || 'center';
  const isExperimental = isExperimentalMode ?? (slide.experimentalFreeform ?? false);
  const effectiveScale = scale;

  const registerBoxElement = useCallback((id: string, label: string, el: HTMLElement | null) => {
    if (!el) {
      registeredBoxesRef.current.delete(id);
    } else {
      registeredBoxesRef.current.set(id, { label, el });
    }
  }, []);

  const getSiblingBoxes = useCallback((excludeId: string): SiblingBoxInfo[] => {
    if (!stageRef.current) return [];
    const stageRect = stageRef.current.getBoundingClientRect();
    const currentScale = effectiveScale > 0 ? effectiveScale : 1;
    const siblings: SiblingBoxInfo[] = [];

    registeredBoxesRef.current.forEach((info, id) => {
      if (id === excludeId || !info.el) return;
      const rect = info.el.getBoundingClientRect();
      const left = (rect.left - stageRect.left) / currentScale;
      const top = (rect.top - stageRect.top) / currentScale;
      const width = rect.width / currentScale;
      const height = rect.height / currentScale;

      siblings.push({
        id,
        label: info.label,
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        center: left + width / 2,
      });
    });

    return siblings;
  }, [effectiveScale]);

  const getOffset = useCallback(
    (boxId: string): TextBoxOffset => {
      const custom = slide.boxOffsets?.[boxId];
      if (boxId === 'slide-image' && slide.layout !== 'split-image') {
        return {
          x: custom?.x ?? 0,
          y: custom?.y ?? 0,
          canvasX: custom?.canvasX ?? 560,
          canvasY: custom?.canvasY ?? 190,
          width: custom?.width ?? 340,
          align: custom?.align,
          snapLabel: custom?.snapLabel,
          boxStyle: custom?.boxStyle,
        };
      }
      return custom || { x: 0, y: 0 };
    },
    [slide.boxOffsets, slide.layout]
  );

  const handleBoxOffsetChange = useCallback((boxId: string, newOffset: TextBoxOffset) => {
    if (onUpdateBoxOffset) {
      onUpdateBoxOffset(boxId, newOffset);
    }
  }, [onUpdateBoxOffset]);

  const hasAnyCustomOffset = Object.keys(slide.boxOffsets || {}).length > 0;

  // Auto-fit 960x540 canvas to the available container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const handleResize = () => {
      if (!el) return;
      const { clientWidth, clientHeight } = el;
      const padding = 32;
      const availableWidth = Math.max(100, clientWidth - padding);
      const availableHeight = Math.max(100, clientHeight - padding);

      const targetRatio = 16 / 9;
      const containerRatio = availableWidth / availableHeight;

      let newScale: number;
      if (containerRatio > targetRatio) {
        newScale = availableHeight / 540;
      } else {
        newScale = availableWidth / 960;
      }

      setScale(Math.max(0.15, Math.min(newScale, 1.4)));
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    // Native Wheel Event Listener on Container (supports non-passive zooming)
    const handleNativeWheel = (e: WheelEvent) => {
      if (isPresenterMode || !onUpdateTextZoom) return;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const current = slide.textZoom ?? 1.0;
      const nextZoom = Math.min(2.0, Math.max(0.6, +(current + delta).toFixed(2)));

      onUpdateTextZoom(nextZoom);
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [isPresenterMode, onUpdateTextZoom, slide.textZoom]);

  const fontConfig = computeSlideFontScale(slide);

  // Reusable rendering function for draggable text boxes & media
  const renderTextBox = (
    id: string,
    children: React.ReactNode,
    className?: string,
    badgeLabel?: string
  ) => (
    <DraggableTextBox
      key={id}
      id={id}
      offset={getOffset(id)}
      onOffsetChange={handleBoxOffsetChange}
      scale={effectiveScale}
      theme={theme}
      isPresenterMode={isPresenterMode}
      stageElement={stageRef.current}
      getSiblingBoxes={getSiblingBoxes}
      registerBoxElement={registerBoxElement}
      onActiveGuideChange={setActiveGuide}
      textZoom={currentZoom}
      isExperimental={isExperimental}
      badgeLabel={badgeLabel || 'Elemento'}
      className={`whitespace-pre-line ${className || ''}`}
    >
      {children}
    </DraggableTextBox>
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden cursor-default select-none"
      style={{
        backgroundColor: isPresenterMode ? theme.slideBg : 'transparent',
      }}
    >
      {/* 960x540 Standard 16:9 Presentation Stage */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{
          width: `${960 * effectiveScale}px`,
          height: `${540 * effectiveScale}px`,
        }}
      >
        <div
          ref={stageRef}
          style={{
            width: '960px',
            height: '540px',
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'center center',
            backgroundColor: theme.slideBg,
            borderColor: theme.cardBorder,
          }}
          className={`relative shrink-0 select-none overflow-hidden flex flex-col justify-between ${fontConfig.paddingClass} rounded-2xl shadow-2xl border transition-colors`}
        >
          {/* Background Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: theme.accent }}
          />

          {/* Full Canvas Magnetic Alignment Guidelines */}
          {activeGuide && !isPresenterMode && !isExperimental && (
            <div className="absolute inset-0 pointer-events-none z-40">
              {/* Vertical Guide Line */}
              {activeGuide.guideX !== undefined && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: `${activeGuide.guideX}px`,
                    width: '2px',
                    backgroundColor: theme.accent,
                    boxShadow: `0 0 10px ${theme.accent}, 0 0 3px ${theme.accent}`,
                  }}
                />
              )}

              {/* Horizontal Guide Line */}
              {activeGuide.guideY !== undefined && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: `${activeGuide.guideY}px`,
                    height: '2px',
                    backgroundColor: theme.accent,
                    boxShadow: `0 0 10px ${theme.accent}, 0 0 3px ${theme.accent}`,
                  }}
                />
              )}
            </div>
          )}

          {/* Top Header / Slide Number Counter */}
          <div className="relative z-10 flex items-center justify-end h-6 shrink-0">
            <div
              className="text-xs font-mono font-medium opacity-60"
              style={{ color: theme.textSecondary }}
            >
              {String(slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </div>
          </div>

          {/* Central Main Stage: Stable vertical anchor tendency (center default or top) */}
          <div
            className={`z-10 flex-1 flex flex-col ${
              contentAnchor === 'top' ? 'justify-start pt-5' : 'justify-center my-auto'
            } pb-2 min-h-0 cursor-default transition-all duration-300`}
            title="Trascina le caselle per allinearle. Trascina la barra a destra per stringere."
          >
            {/* 1. HERO LAYOUT */}
            {slide.layout === 'hero' && (
              <div className={`${fontConfig.spacingClass} w-full max-w-4xl`}>
                <div
                  className="w-16 h-1.5 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />

                {renderTextBox(
                  'hero-title',
                  <h1
                    className={fontConfig.titleClass}
                    style={{
                      fontFamily: theme.fontTitleFamily,
                      color: theme.textPrimary,
                    }}
                  >
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle &&
                  renderTextBox(
                    'hero-subtitle',
                    <p
                      className={`${fontConfig.subtitleClass} opacity-90`}
                      style={{
                        fontFamily: theme.fontBodyFamily,
                        color: theme.accent,
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                {slide.content.length > 0 && (
                  <div className={`pt-2 flex flex-wrap gap-4 ${fontConfig.bodyClass}`}>
                    {slide.content.map((item, idx) => {
                      const cleanItem = (item || '').replace(/\\n/g, '\n');
                      const isEmpty = !cleanItem || cleanItem.trim() === '';

                      if (isEmpty) {
                        return renderTextBox(
                          `content-${idx}`,
                          <div className="w-full h-4 select-none" aria-hidden="true" />,
                          'w-full',
                          'Spazio vuoto'
                        );
                      }

                      return renderTextBox(
                        `content-${idx}`,
                        <div
                          className="flex items-center gap-2.5 font-medium px-1 py-0.5"
                          style={{ color: theme.textSecondary }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: theme.accent }}
                          />
                          <span className="whitespace-pre-line">{cleanItem}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. STAT / METRIC LAYOUT */}
            {slide.layout === 'stat' && (
              <div className={fontConfig.spacingClass}>
                <div>
                  {renderTextBox(
                    'stat-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>,
                    '',
                    'Titolo'
                  )}

                  {slide.subtitle &&
                    renderTextBox(
                      'stat-subtitle',
                      <p
                        className={`${fontConfig.subtitleClass} mt-1`}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.subtitle}
                      </p>,
                      '',
                      'Sottotitolo'
                    )}
                </div>

                {renderTextBox(
                  'stat-box',
                  <div
                    className="p-8 rounded-2xl border flex items-center justify-between gap-8 w-full select-none"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className={`${fontConfig.statNumberClass} tracking-tight font-black`}
                        style={{
                          fontFamily: theme.fontTitleFamily,
                          color: theme.accent,
                        }}
                      >
                        {slide.statNumber || '10x'}
                      </div>
                      <div
                        className={`${fontConfig.bodyClass} uppercase tracking-wider font-semibold opacity-80 mt-1`}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.statLabel || (slide.content.length === 0 ? 'Metric Target' : '')}
                      </div>
                    </div>

                    {slide.content.length > 0 && (
                      <div className="flex-1 space-y-2 border-l pl-6 border-neutral-700/50">
                        {slide.content.map((note, i) => (
                          <div
                            key={i}
                            className={`${fontConfig.bodyClass} flex items-center gap-2`}
                            style={{ color: theme.textPrimary }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>,
                  'w-full max-w-full',
                  'Scheda Statistica'
                )}
              </div>
            )}

            {/* 3. CARDS / GRID LAYOUT */}
            {slide.layout === 'cards' && (
              <div className={fontConfig.spacingClass}>
                <div>
                  {renderTextBox(
                    'cards-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle &&
                    renderTextBox(
                      'cards-subtitle',
                      <p
                        className={`${fontConfig.subtitleClass} mt-1`}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                </div>

                <div
                  className={`grid gap-4 ${
                    slide.columns && slide.columns.length > 0
                      ? slide.columns.length <= 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                      : slide.content.length <= 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                  }`}
                >
                  {slide.columns && slide.columns.length > 0
                    ? slide.columns.map((col, idx) =>
                        renderTextBox(
                          `card-${idx}`,
                          <div
                            className={`p-5 rounded-2xl border flex flex-col justify-between ${fontConfig.cardHeightClass} w-full h-full select-none`}
                            style={{
                              backgroundColor: theme.cardBg,
                              borderColor: theme.cardBorder,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                                style={{
                                  backgroundColor: `${theme.accent}20`,
                                  color: theme.accent,
                                }}
                              >
                                0{idx + 1}
                              </span>
                            </div>

                            <div className="flex-1 flex flex-col justify-start min-h-0">
                              <h3
                                className={`${fontConfig.cardTitleClass} mb-1.5`}
                                style={{
                                  fontFamily: theme.fontTitleFamily,
                                  color: theme.textPrimary,
                                }}
                              >
                                {col.title}
                              </h3>

                              <p
                                className={`${fontConfig.cardBodyClass} opacity-85 leading-relaxed break-words whitespace-pre-line`}
                                style={{ color: theme.textSecondary }}
                              >
                                {col.description}
                              </p>
                            </div>
                          </div>,
                          'h-full',
                          `Scheda ${idx + 1}`
                        )
                      )
                    : slide.content
                        .filter((item) => item && item.trim() !== '')
                        .map((item, idx) =>
                        renderTextBox(
                          `card-${idx}`,
                          <div
                            className={`p-5 rounded-2xl border flex flex-col justify-between ${fontConfig.cardHeightClass} w-full h-full select-none`}
                            style={{
                              backgroundColor: theme.cardBg,
                              borderColor: theme.cardBorder,
                            }}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold mb-2"
                              style={{
                                backgroundColor: `${theme.accent}20`,
                                color: theme.accent,
                              }}
                            >
                              0{idx + 1}
                            </span>

                            <p
                              className={`${fontConfig.cardBodyClass} leading-relaxed font-medium break-words whitespace-pre-line flex-1 min-h-0`}
                              style={{ color: theme.textPrimary }}
                            >
                              {item}
                            </p>
                          </div>,
                          'h-full',
                          `Scheda ${idx + 1}`
                        )
                      )}
                </div>
              </div>
            )}

            {/* 4. QUOTE / TESTIMONIAL LAYOUT */}
            {slide.layout === 'quote' && (
              <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md"
                  style={{
                    backgroundColor: `${theme.accent}18`,
                    color: theme.accent,
                  }}
                >
                  <Quote className="w-8 h-8" />
                </div>

                {renderTextBox(
                  'quote-text',
                  <blockquote
                    className={`${fontConfig.quoteTextClass} leading-snug tracking-tight font-medium mb-6`}
                    style={{
                      fontFamily: theme.fontTitleFamily,
                      color: theme.textPrimary,
                    }}
                  >
                    "{slide.title || slide.content[0]}"
                  </blockquote>,
                  'w-full flex justify-center'
                )}

                {(slide.quoteAuthor || slide.subtitle) &&
                  renderTextBox(
                    'quote-author',
                    <cite
                      className={`${fontConfig.subtitleClass} not-italic font-semibold tracking-wide uppercase`}
                      style={{ color: theme.accent }}
                    >
                      — {slide.quoteAuthor || slide.subtitle}
                    </cite>,
                    'w-full flex justify-center'
                  )}
              </div>
            )}

            {/* 5. TIMELINE / PROCESS LAYOUT */}
            {slide.layout === 'timeline' && (
              <div className={fontConfig.spacingClass}>
                <div>
                  {renderTextBox(
                    'timeline-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle &&
                    renderTextBox(
                      'timeline-subtitle',
                      <p
                        className={`${fontConfig.subtitleClass} mt-1`}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                </div>

                <div
                  className={`grid ${
                    (slide.columns?.length || slide.content.length) <= 2
                      ? 'grid-cols-2'
                      : (slide.columns?.length || slide.content.length) >= 4
                      ? 'grid-cols-4'
                      : 'grid-cols-3'
                  } gap-4`}
                >
                  {(slide.columns && slide.columns.length > 0
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
                        })
                  ).map((item, idx, arr) =>
                    renderTextBox(
                      `timeline-step-${idx}`,
                      <div
                        className={`p-5 rounded-xl border flex flex-col justify-between ${fontConfig.cardHeightClass} w-full h-full select-none`}
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span
                            className="px-2.5 py-1 rounded-md text-xs font-semibold max-w-[85%] truncate shadow-sm"
                            style={{
                              backgroundColor: `${theme.accent}25`,
                              color: theme.accent,
                              border: `1px solid ${theme.accent}40`,
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          {idx < arr.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-neutral-500 shrink-0" />
                          )}
                        </div>

                        <p
                          className={`${fontConfig.cardBodyClass} leading-relaxed mt-2 font-medium break-words whitespace-pre-line flex-1 min-h-0`}
                          style={{ color: theme.textPrimary }}
                        >
                          {item.description}
                        </p>
                      </div>,
                      'h-full',
                      item.title || `Fase ${idx + 1}`
                    )
                  )}
                </div>
              </div>
            )}

            {/* 6. SPLIT WITH IMAGE / MEDIA LAYOUT */}
            {slide.layout === 'split-image' && (
              <div className="grid grid-cols-2 gap-8 items-center h-full">
                <div className={fontConfig.spacingClass}>
                  {renderTextBox(
                    'split-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>
                  )}

                  {slide.subtitle &&
                    renderTextBox(
                      'split-subtitle',
                      <p
                        className={fontConfig.subtitleClass}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.subtitle}
                      </p>
                    )}

                  <ul className={`space-y-3 ${fontConfig.bodyClass}`}>
                    {slide.content.map((item, idx) => {
                      const cleanItem = (item || '').replace(/\\n/g, '\n');
                      const isEmpty = !cleanItem || cleanItem.trim() === '';

                      if (isEmpty) {
                        return renderTextBox(
                          `split-item-${idx}`,
                          <li className="h-5 list-none select-none my-1" aria-hidden="true" />,
                          'w-full',
                          'Spazio vuoto'
                        );
                      }

                      return renderTextBox(
                        `split-item-${idx}`,
                        <li className="flex items-start gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-2"
                            style={{ backgroundColor: theme.accent }}
                          />
                          <span className="break-words whitespace-pre-line" style={{ color: theme.textPrimary }}>
                            {cleanItem}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex items-center justify-center w-full">
                  {slide.svgCode ? (
                    renderTextBox(
                      'slide-graphic',
                      <div
                        className="w-full max-h-64 p-4 rounded-2xl border flex items-center justify-center overflow-hidden shadow-md select-none"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        }}
                        dangerouslySetInnerHTML={{ __html: slide.svgCode }}
                      />,
                      'w-full max-w-full',
                      'Grafica'
                    )
                  ) : slide.imageUrl ? (
                    renderTextBox(
                      'slide-image',
                      <div className="relative group/img w-full min-w-[240px] aspect-[4/3] rounded-2xl overflow-hidden border shadow-xl select-none">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover pointer-events-none select-none"
                          draggable={false}
                        />
                        {/* Hover Overlay with Crop, Replace and Remove Buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity pointer-events-none">
                          {onOpenCropModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCropModal();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-lg transition-colors cursor-pointer pointer-events-auto"
                              title="Ritaglia e centra l'immagine"
                            >
                              <Crop className="w-3.5 h-3.5" />
                              <span>Ritaglia</span>
                            </button>
                          )}
                          {onOpenPhotoSearch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPhotoSearch();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-200 font-medium text-xs shadow-lg transition-colors border border-sky-700 cursor-pointer pointer-events-auto"
                              title="Sostituisci con una foto cercata online"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Cerca Online</span>
                            </button>
                          )}
                          {onTriggerUpload && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTriggerUpload();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs shadow-lg transition-colors border border-neutral-700 cursor-pointer pointer-events-auto"
                              title="Sostituisci con un file locale"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Cambia</span>
                            </button>
                          )}
                          {onRemoveImage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveImage();
                              }}
                              className="p-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-medium text-xs shadow-lg transition-colors border border-rose-700 cursor-pointer pointer-events-auto"
                              title="Rimuovi foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>,
                      'w-full max-w-full',
                      'Foto'
                    )
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all hover:border-sky-400 group"
                      style={{
                        borderColor: theme.cardBorder,
                        backgroundColor: theme.cardBg,
                      }}
                    >
                      <ImageIcon
                        className="w-10 h-10 mb-2 text-sky-400 group-hover:-translate-y-0.5 transition-transform"
                      />
                      <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        Aggiungi Immagine
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mb-3">
                        Scegli una fotografia da Unsplash oppure carica un file dal computer.
                      </p>
                      <div className="flex items-center gap-2">
                        {onOpenPhotoSearch && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPhotoSearch();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Cerca Foto Online</span>
                          </button>
                        )}
                        {onTriggerUpload && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTriggerUpload();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Carica File</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. COMPARISON LAYOUT */}
            {slide.layout === 'comparison' && (
              <div className={fontConfig.spacingClass}>
                <div>
                  {renderTextBox(
                    'comp-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle &&
                    renderTextBox(
                      'comp-subtitle',
                      <p
                        className={`${fontConfig.subtitleClass} mt-1`}
                        style={{ color: theme.textSecondary }}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Left: Challenge Card */}
                  {renderTextBox(
                    'comp-challenge-box',
                    <div
                      className={`p-6 rounded-2xl border flex flex-col justify-between ${fontConfig.cardHeightClass} w-full h-full select-none`}
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <span className="text-xs font-mono font-bold text-rose-400 mb-2 uppercase tracking-wider">
                        Sfida / Prima
                      </span>
                      <p
                        className={`${fontConfig.bodyClass} leading-relaxed font-medium`}
                        style={{ color: theme.textPrimary }}
                      >
                        {slide.content[0] || 'Descrizione della sfida attuale'}
                      </p>
                    </div>,
                    'h-full',
                    'Sfida'
                  )}

                  {/* Right: Solution Card */}
                  {renderTextBox(
                    'comp-solution-box',
                    <div
                      className={`p-6 rounded-2xl border flex flex-col justify-between ${fontConfig.cardHeightClass} w-full h-full select-none`}
                      style={{
                        backgroundColor: `${theme.accent}12`,
                        borderColor: theme.accent,
                      }}
                    >
                      <span
                        className="text-xs font-mono font-bold mb-2 uppercase tracking-wider"
                        style={{ color: theme.accent }}
                      >
                        Soluzione / Dopo
                      </span>
                      <p
                        className={`${fontConfig.bodyClass} leading-relaxed font-semibold`}
                        style={{ color: theme.textPrimary }}
                      >
                        {slide.content[1] || 'La soluzione proposta o il risultato'}
                      </p>
                    </div>,
                    'h-full',
                    'Soluzione'
                  )}
                </div>
              </div>
            )}

            {/* 8. BULLETS / LIST (DEFAULT) */}
            {slide.layout === 'bullets' && (
              <div className={fontConfig.spacingClass}>
                <div>
                  {renderTextBox(
                    'bullet-title',
                    <h2
                      className={fontConfig.titleClass}
                      style={{
                        fontFamily: theme.fontTitleFamily,
                        color: theme.textPrimary,
                      }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle &&
                    renderTextBox(
                      'bullet-subtitle',
                      <p
                        className={`${fontConfig.subtitleClass} mt-1.5 opacity-90`}
                        style={{
                          fontFamily: theme.fontBodyFamily,
                          color: theme.accent,
                        }}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                </div>

                <ul className={`space-y-3.5 ${fontConfig.bodyClass}`}>
                  {slide.content.map((item, idx) => {
                    const cleanItem = (item || '').replace(/\\n/g, '\n');
                    const isEmpty = !cleanItem || cleanItem.trim() === '';

                    if (isEmpty) {
                      return renderTextBox(
                        `content-${idx}`,
                        <li className="h-5 list-none select-none" aria-hidden="true" />,
                        'w-full',
                        'Spazio vuoto'
                      );
                    }

                    return renderTextBox(
                      `content-${idx}`,
                      <li className="flex items-start gap-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-2 shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="leading-relaxed font-medium break-words whitespace-pre-line"
                          style={{ color: theme.textPrimary }}
                        >
                          {cleanItem}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {slide.svgCode && (
                  <div
                    className="mt-3 p-4 rounded-xl border max-h-40 overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    }}
                    dangerouslySetInnerHTML={{ __html: slide.svgCode }}
                  />
                )}
              </div>
            )}

            {/* Draggable Photo on non-split-image layouts when slide has an image */}
            {slide.layout !== 'split-image' &&
              slide.imageUrl &&
              renderTextBox(
                'slide-image',
                <div className="relative group/img w-full min-w-[220px] aspect-[4/3] rounded-2xl overflow-hidden border shadow-xl select-none">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity pointer-events-none">
                    {onOpenCropModal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCropModal();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-lg transition-colors cursor-pointer pointer-events-auto"
                        title="Ritaglia e centra l'immagine"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Ritaglia</span>
                      </button>
                    )}
                    {onTriggerUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerUpload();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs shadow-lg transition-colors border border-neutral-700 cursor-pointer pointer-events-auto"
                        title="Sostituisci con un'altra foto"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambia</span>
                      </button>
                    )}
                    {onRemoveImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage();
                        }}
                        className="p-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-medium text-xs shadow-lg transition-colors border border-rose-700 cursor-pointer pointer-events-auto"
                        title="Rimuovi foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>,
                'w-full max-w-full',
                'Foto'
              )}
          </div>

        </div>
      </div>
    </div>
  );
};
