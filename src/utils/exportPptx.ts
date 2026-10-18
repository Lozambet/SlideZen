import pptxgen from 'pptxgenjs';
import { Slide, PresentationTheme } from '../types/presentation';

// Helper to convert hex #ffffff to hex string ffffff
function cleanHex(color: string): string {
  if (!color) return '000000';
  return color.replace('#', '').trim();
}

export async function exportToPptx(
  slides: Slide[],
  theme: PresentationTheme,
  filename = 'presentazione.pptx'
): Promise<void> {
  const pptx = new pptxgen();

  // Standard 16:9 widescreen
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'SlideZen Studio';
  pptx.company = 'SlideZen';
  pptx.title = slides[0]?.title || 'Presentazione';

  const bgColor = cleanHex(theme.slideBg);
  const textPrimaryColor = cleanHex(theme.textPrimary);
  const textSecondaryColor = cleanHex(theme.textSecondary);
  const accentColor = cleanHex(theme.accent);
  const cardBgColor = cleanHex(theme.cardBg);

  slides.forEach((slide) => {
    const pSlide = pptx.addSlide();

    // Background color
    pSlide.background = { color: bgColor };

    if (slide.layout === 'hero') {
      // Big title
      pSlide.addText(slide.title, {
        x: '8%',
        y: '28%',
        w: '84%',
        h: '28%',
        fontSize: 40,
        bold: true,
        color: textPrimaryColor,
        fontFace: theme.isDark ? 'Arial' : 'Georgia',
        align: 'left',
        valign: 'middle',
      });

      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: '8%',
          y: '56%',
          w: '84%',
          h: '15%',
          fontSize: 20,
          color: accentColor,
          fontFace: 'Arial',
          align: 'left',
        });
      }

      if (slide.content.length > 0) {
        const bullets = slide.content.map((c) => ({
          text: c,
          options: { fontSize: 14, color: textSecondaryColor, bullet: true },
        }));
        pSlide.addText(bullets, {
          x: '8%',
          y: '72%',
          w: '84%',
          h: '18%',
          align: 'left',
        });
      }
    } else if (slide.layout === 'stat') {
      // Title top
      pSlide.addText(slide.title, {
        x: '8%',
        y: '10%',
        w: '84%',
        h: '12%',
        fontSize: 26,
        bold: true,
        color: textPrimaryColor,
      });

      // Massive number
      pSlide.addText(slide.statNumber || '100%', {
        x: '8%',
        y: '26%',
        w: '84%',
        h: '30%',
        fontSize: 64,
        bold: true,
        color: accentColor,
        fontFace: 'Arial',
        align: 'left',
      });

      if (slide.statLabel) {
        pSlide.addText(slide.statLabel, {
          x: '8%',
          y: '56%',
          w: '84%',
          h: '10%',
          fontSize: 20,
          bold: true,
          color: textPrimaryColor,
        });
      }

      if (slide.content.length > 0) {
        const bullets = slide.content.map((c) => ({
          text: c,
          options: { fontSize: 14, color: textSecondaryColor },
        }));
        pSlide.addText(bullets, {
          x: '8%',
          y: '68%',
          w: '84%',
          h: '22%',
        });
      }
    } else if (slide.layout === 'quote') {
      // Big quote mark
      pSlide.addText('“', {
        x: '8%',
        y: '16%',
        w: '12%',
        h: '15%',
        fontSize: 72,
        color: accentColor,
        bold: true,
      });

      // Quote text
      pSlide.addText(slide.content.join(' ') || slide.title, {
        x: '14%',
        y: '28%',
        w: '75%',
        h: '40%',
        fontSize: 24,
        italic: true,
        color: textPrimaryColor,
        fontFace: 'Georgia',
        align: 'left',
      });

      if (slide.quoteAuthor) {
        pSlide.addText(`— ${slide.quoteAuthor}`, {
          x: '14%',
          y: '70%',
          w: '75%',
          h: '10%',
          fontSize: 16,
          bold: true,
          color: accentColor,
        });
      }
    } else if (slide.layout === 'cards' && slide.columns && slide.columns.length > 0) {
      // Title
      pSlide.addText(slide.title, {
        x: '8%',
        y: '8%',
        w: '84%',
        h: '12%',
        fontSize: 26,
        bold: true,
        color: textPrimaryColor,
      });

      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: '8%',
          y: '20%',
          w: '84%',
          h: '8%',
          fontSize: 15,
          color: textSecondaryColor,
        });
      }

      const colCount = Math.min(slide.columns.length, 3);
      const colWidth = 26; // percent
      const gap = 3;

      slide.columns.slice(0, 3).forEach((col, cIdx) => {
        const leftPos = 8 + cIdx * (colWidth + gap);

        // Card shape
        pSlide.addShape(pptx.ShapeType.rect, {
          x: `${leftPos}%`,
          y: '32%',
          w: `${colWidth}%`,
          h: '56%',
          fill: { color: cardBgColor },
          line: { color: accentColor, width: 1 },
        });

        // Col Title
        pSlide.addText(col.title, {
          x: `${leftPos + 2}%`,
          y: '36%',
          w: `${colWidth - 4}%`,
          h: '12%',
          fontSize: 18,
          bold: true,
          color: textPrimaryColor,
        });

        // Col Description
        pSlide.addText(col.description, {
          x: `${leftPos + 2}%`,
          y: '50%',
          w: `${colWidth - 4}%`,
          h: '34%',
          fontSize: 13,
          color: textSecondaryColor,
        });
      });
    } else {
      // Default bullets / split layout
      pSlide.addText(slide.title, {
        x: '8%',
        y: '10%',
        w: '84%',
        h: '12%',
        fontSize: 28,
        bold: true,
        color: textPrimaryColor,
      });

      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: '8%',
          y: '22%',
          w: '84%',
          h: '8%',
          fontSize: 16,
          color: accentColor,
        });
      }

      if (slide.content.length > 0) {
        const bullets = slide.content.map((c) => ({
          text: c,
          options: {
            fontSize: 16,
            color: textPrimaryColor,
            bullet: { type: 'bullet' as const },
            breakLine: true,
          },
        }));

        pSlide.addText(bullets, {
          x: '8%',
          y: '34%',
          w: '84%',
          h: '56%',
          lineSpacing: 24,
        });
      }
    }

    // Speaker notes (Note del relatore)
    if (slide.notes && slide.notes.trim()) {
      pSlide.addNotes(slide.notes.trim());
    }
  });

  await pptx.writeFile({ fileName: filename });
}
