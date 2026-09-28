import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Check, Loader2, ArrowRight, Wrench, FileText, MessageSquare } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { useUpdateWorkOrderStatus } from '@/hooks/useWorkOrders';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useToast } from '@/hooks/useToast';
import type { WorkOrderSummary, WorkOrder, WorkOrderStatus } from '@/types';

export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELED'],
  WAITING_APPROVAL: ['IN_PROGRESS', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
};

interface WorkOrderStatusModalProps {
  order: WorkOrderSummary | WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderStatusModal: React.FC<WorkOrderStatusModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [targetStatus, setTargetStatus] = useState<WorkOrderStatus | null>(null);
  const [technicianId, setTechnicianId] = useState<string>('');
  const [technicalDiagnosis, setTechnicalDiagnosis] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateStatusMutation = useUpdateWorkOrderStatus();
  const toast = useToast();

  const { data: techniciansData, isLoading: isLoadingTechs } = useTechnicians({
    isActive: true,
    limit: 100,
  });
  const technicians = techniciansData?.data || [];

  // Reset form when modal opens or order changes
  useEffect(() => {
    if (order && isOpen) {
      const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
      setTargetStatus(allowed.length > 0 ? allowed[0] : null);
      setTechnicianId(order.technicianId || '');
      setTechnicalDiagnosis(order.technicalDiagnosis || '');
      setComment('');
      setErrorMsg(null);
    }
  }, [order, isOpen]);

  if (!order) return null;

  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELED';
  const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];

  const handleStatusSelect = (status: WorkOrderStatus) => {
    setTargetStatus(status);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setErrorMsg(null);

    // Frontend validation mirroring business rules
    if (targetStatus === 'IN_PROGRESS') {
      const finalTechId = technicianId || order.technicianId;
      if (!finalTechId) {
        setErrorMsg('É obrigatório atribuir um técnico responsável para iniciar o atendimento.');
        return;
      }
    }

    if (targetStatus === 'COMPLETED') {
      const finalDiagnosis = technicalDiagnosis.trim() || order.technicalDiagnosis?.trim();
      if (!finalDiagnosis) {
        setErrorMsg('Diagnóstico técnico é obrigatório para concluir a ordem de serviço.');
        return;
      }
    }

    if (targetStatus === 'WAITING_PARTS') {
      if (!comment.trim()) {
        setErrorMsg('É obrigatório informar as peças pendentes / justificativa ao colocar a OS em espera.');
        return;
      }
    }

    if (targetStatus === 'CANCELED') {
      if (!comment.trim()) {
        setErrorMsg('É obrigatório informar uma justificativa para o cancelamento da ordem de serviço.');
        return;
      }
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        data: {
          status: targetStatus,
          technicianId: technicianId || undefined,
          technicalDiagnosis: technicalDiagnosis.trim() || undefined,
          comment: comment.trim() || undefined,
        },
      });

      toast.success(`Status da OS ${order.orderNumber} alterado para "${STATUS_LABELS[targetStatus]}"!`);
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Falha ao alterar o status da ordem de serviço.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alterar Status — ${order.orderNumber}`}
      description="Gerencie a transição da ordem de serviço respeitando a máquina de estados."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          {!isTerminal && allowedTransitions.length > 0 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending || !targetStatus}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Transição
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current State Info */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Status Atual:</span>
            <span className="text-slate-700 text-sm font-semibold">{STATUS_LABELS[order.status]}</span>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Terminal State Warning */}
        {isTerminal ? (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Ordem de Serviço em Estado Terminal</p>
              <p>
                Esta ordem de serviço já foi {order.status === 'COMPLETED' ? 'concluída' : 'cancelada'}.
                Ordens em estados terminais não podem sofrer novas alterações de status.
              </p>
            </div>
          </div>
        ) : allowedTransitions.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
            Nenhuma transição permitida a partir do status atual.
          </div>
        ) : (
          <>
            {/* Target Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Selecione o Próximo Status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allowedTransitions.map((status) => {
                  const isSelected = targetStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusSelect(status)}
                      className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-brand-900 font-semibold' : 'text-slate-700'}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <StatusBadge status={status} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Conditional Field: Technician Assignment for IN_PROGRESS */}
            {targetStatus === 'IN_PROGRESS' && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  Técnico Responsável {(!order.technicianId && !technicianId) && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  disabled={isLoadingTechs}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">
                    {order.technicianId ? '-- Manter técnico atual --' : '-- Selecione um técnico obrigatório --'}
                  </option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.specialty ? `(${t.specialty})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {order.technician
                    ? `Atualmente atribuído a ${order.technician.name}. Você pode reatribuir se necessário.`
                    : 'A ordem não possui técnico. É obrigatório atribuir um técnico ativo para iniciar.'}
                </p>
              </div>
            )}

            {/* Conditional Field: Technical Diagnosis for COMPLETED */}
            {targetStatus === 'COMPLETED' && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Laudo / Diagnóstico Técnico <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={technicalDiagnosis}
                  onChange={(e) => setTechnicalDiagnosis(e.target.value)}
                  placeholder="Descreva o diagnóstico técnico, reparos efetuados ou testes de verificação realizados..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-500">
                  Obrigatório para conclusão da ordem de serviço.
                </p>
              </div>
            )}

            {/* Conditional Field: Justification for WAITING_PARTS or CANCELED */}
            {(targetStatus === 'WAITING_PARTS' || targetStatus === 'CANCELED') && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  {targetStatus === 'WAITING_PARTS'
                    ? 'Peças Pendentes / Justificativa de Espera *'
                    : 'Motivo do Cancelamento *'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    targetStatus === 'WAITING_PARTS'
                      ? 'Informe os itens ou componentes pendentes de fornecedor...'
                      : 'Informe o motivo detalhado pelo qual a ordem está sendo cancelada...'
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-500">
                  Este comentário será registrado no histórico auditado da ordem.
                </p>
              </div>
            )}

            {/* Optional Comment for other transitions */}
            {targetStatus !== 'WAITING_PARTS' && targetStatus !== 'CANCELED' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  Comentário adicional de auditoria (opcional)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex: Cliente notificado via WhatsApp sobre o início..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
