import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useDeleteProduct } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onMoveStock: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onMoveStock,
}) => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const deleteMutation = useDeleteProduct();
  const { user } = useAuth();
  const toast = useToast();

  const isAdmin = user?.role === 'ADMIN';

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      toast.success(`Produto "${productToDelete.name}" excluído com sucesso!`);
      setProductToDelete(null);
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error(
          err?.data?.message ||
            'Não é possível excluir este produto pois existem movimentações de estoque ou ordens de serviço vinculadas a ele.'
        );
      } else {
        toast.error(
          err?.data?.message || err?.message || 'Erro ao excluir produto.'
        );
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Produto / Peça
              </th>
              <th scope="col" className="px-6 py-3.5">
                SKU / Unidade
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Preço de Custo
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Preço de Venda
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Saldo Atual
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Mínimo
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((product) => {
              const isZeroStock = product.currentStock === 0;
              const isLowStock =
                product.currentStock > 0 &&
                product.currentStock <= product.minStock;

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/75 transition-colors"
                >
                  {/* Nome e Descrição */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SKU e Unidade */}
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-semibold text-slate-700">
                      {product.sku}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Unidade: {product.unit}
                    </div>
                  </td>

                  {/* Preço de Custo */}
                  <td className="px-6 py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatCurrency(product.costPrice)}
                  </td>

                  {/* Preço de Venda */}
                  <td className="px-6 py-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                    {formatCurrency(product.salePrice)}
                  </td>

                  {/* Saldo Atual */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block font-bold text-sm ${
                        isZeroStock
                          ? 'text-rose-600'
                          : isLowStock
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {product.currentStock} {product.unit}
                    </span>
                  </td>

                  {/* Estoque Mínimo */}
                  <td className="px-6 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                    {product.minStock} {product.unit}
                  </td>

                  {/* Status do Estoque */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {isZeroStock ? (
                      <Badge variant="danger">Zerado</Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning">Estoque Baixo</Badge>
                    ) : (
                      <Badge variant="success">Normal</Badge>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onMoveStock(product)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Movimentar Estoque"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirmar Exclusão de Produto"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Sim, Excluir</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-full text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir o produto{' '}
              <strong className="text-slate-900">
                {productToDelete?.name}
              </strong>{' '}
              (SKU: {productToDelete?.sku})?
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Esta ação só será permitida se o item não possuir movimentações de
              estoque ou ordens de serviço associadas.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
