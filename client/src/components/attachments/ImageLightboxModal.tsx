import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Trash2,
  Calendar,
  User,
  HardDrive,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getFileUrl } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';
import type { WorkOrderAttachment } from '@/types';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: WorkOrderAttachment | null;
  onDelete: (attachmentId: string) => Promise<void>;
  isDeleting?: boolean;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  attachment,
  onDelete,
  isDeleting = false,
}) => {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, showDeleteConfirm, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !attachment) return null;

  const canDelete =
    user?.role === 'ADMIN' ||
    attachment.uploadedBy === user?.name ||
    attachment.uploadedBy === user?.email;

  const typeLabels: Record<string, { label: string; color: string }> = {
    BEFORE: {
      label: 'Antes do Serviço',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    AFTER: {
      label: 'Depois do Serviço',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    DOCUMENT: {
      label: 'Laudo / Documento',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  };

  const currentType = typeLabels[attachment.type] || {
    label: attachment.type,
    color: 'bg-slate-700 text-slate-200 border-slate-600',
  };

  const fileUrl = getFileUrl(attachment.url);

  const handleDelete = async () => {
    await onDelete(attachment.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-md transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/50 border-b border-white/10 shrink-0 text-white z-10">
        <div className="flex items-center gap-3 overflow-hidden mr-4">
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border shrink-0 ${currentType.color}`}
          >
            {currentType.label}
          </span>
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold truncate leading-tight">
              {attachment.originalName}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                {formatFileSize(attachment.size)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {attachment.uploadedBy}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(attachment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={fileUrl}
            download={attachment.originalName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            title="Baixar arquivo original"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span>
          </a>

          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-red-200 text-xs font-medium transition-colors border border-red-500/30"
              title="Excluir anexo permanentemente"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            title="Fechar (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
        <img
          src={fileUrl}
          alt={attachment.originalName}
          className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform"
        />

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-base font-bold">Confirmar Exclusão de Anexo</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente o anexo{' '}
                <strong className="text-white">"{attachment.originalName}"</strong>? Esta ação não
                poderá ser desfeita.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sim, Excluir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-black/40 border-t border-white/10 text-center text-xs text-slate-400 shrink-0">
        Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> para fechar a visualização
      </div>
    </div>
  );
};
