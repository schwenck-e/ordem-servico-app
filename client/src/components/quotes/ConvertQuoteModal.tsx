import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useConvertToWorkOrder } from '@/hooks/useQuotes';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/formatters';
import type { QuoteSummary, Quote } from '@/types';

interface ConvertQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteSummary | Quote | null;
}

export const ConvertQuoteModal: React.FC<ConvertQuoteModalProps> = ({
  isOpen,
  onClose,
  quote,
}) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const convertMutation = useConvertToWorkOrder();

  if (!quote) return null;

  const handleConfirm = async () => {
    try {
      const result = await convertMutation.mutateAsync(quote.id);
      success(`Orçamento convertido! OS ${result.workOrder.orderNumber} gerada com sucesso.`);
      onClose();
      navigate(`/work-orders/${result.workOrder.id}`);
    } catch (err: any) {
      error(err?.message || 'Falha ao processar conversão em Ordem de Serviço.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Converter Orçamento em Ordem de Serviço"
      description={`Confirmação de geração de OS a partir da proposta ${quote.quoteNumber}.`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={convertMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={convertMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Convertendo...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Conversão</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente:</span>
            <span className="font-semibold text-slate-800">{quote.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Equipamento:</span>
            <span className="font-medium text-slate-800">{quote.equipment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total da Proposta:</span>
            <span className="font-bold text-slate-900">{formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Atenção sobre Estoque e Status:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
              <li>O status deste orçamento será alterado permanentemente para <strong>Aprovado</strong>.</li>
              <li>Todas as peças vinculadas ao catálogo terão <strong>baixa física automática imediata</strong> no saldo de estoque.</li>
              <li>Uma nova <strong>Ordem de Serviço (Status: Aberta)</strong> será gerada com todos os itens e vínculos.</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};
