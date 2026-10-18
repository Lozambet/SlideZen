import { Slide, SlideLayout } from '../types/presentation';

export function parseRawTextToSlides(rawText: string): Slide[] {
  if (!rawText.trim()) {
    return [
      {
        id: 'slide-1',
        rawText: '',
        title: 'Nuova Presentazione',
        subtitle: 'Inizia a scrivere nel riquadro per creare le tue diapositive',
        layout: 'hero',
        content: ['Scrivi il titolo, i punti elenco e le indicazioni grafiche.'],
      },
    ];
  }

  // Split by markdown delimiter '---' or double blank lines with header
  let slideBlocks: string[] = [];
  if (rawText.includes('---')) {
    slideBlocks = rawText.split(/\n\s*---\s*\n/).map((b) => b.trim()).filter(Boolean);
  } else {
    // If no '---', split by headers '# ' if multiple exist
    const headerMatches = rawText.split(/\n(?=#\s)/);
    if (headerMatches.length > 1) {
      slideBlocks = headerMatches.map((b) => b.trim()).filter(Boolean);
    } else {
      slideBlocks = [rawText.trim()];
    }
  }

  if (slideBlocks.length === 0) {
    slideBlocks = [rawText.trim()];
  }

  return slideBlocks.map((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = `Diapositiva ${idx + 1}`;
    let subtitle: string | undefined = undefined;
    let graphicNotes: string | undefined = undefined;
    let statNumber: string | undefined = undefined;
    let statLabel: string | undefined = undefined;
    let quoteAuthor: string | undefined = undefined;
    let layout: SlideLayout = idx === 0 ? 'hero' : 'bullets';
    const contentLines: string[] = [];
    const columns: { title: string; description: string }[] = [];

    for (const line of lines) {
      // Check for graphic directives: [grafica: ...], [indicazione: ...], [immagine: ...]
      const graphicMatch = line.match(/^\[(grafica|indicazione|schema|immagine|visivo):\s*(.*?)\]$/i);
      if (graphicMatch) {
        graphicNotes = graphicMatch[2].trim();
        const gLow = graphicNotes.toLowerCase();
        if (gLow.includes('3 colonne') || gLow.includes('colonne') || gLow.includes('pilastri') || gLow.includes('card')) {
          layout = 'cards';
        } else if (gLow.includes('statistica') || gLow.includes('numero') || gLow.includes('percentuale')) {
          layout = 'stat';
        } else if (gLow.includes('citazione') || gLow.includes('quote')) {
          layout = 'quote';
        } else if (gLow.includes('timeline') || gLow.includes('fasi') || gLow.includes('passi') || gLow.includes('roadmap')) {
          layout = 'timeline';
        } else if (gLow.includes('confronto') || gLow.includes('prima e dopo') || gLow.includes('vs')) {
          layout = 'comparison';
        } else if (gLow.includes('immagine') || gLow.includes('foto') || gLow.includes('visual')) {
          layout = 'split-image';
        }
        continue;
      }

      // Check for layout directive: [layout: hero | cards | stat | ...]
      const layoutMatch = line.match(/^\[layout:\s*([a-zA-Z-]+)\]$/i);
      if (layoutMatch) {
        const reqLayout = layoutMatch[1].toLowerCase() as SlideLayout;
        if (['hero', 'bullets', 'cards', 'stat', 'quote', 'timeline', 'split-image', 'comparison'].includes(reqLayout)) {
          layout = reqLayout;
        }
        continue;
      }

      // Check for stat directive: [statistica: +85% Crescita]
      const statMatch = line.match(/^\[statistica?:\s*([^\s]+)\s*(.*?)\]$/i);
      if (statMatch) {
        statNumber = statMatch[1];
        statLabel = statMatch[2] || undefined;
        layout = 'stat';
        continue;
      }

      // Check for quote directive: [citazione: "testo" - Autore] or > quote
      const quoteMatch = line.match(/^\[citazione:\s*"?([^"-]+)"?\s*(?:-\s*(.*?))?\]$/i);
      if (quoteMatch) {
        contentLines.push(quoteMatch[1].trim());
        if (quoteMatch[2]) quoteAuthor = quoteMatch[2].trim();
        layout = 'quote';
        continue;
      }

      // Check for column directive: [colonna: Titolo | Descrizione]
      const colMatch = line.match(/^\[colonna:\s*(.*?)\s*\|\s*(.*?)\]$/i);
      if (colMatch) {
        columns.push({ title: colMatch[1].trim(), description: colMatch[2].trim() });
        layout = 'cards';
        continue;
      }

      // Check for Title: '# Titolo' or 'Titolo: ...'
      if (line.startsWith('# ')) {
        title = line.replace(/^#\s+/, '').trim();
        continue;
      }

      // Check for Subtitle: '## Sottotitolo' or 'Sottotitolo: ...'
      if (line.startsWith('## ')) {
        subtitle = line.replace(/^##\s+/, '').trim();
        continue;
      }

      // Blockquote markdown '> Citazione'
      if (line.startsWith('>')) {
        const qText = line.replace(/^>\s*/, '').trim();
        contentLines.push(qText);
        layout = 'quote';
        continue;
      }

      // If title is default and line doesn't start with bullet, check if it's the title
      if (title.startsWith('Diapositiva') && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('1.')) {
        title = line;
        continue;
      }

      // Otherwise regular bullet or text line
      const cleanContent = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      contentLines.push(cleanContent);
    }

    // Auto-detect stat if statNumber not set yet and first line is genuinely a metric (percentage, currency, multiplier)
    if (!statNumber && layout !== 'hero' && contentLines.length > 0) {
      const firstLine = contentLines[0];
      const numMatch = firstLine.match(/^([+−-]?\d+(?:[.,]\d+)?%|[€$£¥]\s*\d+(?:[.,]\d+)?[kKmMbB]?|\b\d+(?:[.,]\d+)?[xX]\b|\b\d+(?:[.,]\d+)?\s*[kKmMbB]\+?|\b\d{2,}\+\b)\s*(?:[-–:]\s*(.*))?$/);
      if (numMatch) {
        statNumber = numMatch[1];
        if (numMatch[2]) statLabel = numMatch[2];
        layout = 'stat';
        contentLines.shift();
      }
    }

    // If 3+ content lines and no specific layout yet, cards can be a great visual
    if (layout === 'bullets' && contentLines.length >= 3 && graphicNotes?.includes('card')) {
      layout = 'cards';
    }

    return {
      id: `slide-${idx + 1}-${Date.now().toString(36)}`,
      rawText: block,
      title: title || `Diapositiva ${idx + 1}`,
      subtitle,
      layout,
      content: contentLines,
      graphicNotes,
      statNumber,
      statLabel,
      quoteAuthor,
      columns: columns.length > 0 ? columns : undefined,
    };
  });
}

export function slidesToRawText(slides: Slide[]): string {
  return slides
    .map((slide) => {
      const parts: string[] = [];
      parts.push(`# ${slide.title}`);
      if (slide.subtitle) {
        parts.push(`## ${slide.subtitle}`);
      }
      if (slide.graphicNotes) {
        parts.push(`[grafica: ${slide.graphicNotes}]`);
      }
      if (slide.layout !== 'bullets' && slide.layout !== 'hero') {
        parts.push(`[layout: ${slide.layout}]`);
      }
      if (slide.statNumber) {
        parts.push(`[statistica: ${slide.statNumber}${slide.statLabel ? ` ${slide.statLabel}` : ''}]`);
      }
      if (slide.quoteAuthor) {
        parts.push(`[citazione: "${slide.content.join(' ')}" - ${slide.quoteAuthor}]`);
      } else {
        slide.content.forEach((line) => {
          parts.push(`- ${line}`);
        });
      }
      if (slide.columns && slide.columns.length > 0) {
        slide.columns.forEach((col) => {
          parts.push(`[colonna: ${col.title} | ${col.description}]`);
        });
      }
      return parts.join('\n');
    })
    .join('\n\n---\n\n');
}
