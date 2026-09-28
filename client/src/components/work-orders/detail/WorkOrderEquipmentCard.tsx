import React from 'react';
import { Cpu, Hash, AlertCircle } from 'lucide-react';
import type { WorkOrder } from '@/types';

interface WorkOrderEquipmentCardProps {
  order: WorkOrder;
}

export const WorkOrderEquipmentCard: React.FC<WorkOrderEquipmentCardProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary-600" />
          <span>Equipamento e Defeito</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 block">Modelo / Aparelho</span>
          <span className="text-base font-semibold text-slate-900 block mt-0.5">
            {order.equipment}
          </span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block">Número de Série</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-mono text-slate-800">
              {order.serialNumber ? (
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  {order.serialNumber}
                </span>
              ) : (
                <span className="text-slate-400 italic">Não informado</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Reported Defect Box */}
      <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Defeito Reclamado pelo Cliente</span>
        </div>
        <p className="text-sm text-amber-950 whitespace-pre-wrap leading-relaxed">
          {order.reportedDefect}
        </p>
      </div>
    </div>
  );
};
