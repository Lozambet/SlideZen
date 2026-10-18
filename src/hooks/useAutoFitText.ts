import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Custom hook that automatically calculates and reduces font size
 * for text blocks that exceed the slide container boundaries,
 * ensuring the preview and final output always match perfectly without overflowing.
 *
 * @param maxHeight Maximum allowable pixel height for the content container (default: 390px in 960x540 canvas)
 * @param dependencies Array of dependencies that should trigger re-measurement (e.g. slide.title, slide.content, slide.layout)
 */
export function useAutoFitText(maxHeight = 390, dependencies: any[] = []) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontScale, setFontScale] = useState<number>(1);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // First measure natural scrollHeight
    const measureAndFit = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const scrollHeight = element.scrollHeight;

      if (scrollHeight > maxHeight && maxHeight > 0) {
        // Calculate needed reduction ratio with safety padding
        const calculatedRatio = (maxHeight / scrollHeight) * 0.95;
        // Clamp scale factor between 0.55 (minimum legible size) and 1.0 (standard size)
        const clampedScale = Math.max(0.55, Math.min(1.0, calculatedRatio));
        setFontScale(Number(clampedScale.toFixed(3)));
      } else {
        setFontScale(1);
      }
    };

    // Run initial measurement
    measureAndFit();

    // Check on next animation frame after DOM text layout settles
    const frameId = requestAnimationFrame(measureAndFit);

    // Also observe container mutations if content dynamically changes
    const observer = new ResizeObserver(() => {
      measureAndFit();
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxHeight, ...dependencies]);

  return { contentRef, fontScale };
}
