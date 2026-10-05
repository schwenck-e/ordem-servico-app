import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, DollarSign, QrCode, CreditCard, Banknote, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreatePayment } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/formatters';
import { paymentFormSchema, type PaymentFormData } from '@/schemas/invoice.schema';
import type { PaymentMethod } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  remainingBalance: number;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'PIX', label: 'PIX', icon: QrCode },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'BANK_SLIP', label: 'Boleto Bancário', icon: FileSpreadsheet },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  remainingBalance,
  onSuccess,
}) => {
  const toast = useToast();
  const createPaymentMutation = useCreatePayment();

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: remainingBalance,
      paymentMethod: 'PIX',
      paidAt: today,
      notes: '',
    },
  });

  const selectedMethod = watch('paymentMethod');

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: Number(remainingBalance.toFixed(2)),
        paymentMethod: 'PIX',
        paidAt: today,
        notes: '',
      });
    }
  }, [isOpen, remainingBalance, reset, today]);

  const handleSetFullAmount = () => {
    setValue('amount', Number(remainingBalance.toFixed(2)), { shouldValidate: true });
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (data.amount > remainingBalance + 0.001) {
      toast.error(`O valor não pode ser superior ao saldo restante (${formatCurrency(remainingBalance)})`);
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        invoiceId,
        data: {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paidAt: new Date(data.paidAt).toISOString(),
          notes: data.notes || undefined,
        },
      });

      toast.success(`Pagamento de ${formatCurrency(data.amount)} registrado com sucesso!`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Erro ao registrar pagamento.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pagamento / Quitação"
      description={`Fatura ${invoiceNumber} • Saldo em aberto: ${formatCurrency(remainingBalance)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Valor do Pagamento */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Valor do Pagamento (R$)*</label>
            <button
              type="button"
              onClick={handleSetFullAmount}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Quitar Valor Total ({formatCurrency(remainingBalance)})
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingBalance}
              {...register('amount', { valueAsNumber: true })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="0,00"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.amount.message}</p>
          )}
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Forma de Pagamento*
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
              const isSelected = selectedMethod === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('paymentMethod', value, { shouldValidate: true })}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          {errors.paymentMethod && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Data do Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Data do Pagamento*
          </label>
          <input
            type="date"
            {...register('paidAt')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          {errors.paidAt && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.paidAt.message}</p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            placeholder="Ex.: Comprovante enviado via WhatsApp, autorização #12345"
          />
          {errors.notes && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.notes.message}</p>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={createPaymentMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createPaymentMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {createPaymentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
