/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Slide, PresentationTheme, SlideLayout, TypoCorrection, TextBoxOffset } from './types/presentation';
import { PRESENTATION_THEMES } from './data/themes';
import { SAMPLE_PRESENTATIONS } from './data/samplePresentations';
import { parseNaturalSlideText } from './utils/naturalSlideParser';
import { Navbar } from './components/Navbar';
import { SlideEditor } from './components/SlideEditor';
import { SlideCanvas } from './components/SlideCanvas';
import { SlideThumbnailReel } from './components/SlideThumbnailReel';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { TypoCheckerModal } from './components/TypoCheckerModal';
import { GraphicSuggestionsModal } from './components/GraphicSuggestionsModal';
import { ExportModal } from './components/ExportModal';
import { PresentationMode } from './components/PresentationMode';
import { LayoutDropdown } from './components/LayoutDropdown';
import { LayoutSuggestionBanner } from './components/LayoutSuggestionBanner';
import { ImageCropModal } from './components/ImageCropModal';
import { QuickTipsDrawer } from './components/QuickTipsDrawer';
import { SlideCanvasToolbar } from './components/SlideCanvasToolbar';
import { UserProjectsModal } from './components/UserProjectsModal';
import { OnlinePhotoSearchModal } from './components/OnlinePhotoSearchModal';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveProjectToFirestore,
  subscribeToUserProjects,
  deleteProjectFromFirestore,
  SavedProject,
} from './services/firebase';
import {
  Sparkles,
  Layout,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Columns,
  Plus,
  Upload,
  Crop,
  Search,
  Image as ImageIcon,
} from 'lucide-react';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Theme state
  const [activeTheme, setActiveTheme] = useState<PresentationTheme>(() => {
    const saved = localStorage.getItem('slidezen_theme');
    if (saved) {
      const found = PRESENTATION_THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return PRESENTATION_THEMES[0]; // Swiss Bauhaus
  });

  // Presentation Slides: Each slide has its own independent text block to fill
  const [slides, setSlides] = useState<Slide[]>(() => {
    const saved = localStorage.getItem('slidezen_slides');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading saved slides:', e);
      }
    }
    // Default to the first curated preset
    return SAMPLE_PRESENTATIONS[0].slideTexts.map((text, idx) =>
      parseNaturalSlideText(text, idx)
    );
  });

  // Active slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTypoModalOpen, setIsTypoModalOpen] = useState(false);
  const [isGraphicModalOpen, setIsGraphicModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isQuickTipsOpen, setIsQuickTipsOpen] = useState(false);
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>(() => {
    return localStorage.getItem('slidezen_title') || 'La mia presentazione';
  });
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSwitchingProjectRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  // Sync auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProjects([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync user's saved projects from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeProjects = subscribeToUserProjects(
      (projects) => {
        setUserProjects(projects);
      },
      (err) => {
        console.warn('Real-time projects subscription error:', err);
      }
    );
    return () => unsubscribeProjects();
  }, [currentUser]);

  // Persist project title to localStorage
  useEffect(() => {
    localStorage.setItem('slidezen_title', currentProjectTitle);
  }, [currentProjectTitle]);

  // Automatic background auto-saving to Firebase Firestore
  useEffect(() => {
    // Avoid auto-saving initial sample on first page load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    // Avoid auto-saving when user has just loaded an existing project
    if (isSwitchingProjectRef.current) {
      isSwitchingProjectRef.current = false;
      return;
    }
    if (!currentUser) return;

    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const titleToSave =
          currentProjectTitle ||
          slides[0]?.title?.trim() ||
          'Presentazione SlideZen';

        const id = await saveProjectToFirestore({
          id: currentProjectId || undefined,
          title: titleToSave,
          slides,
          themeId: activeTheme.id,
        });

        if (!currentProjectId && id) {
          setCurrentProjectId(id);
        }
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setAutoSaveStatus('idle');
      }
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [slides, activeTheme.id, currentUser, currentProjectTitle, currentProjectId]);

  // Explicit user force-save action
  const handleForceSave = async () => {
    if (!currentUser) {
      handleGoogleSignIn();
      return;
    }
    setAutoSaveStatus('saving');
    try {
      const titleToSave =
        currentProjectTitle ||
        slides[0]?.title?.trim() ||
        'Presentazione SlideZen';

      const id = await saveProjectToFirestore({
        id: currentProjectId || undefined,
        title: titleToSave,
        slides,
        themeId: activeTheme.id,
      });

      if (!currentProjectId && id) {
        setCurrentProjectId(id);
      }
      setAutoSaveStatus('saved');
      setStatusToast('Presentazione salvata su Firebase.');
      setTimeout(() => setStatusToast(null), 2500);
    } catch (err: any) {
      console.error('Manual save error:', err);
      setAutoSaveStatus('idle');
      setStatusToast(`Errore salvataggio: ${err.message || 'Riprova'}`);
      setTimeout(() => setStatusToast(null), 3500);
    }
  };

  // AI Agent state for active slide
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingTypos, setIsCheckingTypos] = useState(false);
  const [typoCorrections, setTypoCorrections] = useState<TypoCorrection[]>([]);
  const [correctedFullText, setCorrectedFullText] = useState<string>('');

  // Ensure current slide index is valid
  useEffect(() => {
    if (currentSlideIndex >= slides.length) {
      setCurrentSlideIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlideIndex]);

  // Persist slides and theme to localStorage
  useEffect(() => {
    localStorage.setItem('slidezen_slides', JSON.stringify(slides));
  }, [slides]);

  useEffect(() => {
    localStorage.setItem('slidezen_theme', activeTheme.id);
  }, [activeTheme.id]);

  // Keyboard shortcuts: F5 for presentation mode, ? for quick tips
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in textarea or input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'textarea' || activeTag === 'input';

      if (e.key === 'F5') {
        e.preventDefault();
        setIsPresenting(true);
      } else if (!isInput && (e.key === '?' || (e.key === '/' && e.shiftKey))) {
        e.preventDefault();
        setIsQuickTipsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  // 1. User updates the text block of the active slide
  // Instant client parsing keeps preview live, zero lag, without requiring conventions!
  const handleUpdateSlideText = (newText: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;

      // Pass target.layout so the current layout is strictly preserved
      const parsed = parseNaturalSlideText(newText, currentSlideIndex, target.id, target.layout);
      // Keep any already generated custom visuals, zoom levels, box placements, and layout preferences
      parsed.svgCode = target.svgCode;
      parsed.imageUrl = target.imageUrl;
      parsed.textZoom = target.textZoom;
      parsed.contentAnchor = target.contentAnchor;
      parsed.experimentalFreeform = target.experimentalFreeform;
      parsed.boxOffsets = target.boxOffsets;
      parsed.fontScale = target.fontScale;
      parsed.notes = target.notes;
      // CRITICAL: Strictly preserve user's current layout! Platform layout suggestions require explicit user acceptance.
      parsed.layout = target.layout;

      // Keep user's dismissal if the suggestion hasn't changed
      if (target.dismissedLayoutSuggestion === parsed.suggestedLayout) {
        parsed.dismissedLayoutSuggestion = target.dismissedLayoutSuggestion;
      }

      updated[currentSlideIndex] = parsed;
      return updated;
    });
  };

  // Update speaker notes for active slide
  const handleUpdateSlideNotes = (newNotes: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          notes: newNotes,
        };
      }
      return updated;
    });
  };

  // 2. AI Agent: Analyze active slide and choose optimal layout & elements
  // Strictly preserves user's layout until user accepts advice!
  const handleAnalyzeSlideWithAi = async () => {
    const targetSlide = slides[currentSlideIndex];
    if (!targetSlide || !targetSlide.rawText.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/organize-single-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideText: targetSlide.rawText,
          slideIndex: currentSlideIndex,
          totalSlides: slides.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSlides((prev) => {
          const updated = [...prev];
          const curr = updated[currentSlideIndex];
          if (!curr) return prev;

          const recommendedLayout = data.layout as SlideLayout;
          const isDifferentLayout = Boolean(recommendedLayout && recommendedLayout !== curr.layout);

          updated[currentSlideIndex] = {
            ...curr,
            title: data.title || curr.title,
            subtitle: data.subtitle || undefined,
            // Keep current layout! Layout recommendation must be accepted by user
            layout: curr.layout,
            suggestedLayout: isDifferentLayout ? recommendedLayout : undefined,
            suggestedLayoutReason: data.graphicIntentDetected || 'Layout ottimizzato consigliato dall\'AI',
            dismissedLayoutSuggestion: undefined,
            content: Array.isArray(data.content) && data.content.length > 0 ? data.content : curr.content,
            columns: data.columns && data.columns.length > 0 ? data.columns : curr.columns,
            statNumber: data.statNumber || curr.statNumber,
            statLabel: data.statLabel || curr.statLabel,
            quoteAuthor: data.quoteAuthor || curr.quoteAuthor,
            fontScale: data.recommendedFontScale || curr.fontScale,
          };
          return updated;
        });
        setStatusToast('Analisi completata: verifica il consiglio di layout!');
        setTimeout(() => setStatusToast(null), 3000);
      }
    } catch (err) {
      console.error('Error in handleAnalyzeSlideWithAi:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Change font scale density manually or back to auto
  const handleChangeFontScale = (scale: 'auto' | 'spacious' | 'balanced' | 'compact' | 'dense') => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          fontScale: scale,
        };
      }
      return updated;
    });
  };

  // 3. Typo checker for current slide (orthographic mistakes only)
  const handleCheckTypos = async () => {
    const targetSlide = slides[currentSlideIndex];
    if (!targetSlide || !targetSlide.rawText.trim()) return;

    setIsCheckingTypos(true);
    try {
      const response = await fetch('/api/check-typos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: targetSlide.rawText }),
      });

      if (response.ok) {
        const data = await response.json();
        setTypoCorrections(data.errors || []);
        setCorrectedFullText(data.correctedFullText || targetSlide.rawText);
        setIsTypoModalOpen(true);
      }
    } catch (err) {
      console.error('Error checking typos:', err);
    } finally {
      setIsCheckingTypos(false);
    }
  };

  // Apply single typo fix
  const handleApplySingleTypoCorrection = (corr: TypoCorrection) => {
    const target = slides[currentSlideIndex];
    if (!target) return;
    const escaped = corr.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const updatedText = target.rawText.replace(regex, corr.suggestion);
    handleUpdateSlideText(updatedText);
    setTypoCorrections((prev) => prev.filter((c) => c.original !== corr.original));
  };

  // Apply all typo fixes
  const handleApplyAllTypoCorrections = (newText: string) => {
    handleUpdateSlideText(newText);
    setTypoCorrections([]);
  };

  // Layout switcher (manual user selection)
  const handleChangeCurrentSlideLayout = (layout: SlideLayout) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          layout,
          suggestedLayout: undefined,
          suggestedLayoutReason: undefined,
          dismissedLayoutSuggestion: undefined,
          aiLayoutReason: `Disposizione modificata in: ${layout}`,
        };
      }
      return updated;
    });
  };

  // User accepts layout suggestion advised by the platform
  const handleAcceptLayoutSuggestion = () => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target || !target.suggestedLayout) return prev;

      const newLayout = target.suggestedLayout;
      updated[currentSlideIndex] = {
        ...target,
        layout: newLayout,
        suggestedLayout: undefined,
        suggestedLayoutReason: undefined,
        dismissedLayoutSuggestion: undefined,
        aiLayoutReason: `Disposizione ${newLayout} applicata su tuo consenso`,
      };
      return updated;
    });
    setStatusToast('Layout aggiornato su tuo consenso!');
    setTimeout(() => setStatusToast(null), 3000);
  };

  // User dismisses layout suggestion (prefers current layout)
  const handleDismissLayoutSuggestion = () => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;

      updated[currentSlideIndex] = {
        ...target,
        dismissedLayoutSuggestion: target.suggestedLayout,
      };
      return updated;
    });
  };

  // Graphic Suggestions callbacks
  const handleApplySvgDiagram = (svgCode: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          svgCode,
        };
      }
      return updated;
    });
  };

  const handleApplyColumns = (columns: { title: string; description: string }[]) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          columns,
          layout: 'cards',
        };
      }
      return updated;
    });
  };

  const handleApplyImage = (imageUrl: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (target) {
        updated[currentSlideIndex] = {
          ...target,
          imageUrl,
          suggestedLayout: target.layout !== 'split-image' ? 'split-image' : undefined,
          suggestedLayoutReason:
            target.layout !== 'split-image'
              ? 'Immagine generata: puoi passare al layout Testo + Immagine a 2 colonne o spostare la foto dove preferisci'
              : undefined,
          dismissedLayoutSuggestion: undefined,
        };
      }
      return updated;
    });
  };

  // Apply photo from online search to active slide
  const handleSelectOnlinePhoto = (photoUrl: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (target) {
        updated[currentSlideIndex] = {
          ...target,
          imageUrl: photoUrl,
          suggestedLayout: target.layout !== 'split-image' ? 'split-image' : undefined,
          suggestedLayoutReason:
            target.layout !== 'split-image'
              ? 'Foto online aggiunta: vuoi passare al layout Testo + Immagine a 2 colonne?'
              : undefined,
          dismissedLayoutSuggestion: undefined,
        };
      }
      return updated;
    });
    setStatusToast('Foto online applicata alla diapositiva.');
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Add new slide with online photo
  const handleAddSlideWithOnlinePhoto = (photoUrl: string, title?: string) => {
    const newSlideIndex = slides.length;
    const defaultText = `${title || 'Nuovo Capitolo'}\nDescrizione o punti chiave per questa sezione`;
    const newSlide = parseNaturalSlideText(defaultText, newSlideIndex);
    newSlide.imageUrl = photoUrl;
    newSlide.layout = 'split-image';
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(newSlideIndex);
    setStatusToast('Nuova diapositiva creata con la foto!');
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Upload multimedia files (images, diagrams, logos)
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      setSlides((prev) => {
        const updated = [...prev];
        const target = updated[currentSlideIndex];
        if (target) {
          updated[currentSlideIndex] = {
            ...target,
            imageUrl: dataUrl,
            // Non cambiare il layout automaticamente: l'utente può spostare la foto ovunque o accettare split-image
            suggestedLayout: target.layout !== 'split-image' ? 'split-image' : undefined,
            suggestedLayoutReason:
              target.layout !== 'split-image'
                ? 'Immagine caricata: vuoi passare al layout Testo + Immagine a 2 colonne?'
                : undefined,
            dismissedLayoutSuggestion: undefined,
          };
        }
        return updated;
      });
      setStatusToast('Immagine caricata. Puoi spostarla liberamente su qualsiasi layout.');
      setTimeout(() => setStatusToast(null), 3500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Adjust text zoom smoothly (via mouse wheel or manual control)
  const handleUpdateTextZoom = (newZoom: number) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          textZoom: newZoom,
        };
      }
      return updated;
    });
  };

  // Save cropped image
  const handleSaveCroppedImage = (croppedDataUrl: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[currentSlideIndex]) {
        updated[currentSlideIndex] = {
          ...updated[currentSlideIndex],
          originalImageUrl: updated[currentSlideIndex].originalImageUrl || updated[currentSlideIndex].imageUrl,
          imageUrl: croppedDataUrl,
        };
      }
      return updated;
    });
  };

  // Deck operations
  const handleAddSlide = () => {
    const newSlideIndex = slides.length;
    const defaultText = `Nuova Diapositiva\nInserisci qui i tuoi punti principali`;
    const newSlide = parseNaturalSlideText(defaultText, newSlideIndex);
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(newSlideIndex);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, slides.length - 2));
    }
  };

  const handleDuplicateSlide = (index: number) => {
    const target = slides[index];
    if (!target) return;
    const copy: Slide = {
      ...target,
      id: `slide-copy-${Date.now().toString(36)}`,
      title: `${target.title} (Copia)`,
    };
    setSlides((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, copy);
      return updated;
    });
    setCurrentSlideIndex(index + 1);
  };

  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= slides.length) return;
    setSlides((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setCurrentSlideIndex(toIndex);
  };

  const handleLoadPreset = (presetIndex: number) => {
    const preset = SAMPLE_PRESENTATIONS[presetIndex];
    if (preset) {
      const newSlides = preset.slideTexts.map((txt, idx) => parseNaturalSlideText(txt, idx));
      setSlides(newSlides);
      const th = PRESENTATION_THEMES.find((t) => t.id === preset.themeId);
      if (th) setActiveTheme(th);
      setCurrentSlideIndex(0);
    }
  };

  // Import JSON Project
  const handleImportProject = (project: { slides: Slide[]; themeId?: string }) => {
    const normalizedSlides: Slide[] = project.slides.map((s, idx) => {
      if (s && typeof s.title === 'string' && Array.isArray(s.content)) {
        return {
          ...s,
          id: s.id || `slide-imported-${idx}-${Date.now()}`,
          rawText:
            typeof s.rawText === 'string' && s.rawText.trim()
              ? s.rawText
              : [s.title, s.subtitle, ...s.content].filter(Boolean).join('\n'),
          layout: s.layout || (idx === 0 ? 'hero' : 'bullets'),
          boxOffsets: s.boxOffsets || {},
        };
      }
      return parseNaturalSlideText(String(s?.rawText || s?.title || ''), idx);
    });

    setSlides(normalizedSlides);
    if (project.themeId) {
      const foundTheme = PRESENTATION_THEMES.find((t) => t.id === project.themeId);
      if (foundTheme) setActiveTheme(foundTheme);
    }
    setCurrentSlideIndex(0);
    setStatusToast(`Progetto JSON importato (${normalizedSlides.length} diapositive)`);
    setTimeout(() => setStatusToast(null), 3200);
  };

  // Firebase Google Auth handlers
  const handleGoogleSignIn = async () => {
    try {
      const { user } = await signInWithGoogle();
      setStatusToast(`Accesso effettuato: benvenuto ${user.displayName || user.email}!`);
      setTimeout(() => setStatusToast(null), 3500);
    } catch (err: any) {
      console.error(err);
      setStatusToast('Accesso annullato o non riuscito.');
      setTimeout(() => setStatusToast(null), 3000);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentProjectId(null);
      setStatusToast('Disconnessione effettuata.');
      setTimeout(() => setStatusToast(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Load an existing saved project from Firebase Firestore
  const handleLoadUserProject = (project: SavedProject) => {
    isSwitchingProjectRef.current = true;
    if (project.slides && project.slides.length > 0) {
      setSlides(project.slides);
      setCurrentSlideIndex(0);
    }
    if (project.themeId) {
      const found = PRESENTATION_THEMES.find((t) => t.id === project.themeId);
      if (found) setActiveTheme(found);
    }
    setCurrentProjectId(project.id);
    setCurrentProjectTitle(project.title);
    setAutoSaveStatus('saved');
    setStatusToast(`Progetto "${project.title}" aperto.`);
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Delete project from Firebase Firestore
  const handleDeleteUserProject = async (projectId: string) => {
    try {
      await deleteProjectFromFirestore(projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
      setStatusToast('Progetto rimosso dal database.');
      setTimeout(() => setStatusToast(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusToast('Errore durante l\'eliminazione del progetto.');
      setTimeout(() => setStatusToast(null), 3000);
    }
  };

  // Reset workspace to a new presentation (auto-saves as new project on edit)
  const handleNewPresentation = () => {
    isSwitchingProjectRef.current = true;
    const freshSlide = parseNaturalSlideText(
      'Titolo della Presentazione\nSottotitolo o introduzione del progetto',
      0
    );
    setSlides([freshSlide]);
    setCurrentSlideIndex(0);
    setCurrentProjectId(null);
    setCurrentProjectTitle('Nuova Presentazione');
    setAutoSaveStatus('idle');
    setStatusToast('Nuova presentazione creata.');
    setTimeout(() => setStatusToast(null), 2500);
  };

  // Update box offset for active slide (magnetic alignment)
  const handleUpdateBoxOffset = (boxId: string, offset: TextBoxOffset) => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;
      const currentOffsets = target.boxOffsets || {};
      updated[currentSlideIndex] = {
        ...target,
        boxOffsets: {
          ...currentOffsets,
          [boxId]: offset,
        },
      };
      return updated;
    });
  };

  // Reset all box offsets for active slide to default layout
  const handleResetAllBoxOffsets = () => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;
      updated[currentSlideIndex] = {
        ...target,
        boxOffsets: {},
      };
      return updated;
    });
    setStatusToast('Caselle di testo riallineate allo stile predefinito');
    setTimeout(() => setStatusToast(null), 2000);
  };

  // Content Anchor (Center default vs Top)
  const handleUpdateContentAnchor = (anchor: 'center' | 'top') => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;
      updated[currentSlideIndex] = {
        ...target,
        contentAnchor: anchor,
      };
      return updated;
    });
    setStatusToast(
      anchor === 'top'
        ? 'Ancoraggio diapositiva: In alto (partendo da sopra)'
        : 'Ancoraggio diapositiva: Al Centro (predefinito)'
    );
    setTimeout(() => setStatusToast(null), 1800);
  };

  // Toggle Experimental Freeform mode (no magnetic grid snap)
  const handleToggleExperimentalMode = () => {
    setSlides((prev) => {
      const updated = [...prev];
      const target = updated[currentSlideIndex];
      if (!target) return prev;
      const willBeFree = !(target.experimentalFreeform ?? false);
      updated[currentSlideIndex] = {
        ...target,
        experimentalFreeform: willBeFree,
      };
      return updated;
    });
    const currentSlide = slides[currentSlideIndex];
    const willBeFree = !(currentSlide?.experimentalFreeform ?? false);
    setStatusToast(
      willBeFree
        ? 'Modalità Sperimentale: Posizionamento 100% libero (calamita disattivata)'
        : 'Modalità Calamita: Aggancio magnetico alla griglia attivo'
    );
    setTimeout(() => setStatusToast(null), 2200);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTheme={activeTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTypoChecker={handleCheckTypos}
        onStartPresentation={() => setIsPresenting(true)}
        onImportProject={handleImportProject}
        onOpenQuickTips={() => setIsQuickTipsOpen(true)}
        currentUser={currentUser}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        savedProjectsCount={userProjects.length}
        onNewPresentation={handleNewPresentation}
        autoSaveStatus={autoSaveStatus}
        currentProjectTitle={currentProjectTitle}
        onChangeProjectTitle={setCurrentProjectTitle}
        onForceSave={handleForceSave}
      />

      {/* Floating Status Toast */}
      {statusToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-medium shadow-2xl animate-in fade-in duration-200">
          {statusToast}
        </div>
      )}

        {/* Main Workspace */}
        <main className="flex-1 flex overflow-hidden p-3 md:p-4 gap-4">
          {/* LEFT COLUMN: Dedicated text block for the selected slide */}
          <div className="flex flex-col h-full w-full lg:w-5/12 xl:w-4/12 transition-all duration-300 gap-2.5 min-h-0">
            {/* Platform Layout Recommendation Banner (Only above the text editor) */}
            {activeSlide?.suggestedLayout &&
              activeSlide.suggestedLayout !== activeSlide.layout &&
              activeSlide.dismissedLayoutSuggestion !== activeSlide.suggestedLayout && (
                <div className="shrink-0">
                  <LayoutSuggestionBanner
                    currentLayout={activeSlide.layout}
                    suggestedLayout={activeSlide.suggestedLayout}
                    reason={activeSlide.suggestedLayoutReason}
                    onAccept={handleAcceptLayoutSuggestion}
                    onDismiss={handleDismissLayoutSuggestion}
                  />
                </div>
              )}

            {activeSlide && (
              <SlideEditor
                slide={activeSlide}
                slideIndex={currentSlideIndex}
                totalSlides={slides.length}
                onChangeText={handleUpdateSlideText}
                onChangeNotes={handleUpdateSlideNotes}
                onAddSlide={handleAddSlide}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Live Slide Canvas & Slide Deck Reel */}
          <div className="flex-1 hidden lg:flex flex-col h-full min-w-0 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 gap-4 justify-between overflow-hidden">
              {/* Clean Top Header with Media Upload & Layout Dropdown */}
              <div className="flex items-center justify-end border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  {/* Search Online Photos Button */}
                  <button
                    onClick={() => setIsPhotoSearchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 hover:border-sky-500/60 bg-sky-950/20 hover:bg-sky-900/40 text-xs font-medium text-sky-200 transition-colors shadow-sm cursor-pointer"
                    title="Cerca foto in alta risoluzione online (Unsplash)"
                  >
                    <Search className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cerca Foto Online</span>
                  </button>

                  {/* Upload Media Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors shadow-sm"
                    title="Carica un file multimediale (JPG, PNG, WebP)"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Carica Media</span>
                  </button>

                  {activeSlide?.imageUrl && (
                    <button
                      onClick={() => setIsCropModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors shadow-sm"
                      title="Ritaglia l'immagine della slide"
                    >
                      <Crop className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ritaglia</span>
                    </button>
                  )}

                  {activeSlide && (
                    <LayoutDropdown
                      currentLayout={activeSlide.layout}
                      suggestedLayout={activeSlide.suggestedLayout}
                      onSelectLayout={handleChangeCurrentSlideLayout}
                    />
                  )}
                </div>
              </div>

              {/* Minimal Canvas Control Bar (OUTSIDE the slide) */}
              {activeSlide && (
                <SlideCanvasToolbar
                  currentZoom={activeSlide.textZoom ?? 1.0}
                  onUpdateTextZoom={handleUpdateTextZoom}
                  contentAnchor={activeSlide.contentAnchor ?? 'center'}
                  onUpdateContentAnchor={handleUpdateContentAnchor}
                  isExperimental={activeSlide.experimentalFreeform ?? false}
                  onToggleExperimentalMode={handleToggleExperimentalMode}
                  hasCustomOffsets={Boolean(
                    activeSlide.boxOffsets && Object.keys(activeSlide.boxOffsets).length > 0
                  )}
                  onResetAllBoxOffsets={handleResetAllBoxOffsets}
                />
              )}

              {/* Canvas Viewport (Center) */}
              <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden w-full">
                {activeSlide ? (
                  <SlideCanvas
                    slide={activeSlide}
                    theme={activeTheme}
                    slideNumber={currentSlideIndex + 1}
                    totalSlides={slides.length}
                    onTriggerUpload={() => fileInputRef.current?.click()}
                    onOpenCropModal={() => setIsCropModalOpen(true)}
                    onRemoveImage={() => {
                      setSlides((prev) => {
                        const updated = [...prev];
                        if (updated[currentSlideIndex]) {
                          updated[currentSlideIndex] = {
                            ...updated[currentSlideIndex],
                            imageUrl: undefined,
                            originalImageUrl: undefined,
                          };
                        }
                        return updated;
                      });
                    }}
                    onUpdateTextZoom={handleUpdateTextZoom}
                    onUpdateBoxOffset={handleUpdateBoxOffset}
                    onResetAllBoxOffsets={handleResetAllBoxOffsets}
                    onUpdateContentAnchor={handleUpdateContentAnchor}
                    onToggleExperimentalMode={handleToggleExperimentalMode}
                    onOpenQuickTips={() => setIsQuickTipsOpen(true)}
                    onOpenPhotoSearch={() => setIsPhotoSearchOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
                    Nessuna diapositiva selezionata
                  </div>
                )}
              </div>

              {/* Bottom Slide Deck Navigation & Thumbnails */}
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-neutral-400">
                      Diapositive ({slides.length})
                    </span>
                    <button
                      onClick={handleAddSlide}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      title="Aggiungi una nuova diapositiva"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuova Slide</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400 text-xs">
                    <button
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                      className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                      title="Slide Precedente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[11px]">
                      {currentSlideIndex + 1} / {slides.length}
                    </span>
                    <button
                      disabled={currentSlideIndex === slides.length - 1}
                      onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                      className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                      title="Slide Successiva"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <SlideThumbnailReel
                  slides={slides}
                  currentIndex={currentSlideIndex}
                  onSelectSlide={setCurrentSlideIndex}
                  onAddSlide={handleAddSlide}
                  onDeleteSlide={handleDeleteSlide}
                  onDuplicateSlide={handleDuplicateSlide}
                  onMoveSlide={handleMoveSlide}
                  onChangeLayout={(idx, l) => {
                    setSlides((prev) => {
                      const updated = [...prev];
                      if (updated[idx]) {
                        updated[idx] = { ...updated[idx], layout: l };
                      }
                      return updated;
                    });
                  }}
                  theme={activeTheme}
                />
              </div>
            </div>
        </main>

        {/* Modals */}
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          activeTheme={activeTheme}
          onSelectTheme={setActiveTheme}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          slides={slides}
          theme={activeTheme}
          onImportProject={handleImportProject}
          projectTitle={currentProjectTitle}
        />

        <TypoCheckerModal
          isOpen={isTypoModalOpen}
          onClose={() => setIsTypoModalOpen(false)}
          isLoading={isCheckingTypos}
          corrections={typoCorrections}
          correctedFullText={correctedFullText}
          onApplySingleCorrection={handleApplySingleTypoCorrection}
          onApplyAllCorrections={handleApplyAllTypoCorrections}
        />

        {activeSlide && (
          <GraphicSuggestionsModal
            isOpen={isGraphicModalOpen}
            onClose={() => setIsGraphicModalOpen(false)}
            slide={activeSlide}
            onApplyLayout={handleChangeCurrentSlideLayout}
            onApplySvgDiagram={handleApplySvgDiagram}
            onApplyColumns={handleApplyColumns}
            onApplyImage={handleApplyImage}
          />
        )}

        <PresentationMode
          isOpen={isPresenting}
          onClose={() => setIsPresenting(false)}
          slides={slides}
          currentIndex={currentSlideIndex}
          onNavigate={setCurrentSlideIndex}
          theme={activeTheme}
        />

        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={activeSlide?.originalImageUrl || activeSlide?.imageUrl || ''}
          onClose={() => setIsCropModalOpen(false)}
          onSaveCrop={handleSaveCroppedImage}
        />

        <QuickTipsDrawer
          isOpen={isQuickTipsOpen}
          onClose={() => setIsQuickTipsOpen(false)}
        />

        <UserProjectsModal
          isOpen={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          currentUser={currentUser}
          projects={userProjects}
          currentProjectId={currentProjectId}
          onLoadProject={handleLoadUserProject}
          onDeleteProject={handleDeleteUserProject}
          onNewPresentation={handleNewPresentation}
          onSignIn={handleGoogleSignIn}
        />

        <OnlinePhotoSearchModal
          isOpen={isPhotoSearchOpen}
          onClose={() => setIsPhotoSearchOpen(false)}
          onSelectPhoto={handleSelectOnlinePhoto}
          onAddSlideWithPhoto={handleAddSlideWithOnlinePhoto}
          currentPhotoUrl={activeSlide?.imageUrl}
        />
      </div>
  );
}
