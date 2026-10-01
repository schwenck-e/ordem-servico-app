import React, { useState } from 'react';
import { Edit2, Trash2, Mail, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/formatters';
import type { User } from '@/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit }) => {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const deleteMutation = useDeleteUser();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    if (currentUser?.id === userToDelete.id) {
      toast.error('Você não pode excluir sua própria conta de administrador.');
      setUserToDelete(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      toast.success(`Usuário "${userToDelete.name}" removido com sucesso!`);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Erro ao remover usuário.');
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">Colaborador</th>
              <th scope="col" className="px-6 py-3.5">Papel / Perfil</th>
              <th scope="col" className="px-6 py-3.5 text-center">Status</th>
              <th scope="col" className="px-6 py-3.5">Cadastrado em</th>
              <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => {
              const isSelf = currentUser?.id === user.id;
              const initials = user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Nome e E-mail */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {user.name}
                          {isSelf && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Papel */}
                  <td className="px-6 py-4">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Operador
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>

                  {/* Data de Criação */}
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar usuário"
                        aria-label={`Editar ${user.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelf
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                        aria-label={`Excluir ${user.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Exclusão de Usuário"
        description="Esta ação removerá o acesso do colaborador ao sistema."
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setUserToDelete(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Excluir Usuário
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-700">
              Tem certeza que deseja excluir o usuário{' '}
              <strong className="text-slate-900">{userToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              O colaborador perderá o acesso imediato à plataforma.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
