import React, { useState, useRef } from 'react';
import { Slide, PresentationTheme } from '../types/presentation';
import { exportToPptx } from '../utils/exportPptx';
import { exportToPdf } from '../utils/exportPdf';
import { exportToGoogleSlides, GoogleSlidesExportResult } from '../utils/exportGoogleSlides';
import { getGoogleSlidesAccessToken } from '../services/firebase';
import {
  Download,
  Upload,
  FileText,
  Presentation,
  FileCode2,
  Check,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  theme: PresentationTheme;
  onImportProject: (project: { slides: Slide[]; themeId?: string }) => void;
  projectTitle?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  theme,
  onImportProject,
  projectTitle,
}) => {
  const [exportingPptx, setExportingPptx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingGoogleSlides, setExportingGoogleSlides] = useState(false);
  const [googleSlidesResult, setGoogleSlidesResult] = useState<GoogleSlidesExportResult | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportGoogleSlides = async () => {
    setExportingGoogleSlides(true);
    setImportError(null);
    try {
      const cleanTitle = (projectTitle || slides[0]?.title || 'Presentazione SlideZen').trim();
      const token = await getGoogleSlidesAccessToken();
      const result = await exportToGoogleSlides(slides, theme, token, cleanTitle);
      setGoogleSlidesResult(result);
      setDownloadSuccess('Presentazione creata con successo in Google Presentazioni!');
      // Automatically open the new presentation in a new tab
      window.open(result.presentationUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      console.error('Google Slides export error:', e);
      setImportError(
        e.message || 'Errore durante la creazione della presentazione su Google Presentazioni.'
      );
    } finally {
      setExportingGoogleSlides(false);
    }
  };

  const handleExportPptx = async () => {
    setExportingPptx(true);
    setImportError(null);
    try {
      const cleanTitle = (projectTitle || slides[0]?.title || 'presentazione')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 24);
      await exportToPptx(slides, theme, `${cleanTitle}.pptx`);
      setDownloadSuccess('PowerPoint (.pptx) scaricato!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (e) {
      console.error('PPTX export error:', e);
    } finally {
      setExportingPptx(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setImportError(null);
    try {
      const cleanTitle = (projectTitle || slides[0]?.title || 'presentazione')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 24);
      await exportToPdf(slides, theme, `${cleanTitle}.pdf`);
      setDownloadSuccess('PDF scaricato!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportJson = () => {
    setImportError(null);
    const projectData = {
      version: 1,
      createdAt: new Date().toISOString(),
      themeId: theme.id,
      slides,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slidezen_project_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess('Progetto JSON salvato!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleImportJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);

        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          onImportProject({ slides: parsed.slides, themeId: parsed.themeId });
          setDownloadSuccess(`Progetto importato (${parsed.slides.length} slide)!`);
          setTimeout(() => {
            setDownloadSuccess(null);
            onClose();
          }, 1200);
        } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined) {
          onImportProject({ slides: parsed });
          setDownloadSuccess(`Progetto importato (${parsed.length} slide)!`);
          setTimeout(() => {
            setDownloadSuccess(null);
            onClose();
          }, 1200);
        } else {
          setImportError('Il file JSON selezionato non contiene un progetto SlideZen valido.');
        }
      } catch (err) {
        console.error('JSON import error:', err);
        setImportError('Impossibile leggere il file JSON. Verifica che il formato sia valido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-400" />
              Esporta & Salva Presentazione
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Crea in Google Presentazioni, scarica in PowerPoint (.pptx), PDF vettoriale o JSON.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">{downloadSuccess}</div>
          </div>
        )}

        {/* Google Slides Direct Result Box */}
        {googleSlidesResult && (
          <div className="mx-6 mt-3 p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-200 truncate">
                  {googleSlidesResult.title}
                </p>
                <p className="text-[11px] text-amber-400/80">Disponibile su Google Presentazioni</p>
              </div>
            </div>
            <a
              href={googleSlidesResult.presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>Apri Presentazione</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Error toast */}
        {importError && (
          <div className="mx-6 mt-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {importError}
          </div>
        )}

        {/* Options List */}
        <div className="p-6 space-y-3 overflow-y-auto">
          {/* 1. Google Presentazioni (Google Slides) - FEATURED */}
          <div
            onClick={!exportingGoogleSlides ? handleExportGoogleSlides : undefined}
            className="p-4 bg-amber-950/15 border border-amber-500/40 hover:border-amber-400/80 rounded-xl flex items-center justify-between cursor-pointer group transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                {/* Official Google Slides icon badge */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  Google Presentazioni
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    Google Slides API
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Crea e salva direttamente la presentazione nel tuo account Google Presentazioni.
                </p>
              </div>
            </div>
            <button
              disabled={exportingGoogleSlides}
              onClick={(e) => {
                e.stopPropagation();
                handleExportGoogleSlides();
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              {exportingGoogleSlides ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creazione...
                </>
              ) : googleSlidesResult ? (
                <>
                  <ExternalLink className="w-3.5 h-3.5" /> Riapri
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Esporta
                </>
              )}
            </button>
          </div>

          {/* 2. Microsoft PowerPoint .pptx */}
          <div
            onClick={handleExportPptx}
            className="p-4 bg-neutral-950/70 border border-neutral-800 hover:border-sky-500/60 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  Microsoft PowerPoint (.pptx)
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-medium">
                    100% Modificabile
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Caselle di testo e forme native modificabili in PowerPoint, Keynote o LibreOffice.
                </p>
              </div>
            </div>
            <button
              disabled={exportingPptx}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700 shrink-0 flex items-center gap-1.5"
            >
              {exportingPptx ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generazione...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Scarica
                </>
              )}
            </button>
          </div>

          {/* 3. PDF Document */}
          <div
            onClick={handleExportPdf}
            className="p-4 bg-neutral-950/70 border border-neutral-800 hover:border-red-500/60 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  Documento PDF Widescreen (16:9)
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-medium">
                    Vettoriale
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Diapositive impaginate a risoluzione nativa pronte per la condivisione e la stampa.
                </p>
              </div>
            </div>
            <button
              disabled={exportingPdf}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700 shrink-0 flex items-center gap-1.5"
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generazione...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Scarica
                </>
              )}
            </button>
          </div>

          {/* 4. JSON Project Save & Import */}
          <div className="p-4 bg-neutral-950/70 border border-neutral-800 hover:border-violet-500/50 rounded-xl flex items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-100">
                  Progetto SlideZen (.json)
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Salva il file del progetto su disco oppure ricarica un file salvato in precedenza.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportJsonChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 text-xs font-medium rounded-lg transition-colors border border-violet-700/70 flex items-center gap-1.5"
                title="Carica un file progetto .json"
              >
                <Upload className="w-3.5 h-3.5" /> Importa
              </button>
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700 flex items-center gap-1.5"
                title="Scarica il progetto corrente in formato .json"
              >
                <Download className="w-3.5 h-3.5" /> Salva
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
