import React from 'react';
import { TypoCorrection } from '../types/presentation';
import { CheckCheck, X, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface TypoCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  corrections: TypoCorrection[];
  correctedFullText?: string;
  onApplySingleCorrection: (correction: TypoCorrection) => void;
  onApplyAllCorrections: (correctedText: string) => void;
}

export const TypoCheckerModal: React.FC<TypoCheckerModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  corrections,
  correctedFullText,
  onApplySingleCorrection,
  onApplyAllCorrections,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                Controllo Ortografico & Refusi
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Correzione esclusiva di refusi e lettere errate. Il tuo stile e le tue frasi non vengono mai alterati.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-300 font-medium">
                Scansione ortografica in corso...
              </p>
              <p className="text-xs text-neutral-500 max-w-sm">
                Controllo scrupoloso di accenti, consonanti doppie e refusi senza alterare le tue parole.
              </p>
            </div>
          ) : corrections.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-neutral-200">
                Nessun errore ortografico rilevato!
              </h3>
              <p className="text-xs text-neutral-400 max-w-md">
                Il tuo testo è pulito e corretto. Le tue parole sono pronte per essere presentate con precisione impeccabile.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300">
                  Trovati <strong>{corrections.length}</strong> possibili refusi. Puoi correggere singolarmente ogni parola o applicare tutte le correzioni con un click.
                </p>
              </div>

              <div className="space-y-2.5">
                {corrections.map((corr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-neutral-950/80 border border-neutral-800/90 rounded-xl flex items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-red-400 text-sm font-mono bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                          {corr.original}
                        </span>
                        <span className="text-neutral-500 text-xs">➔</span>
                        <span className="text-emerald-400 text-sm font-semibold font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                          {corr.suggestion}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">{corr.reason}</p>
                    </div>

                    <button
                      onClick={() => onApplySingleCorrection(corr)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Applica
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/90">
          <span className="text-xs text-neutral-500">
            Regola: rispetto assoluto dei tuoi testi e del tuo lessico
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Chiudi
            </button>
            {corrections.length > 0 && correctedFullText && (
              <button
                onClick={() => {
                  onApplyAllCorrections(correctedFullText);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Correggi Tutti ({corrections.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
