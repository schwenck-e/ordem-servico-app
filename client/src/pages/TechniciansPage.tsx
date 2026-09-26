import React, { useState } from 'react';
import { Wrench, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TechnicianTable } from '@/components/technicians/TechnicianTable';
import { TechnicianModal } from '@/components/technicians/TechnicianModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useTechnicians } from '@/hooks/useTechnicians';
import type { Technician } from '@/types';

type StatusFilter = 'all' | 'active' | 'inactive';

export const TechniciansPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const debouncedSpecialty = useDebounce(specialtyInput, 350);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialtyInput(value);
    setPage(1);
  };

  const isActiveParam =
    statusFilter === 'active'
      ? true
      : statusFilter === 'inactive'
      ? false
      : undefined;

  const { data, isLoading, isError, error, refetch } = useTechnicians({
    page,
    limit,
    search: debouncedSearch,
    isActive: isActiveParam,
    specialty: debouncedSpecialty,
  });

  const handleOpenCreateModal = () => {
    setSelectedTechnician(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTechnician(null);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setSpecialtyInput('');
    setPage(1);
  };

  const technicians = data?.data || [];
  const meta = data?.meta;
  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter !== 'all' || debouncedSpecialty
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Técnicos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão da equipe técnica, especialidades e disponibilidade operacional.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Técnico
        </button>
      </div>

      {/* Filter / Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full sm:w-72"
          />

          <input
            type="text"
            value={specialtyInput}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            placeholder="Filtrar por especialidade..."
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-sm w-full sm:w-56"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start lg:self-auto">
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ativos
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('inactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'inactive'
                ? 'bg-white text-slate-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inativos
          </button>
        </div>
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
            Erro ao carregar técnicos
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
      ) : technicians.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Wrench className="w-6 h-6" />}
            title="Nenhum técnico encontrado"
            description="Não encontramos técnicos correspondentes aos filtros aplicados."
            action={
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Limpar todos os filtros
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<Wrench className="w-6 h-6" />}
            title="Nenhum técnico cadastrado"
            description="Cadastre os membros da sua equipe técnica para atribuir e gerenciar atendimentos."
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Técnico
              </button>
            }
          />
        )
      ) : (
        <div className="space-y-0">
          <TechnicianTable
            technicians={technicians}
            onEdit={handleOpenEditModal}
          />
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="técnicos"
            />
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <TechnicianModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        technician={selectedTechnician}
      />
    </div>
  );
};
