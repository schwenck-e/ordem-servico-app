import React, { useState } from 'react';
import { Users, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types';

export const CustomersPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Reset to page 1 when search query changes
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useCustomers({
    page,
    limit,
    search: debouncedSearch,
  });

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const customers = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão cadastral, documentos e histórico de ordens de serviço vinculadas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
        />
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-800">
            Erro ao carregar clientes
          </h3>
          <p className="text-xs text-rose-600 mt-1">
            {error?.data?.message || error?.message || 'Falha na comunicação com o servidor.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-xs font-medium text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar Novamente
          </button>
        </div>
      ) : customers.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Nenhum cliente encontrado"
            description={`Não foram encontrados registros para a busca "${debouncedSearch}".`}
            action={
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Limpar filtro de busca
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Nenhum cliente cadastrado"
            description="Cadastre seu primeiro cliente para iniciar o gerenciamento de atendimentos."
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Cliente
              </button>
            }
          />
        )
      ) : (
        <div className="space-y-0">
          <CustomerTable customers={customers} onEdit={handleOpenEditModal} />
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="clientes"
            />
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customer={selectedCustomer}
      />
    </div>
  );
};
