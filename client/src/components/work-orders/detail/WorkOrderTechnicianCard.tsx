import React from 'react';
import { Wrench, Phone, Mail, UserX, UserCheck } from 'lucide-react';
import { maskPhone } from '@/lib/masks';
import type { Technician } from '@/types';

interface WorkOrderTechnicianCardProps {
  technician: Technician | null;
  onAssignTechnician?: () => void;
}

export const WorkOrderTechnicianCard: React.FC<WorkOrderTechnicianCardProps> = ({
  technician,
  onAssignTechnician,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary-600" />
          <span>Técnico Responsável</span>
        </h2>
        {technician && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            <UserCheck className="w-3 h-3" />
            Atribuído
          </span>
        )}
      </div>

      {technician ? (
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-slate-900 text-base">{technician.name}</p>
            <p className="text-xs text-primary-700 font-medium bg-primary-50 px-2 py-0.5 rounded inline-block mt-1">
              {technician.specialty}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-600 pt-1">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              {technician.phone ? (
                <a
                  href={`tel:${technician.phone.replace(/\D/g, '')}`}
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  {maskPhone(technician.phone)}
                </a>
              ) : (
                <span className="text-slate-400">Não informado</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              {technician.email ? (
                <a
                  href={`mailto:${technician.email}`}
                  className="hover:text-primary-600 transition-colors truncate"
                >
                  {technician.email}
                </a>
              ) : (
                <span className="text-slate-400">Não informado</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-3 bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Nenhum técnico atribuído</p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
              A ordem de serviço ainda não possui um técnico responsável vinculado para início dos trabalhos.
            </p>
          </div>
          {onAssignTechnician && (
            <button
              type="button"
              onClick={onAssignTechnician}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-md transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Atribuir Técnico</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
