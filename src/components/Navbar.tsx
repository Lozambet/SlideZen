import React, { useState, useRef } from 'react';
import { PresentationTheme, Slide } from '../types/presentation';
import {
  Palette,
  Download,
  Upload,
  Play,
  HelpCircle,
  FolderOpen,
  Cloud,
  Check,
  Loader2,
  LogOut,
  User as UserIcon,
  Plus,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTheme: PresentationTheme;
  onOpenThemeModal: () => void;
  onOpenExportModal: () => void;
  onOpenTypoChecker: () => void;
  onStartPresentation: () => void;
  onImportProject: (project: { slides: Slide[]; themeId?: string }) => void;
  onOpenQuickTips?: () => void;
  onOpenPhotoSearch?: () => void;
  // Firebase & Projects Props
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenProjectsModal: () => void;
  savedProjectsCount: number;
  onNewPresentation: () => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  currentProjectTitle?: string;
  onChangeProjectTitle?: (title: string) => void;
  onForceSave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTheme,
  onOpenThemeModal,
  onOpenExportModal,
  onStartPresentation,
  onImportProject,
  onOpenQuickTips,
  onOpenPhotoSearch,
  currentUser,
  onSignIn,
  onSignOut,
  onOpenProjectsModal,
  savedProjectsCount,
  onNewPresentation,
  autoSaveStatus,
  currentProjectTitle,
  onChangeProjectTitle,
  onForceSave,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          onImportProject({ slides: parsed.slides, themeId: parsed.themeId });
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          onImportProject({ slides: parsed });
        }
      } catch (err) {
        console.error('Errore durante la lettura del file JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="no-print h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand / Logo, Theme & Database Projects */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-950 flex items-center justify-center font-bold text-base tracking-tighter shadow-sm">
            S<span className="text-red-500">Z</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-neutral-100 flex items-center gap-1.5">
              SlideZen
              <span className="text-[10px] font-medium bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                Studio
              </span>
            </h1>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block mx-1" />

        {/* Template Selector Button */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors text-xs text-neutral-200 cursor-pointer"
          title="Scegli template di font, colori e stili visivi"
        >
          <div className="flex items-center gap-1">
            {activeTheme.swatches.map((color, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="font-medium hidden sm:inline">{activeTheme.name}</span>
          <Palette className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {/* Apri Vecchi Progetti Button (The primary role of the database) */}
        {currentUser && (
          <button
            onClick={onOpenProjectsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 hover:border-sky-500/60 bg-sky-950/20 hover:bg-sky-900/40 transition-colors text-xs font-medium text-sky-200 cursor-pointer shadow-sm"
            title="Apri i tuoi vecchi progetti salvati su Firebase Firestore"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Apri Progetti</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-sky-300 font-semibold">
              {savedProjectsCount}
            </span>
          </button>
        )}

        {/* Cerca Foto Online button in Navbar */}
        {onOpenPhotoSearch && (
          <button
            onClick={onOpenPhotoSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors text-xs text-neutral-200 cursor-pointer"
            title="Cerca foto online in alta risoluzione (Unsplash) da inserire nelle slide"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium hidden md:inline">Cerca Foto</span>
          </button>
        )}
      </div>

      {/* Hidden JSON file input for importing */}
      <input
        type="file"
        ref={jsonInputRef}
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonFileChange}
      />

      {/* Right Controls - Streamlined & Ordered */}
      <div className="flex items-center gap-2">
        {/* Presentation Title Input (to the left of Export button) */}
        <div className="flex items-center gap-1.5 mr-1">
          <div className="relative flex items-center group">
            <FileText className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 group-hover:text-sky-400 pointer-events-none transition-colors" />
            <input
              type="text"
              value={currentProjectTitle || ''}
              onChange={(e) => onChangeProjectTitle?.(e.target.value)}
              placeholder="Titolo presentazione..."
              className="w-36 sm:w-48 md:w-60 pl-8 pr-2.5 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 focus:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-sky-500 rounded-lg text-xs font-semibold text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-all truncate"
              title="Rinomina la presentazione (autosalvataggio attivo)"
            />
          </div>

          {/* Cloud Auto-save Status next to Title */}
          {currentUser ? (
            <div
              onClick={onForceSave}
              className="cursor-pointer shrink-0"
              title={
                autoSaveStatus === 'saving'
                  ? 'Autosalvataggio in corso su Firebase...'
                  : autoSaveStatus === 'saved'
                  ? 'Tutte le modifiche sono autosalvate su Firebase (clicca per forzare il salvataggio)'
                  : 'Clicca per forzare il salvataggio su Firebase'
              }
            >
              {autoSaveStatus === 'saving' ? (
                <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-sky-400 font-medium bg-sky-950/40 border border-sky-800/50 rounded-lg animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                  <span className="hidden xl:inline">Salvataggio...</span>
                </div>
              ) : autoSaveStatus === 'saved' ? (
                <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="hidden xl:inline">Salvato</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 font-medium bg-neutral-900/60 border border-neutral-800 rounded-lg transition-colors">
                  <Cloud className="w-3 h-3 text-sky-400" />
                  <span className="hidden xl:inline">Salva</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={onSignIn}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 font-medium bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              title="Le modifiche sono salvate automaticamente in locale nel browser. Clicca per accedere con Google e sincronizzarle su Firebase Cloud."
            >
              <Check className="w-3 h-3 text-neutral-400" />
              <span className="hidden xl:inline">Autosalvato (locale)</span>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
          title="Esporta o stampa la presentazione (PDF, PPTX, Immagini)"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Esporta</span>
        </button>

        {/* Present Button */}
        <button
          onClick={onStartPresentation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          title="Avvia modalità presentazione (F5)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Presenta</span>
        </button>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block mx-0.5" />

        {/* Google Authentication Section */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors cursor-pointer"
              title={`Account Google: ${currentUser.email}`}
            >
              <span className="hidden md:inline max-w-[120px] truncate font-medium text-[11px]">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Utente'}
                  className="w-6 h-6 rounded-full border border-neutral-700 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  {currentUser.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in">
                <div className="px-3 py-2 border-b border-neutral-800">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || 'Utente Google'}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenProjectsModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-sky-400" />
                    <span>Apri vecchi progetti ({savedProjectsCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      onNewPresentation();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Nuovo progetto vuoto</span>
                  </button>

                  <button
                    onClick={() => {
                      jsonInputRef.current?.click();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-violet-400" />
                    <span>Importa file JSON</span>
                  </button>

                  {onOpenQuickTips && (
                    <button
                      onClick={() => {
                        onOpenQuickTips();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Guida rapida & Scorciatoie</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-xs text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Esci dall'account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-all shadow-sm cursor-pointer"
            title="Accedi con Google per ritrovare i tuoi vecchi progetti"
          >
            {/* Google G icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Accedi con Google</span>
            <span className="sm:hidden">Accedi</span>
          </button>
        )}
      </div>
    </header>
  );
};
