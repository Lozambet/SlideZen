import React, { useState } from 'react';
import {
  FolderOpen,
  X,
  Trash2,
  Calendar,
  Layers,
  Plus,
  ExternalLink,
  Search,
  CloudCheck,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SavedProject } from '../services/firebase';

interface UserProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  projects: SavedProject[];
  currentProjectId: string | null;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onNewPresentation: () => void;
  onSignIn?: () => void;
}

export const UserProjectsModal: React.FC<UserProjectsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  projects,
  currentProjectId,
  onLoadProject,
  onDeleteProject,
  onNewPresentation,
  onSignIn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    (p.title || 'Presentazione senza titolo')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      await onDeleteProject(projectId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Appena modificato';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return 'Recentemente';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Apri Progetti Precedenti
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-sky-300">
                  Cloud Firebase
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                {currentUser
                  ? `Connesso come ${currentUser.email}`
                  : 'Accedi per visualizzare i tuoi progetti salvati'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Auto-save Banner */}
        <div className="px-6 py-2.5 bg-sky-950/20 border-b border-sky-900/30 flex items-center justify-between gap-3 text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Autosalvataggio attivo:</strong> tutte le tue modifiche vengono salvate
              automaticamente su Firebase in background mentre lavori.
            </span>
          </div>
          <button
            onClick={() => {
              onNewPresentation();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuovo Progetto</span>
          </button>
        </div>

        {/* Search Bar & List Header */}
        <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between gap-4 bg-neutral-950/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca nei progetti salvati..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <span className="text-xs text-neutral-400">
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'progetto trovato' : 'progetti trovati'}
          </span>
        </div>

        {/* Projects List Content */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
          {!currentUser ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <FolderOpen className="w-12 h-12 text-neutral-600 mb-3" />
              <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                Accesso Google non attivo
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs mb-4">
                Accedi con Google per ritrovare tutti i tuoi vecchi progetti salvati sul database.
              </p>
              {onSignIn && (
                <button
                  onClick={() => {
                    onSignIn();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Accedi con Google
                </button>
              )}
            </div>
          ) : projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/30">
              <FolderOpen className="w-12 h-12 text-neutral-600 mb-3" />
              <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                Nessun vecchio progetto salvato
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-4">
                Non hai ancora vecchi progetti salvati su Firebase. Modifica la tua presentazione
                attuale e verrà autosalvata automaticamente nel tuo spazio cloud.
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              Nessun progetto corrisponde a "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProjects.map((p) => {
                const isCurrent = p.id === currentProjectId;
                const isConfirming = confirmDeleteId === p.id;
                const isDeleting = deletingId === p.id;
                const firstSlideTitle = p.slides?.[0]?.title || '';
                const firstSlideSubtitle = p.slides?.[0]?.subtitle || '';

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between group ${
                      isCurrent
                        ? 'bg-sky-950/25 border-sky-500/50 shadow-md ring-1 ring-sky-500/20'
                        : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-white line-clamp-1">
                          {p.title || 'Presentazione senza titolo'}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                            In modifica ora
                          </span>
                        )}
                      </div>

                      {firstSlideTitle && firstSlideTitle !== p.title && (
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2">
                          {firstSlideTitle} {firstSlideSubtitle ? `— ${firstSlideSubtitle}` : ''}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-neutral-500" />
                          {p.slideCount || p.slides?.length || 0} diapositive
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {formatDate(p.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800/60">
                      {isConfirming ? (
                        <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
                          <span className="text-[11px] text-red-400 font-medium">
                            Confermi eliminazione?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              {isDeleting ? 'Eliminazione...' : 'Elimina'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors cursor-pointer"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onLoadProject(p);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-sky-600/40 text-sky-200 border border-sky-500/40 hover:bg-sky-600/60'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-white hover:text-sky-300'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{isCurrent ? 'Riapri' : 'Apri Progetto'}</span>
                          </button>

                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                            title="Elimina questo vecchio progetto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-500">
          <span>Seleziona un progetto per riaprirlo e continuare a modificarlo.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors font-medium cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
