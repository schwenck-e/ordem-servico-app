import React from 'react';
import { FileText, Edit3, AlertCircle } from 'lucide-react';
import type { WorkOrder } from '@/types';

interface WorkOrderDiagnosisCardProps {
  order: WorkOrder;
  onEditDiagnosis?: () => void;
}

export const WorkOrderDiagnosisCard: React.FC<WorkOrderDiagnosisCardProps> = ({
  order,
  onEditDiagnosis,
}) => {
  const hasDiagnosis = Boolean(order.technicalDiagnosis && order.technicalDiagnosis.trim().length > 0);
  const isInProgress = order.status === 'IN_PROGRESS';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          <span>Laudo Técnico / Diagnóstico de Bancada</span>
        </h2>
        {onEditDiagnosis && (
          <button
            type="button"
            onClick={onEditDiagnosis}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{hasDiagnosis ? 'Atualizar Laudo' : 'Registrar Laudo'}</span>
          </button>
        )}
      </div>

      {hasDiagnosis ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {order.technicalDiagnosis}
          </p>
        </div>
      ) : (
        <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>Nenhum laudo técnico cadastrado até o momento.</span>
          </div>
          {isInProgress && (
            <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
              <strong>Nota:</strong> O preenchimento do laudo técnico de bancada é obrigatório pelas regras de negócio para a conclusão desta Ordem de Serviço.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
