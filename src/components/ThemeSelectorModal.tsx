import React from 'react';
import { PresentationTheme } from '../types/presentation';
import { PRESENTATION_THEMES } from '../data/themes';
import { Check, X, Sparkles } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: PresentationTheme;
  onSelectTheme: (theme: PresentationTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Tutti');

  if (!isOpen) return null;

  const categories = ['Tutti', 'Elegante', 'Casual', 'Informale', 'Chiari', 'Scuri'];

  const filteredThemes =
    selectedCategory === 'Tutti'
      ? PRESENTATION_THEMES
      : selectedCategory === 'Chiari'
      ? PRESENTATION_THEMES.filter((t) => !t.isDark)
      : selectedCategory === 'Scuri'
      ? PRESENTATION_THEMES.filter((t) => t.isDark)
      : PRESENTATION_THEMES.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-semibold text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Template & Stili Visivi Predefiniti
            </h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Personalizza istantaneamente font, cromie e ritmo grafico per l'intera presentazione.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-800/60 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-950 font-semibold shadow'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Themes Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredThemes.map((theme) => {
            const isSelected = activeTheme.id === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme);
                  onClose();
                }}
                className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-white bg-neutral-800/90 ring-2 ring-white/20'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/50'
                }`}
              >
                {/* Visual Slide Mini-Preview */}
                <div
                  className="w-full h-32 rounded-lg p-3 flex flex-col justify-between mb-3 border relative overflow-hidden transition-transform group-hover:scale-[1.01]"
                  style={{
                    backgroundColor: theme.slideBg,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.accentLight,
                        color: theme.accent,
                      }}
                    >
                      {theme.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {theme.swatches.map((color, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4
                      className="text-base font-bold truncate leading-tight"
                      style={{
                        color: theme.textPrimary,
                        fontFamily: theme.fontTitleFamily,
                      }}
                    >
                      {theme.name}
                    </h4>
                    <p
                      className="text-xs truncate opacity-80"
                      style={{
                        color: theme.textSecondary,
                        fontFamily: theme.fontBodyFamily,
                      }}
                    >
                      Linguaggio tipografico & identità coerente
                    </p>
                  </div>

                  {/* Accent Line */}
                  <div
                    className="h-1 w-12 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>

                {/* Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-100 text-sm">{theme.name}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                          <Check className="w-3 h-3" /> Attivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{theme.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 text-xs text-neutral-400">
          <span>Stile selezionato: <strong className="text-neutral-200">{activeTheme.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 text-neutral-900 hover:bg-white font-medium rounded-lg transition-colors"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
