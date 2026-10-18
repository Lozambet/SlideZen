import { jsPDF } from 'jspdf';
import { Slide, PresentationTheme } from '../types/presentation';

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export async function exportToPdf(
  slides: Slide[],
  theme: PresentationTheme,
  filename = 'presentazione.pdf'
): Promise<void> {
  // Standard 16:9 Landscape dimensions in points (960 x 540)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540],
  });

  const bgRgb = hexToRgb(theme.slideBg);
  const textPrimaryRgb = hexToRgb(theme.textPrimary);
  const textSecondaryRgb = hexToRgb(theme.textSecondary);
  const accentRgb = hexToRgb(theme.accent);
  const cardBgRgb = hexToRgb(theme.cardBg);
  const cardBorderRgb = hexToRgb(theme.cardBorder);

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([960, 540], 'landscape');
    }

    // 1. Draw slide background
    doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    doc.rect(0, 0, 960, 540, 'F');

    // 2. Slide numbering footer
    doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
    doc.setFontSize(10);
    doc.text(`${index + 1} / ${slides.length}`, 900, 515, { align: 'right' });

    // 3. Render Slide Content according to layout
    if (slide.layout === 'hero') {
      // Accent bar
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.rect(60, 140, 48, 4, 'F');

      // Main Title
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      const splitTitle = doc.splitTextToSize(slide.title, 820);
      doc.text(splitTitle, 60, 200);

      const titleHeight = splitTitle.length * 42;
      let nextY = 200 + titleHeight;

      if (slide.subtitle) {
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        const splitSub = doc.splitTextToSize(slide.subtitle, 820);
        doc.text(splitSub, 60, nextY);
        nextY += splitSub.length * 24 + 16;
      }

      if (slide.content.length > 0) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        slide.content.forEach((line) => {
          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.circle(65, nextY - 4, 3, 'F');
          const splitLine = doc.splitTextToSize(line, 780);
          doc.text(splitLine, 80, nextY);
          nextY += splitLine.length * 20 + 8;
        });
      }
    } else if (slide.layout === 'stat') {
      // Slide Title
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.title, 60, 80);

      // Stat container box
      doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
      doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
      doc.roundedRect(60, 110, 840, 360, 8, 8, 'FD');

      // Massive number
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setFontSize(72);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.statNumber || '100%', 100, 210);

      // Stat label
      if (slide.statLabel) {
        doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(slide.statLabel, 100, 260);
      }

      // Content description
      if (slide.content.length > 0) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(15);
        doc.setFont('helvetica', 'normal');
        let cY = 300;
        slide.content.forEach((line) => {
          const splitLine = doc.splitTextToSize(line, 740);
          doc.text(splitLine, 100, cY);
          cY += splitLine.length * 22 + 6;
        });
      }
    } else if (slide.layout === 'quote') {
      // Big quotation mark
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setFontSize(80);
      doc.setFont('times', 'italic');
      doc.text('“', 70, 160);

      // Quote text
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(24);
      doc.setFont('times', 'italic');
      const quoteBody = slide.content.length > 0 ? slide.content.join(' ') : slide.title;
      const splitQuote = doc.splitTextToSize(quoteBody, 760);
      doc.text(splitQuote, 110, 190);

      const qHeight = splitQuote.length * 32;

      if (slide.quoteAuthor) {
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`— ${slide.quoteAuthor}`, 110, 210 + qHeight);
      }
    } else if (slide.layout === 'cards') {
      // Title
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.title, 60, 75);

      if (slide.subtitle) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(slide.subtitle, 60, 100);
      }

      const cardWidth = 260;
      const gap = 25;
      const startX = 60;
      const startY = 130;

      const items =
        slide.columns && slide.columns.length > 0
          ? slide.columns.slice(0, 3)
          : slide.content.slice(0, 3).map((item, idx) => ({
              title: `0${idx + 1}`,
              description: item,
            }));

      items.forEach((col, cIdx) => {
        const x = startX + cIdx * (cardWidth + gap);

        // Card background
        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.roundedRect(x, startY, cardWidth, 340, 8, 8, 'FD');

        // Card top accent line
        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.rect(x + 20, startY + 24, 32, 3, 'F');

        // Card Title
        doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const splitTitle = doc.splitTextToSize(col.title, cardWidth - 40);
        doc.text(splitTitle, x + 20, startY + 60);

        // Card Description
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(col.description, cardWidth - 40);
        doc.text(splitDesc, x + 20, startY + 70 + splitTitle.length * 20);
      });
    } else if (slide.layout === 'timeline') {
      // Title
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.title, 60, 75);

      if (slide.subtitle) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(slide.subtitle, 60, 100);
      }

      const stepWidth = 195;
      const gap = 20;
      const startX = 60;
      const startY = 135;

      slide.content.slice(0, 4).forEach((step, sIdx) => {
        const x = startX + sIdx * (stepWidth + gap);

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.roundedRect(x, startY, stepWidth, 320, 8, 8, 'FD');

        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`FASE ${sIdx + 1}`, x + 18, startY + 32);

        doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const splitStep = doc.splitTextToSize(step, stepWidth - 36);
        doc.text(splitStep, x + 18, startY + 70);
      });
    } else if (slide.layout === 'comparison') {
      // Title
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.title, 60, 75);

      if (slide.subtitle) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(slide.subtitle, 60, 100);
      }

      const boxWidth = 405;
      const startY = 130;

      // Left box: Challenge
      doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
      doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
      doc.roundedRect(60, startY, boxWidth, 340, 8, 8, 'FD');

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SITUAZIONE ATTUALE / SFIDA', 84, startY + 36);

      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      const leftText = doc.splitTextToSize(
        slide.content[0] || 'Descrizione della problematica affrontata',
        boxWidth - 48
      );
      doc.text(leftText, 84, startY + 72);

      // Right box: Solution
      doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.roundedRect(495, startY, boxWidth, 340, 8, 8, 'FD');

      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('NUOVA SOLUZIONE / RISULTATO', 519, startY + 36);

      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      const rightText = doc.splitTextToSize(
        slide.content[1] || slide.content[0] || 'Vantaggi apportati e trasformazione',
        boxWidth - 48
      );
      doc.text(rightText, 519, startY + 72);
    } else if (slide.layout === 'split-image') {
      // Left Column Text
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      const splitTitle = doc.splitTextToSize(slide.title, 400);
      doc.text(splitTitle, 60, 90);

      let curY = 90 + splitTitle.length * 32;
      if (slide.subtitle) {
        doc.setTextColor(textSecondaryRgb.r, textSecondaryRgb.g, textSecondaryRgb.b);
        doc.setFontSize(15);
        doc.setFont('helvetica', 'normal');
        const splitSub = doc.splitTextToSize(slide.subtitle, 400);
        doc.text(splitSub, 60, curY);
        curY += splitSub.length * 22 + 16;
      }

      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      slide.content.forEach((line) => {
        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.circle(68, curY - 4, 3, 'F');
        const splitLine = doc.splitTextToSize(line, 375);
        doc.text(splitLine, 82, curY);
        curY += splitLine.length * 20 + 10;
      });

      // Right Column Image or Box
      if (slide.imageUrl && slide.imageUrl.startsWith('data:image/')) {
        try {
          const format = slide.imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(slide.imageUrl, format, 500, 95, 400, 300, undefined, 'FAST');
        } catch {
          doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
          doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
          doc.roundedRect(500, 95, 400, 300, 8, 8, 'FD');
        }
      } else {
        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.roundedRect(500, 95, 400, 300, 8, 8, 'FD');
      }
    } else {
      // Default Bullets & Content
      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(slide.title, 60, 80);

      let curY = 110;
      if (slide.subtitle) {
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(slide.subtitle, 60, curY);
        curY += 30;
      }

      doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'normal');

      slide.content.forEach((line) => {
        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.circle(70, curY - 5, 3.5, 'F');

        const splitLine = doc.splitTextToSize(line, 780);
        doc.text(splitLine, 85, curY);
        curY += splitLine.length * 22 + 10;
      });
    }
  });

  doc.save(filename);
}
