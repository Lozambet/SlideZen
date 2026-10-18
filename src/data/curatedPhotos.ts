export interface OnlinePhoto {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbUrl: string;
  category: string;
  tags: string[];
}

export const PHOTO_CATEGORIES = [
  'Tutti',
  'Business & Ufficio',
  'Tecnologia & AI',
  'Design & Architettura',
  'Natura & Paesaggi',
  'Minimal & Astratto',
  'Persone & Team',
  'Finanza & Grafici',
] as const;

export const CURATED_PHOTOS: OnlinePhoto[] = [
  // 1. Business & Ufficio
  {
    id: 'photo-biz-1',
    title: 'Riunione strategica di team',
    author: 'Jason Goodman',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=70',
    category: 'Business & Ufficio',
    tags: ['business', 'ufficio', 'team', 'riunione', 'meeting', 'lavoro', 'collaborazione', 'startup', 'strategy', 'coworking'],
  },
  {
    id: 'photo-biz-2',
    title: 'Postazione di lavoro minimalista',
    author: 'Luke Peters',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=70',
    category: 'Business & Ufficio',
    tags: ['ufficio', 'scrivania', 'desk', 'moderno', 'interior', 'business', 'azienda', 'luminoso', 'spazio'],
  },
  {
    id: 'photo-biz-3',
    title: 'Presentazione e brainstorming su lavagna',
    author: 'Kaleidico',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=70',
    category: 'Business & Ufficio',
    tags: ['brainstorming', 'progetto', 'pianificazione', 'scrum', 'agile', 'kanban', 'postit', 'idea', 'presentazione'],
  },
  {
    id: 'photo-biz-4',
    title: 'Stretta di mano e accordo commerciale',
    author: 'Cytonn Photography',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=70',
    category: 'Business & Ufficio',
    tags: ['accordo', 'partnership', 'stretta di mano', 'handshake', 'fiducia', 'contratto', 'successo', 'clienti'],
  },

  // 2. Tecnologia & AI
  {
    id: 'photo-tech-1',
    title: 'Codice di programmazione su monitor',
    author: 'Fotis Fotopoulos',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=70',
    category: 'Tecnologia & AI',
    tags: ['codice', 'code', 'programmazione', 'sviluppo', 'software', 'developer', 'tecnologia', 'developer', 'python', 'javascript'],
  },
  {
    id: 'photo-tech-2',
    title: 'Rete dati e Intelligenza Artificiale',
    author: 'DeepMind',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=70',
    category: 'Tecnologia & AI',
    tags: ['ai', 'intelligenza artificiale', 'machine learning', 'dati', 'cyber', 'futuro', 'deep learning', 'network', 'digitale'],
  },
  {
    id: 'photo-tech-3',
    title: 'Server farm e Cloud computing',
    author: 'Taylor Vick',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=70',
    category: 'Tecnologia & AI',
    tags: ['server', 'cloud', 'datacenter', 'infrastruttura', 'hardware', 'sicurezza', 'cybersecurity', 'rete'],
  },
  {
    id: 'photo-tech-4',
    title: 'Microchip e semiconduttori',
    author: 'Alexandre Debiève',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=70',
    category: 'Tecnologia & AI',
    tags: ['chip', 'processore', 'scheda madre', 'hardware', 'tecnologia', 'elettronica', 'innovazione'],
  },

  // 3. Design & Architettura
  {
    id: 'photo-arch-1',
    title: 'Geometrie architettoniche moderne',
    author: 'Simone Hutsch',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=70',
    category: 'Design & Architettura',
    tags: ['architettura', 'design', 'linee', 'struttura', 'palazzo', 'facciata', 'moderno', 'minimal', 'forma'],
  },
  {
    id: 'photo-arch-2',
    title: 'Grattacieli e prospettiva verso il cielo',
    author: 'Alex Wong',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70',
    category: 'Design & Architettura',
    tags: ['grattacieli', 'città', 'business district', 'corporate', 'futuro', 'crescita', 'prospettiva', 'vetro', 'acciaio'],
  },
  {
    id: 'photo-arch-3',
    title: 'Scale a chiocciola e simmetria',
    author: 'Daniel von Appen',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=70',
    category: 'Design & Architettura',
    tags: ['scale', 'spirale', 'simmetria', 'design', 'minimalista', 'ordine', 'struttura', 'bianco'],
  },

  // 4. Natura & Paesaggi
  {
    id: 'photo-nat-1',
    title: 'Vette montuose all\'alba',
    author: 'Kalen Emsley',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=70',
    category: 'Natura & Paesaggi',
    tags: ['montagna', 'vetta', 'sfida', 'alba', 'orizzonte', 'natura', 'obiettivi', 'leadership', 'ispirazione', 'paesaggio'],
  },
  {
    id: 'photo-nat-2',
    title: 'Foresta verde dall\'alto',
    author: 'Casey Horner',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=70',
    category: 'Natura & Paesaggi',
    tags: ['foresta', 'alberi', 'verde', 'sostenibilità', 'ecologia', 'natura', 'ambiente', 'green', 'esg'],
  },
  {
    id: 'photo-nat-3',
    title: 'Oceano e onde rilassanti',
    author: 'Shifaaz shamoon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70',
    category: 'Natura & Paesaggi',
    tags: ['mare', 'oceano', 'spiaggia', 'acqua', 'calma', 'serenità', 'trasparenza', 'natura', 'estate'],
  },

  // 5. Minimal & Astratto
  {
    id: 'photo-min-1',
    title: 'Onde di luce sfumata e gradiente',
    author: 'Google DeepMind',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70',
    category: 'Minimal & Astratto',
    tags: ['astratto', 'fluido', 'gradiente', 'colori', 'arte', 'sfondo', 'onda', 'moderno', 'texture'],
  },
  {
    id: 'photo-min-2',
    title: 'Texture geometrica e ombre',
    author: 'Ricardo Gomez Angel',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=70',
    category: 'Minimal & Astratto',
    tags: ['texture', 'ombra', 'luce', 'minimal', 'linee', 'eleganza', 'pulizia', 'spazio'],
  },
  {
    id: 'photo-min-3',
    title: 'Fumo colorato e dinamismo',
    author: 'Pawel Czerwinski',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=70',
    category: 'Minimal & Astratto',
    tags: ['creatività', 'energia', 'fluido', 'astratto', 'sfumatura', 'sfondo', 'impatto', 'arte'],
  },

  // 6. Persone & Team
  {
    id: 'photo-team-1',
    title: 'Team sorridente e affiatato',
    author: 'Priscilla Du Preez',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=70',
    category: 'Persone & Team',
    tags: ['persone', 'team', 'studenti', 'giovani', 'collaborazione', 'sorriso', 'cultura aziendale', 'diversity', 'community'],
  },
  {
    id: 'photo-team-2',
    title: 'Relatore che parla a un pubblico',
    author: 'Product School',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=70',
    category: 'Persone & Team',
    tags: ['speaker', 'conferenza', 'presentazione', 'stage', 'palco', 'pubblico', 'keynote', 'discorso', 'evento'],
  },

  // 7. Finanza & Grafici
  {
    id: 'photo-fin-1',
    title: 'Grafici finanziari su tablet',
    author: 'Adeolu Eletu',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=70',
    category: 'Finanza & Grafici',
    tags: ['grafici', 'finanza', 'dati', 'crescita', 'investimenti', 'mercati', 'analytics', 'kpi', 'revenue', 'roi'],
  },
  {
    id: 'photo-fin-2',
    title: 'Analisi numerica e calcoli',
    author: 'Scott Graham',
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=70',
    category: 'Finanza & Grafici',
    tags: ['analisi', 'calcolo', 'piano economico', 'business plan', 'contabilità', 'budget', 'strategia'],
  },
];
