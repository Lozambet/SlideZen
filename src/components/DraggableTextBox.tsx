import React, { useState, useRef, useEffect } from 'react';
import { PresentationTheme, TextBoxOffset } from '../types/presentation';
import { RotateCcw, Square } from 'lucide-react';

export interface ActiveGuideInfo {
  type: 'left' | 'center' | 'right' | 'beside' | 'below' | 'grid';
  guideX?: number; // X position on 960x540 canvas to draw line
  guideY?: number; // Y position on 960x540 canvas
  label: string;
}

export interface SiblingBoxInfo {
  id: string;
  label: string;
  left: number; // in 960x540 canvas px
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  center: number;
}

interface DraggableTextBoxProps {
  id: string;
  offset: TextBoxOffset;
  onOffsetChange: (id: string, offset: TextBoxOffset) => void;
  scale: number;
  theme: PresentationTheme;
  isPresenterMode?: boolean;
  className?: string;
  badgeLabel?: string;
  stageElement?: HTMLDivElement | null;
  getSiblingBoxes?: (excludeId: string) => SiblingBoxInfo[];
  registerBoxElement?: (id: string, label: string, el: HTMLElement | null) => void;
  onActiveGuideChange?: (guide: ActiveGuideInfo | null) => void;
  textZoom?: number;
  isExperimental?: boolean;
  children: React.ReactNode;
}

export const DraggableTextBox: React.FC<DraggableTextBoxProps> = ({
  id,
  offset,
  onOffsetChange,
  scale,
  theme,
  isPresenterMode = false,
  className = '',
  badgeLabel = 'Casella di testo',
  stageElement,
  getSiblingBoxes,
  registerBoxElement,
  onActiveGuideChange,
  textZoom = 1.0,
  isExperimental = false,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Position on 960x540 canvas during active drag
  const [dragCanvasPos, setDragCanvasPos] = useState<{ x: number; y: number }>({
    x: offset.canvasX ?? 60,
    y: offset.canvasY ?? 60,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragContextRef = useRef<{
    pointerStartX: number;
    pointerStartY: number;
    startCanvasLeft: number;
    startCanvasTop: number;
    initialFlowLeft: number;
    initialFlowTop: number;
    boxWidth: number;
    boxHeight: number;
    siblings: SiblingBoxInfo[];
  } | null>(null);

  const resizeContextRef = useRef<{
    pointerStartX: number;
    startWidth: number;
  } | null>(null);

  // Register DOM element for live bounding box measurements
  useEffect(() => {
    if (registerBoxElement && containerRef.current) {
      registerBoxElement(id, badgeLabel, containerRef.current);
    }
    return () => {
      if (registerBoxElement) {
        registerBoxElement(id, badgeLabel, null);
      }
    };
  }, [id, badgeLabel, registerBoxElement]);

  const hasCanvasPos = offset.canvasX !== undefined && offset.canvasY !== undefined;

  // Real CSS Zoom: scales text typography, spacing, and layout box crisply
  const zoomStyle: React.CSSProperties | undefined =
    textZoom && textZoom !== 1.0
      ? {
          zoom: textZoom,
        }
      : undefined;

  // In presenter mode: render cleanly with fixed coordinates and width if customized
  if (isPresenterMode) {
    const textAlignmentClass =
      offset.align === 'center'
        ? 'text-center'
        : offset.align === 'right'
          ? 'text-right'
          : '';

    const isCardBox = offset.boxStyle === 'card';

    return (
      <div
        className={`w-fit max-w-full ${textAlignmentClass} ${
          isCardBox ? 'p-5 rounded-2xl border shadow-md' : ''
        } ${className}`}
        style={{
          position: hasCanvasPos ? 'absolute' : undefined,
          left: hasCanvasPos ? `${offset.canvasX}px` : undefined,
          top: hasCanvasPos ? `${offset.canvasY}px` : undefined,
          width: offset.width ? `${offset.width}px` : undefined,
          maxWidth: offset.width ? `${offset.width}px` : undefined,
          backgroundColor: isCardBox ? theme.cardBg : undefined,
          borderColor: isCardBox ? theme.cardBorder : undefined,
        }}
      >
        <div style={zoomStyle}>{children}</div>
      </div>
    );
  }

  // Pointer Down: Initialize drag tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isResizing) return; // Only primary mouse button
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Capture pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const currentScale = scale > 0 ? scale : 1;
    const stageRect = stageElement ? stageElement.getBoundingClientRect() : null;

    if (!stageRect) return;

    const elRect = containerEl.getBoundingClientRect();
    const zoomFactor = textZoom && textZoom > 0 ? textZoom : 1;

    // Dimensions in 960x540 canvas px
    const boxWidth = elRect.width / currentScale / zoomFactor;
    const boxHeight = elRect.height / currentScale / zoomFactor;

    // Current position in 960x540 canvas space
    const initialFlowLeft = (elRect.left - stageRect.left) / currentScale;
    const initialFlowTop = (elRect.top - stageRect.top) / currentScale;

    const startCanvasLeft = offset.canvasX ?? initialFlowLeft;
    const startCanvasTop = offset.canvasY ?? initialFlowTop;

    // Snapshot sibling boxes for collision and magnetic checks
    const siblings = getSiblingBoxes ? getSiblingBoxes(id) : [];

    dragContextRef.current = {
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      startCanvasLeft,
      startCanvasTop,
      initialFlowLeft,
      initialFlowTop,
      boxWidth,
      boxHeight,
      siblings,
    };

    setDragCanvasPos({ x: startCanvasLeft, y: startCanvasTop });
    setIsDragging(true);
  };

  // Pointer Move: Real-time magnetic snap detection or experimental freeform
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragContextRef.current || isResizing) return;

    const ctx = dragContextRef.current;
    const currentScale = scale > 0 ? scale : 1;

    // Raw delta moved on screen converted strictly to 960x540 canvas pixels
    const deltaX = (e.clientX - ctx.pointerStartX) / currentScale;
    const deltaY = (e.clientY - ctx.pointerStartY) / currentScale;

    const rawCanvasLeft = ctx.startCanvasLeft + deltaX;
    const rawCanvasTop = ctx.startCanvasTop + deltaY;
    const rawCanvasRight = rawCanvasLeft + ctx.boxWidth;
    const rawCanvasCenterX = rawCanvasLeft + ctx.boxWidth / 2;

    // In Experimental Freeform Mode: Zero magnetic attraction, 100% free placement!
    if (isExperimental) {
      onActiveGuideChange?.(null);
      setDragCanvasPos({ x: rawCanvasLeft, y: rawCanvasTop });
      return;
    }

    // Evaluate Magnetic Alignment Snap Targets:
    let bestSnap: ActiveGuideInfo | null = null;

    // Priority 1: Check if dropped alongside or below another element ("Accanto a un altro" / "Sotto")
    for (const sib of ctx.siblings) {
      // Accanto a Destra: only if it physically fits on canvas (< 900px)
      const fitsOnRight = sib.right + 20 + ctx.boxWidth <= 900;
      const distToRightEdge = Math.abs(rawCanvasLeft - (sib.right + 20));
      const verticalOverlap = Math.abs(rawCanvasTop - sib.top);

      if (fitsOnRight && distToRightEdge < 45 && verticalOverlap < 45) {
        bestSnap = {
          type: 'beside',
          guideX: sib.right + 20,
          guideY: sib.top,
          label: `Accanto a destra`,
        };
        break;
      }

      // Accanto a Sinistra: only if it physically fits on canvas (> 60px)
      const fitsOnLeft = sib.left - 20 - ctx.boxWidth >= 60;
      const distToLeftEdge = Math.abs(rawCanvasRight - (sib.left - 20));
      if (fitsOnLeft && distToLeftEdge < 45 && verticalOverlap < 45) {
        bestSnap = {
          type: 'beside',
          guideX: sib.left - 20,
          guideY: sib.top,
          label: `Accanto a sinistra`,
        };
        break;
      }

      // In colonna sotto (Directly below sibling, aligned with sibling's left edge)
      const distToBottomEdge = Math.abs(rawCanvasTop - (sib.bottom + 16));
      const horizAlign = Math.abs(rawCanvasLeft - sib.left);
      if (distToBottomEdge < 38 && horizAlign < 42) {
        bestSnap = {
          type: 'below',
          guideX: sib.left,
          guideY: sib.bottom + 16,
          label: `In colonna`,
        };
        break;
      }

      // Centrato sotto (Directly below sibling, center aligned)
      const centerAlign = Math.abs(rawCanvasCenterX - sib.center);
      if (distToBottomEdge < 38 && centerAlign < 42) {
        bestSnap = {
          type: 'below',
          guideX: sib.center,
          guideY: sib.bottom + 16,
          label: `Centrato sotto`,
        };
        break;
      }
    }

    // Priority 2: Canvas Global Alignments (A Sinistra, Al Centro, A Destra)
    if (!bestSnap) {
      // Left margin check (60px)
      if (Math.abs(rawCanvasLeft - 60) < 55 || rawCanvasLeft < 170) {
        bestSnap = {
          type: 'left',
          guideX: 60,
          label: 'Allinea a Sinistra',
        };
      }
      // Center check (480px)
      else if (Math.abs(rawCanvasCenterX - 480) < 65 || (rawCanvasCenterX >= 380 && rawCanvasCenterX <= 580)) {
        bestSnap = {
          type: 'center',
          guideX: 480,
          label: 'Allinea al Centro',
        };
      }
      // Right margin check (900px)
      else if (Math.abs(rawCanvasRight - 900) < 55 || rawCanvasRight > 780) {
        bestSnap = {
          type: 'right',
          guideX: 900,
          label: 'Allinea a Destra',
        };
      }
    }

    // Priority 3: Collision Warning (If hovering directly over another box without snap)
    if (!bestSnap) {
      const collidingSib = ctx.siblings.find((sib) => {
        return (
          rawCanvasLeft < sib.right &&
          rawCanvasRight > sib.left &&
          rawCanvasTop < sib.bottom &&
          rawCanvasTop + ctx.boxHeight > sib.top
        );
      });

      if (collidingSib) {
        bestSnap = {
          type: 'below',
          guideY: collidingSib.bottom + 16,
          label: `Spazio occupato`,
        };
      }
    }

    onActiveGuideChange?.(bestSnap);
    setDragCanvasPos({ x: rawCanvasLeft, y: rawCanvasTop });
  };

  // Pointer Up: Strict Anti-Overlap Guarantee & Magnetic Snap Calculation
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragContextRef.current) return;

    setIsDragging(false);
    onActiveGuideChange?.(null);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const ctx = dragContextRef.current;
    const currentCanvasLeft = dragCanvasPos.x;
    const currentCanvasTop = dragCanvasPos.y;

    // Experimental Freeform Drop: Pure pixel placement without grid snapping
    if (isExperimental) {
      const clampedX = Math.max(20, Math.min(940 - ctx.boxWidth, currentCanvasLeft));
      const clampedY = Math.max(20, Math.min(520 - ctx.boxHeight, currentCanvasTop));

      onOffsetChange(id, {
        ...offset,
        x: 0,
        y: 0,
        canvasX: Math.round(clampedX),
        canvasY: Math.round(clampedY),
        align: 'left',
        snapLabel: 'Posizione libera',
      });
      return;
    }

    const currentCanvasRight = currentCanvasLeft + ctx.boxWidth;
    const currentCanvasCenterX = currentCanvasLeft + ctx.boxWidth / 2;

    let targetCanvasLeft = currentCanvasLeft;
    let targetCanvasTop = currentCanvasTop;
    let finalAlign: 'left' | 'center' | 'right' | 'beside' = 'left';
    let finalLabel = 'Allineato alla griglia';

    // 1. Check Magnetic Alignment against siblings
    let snappedToSibling = false;
    for (const sib of ctx.siblings) {
      // Accanto a destra: strictly only if it fits within canvas 900px
      if (
        sib.right + 20 + ctx.boxWidth <= 900 &&
        Math.abs(currentCanvasLeft - (sib.right + 20)) < 55 &&
        Math.abs(currentCanvasTop - sib.top) < 50
      ) {
        targetCanvasLeft = sib.right + 20;
        targetCanvasTop = sib.top;
        finalAlign = 'beside';
        finalLabel = `Accanto a ${sib.label}`;
        snappedToSibling = true;
        break;
      }
      // Accanto a sinistra: strictly only if it fits within canvas 60px
      if (
        sib.left - 20 - ctx.boxWidth >= 60 &&
        Math.abs(currentCanvasRight - (sib.left - 20)) < 55 &&
        Math.abs(currentCanvasTop - sib.top) < 50
      ) {
        targetCanvasLeft = sib.left - 20 - ctx.boxWidth;
        targetCanvasTop = sib.top;
        finalAlign = 'beside';
        finalLabel = `Accanto a ${sib.label}`;
        snappedToSibling = true;
        break;
      }
      // Sotto in colonna (sinistra)
      if (Math.abs(currentCanvasTop - (sib.bottom + 16)) < 42 && Math.abs(currentCanvasLeft - sib.left) < 50) {
        targetCanvasLeft = sib.left;
        targetCanvasTop = sib.bottom + 16;
        finalAlign = 'left';
        finalLabel = `In colonna con ${sib.label}`;
        snappedToSibling = true;
        break;
      }
      // Sotto in colonna (centrato)
      if (Math.abs(currentCanvasTop - (sib.bottom + 16)) < 42 && Math.abs(currentCanvasCenterX - sib.center) < 45) {
        targetCanvasLeft = sib.center - ctx.boxWidth / 2;
        targetCanvasTop = sib.bottom + 16;
        finalAlign = 'center';
        finalLabel = `Centrato sotto ${sib.label}`;
        snappedToSibling = true;
        break;
      }
    }

    // 2. Global Canvas Alignments if not sibling-snapped
    if (!snappedToSibling) {
      if (Math.abs(currentCanvasLeft - 60) < 65 || currentCanvasLeft < 190) {
        // A SINISTRA
        targetCanvasLeft = 60;
        finalAlign = 'left';
        finalLabel = 'Allineato a Sinistra';
      } else if (Math.abs(currentCanvasCenterX - 480) < 80 || (currentCanvasCenterX >= 360 && currentCanvasCenterX <= 600)) {
        // AL CENTRO
        targetCanvasLeft = 480 - ctx.boxWidth / 2;
        finalAlign = 'center';
        finalLabel = 'Allineato al Centro';
      } else if (Math.abs(currentCanvasRight - 900) < 65 || currentCanvasRight > 770) {
        // A DESTRA
        targetCanvasLeft = 900 - ctx.boxWidth;
        finalAlign = 'right';
        finalLabel = 'Allineato a Destra';
      } else {
        // Griglia ritmica (passo 40px)
        targetCanvasLeft = 60 + Math.round((currentCanvasLeft - 60) / 40) * 40;
        finalAlign = 'left';
        finalLabel = 'Allineato alla Griglia';
      }

      // Vertical Rhythm (passi di 28px)
      targetCanvasTop = 60 + Math.round((currentCanvasTop - 60) / 28) * 28;
    }

    // 3. STRICT ANTI-OVERLAP RESOLVER: GUARANTEE ZERO OVERLAP WITH ANY SIBLING BOX
    const GAP = 16; // Minimum spacing clearance in px

    const testCollision = (testLeft: number, testTop: number) => {
      const boxRight = testLeft + ctx.boxWidth;
      const boxBottom = testTop + ctx.boxHeight;
      return ctx.siblings.find((sib) => {
        return (
          testLeft < sib.right + GAP &&
          boxRight > sib.left - GAP &&
          testTop < sib.bottom + GAP &&
          boxBottom > sib.top - GAP
        );
      });
    };

    let colliding = testCollision(targetCanvasLeft, targetCanvasTop);

    if (colliding) {
      const candidates: Array<{ left: number; top: number; dist: number; align: 'left' | 'center' | 'right' | 'beside'; label: string }> = [];

      const userClampedLeft = Math.max(60, Math.min(900 - ctx.boxWidth, targetCanvasLeft));

      for (const sib of ctx.siblings) {
        // Option 1: Directly below sibling aligned with user's target X (if clear)
        const belowTop = sib.bottom + GAP;
        if (!testCollision(userClampedLeft, belowTop)) {
          candidates.push({
            left: userClampedLeft,
            top: belowTop,
            dist: Math.hypot(userClampedLeft - targetCanvasLeft, belowTop - targetCanvasTop),
            align: finalAlign,
            label: `Posizionato sotto`,
          });
        }

        // Option 2: Directly below sibling aligned with sibling's left edge
        if (!testCollision(sib.left, belowTop)) {
          candidates.push({
            left: Math.max(60, Math.min(900 - ctx.boxWidth, sib.left)),
            top: belowTop,
            dist: Math.hypot(userClampedLeft - targetCanvasLeft, belowTop - targetCanvasTop),
            align: 'left',
            label: `Posizionato sotto`,
          });
        }

        // Option 3: Beside to the right (ONLY if it fits horizontally without overflowing canvas!)
        if (sib.right + GAP + ctx.boxWidth <= 900) {
          const besideRightX = sib.right + GAP;
          candidates.push({
            left: besideRightX,
            top: sib.top,
            dist: Math.hypot(besideRightX - targetCanvasLeft, sib.top - targetCanvasTop),
            align: 'beside',
            label: `Accanto`,
          });
        }

        // Option 4: Beside to the left (ONLY if it fits horizontally without overflowing canvas!)
        if (sib.left - GAP - ctx.boxWidth >= 60) {
          const besideLeftX = sib.left - GAP - ctx.boxWidth;
          candidates.push({
            left: besideLeftX,
            top: sib.top,
            dist: Math.hypot(besideLeftX - targetCanvasLeft, sib.top - targetCanvasTop),
            align: 'beside',
            label: `Accanto`,
          });
        }

        // Option 5: Directly above this sibling (if room)
        const aboveTop = sib.top - GAP - ctx.boxHeight;
        if (aboveTop >= 55) {
          candidates.push({
            left: Math.max(60, Math.min(900 - ctx.boxWidth, sib.left)),
            top: aboveTop,
            dist: Math.hypot(sib.left - targetCanvasLeft, aboveTop - targetCanvasTop),
            align: 'left',
            label: `Sopra`,
          });
        }
      }

      // Filter only strictly valid collision-free candidates
      const validCandidates = candidates.filter((c) => !testCollision(c.left, c.top));

      if (validCandidates.length > 0) {
        validCandidates.sort((a, b) => a.dist - b.dist);
        targetCanvasLeft = validCandidates[0].left;
        targetCanvasTop = validCandidates[0].top;
        finalAlign = validCandidates[0].align;
        finalLabel = validCandidates[0].label;
        colliding = undefined;
      } else {
        // Fallback: stack vertically below the lowest sibling
        const maxBottom = Math.max(...ctx.siblings.map((s) => s.bottom));
        targetCanvasTop = Math.min(480 - ctx.boxHeight, maxBottom + GAP);
        targetCanvasLeft = Math.max(60, Math.min(900 - ctx.boxWidth, targetCanvasLeft));
        colliding = undefined;
      }
    }

    // Keep within canvas limits (60px to 900px horizontal, 45px to 505px vertical)
    targetCanvasLeft = Math.max(60, Math.min(900 - ctx.boxWidth, targetCanvasLeft));
    targetCanvasTop = Math.max(45, Math.min(505 - ctx.boxHeight, targetCanvasTop));

    // Check if dropped back near initial layout position
    const distToInitial =
      Math.abs(targetCanvasLeft - ctx.initialFlowLeft) + Math.abs(targetCanvasTop - ctx.initialFlowTop);

    if (distToInitial < 16 && !colliding) {
      // Restore default flow position
      onOffsetChange(id, {
        ...offset,
        x: 0,
        y: 0,
        canvasX: undefined,
        canvasY: undefined,
        align: 'left',
        snapLabel: undefined,
      });
      return;
    }

    // Lock fixed canvas position (will NEVER move when zoomed or enlarged!)
    onOffsetChange(id, {
      ...offset,
      x: 0,
      y: 0,
      canvasX: Math.round(targetCanvasLeft),
      canvasY: Math.round(targetCanvasTop),
      align: finalAlign,
      snapLabel: finalLabel,
    });
  };

  // Horizontal Resize Handlers
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const containerEl = containerRef.current;
    if (!containerEl) return;

    const currentScale = scale > 0 ? scale : 1;
    const zoomFactor = textZoom && textZoom > 0 ? textZoom : 1;
    const rect = containerEl.getBoundingClientRect();
    const currentUnscaledWidth = rect.width / (currentScale * zoomFactor);

    resizeContextRef.current = {
      pointerStartX: e.clientX,
      startWidth: offset.width || currentUnscaledWidth,
    };
    setIsResizing(true);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !resizeContextRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const currentScale = scale > 0 ? scale : 1;
    const zoomFactor = textZoom && textZoom > 0 ? textZoom : 1;
    const deltaX = (e.clientX - resizeContextRef.current.pointerStartX) / (currentScale * zoomFactor);
    const newWidth = Math.max(120, Math.min(880, Math.round(resizeContextRef.current.startWidth + deltaX)));

    onOffsetChange(id, {
      ...offset,
      width: newWidth,
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    setIsResizing(false);
    resizeContextRef.current = null;
  };

  const handleResetWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOffsetChange(id, {
      ...offset,
      width: undefined,
    });
  };

  // Reset to original layout on double-click
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOffsetChange(id, {
      x: 0,
      y: 0,
      canvasX: undefined,
      canvasY: undefined,
      width: undefined,
      align: 'left',
      snapLabel: undefined,
      boxStyle: undefined,
    });
  };

  const handleToggleBoxStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOffsetChange(id, {
      ...offset,
      boxStyle: offset.boxStyle === 'card' ? 'none' : 'card',
    });
  };

  // Align class for text rendering based on magnetic snap
  const textAlignmentClass =
    offset.align === 'center'
      ? 'text-center'
      : offset.align === 'right'
        ? 'text-right'
        : 'text-left';

  const isCardBox = offset.boxStyle === 'card';

  // Compute position styling
  let positionStyle: React.CSSProperties;

  if (isDragging) {
    positionStyle = {
      position: 'absolute',
      left: `${dragCanvasPos.x}px`,
      top: `${dragCanvasPos.y}px`,
      zIndex: 60,
      transition: 'none',
      touchAction: 'none',
    };
  } else if (hasCanvasPos) {
    positionStyle = {
      position: 'absolute',
      left: `${offset.canvasX}px`,
      top: `${offset.canvasY}px`,
      zIndex: 25,
      transition: isResizing
        ? 'none'
        : 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.1s ease, box-shadow 0.25s ease',
      touchAction: 'none',
    };
  } else {
    positionStyle = {
      position: 'relative',
      zIndex: 10,
      transition: isResizing ? 'none' : 'width 0.1s ease',
      touchAction: 'none',
    };
  }

  // Apply card box colors if explicitly boxed
  if (isCardBox) {
    positionStyle.backgroundColor = theme.cardBg;
    positionStyle.borderColor = theme.cardBorder;
  }

  // Apply custom resized width if set
  if (offset.width) {
    positionStyle.width = `${offset.width}px`;
    positionStyle.maxWidth = `${offset.width}px`;
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={positionStyle}
      className={`group/box w-fit max-w-full select-none cursor-grab active:cursor-grabbing rounded-2xl transition-all ${textAlignmentClass} ${
        isCardBox ? 'p-5 border shadow-md' : ''
      } ${
        isDragging
          ? 'ring-2 ring-sky-400 shadow-2xl backdrop-blur-[2px]'
          : isHovered
            ? 'ring-1 ring-white/30'
            : hasCanvasPos
              ? 'ring-1 ring-sky-500/30'
              : ''
      } ${className}`}
      title="Trascina per allineare. Usa la barra a destra per stringere o il pulsante Box per racchiudere/estrarre dalla box."
    >
      {/* Discreet Box Toggle and Reset Buttons on Hover */}
      {isHovered && !isDragging && !isResizing && !isPresenterMode && (
        <div className="absolute -top-3 -right-2.5 z-30 flex items-center gap-1 pointer-events-auto">
          {/* Toggle Box / Card Container */}
          <button
            onClick={handleToggleBoxStyle}
            className={`p-1 rounded-full border shadow-md transition-all duration-150 flex items-center justify-center ${
              isCardBox
                ? 'bg-sky-600 border-sky-400 text-white'
                : 'bg-neutral-900/90 border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title={
              isCardBox
                ? 'Rimuovi box (Testo libero esterno)'
                : 'Racchiudi in una box (Card con sfondo e bordo)'
            }
          >
            <Square className="w-2.5 h-2.5" />
          </button>

          {(hasCanvasPos || offset.width || offset.boxStyle) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(e);
              }}
              className="p-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800 shadow-md transition-all duration-150 flex items-center justify-center"
              title="Ripristina posizione, larghezza e box (doppio clic)"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}

      {/* Right Edge Horizontal Resize Bar */}
      {!isPresenterMode && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          onDoubleClick={handleResetWidth}
          className="absolute -right-2.5 top-0 bottom-0 w-5 cursor-ew-resize group/resizer z-30 flex items-center justify-center select-none pointer-events-auto"
          title="Trascina verso sinistra per stringere la casella (doppio clic per ripristinare larghezza automatica)"
        >
          {/* Visual handle indicator */}
          <div
            className={`w-1 rounded-full transition-all duration-150 ${
              isResizing
                ? 'h-full bg-sky-400 opacity-100 ring-2 ring-sky-400/50 shadow-lg'
                : isHovered
                  ? 'h-3/4 bg-sky-400/80 group-hover/resizer:bg-sky-400 group-hover/resizer:w-1.5 opacity-90'
                  : 'h-1/2 bg-white/20 opacity-0 group-hover/box:opacity-60'
            }`}
          />
        </div>
      )}

      {/* Wrapped Content with Real Scaled Zoom */}
      <div className="relative z-10 pointer-events-none w-fit max-w-full" style={zoomStyle}>
        {children}
      </div>
    </div>
  );
};
