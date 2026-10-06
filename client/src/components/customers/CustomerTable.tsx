import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Mail, Phone, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { maskDocument, maskPhone } from '@/lib/masks';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useDeleteCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';
import type { Customer } from '@/types';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onEdit }) => {
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const deleteMutation = useDeleteCustomer();
  const toast = useToast();

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await deleteMutation.mutateAsync(customerToDelete.id);
      toast.success(`Cliente "${customerToDelete.name}" excluído com sucesso!`);
      setCustomerToDelete(null);
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error(
          err?.data?.message ||
            'Não é possível excluir um cliente que possui ordens de serviço vinculadas.'
        );
      } else {
        toast.error(err?.data?.message || err?.message || 'Erro ao excluir cliente.');
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">Cliente</th>
              <th scope="col" className="px-6 py-3.5">CPF / CNPJ</th>
              <th scope="col" className="px-6 py-3.5">Contato</th>
              <th scope="col" className="px-6 py-3.5">Endereço</th>
              <th scope="col" className="px-6 py-3.5 text-center">O.S. Vinculadas</th>
              <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {customers.map((customer) => {
              const osCount = customer._count?.workOrders || 0;

              return (
                <tr key={customer.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Nome */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{customer.name}</div>
                  </td>

                  {/* CPF/CNPJ */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {maskDocument(customer.document)}
                  </td>

                  {/* Contato */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{maskPhone(customer.phone)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{customer.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Endereço */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  </td>

                  {/* Contagem de OS */}
                  <td className="px-6 py-4 text-center">
                    {osCount > 0 ? (
                      <Link
                        to={`/work-orders?search=${encodeURIComponent(customer.name)}`}
                        className="inline-flex transition-transform hover:scale-105"
                        title={`Visualizar as ${osCount} ordens de serviço deste cliente`}
                      >
                        <Badge variant="info" className="hover:bg-sky-100 hover:border-sky-300 transition-colors cursor-pointer">
                          {osCount} {osCount === 1 ? 'ordem' : 'ordens'}
                        </Badge>
                      </Link>
                    ) : (
                      <Badge variant="neutral">
                        0 ordens
                      </Badge>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar cliente"
                        aria-label={`Editar ${customer.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerToDelete(customer)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir cliente"
                        aria-label={`Excluir ${customer.name}`}
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
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        title="Confirmar Exclusão"
        description="Esta ação removerá permanentemente o cliente do sistema."
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCustomerToDelete(null)}
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
              Tem certeza que deseja excluir o cliente{' '}
              <strong className="text-slate-900">{customerToDelete?.name}</strong>?
            </p>
            {customerToDelete?._count?.workOrders ? (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                Atenção: Este cliente possui {customerToDelete._count.workOrders} ordem(ns) de serviço vinculada(s). A exclusão será bloqueada pela regra de integridade.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
};
