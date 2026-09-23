import React from 'react';
import { Wrench, Plus } from 'lucide-react';

export const TechniciansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Técnicos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Equipe técnica, especialidades e disponibilidade de alocação.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg opacity-75 cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Técnico
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Módulo de Técnicos</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Gestão de técnicos, especialidades e status ativo/inativo serão implementados no ticket <strong>ELI-13</strong>.
        </p>
      </div>
    </div>
  );
};
