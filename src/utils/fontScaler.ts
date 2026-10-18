import { Slide } from '../types/presentation';

export type FontDensityTier = 'spacious' | 'balanced' | 'compact' | 'dense';

export interface FontScaleConfig {
  tier: FontDensityTier;
  label: string;
  badgeText: string;
  paddingClass: string;
  spacingClass: string;
  titleClass: string;
  subtitleClass: string;
  bodyClass: string;
  cardTitleClass: string;
  cardBodyClass: string;
  cardHeightClass: string;
  statNumberClass: string;
  statLabelClass: string;
  quoteTextClass: string;
}

export function computeSlideFontScale(slide: Slide): FontScaleConfig {
  const titleLen = slide.title?.length || 0;
  const subLen = slide.subtitle?.length || 0;
  const contentLen = slide.content?.reduce((acc, c) => acc + c.length, 0) || 0;
  const colLen = slide.columns?.reduce((acc, col) => acc + (col.title?.length || 0) + (col.description?.length || 0), 0) || 0;
  const totalChars = titleLen + subLen + contentLen + colLen;

  const contentItemsCount = (slide.content?.length || 0) + (slide.columns?.length || 0);
  const totalLines = 1 + (slide.subtitle ? 1 : 0) + contentItemsCount;

  // Manual override or auto-calculation
  let tier: FontDensityTier = 'balanced';

  // Automatic volume assessment
  if (slide.fontScale && slide.fontScale !== 'auto') {
    tier = slide.fontScale;
  } else {
    if (totalChars < 90 && totalLines <= 2 && contentItemsCount <= 2) {
      tier = 'spacious';
    } else if (totalChars >= 380 || totalLines >= 7 || contentLen > 280) {
      tier = 'dense';
    } else if (totalChars >= 210 || totalLines >= 5 || contentLen > 150) {
      tier = 'compact';
    } else {
      tier = 'balanced';
    }
  }

  switch (tier) {
    case 'spacious':
      return {
        tier: 'spacious',
        label: 'Ampio (Testo Breve)',
        badgeText: 'Auto-Fit: Dimensione Grande',
        paddingClass: 'p-8 sm:p-9',
        spacingClass: 'space-y-5',
        titleClass: 'text-4xl md:text-5xl font-black tracking-tight leading-[1.1]',
        subtitleClass: 'text-xl md:text-2xl font-medium leading-relaxed',
        bodyClass: 'text-lg md:text-xl font-medium leading-relaxed',
        cardTitleClass: 'text-xl md:text-2xl font-extrabold leading-snug',
        cardBodyClass: 'text-base font-normal leading-relaxed',
        cardHeightClass: 'min-h-[200px]',
        statNumberClass: 'text-7xl md:text-8xl font-black leading-none tracking-tight',
        statLabelClass: 'text-xl md:text-2xl font-bold',
        quoteTextClass: 'text-2xl md:text-3xl font-normal italic leading-snug',
      };

    case 'compact':
      return {
        tier: 'compact',
        label: 'Compatto (Testo Medio-Lungo)',
        badgeText: 'Auto-Fit: Dimensione Compatta',
        paddingClass: 'p-6 sm:p-7',
        spacingClass: 'space-y-3',
        titleClass: 'text-2xl md:text-3xl font-extrabold tracking-tight leading-tight',
        subtitleClass: 'text-base md:text-lg font-medium leading-normal',
        bodyClass: 'text-sm md:text-base leading-normal',
        cardTitleClass: 'text-base md:text-lg font-bold leading-snug',
        cardBodyClass: 'text-xs md:text-sm font-normal leading-normal',
        cardHeightClass: 'min-h-[160px]',
        statNumberClass: 'text-5xl md:text-6xl font-extrabold leading-none',
        statLabelClass: 'text-base md:text-lg font-semibold',
        quoteTextClass: 'text-xl md:text-2xl font-normal italic leading-relaxed',
      };

    case 'dense':
      return {
        tier: 'dense',
        label: 'Ultra-Compatto (Testo Denso)',
        badgeText: 'Auto-Fit: Ottimizzato per Testo Lungo',
        paddingClass: 'p-5 sm:p-6',
        spacingClass: 'space-y-2',
        titleClass: 'text-xl md:text-2xl font-bold tracking-tight leading-tight',
        subtitleClass: 'text-sm md:text-base font-medium leading-tight',
        bodyClass: 'text-xs md:text-sm leading-snug',
        cardTitleClass: 'text-sm font-bold leading-tight',
        cardBodyClass: 'text-xs font-normal leading-snug',
        cardHeightClass: 'min-h-[140px]',
        statNumberClass: 'text-4xl md:text-5xl font-extrabold leading-none',
        statLabelClass: 'text-sm font-semibold',
        quoteTextClass: 'text-lg md:text-xl font-normal italic leading-snug',
      };

    case 'balanced':
    default:
      return {
        tier: 'balanced',
        label: 'Bilanciato (Standard)',
        badgeText: 'Auto-Fit: Dimensione Piena & Bilanciata',
        paddingClass: 'p-7 sm:p-8',
        spacingClass: 'space-y-4',
        titleClass: 'text-3xl md:text-4xl font-extrabold tracking-tight leading-tight',
        subtitleClass: 'text-lg md:text-xl font-medium leading-relaxed',
        bodyClass: 'text-base md:text-lg font-medium leading-relaxed',
        cardTitleClass: 'text-lg md:text-xl font-extrabold leading-snug',
        cardBodyClass: 'text-sm md:text-base font-normal leading-relaxed',
        cardHeightClass: 'min-h-[180px]',
        statNumberClass: 'text-6xl md:text-7xl font-black leading-none tracking-tight',
        statLabelClass: 'text-lg md:text-xl font-bold',
        quoteTextClass: 'text-2xl md:text-3xl font-normal italic leading-relaxed',
      };
  }
}
