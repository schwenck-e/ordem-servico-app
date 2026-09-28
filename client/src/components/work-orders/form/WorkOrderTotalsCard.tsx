import { Calculator, Tag, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { formatCurrency } from '@/lib/formatters';
import type { WorkOrderFormData } from '@/schemas/work-order.schema';

interface WorkOrderTotalsCardProps {
  register: UseFormRegister<WorkOrderFormData>;
  watch: UseFormWatch<WorkOrderFormData>;
  errors: FieldErrors<WorkOrderFormData>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

export function WorkOrderTotalsCard({
  register,
  watch,
  errors,
  isSubmitting,
  isEditMode,
  onCancel,
}: WorkOrderTotalsCardProps) {
  const items = watch('items') || [];
  const discountValue = Number(watch('discount')) || 0;

  // Realtime calculations
  const totalServices = items.reduce((sum, item) => {
    if (item.type === 'SERVICE') {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      return sum + q * p;
    }
    return sum;
  }, 0);

  const totalParts = items.reduce((sum, item) => {
    if (item.type === 'PART') {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      return sum + q * p;
    }
    return sum;
  }, 0);

  const grossTotal = totalServices + totalParts;
  const isDiscountInvalid = discountValue > grossTotal;
  const netTotal = Math.max(0, grossTotal - discountValue);

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <Calculator className="h-5 w-5 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Resumo Financeiro</h3>
      </div>

      {/* Discriminação de Valores */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Total Serviços:</span>
          <span className="font-semibold text-slate-800">{formatCurrency(totalServices)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Total Peças:</span>
          <span className="font-semibold text-slate-800">{formatCurrency(totalParts)}</span>
        </div>

        <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-slate-700">
          <span className="font-medium">Subtotal Bruto:</span>
          <span className="font-bold text-slate-900">{formatCurrency(grossTotal)}</span>
        </div>

        {/* Campo de Desconto */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Desconto Aplicado (R$)</span>
            </label>
            {discountValue > 0 && !isDiscountInvalid && (
              <span className="text-[11px] font-medium text-emerald-600">
                -{formatCurrency(discountValue)}
              </span>
            )}
          </div>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register('discount', { valueAsNumber: true })}
            placeholder="0,00"
            className={`block w-full text-right rounded-lg border py-2 px-3 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 ${
              isDiscountInvalid || errors.discount
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30 text-red-900'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
            }`}
          />
          {isDiscountInvalid ? (
            <div className="mt-1.5 flex items-start space-x-1 text-xs text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>O desconto não pode ser superior ao subtotal bruto ({formatCurrency(grossTotal)}).</span>
            </div>
          ) : errors.discount ? (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.discount.message}</p>
          ) : null}
        </div>

        {/* Total Líquido Final */}
        <div className="rounded-xl bg-slate-900 p-4 text-white shadow-inner mt-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Total da Ordem de Serviço</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {formatCurrency(netTotal)}
          </div>
          {discountValue > 0 && !isDiscountInvalid && (
            <div className="mt-1 text-[11px] text-emerald-400">
              Economia de {formatCurrency(discountValue)} aplicada
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isDiscountInvalid}
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvando Ordem...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEditMode ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 text-slate-400" />
          Cancelar e Voltar
        </button>
      </div>
    </div>
  );
}
