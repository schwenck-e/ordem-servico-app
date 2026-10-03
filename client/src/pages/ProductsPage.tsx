import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  ArrowUpDown,
  History,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductTable } from '@/components/stock/ProductTable';
import { ProductModal } from '@/components/stock/ProductModal';
import { StockMovementModal } from '@/components/stock/StockMovementModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts, useLowStockProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

export const ProductsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const limit = 10;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Queries
  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit,
    search: debouncedSearch,
  });

  const { data: lowStockItems = [] } = useLowStockProducts();

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleOpenCreateProduct = () => {
    setSelectedProductForEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsProductModalOpen(true);
  };

  const handleOpenMovementModal = (product?: Product) => {
    setSelectedProductForMovement(product || null);
    setIsMovementModalOpen(true);
  };

  const rawProducts = data?.data || [];
  const meta = data?.meta;

  // Filtragem em memória se o usuário marcar "Apenas estoque baixo"
  const displayedProducts = useMemo(() => {
    if (!onlyLowStock) return rawProducts;
    return rawProducts.filter((p) => p.currentStock <= p.minStock);
  }, [rawProducts, onlyLowStock]);

  // Estatísticas resumidas do catálogo
  const totalItemsCount = meta?.total ?? rawProducts.length;
  const criticalCount = lowStockItems.length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Controle de Estoque e Peças
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão do catálogo de peças e componentes, saldos físicos e movimentações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/stock/movements"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Histórico de Movimentações</span>
          </Link>

          <button
            type="button"
            onClick={() => handleOpenMovementModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>Nova Movimentação</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Total de Produtos
            </span>
            <span className="text-xl font-bold text-slate-900">
              {totalItemsCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              criticalCount > 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {criticalCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Estoque Crítico / Baixo
            </span>
            <span
              className={`text-xl font-bold ${
                criticalCount > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {criticalCount} {criticalCount === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Status do Almoxarifado
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {criticalCount === 0
                ? 'Níveis regulares'
                : `${criticalCount} requer(em) reposição`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar por SKU, nome ou descrição..."
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              onlyLowStock
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Apenas Estoque Baixo</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <TableSkeleton rows={5} columns={8} />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-800">
            Erro ao carregar catálogo de produtos
          </h3>
          <p className="text-xs text-rose-600 mt-1">
            {error?.data?.message ||
              error?.message ||
              'Falha na comunicação com o servidor.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-xs font-medium text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      ) : displayedProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6 text-slate-400" />}
          title={
            searchInput
              ? 'Nenhum produto encontrado'
              : onlyLowStock
              ? 'Nenhum produto com estoque baixo'
              : 'Nenhum produto cadastrado'
          }
          description={
            searchInput
              ? `Não foram encontrados produtos correspondentes a "${searchInput}".`
              : onlyLowStock
              ? 'Todos os produtos cadastrados estão com níveis de estoque confortáveis.'
              : 'Cadastre peças e componentes para habilitar a gestão de estoque e seleção em Ordens de Serviço.'
          }
          action={
            searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Limpar busca
              </button>
            ) : onlyLowStock ? (
              <button
                type="button"
                onClick={() => setOnlyLowStock(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Ver todos os produtos
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Produto
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <ProductTable
            products={displayedProducts}
            onEdit={handleOpenEditProduct}
            onMoveStock={handleOpenMovementModal}
          />

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="produtos"
            />
          )}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductForEdit(null);
        }}
        product={selectedProductForEdit}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedProductForMovement(null);
        }}
        product={selectedProductForMovement}
      />
    </div>
  );
};
