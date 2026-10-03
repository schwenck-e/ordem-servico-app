import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useToast } from '@/hooks/useToast';
import {
  createProductFormSchema,
  ProductFormData,
} from '@/schemas/product.schema';
import type { Product } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const isEditing = Boolean(product);
  const toast = useToast();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      unit: 'UN',
      costPrice: 0,
      salePrice: 0,
      initialStock: 0,
      minStock: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          unit: product.unit || 'UN',
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          initialStock: product.currentStock, // Used only as reference in form state
          minStock: product.minStock,
        });
      } else {
        reset({
          sku: '',
          name: '',
          description: '',
          unit: 'UN',
          costPrice: 0,
          salePrice: 0,
          initialStock: 0,
          minStock: 0,
        });
      }
    }
  }, [isOpen, product, reset]);

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('sku', e.target.value.toUpperCase(), { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          data: {
            sku: data.sku,
            name: data.name,
            description: data.description || null,
            unit: data.unit,
            costPrice: data.costPrice,
            salePrice: data.salePrice,
            minStock: data.minStock,
          },
        });
        toast.success(`Produto "${data.name}" atualizado com sucesso!`);
      } else {
        await createMutation.mutateAsync({
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          unit: data.unit,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          initialStock: data.initialStock,
          minStock: data.minStock,
        });
        toast.success(`Produto "${data.name}" cadastrado com sucesso!`);
      }
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Erro ao salvar produto.';
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Produto' : 'Novo Produto'}
      description={
        isEditing
          ? 'Atualize as informações cadastrais e valores do produto.'
          : 'Cadastre um novo item ou peça para controle de estoque.'
      }
      maxWidth="lg"
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>{isEditing ? 'Atualizar Produto' : 'Cadastrar Produto'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* SKU e Unidade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Código / SKU <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('sku')}
              onChange={handleSkuChange}
              placeholder="Ex: SSD-1TB-NVME"
              className="w-full px-3 py-2 uppercase bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-rose-500">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Unidade <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('unit')}
              placeholder="UN, PC, KG, MT"
              className="w-full px-3 py-2 uppercase bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.unit && (
              <p className="mt-1 text-xs text-rose-500">{errors.unit.message}</p>
            )}
          </div>
        </div>

        {/* Nome do Produto */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nome do Produto / Peça <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="Ex: SSD Kingston NV2 1TB M.2 2280 NVMe"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
          )}
        </div>

        {/* Preço de Custo e Preço de Venda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preço de Custo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('costPrice', { valueAsNumber: true })}
              placeholder="0,00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.costPrice && (
              <p className="mt-1 text-xs text-rose-500">{errors.costPrice.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preço de Venda (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('salePrice', { valueAsNumber: true })}
              placeholder="0,00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.salePrice && (
              <p className="mt-1 text-xs text-rose-500">{errors.salePrice.message}</p>
            )}
          </div>
        </div>

        {/* Estoque Inicial (apenas criação) e Estoque Mínimo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estoque Inicial
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('initialStock', { valueAsNumber: true })}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {errors.initialStock && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.initialStock.message}
                </p>
              )}
              <span className="text-[11px] text-slate-500">
                Gera movimentação de balanço inicial automaticamente.
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Saldo Atual em Estoque
              </label>
              <input
                type="text"
                disabled
                value={product ? `${product.currentStock} ${product.unit}` : ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500">
                Para alterar o saldo, utilize o botão "Movimentar Estoque".
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estoque Mínimo (Alerta)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              {...register('minStock', { valueAsNumber: true })}
              placeholder="0"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.minStock && (
              <p className="mt-1 text-xs text-rose-500">{errors.minStock.message}</p>
            )}
            <span className="text-[11px] text-slate-500">
              Sinaliza alerta quando o saldo for menor ou igual a este valor.
            </span>
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descrição / Especificações
          </label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder="Detalhes técnicos, compatibilidade, número de peça do fabricante..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500">
              {errors.description.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};
