import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useUploadAttachment } from '@/hooks/useAttachments';
import { useToast } from '@/hooks/useToast';
import { formatFileSize } from '@/lib/utils';
import type { AttachmentType } from '@/types';

interface UploadAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
  defaultType?: AttachmentType;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const UploadAttachmentModal: React.FC<UploadAttachmentModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
  defaultType = 'BEFORE',
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachmentMutation = useUploadAttachment(workOrderId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>(defaultType);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAttachmentType(defaultType);
      setSelectedFile(null);
      setPreviewUrl(null);
      setValidationError(null);
    }
  }, [isOpen, defaultType]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleValidateAndSelectFile = (file: File) => {
    setValidationError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(
        'Formato inválido. Tipos permitidos: Imagens (JPEG, PNG, WebP) e Documentos (PDF).'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('O arquivo excede o limite máximo permitido de 10 MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleValidateAndSelectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleValidateAndSelectFile(file);
    }
  };

  const handleClearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setValidationError('Selecione um arquivo para envio.');
      return;
    }

    try {
      await uploadAttachmentMutation.mutateAsync({
        file: selectedFile,
        type: attachmentType,
      });

      toast.success('Anexo enviado com sucesso!');
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Falha ao realizar upload do arquivo.';
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={uploadAttachmentMutation.isPending ? () => {} : onClose}
      title="Novo Anexo da Ordem de Serviço"
      description="Faça o upload de fotos de antes/depois do reparo ou relatórios técnicos e documentos em PDF."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={uploadAttachmentMutation.isPending}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploadAttachmentMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {uploadAttachmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Enviar Anexo</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Seletor de Categoria */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Categoria do Anexo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setAttachmentType('BEFORE')}
              className={`p-3 rounded-lg border text-left transition-all ${
                attachmentType === 'BEFORE'
                  ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 mb-0.5">
                <span>📷</span> Fotos Antes
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Estado inicial & avarias prévias
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAttachmentType('AFTER')}
              className={`p-3 rounded-lg border text-left transition-all ${
                attachmentType === 'AFTER'
                  ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 mb-0.5">
                <span>✨</span> Fotos Depois
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Comprovação do reparo finalizado
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAttachmentType('DOCUMENT')}
              className={`p-3 rounded-lg border text-left transition-all ${
                attachmentType === 'DOCUMENT'
                  ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 mb-0.5">
                <span>📄</span> Laudo / PDF
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Documentos e laudos técnicos
              </p>
            </button>
          </div>
        </div>

        {/* Zona de Drop / Seleção de Arquivo */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Clique para selecionar ou arraste o arquivo aqui
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Imagens (JPG, PNG, WebP) ou Documentos (PDF) de até 10 MB
            </p>
          </div>
        ) : (
          /* Card do Arquivo Selecionado */
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                />
              ) : selectedFile.type === 'application/pdf' ? (
                <div className="w-14 h-14 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-7 h-7" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Arquivo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSelectedFile}
              disabled={uploadAttachmentMutation.isPending}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Remover arquivo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Mensagem de Erro de Validação */}
        {validationError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
