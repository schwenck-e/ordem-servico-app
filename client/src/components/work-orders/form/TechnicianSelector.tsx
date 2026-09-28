import { Wrench, Loader2 } from 'lucide-react';
import { useTechnicians } from '@/hooks/useTechnicians';
import type { Technician } from '@/types';

interface TechnicianSelectorProps {
  value?: string | null;
  onChange: (technicianId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TechnicianSelector({
  value,
  onChange,
  error,
  disabled = false,
}: TechnicianSelectorProps) {
  // Query exclusively active technicians
  const { data: techniciansData, isLoading } = useTechnicians({
    isActive: true,
    limit: 100,
  });

  const technicians: Technician[] = techniciansData?.data || [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
          <Wrench className="h-4 w-4 text-slate-400" />
          <span>Técnico Responsável</span>
        </label>
        {isLoading && (
          <span className="flex items-center text-xs text-slate-400">
            <Loader2 className="mr-1 h-3 w-3 animate-spin text-indigo-500" />
            Carregando...
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          className={`block w-full rounded-lg border py-2.5 pl-3 pr-10 text-sm shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
          }`}
        >
          <option value="">Não atribuído (Pendente de técnico)</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name} ({tech.specialty})
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-slate-500">
          Apenas técnicos com cadastro ativo são exibidos para atribuição.
        </p>
      )}
    </div>
  );
}
