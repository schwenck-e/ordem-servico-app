import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateStockMovement, useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/useToast';
import {
  createStockMovementFormSchema,
  StockMovementFormData,
} from '@/schemas/product.schema';
import type { Product, StockMovementType } from '@/types';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
}) => {
  const toast = useToast();
  const createMovementMutation = useCreateStockMovement();
  const isSubmitting = createMovementMutation.isPending;

  // Se nenhum produto for passado diretamente, buscar lista de produtos para seleção
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(createStockMovementFormSchema),
    defaultValues: {
      productId: '',
      type: 'IN',
      quantity: 1,
      unitPrice: null,
      reason: '',
    },
  });

  const selectedProductId = useWatch({ control, name: 'productId' });
  const movementType = useWatch({ control, name: 'type' }) as StockMovementType;
  const quantity = useWatch({ control, name: 'quantity' }) || 0;

  const currentProduct = initialProduct || products.find((p) => p.id === selectedProductId);
  const currentStock = currentProduct?.currentStock ?? 0;

  useEffect(() => {
    if (isOpen) {
      reset({
        productId: initialProduct ? initialProduct.id : '',
        type: 'IN',
        quantity: 1,
        unitPrice: initialProduct?.costPrice || null,
        reason: '',
      });
    }
  }, [isOpen, initialProduct, reset]);

  // Ao mudar o produto selecionado no dropdown, atualizar unitPrice padrão
  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setValue('productId', id, { shouldValidate: true });
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setValue('unitPrice', prod.costPrice || null);
    }
  };

  const onSubmit = async (data: StockMovementFormData) => {
    try {
      await createMovementMutation.mutateAsync({
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        unitPrice: data.unitPrice ?? undefined,
        reason: data.reason,
      });

      const typeLabel =
        data.type === 'IN'
          ? 'Entrada'
          : data.type === 'OUT'
          ? 'Saída'
          : 'Ajuste';

      toast.success(`Movimentação de ${typeLabel} registrada com sucesso!`);
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Erro ao registrar movimentação.';
      toast.error(message);
    }
  };

  // Cálculo do saldo previsto após movimentação
  let projectedStock: number | null = null;
  if (currentProduct) {
    if (movementType === 'IN') {
      projectedStock = currentStock + Number(quantity);
    } else if (movementType === 'OUT') {
      projectedStock = currentStock - Number(quantity);
    } else if (movementType === 'ADJUSTMENT') {
      projectedStock = Number(quantity);
    }
  }

  const isStockInsufficient = movementType === 'OUT' && Number(quantity) > currentStock;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Movimentar Estoque"
      description="Lance entradas, saídas ou correções de balanço para atualizar o saldo físico."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isStockInsufficient}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Confirmar Movimentação</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Produto */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Produto / Peça <span className="text-rose-500">*</span>
          </label>
          {initialProduct ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block text-sm">
                  {initialProduct.name}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  SKU: {initialProduct.sku}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Saldo Atual</span>
                <span className="text-sm font-bold text-slate-800">
                  {initialProduct.currentStock} {initialProduct.unit}
                </span>
              </div>
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={handleProductSelectChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">Selecione um produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Saldo: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p className="mt-1 text-xs text-rose-500">{errors.productId.message}</p>
          )}
        </div>

        {/* Tipo de Movimentação */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Movimentação <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setValue('type', 'IN', { shouldValidate: true })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                movementType === 'IN'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowDownLeft
                className={`w-5 h-5 mb-1 ${
                  movementType === 'IN' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('type', 'OUT', { shouldValidate: true })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                movementType === 'OUT'
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight
                className={`w-5 h-5 mb-1 ${
                  movementType === 'OUT' ? 'text-rose-600' : 'text-slate-400'
                }`}
              />
              <span>Saída</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('type', 'ADJUSTMENT', { shouldValidate: true })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                movementType === 'ADJUSTMENT'
                  ? 'bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw
                className={`w-5 h-5 mb-1 ${
                  movementType === 'ADJUSTMENT' ? 'text-sky-600' : 'text-slate-400'
                }`}
              />
              <span>Ajuste</span>
            </button>
          </div>
          {errors.type && (
            <p className="mt-1 text-xs text-rose-500">{errors.type.message}</p>
          )}
        </div>

        {/* Quantidade e Valor Unitário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantidade {currentProduct?.unit ? `(${currentProduct.unit})` : ''}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="1"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Valor Unitário de Custo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('unitPrice', {
                setValueAs: (v) => (v === '' || v === null ? null : parseFloat(v)),
              })}
              placeholder="Opcional"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.unitPrice && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.unitPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* Alerta de Estoque Insuficiente ou Projeção */}
        {currentProduct && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 ${
              isStockInsufficient
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {isStockInsufficient ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div>
              {isStockInsufficient ? (
                <div>
                  <span className="font-semibold block">Estoque Insuficiente!</span>
                  <span>
                    A quantidade solicitada ({quantity} {currentProduct.unit}) excede
                    o saldo atual ({currentStock} {currentProduct.unit}).
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-slate-500 block">
                    Saldo atual: {currentStock} {currentProduct.unit}
                  </span>
                  <span className="font-medium">
                    Novo saldo após lançamento:{' '}
                    <strong>
                      {projectedStock} {currentProduct.unit}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivo da Movimentação */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Motivo / Justificativa <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('reason')}
            placeholder="Ex: Compra NF 1234, Perda por dano, Inventário mensal"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-rose-500">{errors.reason.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};
