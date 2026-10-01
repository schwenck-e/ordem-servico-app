import React, { useState } from 'react';
import { UserCheck, Plus, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { UserTable } from '@/components/users/UserTable';
import { UserModal } from '@/components/users/UserModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers } from '@/hooks/useUsers';
import type { User, UserRole } from '@/types';

export const UsersPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as UserRole | '');
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    limit,
    search: debouncedSearch,
    role: selectedRole ? (selectedRole as UserRole) : undefined,
  });

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const users = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Usuários e Colaboradores
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Shield className="w-3 h-3" />
              Gestão ADMIN
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Controle de perfis de acesso, credenciais e colaboradores ativos no sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Buscar por nome ou e-mail..."
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">Todos os perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="OPERATOR">Operador</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <TableSkeleton rows={5} columns={5} />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-800">
            Erro ao carregar colaboradores
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
      ) : users.length === 0 ? (
        debouncedSearch || selectedRole ? (
          <EmptyState
            icon={<UserCheck className="w-6 h-6" />}
            title="Nenhum usuário encontrado"
            description="Não foram encontrados colaboradores com os filtros aplicados."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSelectedRole('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Limpar filtros de busca
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<UserCheck className="w-6 h-6" />}
            title="Nenhum colaborador cadastrado"
            description="Cadastre colaboradores para atribuir permissões operacionais e administrativas."
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Usuário
              </button>
            }
          />
        )
      ) : (
        <div className="space-y-0">
          <UserTable users={users} onEdit={handleOpenEditModal} />
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="usuários"
            />
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />
    </div>
  );
};
