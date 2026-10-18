import React, { useState, useMemo } from 'react';
import {
  CURATED_PHOTOS,
  PHOTO_CATEGORIES,
  OnlinePhoto,
} from '../data/curatedPhotos';
import {
  Search,
  X,
  Image as ImageIcon,
  Check,
  Plus,
  Link,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface OnlinePhotoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoUrl: string) => void;
  onAddSlideWithPhoto: (photoUrl: string, title?: string) => void;
  currentPhotoUrl?: string;
}

export const OnlinePhotoSearchModal: React.FC<OnlinePhotoSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  onAddSlideWithPhoto,
  currentPhotoUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  // Filter photos based on search query and category
  const filteredPhotos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CURATED_PHOTOS.filter((photo) => {
      // Category filter
      if (selectedCategory !== 'Tutti' && photo.category !== selectedCategory) {
        return false;
      }
      // Query filter
      if (!q) return true;
      const matchesTitle = photo.title.toLowerCase().includes(q);
      const matchesAuthor = photo.author.toLowerCase().includes(q);
      const matchesCategory = photo.category.toLowerCase().includes(q);
      const matchesTags = photo.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTitle || matchesAuthor || matchesCategory || matchesTags;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
      onSelectPhoto(trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                Cerca Foto Online
                <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  Unsplash HD
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fotografie professionali ad alta risoluzione pronte per le tue slide.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                showCustomUrlInput
                  ? 'bg-sky-950/60 border-sky-700 text-sky-300'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="Inserisci un link URL diretto a una foto dal web"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Incolla URL</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Custom URL Input Bar (Collapsible) */}
        {showCustomUrlInput && (
          <form
            onSubmit={handleApplyCustomUrl}
            className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/50 flex items-center gap-2 animate-in fade-in"
          >
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Incolla l'URL dell'immagine (es. https://images.unsplash.com/...)"
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Usa URL
            </button>
          </form>
        )}

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/30 flex flex-col gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per argomento (es. tecnologia, ufficio, natura, meeting, finanza, architettura)..."
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-sky-500/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredPhotos.map((photo) => {
                const isCurrent = currentPhotoUrl === photo.url;
                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-xl overflow-hidden border bg-neutral-950 aspect-[4/3] flex flex-col justify-end transition-all ${
                      isCurrent
                        ? 'ring-2 ring-sky-500 border-transparent shadow-lg'
                        : 'border-neutral-800 hover:border-sky-500/60 hover:shadow-xl'
                    }`}
                  >
                    {/* Image */}
                    <img
                      src={photo.thumbUrl}
                      alt={photo.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                    {/* Active Checkmark Badge */}
                    {isCurrent && (
                      <div className="absolute top-2 right-2 bg-sky-500 text-white p-1 rounded-full shadow-md z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Content & Hover Action Buttons */}
                    <div className="relative z-10 p-2.5 flex flex-col gap-1.5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate drop-shadow-sm">
                          {photo.title}
                        </p>
                        <p className="text-[9px] text-neutral-400 truncate">
                          Foto di {photo.author}
                        </p>
                      </div>

                      {/* Hover Actions */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <button
                          onClick={() => {
                            onSelectPhoto(photo.url);
                            onClose();
                          }}
                          className="flex-1 py-1 px-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold rounded-md transition-colors text-center shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          title="Inserisci questa foto nella diapositiva corrente"
                        >
                          <Check className="w-3 h-3" />
                          <span>Applica</span>
                        </button>
                        <button
                          onClick={() => {
                            onAddSlideWithPhoto(photo.url, photo.title);
                            onClose();
                          }}
                          className="py-1 px-2 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[10px] font-medium rounded-md transition-colors border border-neutral-700 shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          title="Crea una nuova diapositiva con questa foto"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Nuova</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
              <ImageIcon className="w-10 h-10 text-neutral-600 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-neutral-300">Nessuna foto trovata per "{searchQuery}"</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-sm">
                Prova con parole chiave come "ufficio", "tecnologia", "foresta", "città" oppure incolla un URL diretto.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tutti');
                }}
                className="mt-3 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-colors"
              >
                Mostra tutte le foto
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0 text-[11px] text-neutral-400">
          <span>{filteredPhotos.length} fotografie disponibili da Unsplash</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
