import React from 'react';
import { X, Trash2, FolderOpen, Clock, FileText, Plus } from 'lucide-react';
import { SavedDraft } from '../types';

interface SavedDraftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: SavedDraft[];
  onLoadDraft: (draft: SavedDraft) => void;
  onDeleteDraft: (id: string) => void;
  onNewPackage: () => void;
}

export const SavedDraftsDrawer: React.FC<SavedDraftsDrawerProps> = ({
  isOpen,
  onClose,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  onNewPackage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-l border-slate-300 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-800 text-white">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Local Device Drafts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-mono">
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} stored in browser
          </span>
          <button
            onClick={() => {
              onNewPackage();
              onClose();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-white cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3 h-3" />
            New Package
          </button>
        </div>

        {/* List */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5">
          {drafts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold uppercase text-slate-700">No saved drafts found</p>
              <p className="text-[11px] text-slate-500">Drafts are saved locally on this device as you generate and edit.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-3 rounded bg-slate-50 border border-slate-200 hover:border-blue-600 hover:bg-white transition-all space-y-1.5 group shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">
                      {draft.title || draft.formData.awardName || 'Untitled Package'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono text-[9px] font-bold uppercase">
                        {draft.formData.rankGrade || 'Rank N/A'}
                      </span>
                      <span>{draft.formData.formFormat || 'AF Form 1206'}</span>
                      <span>•</span>
                      <span>{draft.formData.targetBoardLevel || 'Wing'}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete draft "${draft.title}"?`)) {
                        onDeleteDraft(draft.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(draft.updatedAt).toLocaleDateString()} {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={() => {
                      onLoadDraft(draft);
                      onClose();
                    }}
                    className="text-blue-700 hover:text-blue-900 font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Open Draft →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
