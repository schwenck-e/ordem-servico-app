import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Cpu,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  ArrowRightLeft,
  Loader2,
  Package,
  Edit2,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusBadge, PriorityBadge, Badge } from '@/components/common/Badge';
import { useWorkOrder } from '@/hooks/useWorkOrders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskPhone } from '@/lib/masks';
import type { WorkOrderSummary } from '@/types';

interface WorkOrderQuickViewModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal: (order: WorkOrderSummary) => void;
}

export const WorkOrderQuickViewModal: React.FC<WorkOrderQuickViewModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onOpenStatusModal,
}) => {
  const { data: order, isLoading, isError } = useWorkOrder(orderId || undefined);

  if (!isOpen) return null;

  const isTerminal = order?.status === 'COMPLETED' || order?.status === 'CANCELED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? `Detalhes da O.S. — ${order.orderNumber}` : 'Carregando O.S...'}
      description="Visualização rápida das informações operacionais, financeiras e cadastrais."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {order && (
              <Link
                to={`/work-orders/${order.id}/edit`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-slate-500" />
                Editar Ordem Completa
              </Link>
            )}

            {order && !isTerminal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStatusModal(order);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Alterar Status
              </button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-xs">Carregando dados da ordem de serviço...</p>
        </div>
      ) : isError || !order ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          Erro ao carregar detalhes da ordem de serviço.
        </div>
      ) : (
        <div className="space-y-5 text-xs text-slate-700">
          {/* Header Badges and Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Aberta em: {formatDateTime(order.createdAt)}</span>
            </div>
          </div>

          {/* Grid: Customer & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs border-b border-slate-100 pb-1.5">
                <User className="w-4 h-4 text-brand-600" />
                Dados do Cliente
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-medium text-slate-900">{order.customer.name}</p>
                <p className="text-slate-500">Telefone: {maskPhone(order.customer.phone)}</p>
                <p className="text-slate-500">E-mail: {order.customer.email}</p>
              </div>
            </div>

            {/* Equipment Box */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs border-b border-slate-100 pb-1.5">
                <Cpu className="w-4 h-4 text-brand-600" />
                Equipamento
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-medium text-slate-900">{order.equipment}</p>
                <p className="text-slate-500">
                  Nº de Série: {order.serialNumber || 'Não informado'}
                </p>
                {order.scheduledDate && (
                  <p className="text-slate-500">
                    Agendado para: {formatDate(order.scheduledDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Defect and Diagnosis */}
          <div className="space-y-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Defeito Relatado:
              </span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                {order.reportedDefect}
              </p>
            </div>

            {order.technicalDiagnosis && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 text-emerald-800">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Laudo / Diagnóstico Técnico:
                </span>
                <p className="text-slate-700 bg-emerald-50/50 p-2.5 rounded border border-emerald-100 leading-relaxed">
                  {order.technicalDiagnosis}
                </p>
              </div>
            )}
          </div>

          {/* Technician Assignment */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-500 block text-[11px]">Técnico Responsável</span>
                <span className="font-medium text-slate-900">
                  {order.technician ? order.technician.name : 'Nenhum técnico atribuído'}
                </span>
              </div>
            </div>
            {order.technician && (
              <Badge variant="neutral">
                {order.technician.specialty || 'Técnico Especialista'}
              </Badge>
            )}
          </div>

          {/* Items Table if available */}
          {order.items && order.items.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 font-semibold text-xs text-slate-700">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                Itens e Serviços da O.S. ({order.items.length})
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2 text-center">Qtd</th>
                    <th className="px-3 py-2 text-right">Unitário</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <Badge variant={item.type === 'SERVICE' ? 'info' : 'warning'}>
                          {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-800">{item.description}</td>
                      <td className="px-3 py-2 text-center text-slate-600 font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900 font-mono">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Resumo Financeiro
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 mr-1">Serviços:</span>
                <span className="text-slate-700">{formatCurrency(order.totalServices)}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">Peças:</span>
                <span className="text-slate-700">{formatCurrency(order.totalParts)}</span>
              </div>
              {order.discount > 0 && (
                <div>
                  <span className="text-rose-500 mr-1">Desconto:</span>
                  <span className="text-rose-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pl-2 border-l border-slate-300">
                <span className="text-slate-500 font-sans mr-1">Total:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
