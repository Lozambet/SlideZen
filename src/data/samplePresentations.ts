export interface PresetPresentation {
  title: string;
  description: string;
  themeId: string;
  slideTexts: string[];
}

export const SAMPLE_PRESENTATIONS: PresetPresentation[] = [
  {
    title: 'Lancio Prodotto Tech',
    description: 'Pitch di prodotto con metriche, pilastri e visione.',
    themeId: 'slate-graphite',
    slideTexts: [
      `Horizon Cloud

La piattaforma di orchestrazione distribuita per team moderni

Infrastruttura globale a latenza zero

Sicurezza zero-trust integrata di default

Deploy in un click su 35 region mondiali`,

      `I Tre Pilastri Fondamentali

Architettura solida per carichi di lavoro mission-critical

Velocità Estrema: Elaborazione istantanea con engine Rust a basso consumo energetico

Resilienza Totale: Ridondanza automatica multi-cloud senza interruzioni

Semplicità Zen: Configurazione dichiarativa via codice con anteprima immediata

Vorrei disporre questi tre pilastri in colonne affiancate con icone`,

      `Crescita e Impatto sul Mercato

+340% Aumento del throughput

I nostri clienti hanno ridotto del 70% i costi di provisioning nel primo mese di adozione.

Oltre 1.2 milioni di microservizi orchestrati con uptime misurato al 99.995%.

Evidenzia la percentuale in grande con sotto i dati di supporto`,

      `La Nostra Visione

La vera innovazione consiste nel togliere tutto il superfluo, fino a rendere invisibile la complessità tecnologica.

Citazione del Chief Architect`,

      `Roadmap di Rilascio

I prossimi traguardi verso la scalabilità enterprise

Fase 1: Rilascio SDK e CLI per sviluppatori

Fase 2: Audit di conformità SOC2 Type II

Fase 3: Supporto edge computing in 120 PoP

Fase 4: Marketplace aperto per estensioni

Organizza le 4 fasi in una timeline temporale`,
    ],
  },
  {
    title: 'Strategia Aziendale 2026',
    description: 'Piano strategico, driver di valore e obiettivi per executive e board.',
    themeId: 'nordic-breeze',
    slideTexts: [
      `Strategia Aziendale 2026

Obiettivi strategici, investimenti chiave e roadmap di crescita

Piano triennale di espansione nei mercati europei

Trasformazione digitale dei processi operativi

Sostenibilità e impatto sociale positivo`,

      `I Driver di Valore

Come creiamo vantaggio competitivo sostenibile nel lungo periodo

Eccellenza Operativa: Automatizzazione dell'80% delle procedure ripetitive

Centralità del Cliente: Net Promoter Score target superiore a 75 punti

Capitale Umano: Programmi di upskilling continuo e attrazione talenti

Disponi i 3 driver in schede visive`,

      `Obiettivo Ricavi del Quarto Trimestre

€14.8M Fatturato previsto (+42% anno su anno)

La diversificazione dei flussi di ricavo ricorrenti costituisce oggi oltre il 65% del totale entrate del gruppo.

Margine operativo salito al 28% ed espansione avviata in 3 nuovi paesi.

Metti il dato economico in forte evidenza numerica`,

      `Il Valore dell'Ascolto

Non costruiamo prodotti per mercati astratti, ma soluzioni concrete per persone che si fidano del nostro operato ogni giorno.

Citazione del Consiglio Direttivo`,
    ],
  },
  {
    title: 'Design System & Identità',
    description: 'Presentazione editoriale con focus su estetica, tipografia e coerenza.',
    themeId: 'luxe-ivory',
    slideTexts: [
      `Purezza Visiva

Principi del nostro nuovo linguaggio di marca

Ricerca della chiarezza attraverso lo spazio negativo

Gerarchia tipografica naturale e leggibile

Tavolozza cromatica ispirata alla materia naturale`,

      `Valori Cardine

L'identità che guida ogni punto di contatto con il pubblico

Essenzialità: Eliminare ogni decorazione superflua per far risaltare il messaggio

Autenticità: Usare materiali e colori sinceri che trasmettano calore umano

Precisione: Griglie rigorose, spaziature auree e proporzioni armoniose

Crea 3 card pulite ed eleganti`,

      `Coerenza Multi-piattaforma

100% Componenti unificati

Tutti i touchpoint digitali e fisici condividono ora lo stesso sistema di design tokens e componenti riutilizzabili.

Riduzione del 50% dei tempi di sviluppo interfaccia con accessibilità garantita ovunque.

Mostra il 100% come metrica centrale`,
    ],
  },
];
