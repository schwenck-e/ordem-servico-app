import React, { useState } from 'react';
import { Edit2, Trash2, Mail, Phone, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { maskPhone } from '@/lib/masks';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useDeleteTechnician } from '@/hooks/useTechnicians';
import { useToast } from '@/hooks/useToast';
import type { Technician } from '@/types';

interface TechnicianTableProps {
  technicians: Technician[];
  onEdit: (technician: Technician) => void;
}

export const TechnicianTable: React.FC<TechnicianTableProps> = ({ technicians, onEdit }) => {
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null);
  const deleteMutation = useDeleteTechnician();
  const toast = useToast();

  const handleDeleteConfirm = async () => {
    if (!technicianToDelete) return;

    try {
      await deleteMutation.mutateAsync(technicianToDelete.id);
      toast.success(`Técnico "${technicianToDelete.name}" excluído com sucesso!`);
      setTechnicianToDelete(null);
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error(
          err?.data?.message ||
            'Não é possível excluir um técnico com ordens de serviço ativas. Considere inativá-lo na edição.'
        );
      } else {
        toast.error(err?.data?.message || err?.message || 'Erro ao excluir técnico.');
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">Técnico</th>
              <th scope="col" className="px-6 py-3.5">Especialidade</th>
              <th scope="col" className="px-6 py-3.5">Contato</th>
              <th scope="col" className="px-6 py-3.5 text-center">Status</th>
              <th scope="col" className="px-6 py-3.5 text-center">O.S. Vinculadas</th>
              <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {technicians.map((technician) => {
              const isActive = technician.isActive ?? technician.active ?? true;
              const osCount = technician._count?.workOrders || 0;

              return (
                <tr key={technician.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Nome */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{technician.name}</div>
                  </td>

                  {/* Especialidade */}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      <span>{technician.specialty}</span>
                    </div>
                  </td>

                  {/* Contato */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{maskPhone(technician.phone)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{technician.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <Badge variant={isActive ? 'success' : 'neutral'}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>

                  {/* Contagem de OS */}
                  <td className="px-6 py-4 text-center">
                    <Badge variant={osCount > 0 ? 'info' : 'neutral'}>
                      {osCount} {osCount === 1 ? 'ordem' : 'ordens'}
                    </Badge>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(technician)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar técnico"
                        aria-label={`Editar ${technician.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTechnicianToDelete(technician)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir técnico"
                        aria-label={`Excluir ${technician.name}`}
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
        isOpen={Boolean(technicianToDelete)}
        onClose={() => setTechnicianToDelete(null)}
        title="Confirmar Exclusão"
        description="Esta ação removerá permanentemente o técnico do sistema."
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setTechnicianToDelete(null)}
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
              Excluir Definitivamente
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
              Tem certeza que deseja excluir o técnico{' '}
              <strong className="text-slate-900">{technicianToDelete?.name}</strong>?
            </p>
            {technicianToDelete?._count?.workOrders ? (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                Aviso: Este técnico possui {technicianToDelete._count.workOrders} ordem(ns) de serviço vinculada(s). Se houver ordens ativas, a exclusão será bloqueada e será recomendado inativá-lo.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
};
