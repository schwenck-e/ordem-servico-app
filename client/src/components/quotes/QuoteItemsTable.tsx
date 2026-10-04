import React from 'react';
import {
  useFieldArray,
  Control,
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { ProductItemSelector } from '@/components/work-orders/form/ProductItemSelector';
import type { QuoteFormData } from '@/schemas/quote.schema';

interface QuoteItemsTableProps {
  control: Control<QuoteFormData>;
  register: UseFormRegister<QuoteFormData>;
  errors: FieldErrors<QuoteFormData>;
  watch: UseFormWatch<QuoteFormData>;
  setValue: UseFormSetValue<QuoteFormData>;
}

export const QuoteItemsTable: React.FC<QuoteItemsTableProps> = ({
  control,
  register,
  errors,
  watch,
  setValue,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items') || [];

  const handleAddItem = () => {
    append({
      productId: null,
      type: 'SERVICE',
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-800">Itens da Proposta (Serviços e Peças)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Discrimine a mão de obra prevista e componentes/peças com vínculo ao catálogo ou avulsas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center justify-center rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Adicionar Item
        </button>
      </div>

      {errors.items?.message && (
        <div className="flex items-center gap-1.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errors.items.message}</span>
        </div>
      )}

      {/* Tabela de Itens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pl-2 pr-3 w-32">Tipo</th>
              <th className="py-2.5 px-3 min-w-[240px]">Descrição / Peça</th>
              <th className="py-2.5 px-3 w-24 text-center">Qtd</th>
              <th className="py-2.5 px-3 w-36 text-right">Valor Unit. (R$)</th>
              <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
              <th className="py-2.5 pl-3 pr-2 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, index) => {
              const currentItem = watchedItems[index];
              const itemType = currentItem?.type || 'SERVICE';
              const qty = Number(currentItem?.quantity) || 0;
              const price = Number(currentItem?.unitPrice) || 0;
              const subtotal = Math.max(0, qty * price);

              const itemError = errors.items?.[index];

              return (
                <tr key={field.id} className="group hover:bg-slate-50/60 transition-colors">
                  {/* Tipo */}
                  <td className="py-2.5 pl-2 pr-3 align-top">
                    <select
                      {...register(`items.${index}.type`)}
                      onChange={(e) => {
                        const newType = e.target.value as 'SERVICE' | 'PART';
                        setValue(`items.${index}.type`, newType, { shouldValidate: true, shouldDirty: true });
                        if (newType === 'SERVICE') {
                          setValue(`items.${index}.productId`, null, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="SERVICE">Serviço</option>
                      <option value="PART">Peça</option>
                    </select>
                    {itemError?.type && (
                      <p className="mt-0.5 text-[11px] text-red-600">{itemError.type.message}</p>
                    )}
                  </td>

                  {/* Descrição / Seletor de Peça */}
                  <td className="py-2.5 px-3 align-top">
                    {itemType === 'PART' ? (
                      <ProductItemSelector
                        productId={currentItem?.productId}
                        currentDescription={currentItem?.description || ''}
                        quantity={qty}
                        onSelectProduct={(product) => {
                          setValue(`items.${index}.productId`, product.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setValue(`items.${index}.description`, product.name, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setValue(`items.${index}.unitPrice`, product.salePrice, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        onClearProduct={() => {
                          setValue(`items.${index}.productId`, null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        registerDescriptionProps={register(`items.${index}.description`)}
                        error={itemError?.description?.message}
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          {...register(`items.${index}.description`)}
                          placeholder="Ex: Troca de pastilha, Revisão de motor..."
                          className={`block w-full rounded-md border py-1.5 px-2.5 text-xs shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                            itemError?.description
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                          }`}
                        />
                        {itemError?.description && (
                          <p className="mt-0.5 text-[11px] text-red-600">{itemError.description.message}</p>
                        )}
                      </>
                    )}
                  </td>

                  {/* Quantidade */}
                  <td className="py-2.5 px-3 align-top">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className={`block w-full text-center rounded-md border py-1.5 px-2 text-xs shadow-sm transition focus:outline-none focus:ring-1 ${
                        itemError?.quantity
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                      }`}
                    />
                    {itemError?.quantity && (
                      <p className="mt-0.5 text-[11px] text-red-600">{itemError.quantity.message}</p>
                    )}
                  </td>

                  {/* Preço Unitário */}
                  <td className="py-2.5 px-3 align-top">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      className={`block w-full text-right rounded-md border py-1.5 px-2 text-xs shadow-sm transition focus:outline-none focus:ring-1 ${
                        itemError?.unitPrice
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                      }`}
                    />
                    {itemError?.unitPrice && (
                      <p className="mt-0.5 text-[11px] text-red-600">{itemError.unitPrice.message}</p>
                    )}
                  </td>

                  {/* Subtotal */}
                  <td className="py-2.5 px-3 align-middle text-right font-semibold text-slate-800 text-xs">
                    {formatCurrency(subtotal)}
                  </td>

                  {/* Ação Remover */}
                  <td className="py-2.5 pl-3 pr-2 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      title={fields.length <= 1 ? 'O orçamento deve ter ao menos 1 item' : 'Remover item'}
                      className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
