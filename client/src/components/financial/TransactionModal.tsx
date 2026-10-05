import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateFinancialTransaction } from '@/hooks/useFinancial';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/formatters';
import { transactionFormSchema, type TransactionFormData } from '@/schemas/financial.schema';
import type { FinancialTransactionCategory } from '@/types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES: { value: FinancialTransactionCategory; label: string }[] = [
  { value: 'FIXED_EXPENSE', label: 'Despesa Fixa (Aluguel, Energia, Água, Internet)' },
  { value: 'VARIABLE_EXPENSE', label: 'Despesa Variável (Manutenção, Limpeza, Impostos)' },
  { value: 'PARTS_PURCHASE', label: 'Compra de Peças / Reposição de Estoque' },
  { value: 'OTHER', label: 'Outras Despesas' },
];

const REVENUE_CATEGORIES: { value: FinancialTransactionCategory; label: string }[] = [
  { value: 'SERVICE_REVENUE', label: 'Receita de Serviços / Atendimentos' },
  { value: 'OTHER', label: 'Outras Receitas' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const createMutation = useCreateFinancialTransaction();
  const today = new Date().toISOString().split('T')[0];

  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'EXPENSE',
      category: 'FIXED_EXPENSE',
      description: '',
      amount: 0,
      dueDate: today,
      paymentDate: null,
      status: 'PENDING',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      setAlreadyPaid(false);
      reset({
        type: 'EXPENSE',
        category: 'FIXED_EXPENSE',
        description: '',
        amount: undefined as any,
        dueDate: today,
        paymentDate: null,
        status: 'PENDING',
      });
    }
  }, [isOpen, reset, today]);

  const handleTypeChange = (type: 'REVENUE' | 'EXPENSE') => {
    setValue('type', type);
    setValue('category', type === 'EXPENSE' ? 'FIXED_EXPENSE' : 'SERVICE_REVENUE');
  };

  const handleAlreadyPaidChange = (checked: boolean) => {
    setAlreadyPaid(checked);
    setValue('status', checked ? 'PAID' : 'PENDING');
    setValue('paymentDate', checked ? today : null);
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await createMutation.mutateAsync({
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        dueDate: new Date(data.dueDate).toISOString(),
        paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
        status: data.status,
      });

      toast.success(
        `${data.type === 'REVENUE' ? 'Receita' : 'Despesa'} de ${formatCurrency(data.amount)} registrada com sucesso!`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Erro ao registrar movimentação.');
    }
  };

  const categories = selectedType === 'EXPENSE' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento Financeiro"
      description="Cadastre despesas avulsas ou receitas complementares no livro-caixa."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Toggle Tipo (Despesa / Receita) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tipo de Lançamento*
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                selectedType === 'EXPENSE'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>Despesa (A Pagar)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('REVENUE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                selectedType === 'REVENUE'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>Receita (A Receber)</span>
            </button>
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria*</label>
          <div className="relative">
            <select
              {...register('category')}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {errors.category && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.category.message}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Descrição do Lançamento*
          </label>
          <input
            type="text"
            {...register('description')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            placeholder={
              selectedType === 'EXPENSE'
                ? 'Ex.: Pagamento Aluguel Imóvel - Mês Outubro'
                : 'Ex.: Venda de acessório avulso no balcão'
            }
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.description.message}</p>
          )}
        </div>

        {/* Valor em R$ e Data de Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)*</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="0,00"
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Vencimento*
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            {errors.dueDate && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        {/* Já Liquidado? */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alreadyPaid}
              onChange={(e) => handleAlreadyPaidChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20"
            />
            <span className="text-xs font-semibold text-slate-700">
              Esta movimentação já foi realizada / quitada hoje
            </span>
          </label>

          {alreadyPaid && (
            <div className="mt-2 pl-6">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Data do Pagamento / Efetivação
              </label>
              <input
                type="date"
                {...register('paymentDate')}
                className="w-full sm:w-1/2 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all disabled:opacity-50 ${
              selectedType === 'EXPENSE'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Salvar Movimentação
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
