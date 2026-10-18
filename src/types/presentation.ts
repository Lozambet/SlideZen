export type SlideLayout =
  | 'hero'
  | 'bullets'
  | 'cards'
  | 'stat'
  | 'quote'
  | 'timeline'
  | 'split-image'
  | 'comparison';

export interface SlideColumn {
  title: string;
  description: string;
  icon?: string;
}

export interface TextBoxOffset {
  x: number;
  y: number;
  canvasX?: number;
  canvasY?: number;
  width?: number; // custom horizontal width in 960x540 canvas px
  align?: 'left' | 'center' | 'right' | 'beside';
  snapLabel?: string;
  boxStyle?: 'card' | 'none'; // Explicitly internal to card box or external transparent text
}

export interface Slide {
  id: string;
  rawText: string;
  title: string;
  subtitle?: string;
  layout: SlideLayout;
  content: string[];
  graphicNotes?: string;
  aiLayoutReason?: string;
  suggestedLayout?: SlideLayout;
  suggestedLayoutReason?: string;
  dismissedLayoutSuggestion?: SlideLayout;
  statNumber?: string;
  statLabel?: string;
  quoteAuthor?: string;
  imageUrl?: string;
  imagePrompt?: string;
  svgCode?: string;
  columns?: SlideColumn[];
  suggestedIcons?: string[];
  notes?: string;
  fontScale?: 'auto' | 'spacious' | 'balanced' | 'compact' | 'dense';
  textZoom?: number;
  contentAnchor?: 'center' | 'top'; // Tendency of stage anchoring (default 'center')
  experimentalFreeform?: boolean; // Experimental freeform placement without magnetic grid snap
  originalImageUrl?: string;
  boxOffsets?: Record<string, TextBoxOffset>;
}

export interface PresentationTheme {
  id: string;
  name: string;
  category: 'Elegante' | 'Casual' | 'Informale';
  description: string;
  bgColor: string;
  slideBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  fontTitle: string;
  fontBody: string;
  fontTitleFamily: string;
  fontBodyFamily: string;
  isDark: boolean;
  swatches: string[];
}

export interface TypoCorrection {
  original: string;
  suggestion: string;
  reason: string;
}

export interface GraphicSuggestion {
  visualConcept: string;
  recommendedLayout: string;
  imageKeywords: string[];
  structuredDiagram?: {
    title: string;
    description: string;
    icon?: string;
  }[];
  svgCode?: string;
}
