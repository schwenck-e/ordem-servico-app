import React, { useState } from 'react';
import { Package, AlertCircle, Search, X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '@/types';

interface ProductItemSelectorProps {
  productId?: string | null;
  currentDescription: string;
  quantity: number;
  onSelectProduct: (product: Product) => void;
  onClearProduct: () => void;
  error?: string;
  registerDescriptionProps: any;
}

export const ProductItemSelector: React.FC<ProductItemSelectorProps> = ({
  productId,
  currentDescription,
  quantity,
  onSelectProduct,
  onClearProduct,
  error,
  registerDescriptionProps,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualMode, setIsManualMode] = useState(!productId && currentDescription.length > 0);

  const { data: productsData, isLoading } = useProducts({
    limit: 100,
    search: searchTerm,
  });

  const products = productsData?.data || [];
  const selectedProduct = products.find((p) => p.id === productId);

  const isInsufficient = selectedProduct && quantity > selectedProduct.currentStock;

  // Se o usuário optou por digitar uma peça avulsa manualmente
  if (isManualMode && !productId) {
    return (
      <div className="space-y-1">
        <div className="relative">
          <input
            type="text"
            {...registerDescriptionProps}
            placeholder="Descrição da peça avulsa (não cadastrada no estoque)..."
            className={`block w-full rounded-md border py-1.5 px-2.5 text-xs shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-amber-600 font-medium">Peça avulsa (sem baixa em estoque)</span>
          <button
            type="button"
            onClick={() => {
              setIsManualMode(false);
              setIsOpen(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Buscar no Catálogo
          </button>
        </div>
      </div>
    );
  }

  // Se um produto já estiver selecionado
  if (productId) {
    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between rounded-md border p-2 text-xs transition-colors ${
            isInsufficient
              ? 'border-rose-300 bg-rose-50/60'
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Package
              className={`w-4 h-4 shrink-0 ${
                isInsufficient ? 'text-rose-500' : 'text-indigo-600'
              }`}
            />
            <div className="truncate">
              <span className="font-semibold text-slate-800 block truncate">
                {currentDescription}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                {selectedProduct?.sku && (
                  <span className="font-mono">SKU: {selectedProduct.sku}</span>
                )}
                <span>•</span>
                <span
                  className={`font-medium ${
                    isInsufficient ? 'text-rose-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  Saldo: {selectedProduct ? `${selectedProduct.currentStock} ${selectedProduct.unit}` : '-'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClearProduct();
              setIsManualMode(false);
              setIsOpen(true);
            }}
            title="Alterar ou desvincular peça"
            className="ml-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alerta de saldo insuficiente */}
        {isInsufficient && selectedProduct && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Estoque insuficiente (Saldo disponível: {selectedProduct.currentStock} {selectedProduct.unit}).
            </span>
          </div>
        )}
      </div>
    );
  }

  // Se nenhum produto estiver selecionado, exibir combobox/dropdown
  return (
    <div className="relative space-y-1">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            readOnly
            value={currentDescription}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="Clique para selecionar uma peça do estoque..."
            className={`block w-full cursor-pointer rounded-md border py-1.5 pl-2.5 pr-8 text-xs shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={() => setIsManualMode(true)}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap px-1.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
          title="Permite digitar uma peça não cadastrada no catálogo"
        >
          Avulsa
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <div className="mb-2 relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por SKU ou nome..."
                className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  Carregando peças...
                </div>
              ) : products.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  Nenhuma peça encontrada.
                </div>
              ) : (
                products.map((p) => {
                  const hasStock = p.currentStock > 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-slate-50 rounded flex items-center justify-between transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-xs text-slate-800 block truncate">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono">SKU: {p.sku}</span>
                          <span>•</span>
                          <span
                            className={
                              hasStock ? 'text-emerald-600 font-medium' : 'text-rose-600 font-bold'
                            }
                          >
                            Saldo: {p.currentStock} {p.unit}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {formatCurrency(p.salePrice)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(true);
                  setIsOpen(false);
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Cadastrar peça avulsa não catalogada
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
