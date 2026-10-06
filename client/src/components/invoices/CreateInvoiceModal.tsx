import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/formatters';
import type { WorkOrder, WorkOrderSummary, Quote, QuoteSummary, Invoice } from '@/types';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder?: WorkOrder | WorkOrderSummary | null;
  quote?: Quote | QuoteSummary | null;
  onSuccess?: (createdInvoice: Invoice) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  quote,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const createInvoiceMutation = useCreateInvoice();

  // Helper date for default dueDate (+15 days formatted YYYY-MM-DD)
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState<string>(getDefaultDueDate());
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setDueDate(getDefaultDueDate());
      setValidationError(null);
      if (workOrder) {
        setDiscount(workOrder.discount || 0);
        setNotes(`Faturamento referente à Ordem de Serviço ${workOrder.orderNumber}`);
      } else if (quote) {
        setDiscount(quote.discount || 0);
        setNotes(`Faturamento referente ao Orçamento ${quote.quoteNumber}`);
      } else {
        setDiscount(0);
        setNotes('');
      }
    }
  }, [isOpen, workOrder, quote]);

  if (!isOpen) return null;

  const customerName = workOrder?.customer?.name || quote?.customer?.name || 'Cliente não identificado';
  const totalServices = workOrder?.totalServices || quote?.totalServices || 0;
  const totalParts = workOrder?.totalParts || quote?.totalParts || 0;
  const grossAmount = Math.round((totalServices + totalParts) * 100) / 100;
  const netAmount = Math.max(0, Math.round((grossAmount - discount) * 100) / 100);
  const referenceLabel = workOrder ? `OS ${workOrder.orderNumber}` : quote ? `Orçamento ${quote.quoteNumber}` : 'Documento';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (discount < 0) {
      setValidationError('O desconto não pode ser negativo.');
      return;
    }

    if (discount > grossAmount) {
      setValidationError(`O desconto não pode exceder o valor bruto (${formatCurrency(grossAmount)}).`);
      return;
    }

    if (!dueDate) {
      setValidationError('Selecione uma data de vencimento válida.');
      return;
    }

    try {
      const payload: any = {
        dueDate: new Date(dueDate).toISOString(),
        discount,
        notes: notes.trim() || undefined,
      };

      if (workOrder) {
        payload.workOrderId = workOrder.id;
      } else if (quote) {
        payload.quoteId = quote.id;
      }

      const created = await createInvoiceMutation.mutateAsync(payload);
      success(`Fatura ${created.invoiceNumber} emitida com sucesso!`);
      onClose();

      if (onSuccess) {
        onSuccess(created);
      } else {
        navigate(`/invoices/${created.id}`);
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Falha ao emitir fatura.';
      setValidationError(msg);
      error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emitir Fatura Comercial"
      description={`Gerar documento formal de cobrança para ${referenceLabel}.`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={createInvoiceMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createInvoiceMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {createInvoiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Emitindo Fatura...</span>
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                <span>Confirmar e Gerar Fatura</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Informações do Cliente & Referência */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cliente:</span>
            <span className="text-xs font-bold text-slate-900">{customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Documento Origem:</span>
            <span className="font-mono text-xs font-semibold text-brand-600">{referenceLabel}</span>
          </div>
        </div>

        {/* Quadro Resumo Financeiro */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total em Serviços:</span>
            <span className="font-medium text-slate-900">{formatCurrency(totalServices)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total em Peças:</span>
            <span className="font-medium text-slate-900">{formatCurrency(totalParts)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Valor Bruto:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(grossAmount)}</span>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-950 block">Valor Líquido da Fatura:</span>
              <span className="text-[11px] text-emerald-700">Total a ser cobrado do cliente</span>
            </div>
            <span className="text-base font-extrabold text-emerald-700 font-mono">
              {formatCurrency(netAmount)}
            </span>
          </div>
        </div>

        {/* Campos Editáveis: Desconto e Data de Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Desconto Comercial (R$):
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={grossAmount}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Vencimento:
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Observações / Instruções de Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Instruções de Pagamento / Observações (Opcional):
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Chave Pix CNPJ: 12.345.678/0001-90, vencimento em 15 dias..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </form>
    </Modal>
  );
};
