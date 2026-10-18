import { Slide, SlideLayout, SlideColumn } from '../types/presentation';

export function parseNaturalSlideText(
  rawText: string,
  slideIndex = 0,
  existingId?: string,
  currentLayout?: SlideLayout
): Slide {
  const trimmed = rawText.trim();
  const id = existingId || `slide-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  if (!trimmed) {
    return {
      id,
      rawText: '',
      title: `Diapositiva ${slideIndex + 1}`,
      subtitle: undefined,
      layout: currentLayout || (slideIndex === 0 ? 'hero' : 'bullets'),
      content: ['Scrivi qui il testo e le indicazioni per questa diapositiva.'],
      aiLayoutReason: 'Disposizione predefinita',
    };
  }

  // Replace user-typed literal \n with dedicated empty paragraph tokens
  const preprocessed = trimmed.replace(/\\n/g, '\n\n__EMPTY_PARAGRAPH__\n\n');

  // Due volte a capo (doppio Invio) separa le caselle di testo indipendenti.
  // Un singolo a capo mantiene il testo nella stessa casella/blocco.
  const rawParagraphs = preprocessed
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .map((p) => (p === '__EMPTY_PARAGRAPH__' ? '' : p))
    .filter((p, i) => p !== '' || i > 0); // Allow empty paragraphs after title

  let title = '';
  let subtitle: string | undefined = undefined;
  let detectedLayout: SlideLayout = slideIndex === 0 ? 'hero' : 'bullets';
  let aiLayoutReason = 'Disposizione a elenco ordinato';
  let statNumber: string | undefined = undefined;
  let statLabel: string | undefined = undefined;
  let quoteAuthor: string | undefined = undefined;
  const content: string[] = [];
  const columns: SlideColumn[] = [];
  let graphicNotes: string | undefined = undefined;

  const fullTextLower = trimmed.toLowerCase();

  // 1. Filter out natural graphic directives
  const contentParagraphs = rawParagraphs.filter((p) => {
    const pLow = p.toLowerCase();
    if (
      pLow.startsWith('vorrei ') ||
      pLow.startsWith('voglio ') ||
      pLow.startsWith('metti ') ||
      pLow.startsWith('fai ') ||
      pLow.startsWith('disponi ') ||
      pLow.startsWith('indicazione grafica:') ||
      pLow.startsWith('grafica:')
    ) {
      graphicNotes = p.replace(/^(indicazione grafica:|grafica:)\s*/i, '').trim();
      return false;
    }
    return true;
  });

  if (contentParagraphs.length === 0) {
    return {
      id,
      rawText,
      title: `Diapositiva ${slideIndex + 1}`,
      layout: 'hero',
      content: [],
      graphicNotes,
    };
  }

  // 2. Determine Title & Subtitle from first paragraph(s)
  let startIndex = 0;
  const firstBlock = contentParagraphs[0];
  const firstBlockLines = firstBlock.split('\n').map((l) => l.trim()).filter(Boolean);
  const extraBodyFromFirstBlock: string[] = [];

  // Match real numerical statistics only (percentages, currencies, multipliers like 10x, or numbers with scale suffix like 100k+)
  // NEVER matches simple list items or numbers like "punto 1", "fase 1", "step 1", or "1."
  const REAL_STAT_REGEX = /([+−-]?\d+(?:[.,]\d+)?%|[€$£¥]\s*\d+(?:[.,]\d+)?[kKmMbB]?|\b\d+(?:[.,]\d+)?[xX]\b|\b\d+(?:[.,]\d+)?\s*[kKmMbB]\+?|\b\d{2,}\+\b)/;

  if (firstBlockLines[0].toLowerCase().startsWith('titolo:')) {
    title = firstBlockLines[0].substring(7).trim();
    if (firstBlockLines.length > 1) {
      if (firstBlockLines[1].toLowerCase().startsWith('sottotitolo:') || firstBlockLines[1].startsWith('##')) {
        subtitle = firstBlockLines[1].replace(/^(sottotitolo:|#+)\s*/i, '').trim();
        extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
      } else {
        subtitle = firstBlockLines[1];
        extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
      }
    }
    startIndex = 1;
  } else if (firstBlockLines[0].startsWith('#')) {
    title = firstBlockLines[0].replace(/^#+\s*/, '').trim();
    if (firstBlockLines.length > 1) {
      if (firstBlockLines[1].startsWith('##') || firstBlockLines[1].toLowerCase().startsWith('sottotitolo:')) {
        subtitle = firstBlockLines[1].replace(/^(sottotitolo:|#+)\s*/i, '').trim();
        extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
      } else {
        subtitle = firstBlockLines[1];
        extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
      }
    }
    startIndex = 1;
  } else if (
    firstBlockLines.length > 1 &&
    (firstBlockLines[1].toLowerCase().startsWith('sottotitolo:') || firstBlockLines[1].startsWith('##'))
  ) {
    title = firstBlockLines[0];
    subtitle = firstBlockLines[1].replace(/^(sottotitolo:|#+)\s*/i, '').trim();
    extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
    startIndex = 1;
  } else if (contentParagraphs.length === 1 && firstBlockLines.length > 1) {
    // Single paragraph entered with single line-breaks (user pressed single Enter)
    title = firstBlockLines[0];
    const secondLineIsSubCandidate =
      firstBlockLines[1].length < 90 &&
      !firstBlockLines[1].includes(':') &&
      !firstBlockLines[1].match(/^[-*•\d]|^(punto|fase|step)\b/i) &&
      firstBlockLines.length > 2;

    if (secondLineIsSubCandidate) {
      subtitle = firstBlockLines[1];
      extraBodyFromFirstBlock.push(...firstBlockLines.slice(2));
    } else {
      extraBodyFromFirstBlock.push(...firstBlockLines.slice(1));
    }
    startIndex = 1;
  } else if (firstBlockLines.length === 2 && firstBlockLines[0].length < 70 && firstBlockLines[1].length < 120 && contentParagraphs.length > 1) {
    title = firstBlockLines[0];
    subtitle = firstBlockLines[1];
    startIndex = 1;
  } else {
    // First line of the first block is the title; remaining lines are treated as body content
    title = firstBlockLines[0] || firstBlock;
    if (firstBlockLines.length > 1) {
      extraBodyFromFirstBlock.push(...firstBlockLines.slice(1));
    }
    startIndex = 1;

    // Check if the second paragraph separated by blank line is a subtitle candidate
    if (contentParagraphs.length > 1) {
      const secondBlock = contentParagraphs[1];
      const hasRealStat = secondBlock.match(REAL_STAT_REGEX);
      const isListItem = secondBlock.match(/^[-*•\d]|^(punto|fase|step)\b/i);

      if (secondBlock.toLowerCase().startsWith('sottotitolo:')) {
        subtitle = secondBlock.substring(12).trim();
        startIndex = 2;
      } else if (secondBlock.startsWith('##')) {
        subtitle = secondBlock.replace(/^#+\s*/, '').trim();
        startIndex = 2;
      } else if (
        !hasRealStat &&
        !isListItem &&
        secondBlock.length < 80 &&
        !secondBlock.includes(':') &&
        contentParagraphs.length > 2
      ) {
        subtitle = secondBlock;
        startIndex = 2;
      }
    }
  }

  // 3. Process remaining content paragraphs (each becomes an independent draggable box)
  const bodyParagraphs = [
    ...extraBodyFromFirstBlock,
    ...contentParagraphs.slice(startIndex),
  ];

  // Check for Colon-separated items (e.g. "Titolo colonna: spiegazione")
  const colonPairs: { title: string; description: string }[] = [];
  for (const para of bodyParagraphs) {
    const cleanPara = para.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    const colonMatch = cleanPara.match(/^([^:–—\n]{2,45})\s*[:–—]\s*([\s\S]+)$/);
    if (colonMatch && colonMatch[1].split(' ').length <= 6) {
      colonPairs.push({
        title: colonMatch[1].trim(),
        description: colonMatch[2].trim(),
      });
    }
    content.push(cleanPara);
  }

  // 4. Layout Decision Engine
  // Check for Quote
  if (
    fullTextLower.includes('citazione') ||
    trimmed.includes('“') ||
    trimmed.includes('”') ||
    (bodyParagraphs.length === 1 && bodyParagraphs[0].startsWith('"')) ||
    (bodyParagraphs.length === 2 && bodyParagraphs[1].toLowerCase().includes('citazione'))
  ) {
    detectedLayout = 'quote';
    aiLayoutReason = 'Rilevata citazione o dichiarazione autorevole';
    for (const b of bodyParagraphs) {
      if (b.toLowerCase().includes('citazione di') || b.startsWith('—') || b.startsWith('-')) {
        quoteAuthor = b.replace(/^(citazione di|—|-)\s*/i, '').trim();
      }
    }
  }
  // Check for Stat / Metric (ONLY for genuine metrics, NEVER for bullet list items like "punto 1")
  else {
    const statMatch = trimmed.match(REAL_STAT_REGEX);
    const hasStatKeyword =
      fullTextLower.includes('statistica') ||
      fullTextLower.includes('percentuale') ||
      fullTextLower.includes('crescita') ||
      fullTextLower.includes('fatturato') ||
      fullTextLower.includes('throughput') ||
      fullTextLower.includes('uptime') ||
      fullTextLower.includes('kpi') ||
      fullTextLower.includes('metrica');

    // Only detect stat if there is a real metric AND (an explicit stat keyword OR a strong standalone metric like % or currency)
    if (
      statMatch &&
      (hasStatKeyword ||
        statMatch[0].includes('%') ||
        statMatch[0].match(/^[€$£¥]/) ||
        statMatch[0].match(/\b\d+[xX]\b/))
    ) {
      detectedLayout = 'stat';
      statNumber = statMatch[1];
      aiLayoutReason = `Riconosciuta statistica chiave in evidenza: ${statNumber}`;
      // Look for a label near the stat
      const statLine = bodyParagraphs.find((l) => l.includes(statNumber!));
      if (statLine) {
        statLabel = statLine.replace(statNumber!, '').replace(/^[–—:,\s]+|[–—:,\s]+$/g, '').trim();
      }
    }
    // Check for Columns / Cards
    else if (
      fullTextLower.includes('colonn') ||
      fullTextLower.includes('pilastri') ||
      fullTextLower.includes('card') ||
      fullTextLower.includes('schede') ||
      (colonPairs.length >= 2 && colonPairs.length <= 4)
    ) {
      detectedLayout = 'cards';
      aiLayoutReason = `Disposizione a ${colonPairs.length || 3} colonne/card tematiche`;
      if (colonPairs.length >= 2) {
        // Guarantee all body paragraphs are represented if cards layout is chosen
        for (let i = 0; i < bodyParagraphs.length; i++) {
          const raw = bodyParagraphs[i];
          const clean = raw.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
          const match = clean.match(/^([^:–—\n]{2,45})\s*[:–—]\s*([\s\S]+)$/);
          if (match) {
            columns.push({
              title: match[1].trim(),
              description: match[2].trim(),
            });
          } else {
            columns.push({
              title: `Punto ${i + 1}`,
              description: clean,
            });
          }
        }
      }
    }
    // Check for Timeline / Roadmap
    else if (
      fullTextLower.includes('timeline') ||
      fullTextLower.includes('fasi') ||
      fullTextLower.includes('roadmap') ||
      fullTextLower.includes('passi') ||
      fullTextLower.includes('step')
    ) {
      detectedLayout = 'timeline';
      aiLayoutReason = 'Rilevata progressione a step temporali';
    }
    // Check for Comparison
    else if (
      fullTextLower.includes('confronto') ||
      fullTextLower.includes('prima e dopo') ||
      fullTextLower.includes('problema e soluzione') ||
      fullTextLower.includes('sfida vs')
    ) {
      detectedLayout = 'comparison';
      aiLayoutReason = 'Rilevato confronto a due blocchi contrapposti';
    }
    // Check for Split Image
    else if (
      fullTextLower.includes('immagine') ||
      fullTextLower.includes('foto') ||
      fullTextLower.includes('visual')
    ) {
      detectedLayout = 'split-image';
      aiLayoutReason = 'Composizione bilanciata con spazio visuale';
    }
    // Slide 1 default to Hero if concise
    else if (slideIndex === 0 && bodyParagraphs.length <= 4) {
      detectedLayout = 'hero';
      aiLayoutReason = 'Diapositiva di apertura / Copertina';
    }
  }

  // Preserve user's current layout strictly; platform advice is a recommendation
  const effectiveLayout = currentLayout || detectedLayout;
  const suggestedLayout = currentLayout && currentLayout !== detectedLayout ? detectedLayout : undefined;
  const suggestedLayoutReason = suggestedLayout ? aiLayoutReason : undefined;

  // Timeline / Fasi layout: Extract custom phase titles and descriptions into columns
  if (effectiveLayout === 'timeline') {
    const validPhases = bodyParagraphs.filter((p) => p.trim() !== '');
    if (validPhases.length > 0) {
      columns.length = 0;
      validPhases.forEach((para, idx) => {
        const clean = para.replace(/^[-*•]\s*/, '').trim();
        const colonMatch = clean.match(/^([^:–—\n]{1,50})\s*[:–—]\s*([\s\S]+)$/);
        if (colonMatch) {
          columns.push({
            title: colonMatch[1].trim(),
            description: colonMatch[2].trim(),
          });
        } else {
          const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            columns.push({
              title: lines[0],
              description: lines.slice(1).join('\n'),
            });
          } else if (clean.length <= 40) {
            columns.push({
              title: clean,
              description: '',
            });
          } else {
            columns.push({
              title: `Fase ${idx + 1}`,
              description: clean,
            });
          }
        }
      });
    }
  }

  // CRITICAL: NEVER filter out or delete user content! All paragraphs must appear in the slide!
  const finalContent = content.length > 0 ? content : bodyParagraphs;

  return {
    id,
    rawText,
    title: title || `Diapositiva ${slideIndex + 1}`,
    subtitle,
    layout: effectiveLayout,
    suggestedLayout,
    suggestedLayoutReason,
    content: finalContent,
    graphicNotes,
    aiLayoutReason,
    statNumber,
    statLabel,
    quoteAuthor,
    columns: columns.length > 0 ? columns : undefined,
  };
}
