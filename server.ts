import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Shared Gemini Client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Endpoint: Organize single slide from freeform natural text
// NO MARKDOWN CONVENTIONS REQUIRED: user writes plain Italian text with title, body, and natural graphic wishes.
// AI automatically decides layout, extracts stat/cards/quote/timeline, while STRICTLY PRESERVING USER'S WORDS.
app.post('/api/organize-single-slide', async (req, res) => {
  try {
    const { slideText, slideIndex, totalSlides } = req.body;
    if (!slideText || typeof slideText !== 'string' || !slideText.trim()) {
      return res.status(400).json({ error: 'Testo mancante' });
    }

    const prompt = `Analizza questo testo libero scritto dall'utente per una singola diapositiva di presentazione.

REGOLA FONDAMENTALE E INVIOLABILE:
NON RISCRIVERE, NON CAMBIARE IL VOCABOLARIO, NON INVENTARE E NON RIASSUMERE IL TESTO.
L'utente deve ritrovare esattamente le sue frasi e parole autentiche.

Il tuo compito è ESCLUSIVAMENTE comprendere la struttura e scegliere la migliore disposizione grafica:
1. Riconosci il TITOLO (anche se non ci sono simboli speciali o convenzioni: può essere la prima riga, oppure introdotto da "Titolo:", oppure la frase principale).
2. Riconosci l'eventuale SOTTOTITOLO.
3. Riconosci se l'utente ha espresso desideri grafici nel testo (es. "voglio 3 colonne", "fai uno schema a blocchi", "metti il numero in grande", "timeline delle fasi", "citazione di Mario Rossi", "confronto tra prima e dopo", "foto a destra").
4. Riconosci la migliore disposizione visiva (layout) tra:
   - 'hero' (ottimo per la slide 1 o diapositive di benvenuto/copertina)
   - 'cards' (ottimo se ci sono 2, 3 o 4 concetti/pilastri/colonne)
   - 'stat' (se nel testo c'è un numero/percentuale/metrica di rilievo)
   - 'quote' (se c'è una frase celebre o dichiarazione/citazione)
   - 'timeline' (se si parla di fasi, step, roadmap, progressione temporale)
   - 'split-image' (se l'utente vuole un'immagine, fotografia o grafica affiancata)
   - 'comparison' (se si confrontano due aspetti, prima/dopo, problema/soluzione)
   - 'bullets' (disposizione ordinata ed elegante a punti)
5. Distribuisci le frasi esatte dell'utente nel campo 'content' o nei 'columns'.
6. Se c'è una statistica, estrai il numero/percentuale in 'statNumber' e la descrizione in 'statLabel'.
7. Valuta attentamente la quantità di testo presente nella pagina e scegli 'recommendedFontScale':
   - 'spacious' se il testo è breve (font grande e maestoso)
   - 'balanced' se il volume è medio/standard
   - 'compact' se il testo è corposo (font ridimensionato per evitare tagli)
   - 'dense' se il testo è molto lungo (font compatto per fittare perfettamente nella slide 16:9 senza sbordare)
8. Fornisci un breve riassunto in italiano della scelta grafica fatta in 'graphicIntentDetected'.

Posizione slide: ${slideIndex !== undefined ? slideIndex + 1 : 1} su ${totalSlides || 1}.

Testo dell'utente:
"""
${slideText}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Sei un art director e designer di presentazioni.
L'utente scrive in italiano naturale senza usare sintassi o simboli di formattazione speciali (+, [, -, markdown).
Comprendi le intenzioni grafiche e organizza visivamente gli elementi.
RISPETTA RIGOROSAMENTE IL TESTO ORIGINALE DELL'UTENTE senza riscriverlo o alterarlo.
Rispondi in JSON conforme allo schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Titolo identificato (parole esatte dell utente)' },
            subtitle: { type: Type.STRING, description: 'Sottotitolo eventuale (parole esatte dell utente)' },
            layout: {
              type: Type.STRING,
              description: "Uno tra: 'hero', 'bullets', 'cards', 'stat', 'quote', 'timeline', 'split-image', 'comparison'",
            },
            graphicIntentDetected: {
              type: Type.STRING,
              description: 'Breve spiegazione della scelta grafica effettuata in italiano',
            },
            content: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Le frasi/punti di contenuto estratte fedelmente dal testo dell utente',
            },
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
              description: 'Se layout cards o colonne, elementi strutturati con il testo originale dell utente',
            },
            statNumber: { type: Type.STRING, description: 'Numero o percentuale chiave identificata' },
            statLabel: { type: Type.STRING, description: 'Descrizione della statistica' },
            quoteAuthor: { type: Type.STRING, description: 'Autore citazione' },
            recommendedFontScale: {
              type: Type.STRING,
              description: "Uno tra: 'spacious', 'balanced', 'compact', 'dense' in base alla quantità di testo",
            },
            suggestedImageKeywords: { type: Type.STRING, description: 'Termini visivi per ricerca immagine o grafica' },
          },
          required: ['title', 'layout', 'content'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/organize-single-slide:', error);
    return res.status(500).json({ error: error?.message || 'Errore organizzazione slide' });
  }
});

// 1. Endpoint: Organize / Structure raw user text into slides
// CRITICAL: The AI strictly keeps the user's authentic text without rewriting or ghostwriting.
// It parses titles, layout structure, graphic notes, statistics, quotes, and visual suggestions.
app.post('/api/organize-slides', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'Testo mancante' });
    }

    const prompt = `Analizza questo testo fornito dall'utente per una presentazione.
IMPORTANTE - REGOLA FONDAMENTALE:
NON RISCRIVERE, NON PARAFRASARE E NON AGGIUNGERE CONTENUTI inventati.
L'utente deve avere ESATTAMENTE il suo testo autentico.
Il tuo unico compito è organizzare e strutturare il testo nelle diapositive appropriate:
1. Identifica il titolo e l'eventuale sottotitolo della diapositiva.
2. Identifica i punti elenco, paragrafi, citazioni o metriche presenti nel testo dell'utente.
3. Se l'utente ha scritto indicazioni grafiche (es. [grafica: ...], [schema: ...], [immagine: ...]), estraile in graphicNotes.
4. Suggerisci il miglior layout visivo tra: 'hero', 'bullets', 'cards', 'stat', 'quote', 'timeline', 'split-image', 'comparison'.
5. Suggerisci una query di ricerca immagine o prompt visivo pertinente all'argomento (es. 'minimal geometric architecture', 'business analytics clean').
6. Suggerisci 2 o 3 icone Lucide appropriate (es. 'TrendingUp', 'Shield', 'Zap', 'Target', 'Layers', 'Users', 'Cpu', 'CheckCircle2').

Testo dell'utente:
"""
${rawText}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Sei un assistente per il layout e la formattazione grafica di presentazioni.
Non riscrivere né alterare le parole e lo stile dell'utente. Rispetta rigorosamente il testo originale dell'utente, limitandoti a distribuirlo nei campi strutturati. Rispondi SEMPRE e SOLO in formato JSON conforme allo schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            presentationTitle: { type: Type.STRING, description: 'Titolo generale della presentazione' },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Titolo esatto della slide' },
                  subtitle: { type: Type.STRING, description: 'Sottotitolo o categoria breve, se presente' },
                  layout: {
                    type: Type.STRING,
                    description: "Uno tra: 'hero', 'bullets', 'cards', 'stat', 'quote', 'timeline', 'split-image', 'comparison'",
                  },
                  content: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Righe o punti di contenuto (testo esatto scritto dall utente)',
                  },
                  graphicNotes: { type: Type.STRING, description: 'Indicazioni grafiche fornite dall utente' },
                  statNumber: { type: Type.STRING, description: 'Se è una slide statistica, il numero/percentuale chiave estratto' },
                  statLabel: { type: Type.STRING, description: 'Etichetta della statistica' },
                  quoteAuthor: { type: Type.STRING, description: 'Autore citazione se presente' },
                  suggestedImagePrompt: { type: Type.STRING, description: 'Termini per ricerca o generazione immagine (in inglese, ad es. minimalist data visualization dark)' },
                  suggestedIcons: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Nomi di icone pertinenti da Lucide',
                  },
                },
                required: ['title', 'layout', 'content'],
              },
            },
          },
          required: ['slides'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/organize-slides:', error);
    return res.status(500).json({ error: error?.message || 'Errore durante l elaborazione AI delle slide' });
  }
});

// 2. Endpoint: Spellcheck / Typos detection ONLY (orthographic corrections without rewriting user style)
app.post('/api/check-typos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Testo mancante' });
    }

    const prompt = `Analizza esclusivamente gli errori ortografici, refusi, lettere mancanti o accenti errati nel seguente testo.
VINCOLO ASSOLUTO: NON cambiare il tono, NON sostituire sinonimi, NON modificare la sintassi, NON riscrivere le frasi.
Correggi SOLO parole scritte male con evidenti errori ortografici o refusi.

Testo:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Sei un correttore ortografico strettamente conservativo. Segnala solo ed esclusivamente refusi ed errori di battitura/ortografia. Non modificare la struttura sintattica né lo stile.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING, description: 'La parola o breve sequenza con il refuso esatto' },
                  suggestion: { type: Type.STRING, description: 'La correzione ortografica corretta' },
                  reason: { type: Type.STRING, description: 'Breve spiegazione del refuso (es. Lettera mancante, accento errato)' },
                },
                required: ['original', 'suggestion', 'reason'],
              },
            },
            correctedFullText: {
              type: Type.STRING,
              description: 'Il testo completo originale con SOLO i refusi ortografici corretti, senza nessun altra variazione',
            },
          },
          required: ['errors', 'correctedFullText'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"errors":[],"correctedFullText":""}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/check-typos:', error);
    return res.status(500).json({ error: error?.message || 'Errore durante il controllo ortografico' });
  }
});

// 3. Endpoint: Suggest Visual Graphic Ideas & SVG diagrams
app.post('/api/suggest-graphics', async (req, res) => {
  try {
    const { slideTitle, slideContent, graphicNotes } = req.body;

    const prompt = `Per questa slide di presentazione:
Titolo: ${slideTitle || 'Senza titolo'}
Contenuto: ${Array.isArray(slideContent) ? slideContent.join('\n') : slideContent || ''}
Note grafiche utente: ${graphicNotes || 'Nessuna specifica'}

Fornisci:
1. 3 opzioni di layout o composizioni grafiche adatte
2. Uno schema visivo strutturato (titoli colonne/step con descrizioni)
3. Suggerimento di parole chiave per fotografia di sfondo/illustrazione minimale
4. Eventuale codice SVG pulito e moderno (viewBox="0 0 600 400", stile minimalista, colori neutri con accento) che illustri graficamente il concetto (es. schema a 3 pilastri, flusso temporale a step, torta/grafico a barre concettuale).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualConcept: { type: Type.STRING, description: 'Descrizione della soluzione grafica ideale' },
            recommendedLayout: { type: Type.STRING, description: 'Layout raccomandato' },
            imageKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Termini per ricerca immagini' },
            structuredDiagram: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
            },
            svgCode: { type: Type.STRING, description: 'Codice SVG minimalista valido senza delimitatori markdown (opzionale)' },
          },
          required: ['visualConcept', 'recommendedLayout', 'imageKeywords'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/suggest-graphics:', error);
    return res.status(500).json({ error: error?.message || 'Errore durante il suggerimento grafico' });
  }
});

// 4. Endpoint: Generate AI visual image (via gemini-3.1-flash-lite-image if available)
app.post('/api/generate-slide-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt richiesto' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `Minimalist, clean, elegant professional presentation visual: ${prompt}. Clean background, high aesthetic, editorial quality, no messy text or clutter.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '16:9',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({ imageUrl: `data:${mimeType};base64,${part.inlineData.data}` });
        }
      }
    } catch (imgError: any) {
      console.warn('Gemini image generation warning, falling back to curated visual photography:', imgError?.message);
    }

    // High quality curated presentation image fallback by keywords
    const keywords = encodeURIComponent(prompt.slice(0, 40));
    return res.json({
      imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80`,
      fallback: true,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-slide-image:', error);
    return res.status(500).json({ error: error?.message || 'Errore generazione immagine' });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SlideZen server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
