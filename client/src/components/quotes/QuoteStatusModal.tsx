import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useUpdateQuoteStatus } from '@/hooks/useQuotes';
import { useToast } from '@/context/ToastContext';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import type { QuoteSummary, Quote, QuoteStatus } from '@/types';

interface QuoteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteSummary | Quote | null;
}

const NEXT_STATUS_OPTIONS: Record<
  QuoteStatus,
  { value: QuoteStatus; label: string; description: string }[]
> = {
  DRAFT: [
    {
      value: 'SENT',
      label: 'Enviado ao Cliente',
      description: 'A proposta comercial foi encaminhada formalmente para avaliação do cliente.',
    },
    {
      value: 'REJECTED',
      label: 'Recusado',
      description: 'O cliente rejeitou os valores ou condições da proposta comercial.',
    },
  ],
  SENT: [
    {
      value: 'APPROVED',
      label: 'Aprovado pelo Cliente',
      description: 'O cliente aprovou os serviços e peças (habilita conversão em OS).',
    },
    {
      value: 'REJECTED',
      label: 'Recusado',
      description: 'O cliente não aceitou o orçamento.',
    },
    {
      value: 'EXPIRED',
      label: 'Expirado',
      description: 'O prazo de validade da cotação expirou sem manifestação do cliente.',
    },
  ],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
};

export const QuoteStatusModal: React.FC<QuoteStatusModalProps> = ({
  isOpen,
  onClose,
  quote,
}) => {
  const { success, error } = useToast();
  const updateStatusMutation = useUpdateQuoteStatus();

  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(null);
  const [notes, setNotes] = useState('');

  if (!quote) return null;

  const availableOptions = NEXT_STATUS_OPTIONS[quote.status] || [];

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: quote.id,
        data: {
          status: selectedStatus,
          notes: notes.trim() || undefined,
        },
      });

      success(`Status do orçamento ${quote.quoteNumber} atualizado com sucesso!`);
      setSelectedStatus(null);
      setNotes('');
      onClose();
    } catch (err: any) {
      error(err?.message || 'Falha ao atualizar status do orçamento.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atualizar Status do Orçamento"
      description={`Gerenciamento do ciclo de vida da proposta ${quote.quoteNumber}.`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedStatus || updateStatusMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Status</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Status Atual */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-600 font-medium">Status Atual:</span>
          <QuoteStatusBadge status={quote.status} />
        </div>

        {/* Opções de Transição */}
        {availableOptions.length === 0 ? (
          <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 text-center">
            {quote.status === 'APPROVED'
              ? 'Este orçamento já está aprovado. A próxima etapa é a Conversão em Ordem de Serviço.'
              : 'Este orçamento está em um estado terminal e não aceita mais transições manuais.'}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Selecione o Novo Status:
            </label>
            <div className="space-y-2">
              {availableOptions.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quoteStatus"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(opt.value)}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{opt.label}</span>
                        <QuoteStatusBadge status={opt.value} />
                      </div>
                      <p className="text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Observações Opcionais */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Observações sobre a alteração (Opcional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Cliente deu aceite verbal por telefone..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
