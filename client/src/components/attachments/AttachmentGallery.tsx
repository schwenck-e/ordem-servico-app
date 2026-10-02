import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Maximize2,
  HardDrive,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAttachments, useDeleteAttachment } from '@/hooks/useAttachments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getFileUrl } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';
import { UploadAttachmentModal } from './UploadAttachmentModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import type { AttachmentType, WorkOrderAttachment } from '@/types';

interface AttachmentGalleryProps {
  workOrderId: string;
  attachments?: WorkOrderAttachment[];
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  workOrderId,
  attachments: fallbackAttachments = [],
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const { data: serverAttachments, isLoading, isError } = useAttachments(workOrderId);
  const deleteAttachmentMutation = useDeleteAttachment(workOrderId);

  const [activeTab, setActiveTab] = useState<AttachmentType>('BEFORE');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState<WorkOrderAttachment | null>(null);

  // Usa dados do servidor com fallback para a prop
  const allAttachments = serverAttachments || fallbackAttachments;

  const beforeAttachments = allAttachments.filter((att) => att.type === 'BEFORE');
  const afterAttachments = allAttachments.filter((att) => att.type === 'AFTER');
  const documentAttachments = allAttachments.filter((att) => att.type === 'DOCUMENT');

  const currentTabAttachments =
    activeTab === 'BEFORE'
      ? beforeAttachments
      : activeTab === 'AFTER'
      ? afterAttachments
      : documentAttachments;

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentId);
      toast.success('Anexo excluído com sucesso!');
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Não foi possível excluir o anexo.';
      toast.error(message);
    }
  };

  const isAuthorOrAdmin = (attachment: WorkOrderAttachment) => {
    return (
      user?.role === 'ADMIN' ||
      attachment.uploadedBy === user?.name ||
      attachment.uploadedBy === user?.email
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header com Abas e Ação */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Galeria de Fotos & Anexos</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {allAttachments.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fotos de entrada/avarias, comprovação pós-reparo e laudos técnicos em PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Anexo</span>
        </button>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-5 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('BEFORE')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'BEFORE'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>📷 Antes do Serviço</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'BEFORE'
                ? 'bg-brand-100 text-brand-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {beforeAttachments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AFTER')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'AFTER'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>✨ Depois do Serviço</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'AFTER'
                ? 'bg-brand-100 text-brand-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {afterAttachments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DOCUMENT')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'DOCUMENT'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>📄 Laudos & Documentos</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'DOCUMENT'
                ? 'bg-brand-100 text-brand-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {documentAttachments.length}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Carregando anexos...</span>
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>Erro ao carregar anexos desta ordem de serviço.</span>
          </div>
        ) : currentTabAttachments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              {activeTab === 'DOCUMENT' ? (
                <FileText className="w-6 h-6" />
              ) : (
                <span className="text-xl">📷</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === 'BEFORE'
                ? 'Nenhuma foto inicial cadastrada'
                : activeTab === 'AFTER'
                ? 'Nenhuma foto de conclusão cadastrada'
                : 'Nenhum laudo ou documento anexado'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {activeTab === 'BEFORE'
                ? 'Anexe fotos que comprovem o estado original do equipamento ou avarias pré-existentes na entrada.'
                : activeTab === 'AFTER'
                ? 'Adicione fotos do equipamento consertado para comprovar a realização do reparo ao cliente.'
                : 'Envie relatórios técnicos, laudos periciais ou notas fiscais em formato PDF.'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Anexo</span>
            </button>
          </div>
        ) : activeTab === 'DOCUMENT' ? (
          /* Lista de Documentos / PDFs */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentAttachments.map((doc) => {
              const fileUrl = getFileUrl(doc.url);
              const canDelete = isAuthorOrAdmin(doc);

              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-900 hover:text-brand-600 truncate block transition-colors"
                        title={doc.originalName}
                      >
                        {doc.originalName}
                      </a>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Abrir documento em nova aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={fileUrl}
                      download={doc.originalName}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Baixar documento"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(doc.id)}
                        disabled={deleteAttachmentMutation.isPending}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grade de Fotos (BEFORE ou AFTER) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {currentTabAttachments.map((photo) => {
              const fileUrl = getFileUrl(photo.url);
              const canDelete = isAuthorOrAdmin(photo);

              return (
                <div
                  key={photo.id}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-sm cursor-pointer"
                  onClick={() => setLightboxAttachment(photo)}
                >
                  <img
                    src={fileUrl}
                    alt={photo.originalName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay gradiente com dados e ações ao passar o mouse */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 text-white">
                    <div className="flex items-center justify-end gap-1">
                      <span className="p-1 rounded bg-black/40 text-white/90 hover:text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold truncate leading-tight">
                        {photo.originalName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                        <span className="flex items-center gap-0.5">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(photo.size)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(photo.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Exclusão Rápida */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(photo.id);
                      }}
                      disabled={deleteAttachmentMutation.isPending}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modais de Upload e Lightbox */}
      <UploadAttachmentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        workOrderId={workOrderId}
        defaultType={activeTab}
      />

      <ImageLightboxModal
        isOpen={Boolean(lightboxAttachment)}
        onClose={() => setLightboxAttachment(null)}
        attachment={lightboxAttachment}
        onDelete={handleDeleteAttachment}
        isDeleting={deleteAttachmentMutation.isPending}
      />
    </div>
  );
};
