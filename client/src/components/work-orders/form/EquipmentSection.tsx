import { Smartphone, Hash, AlertCircle, Calendar, MessageSquare, Stethoscope } from 'lucide-react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { WorkOrderFormData } from '@/schemas/work-order.schema';
import type { WorkOrderPriority } from '@/types';

interface EquipmentSectionProps {
  register: UseFormRegister<WorkOrderFormData>;
  errors: FieldErrors<WorkOrderFormData>;
  watch: UseFormWatch<WorkOrderFormData>;
  setValue: UseFormSetValue<WorkOrderFormData>;
  isEditMode: boolean;
}

const priorities: { value: WorkOrderPriority; label: string; activeColor: string }[] = [
  { value: 'LOW', label: 'Baixa', activeColor: 'bg-slate-100 text-slate-800 border-slate-300 ring-slate-400' },
  { value: 'MEDIUM', label: 'Média', activeColor: 'bg-sky-50 text-sky-700 border-sky-300 ring-sky-500' },
  { value: 'HIGH', label: 'Alta', activeColor: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-500' },
  { value: 'URGENT', label: 'Urgente', activeColor: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-500' },
];

export function EquipmentSection({
  register,
  errors,
  watch,
  setValue,
  isEditMode,
}: EquipmentSectionProps) {
  const reportedDefect = watch('reportedDefect') || '';
  const currentPriority = watch('priority');

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800">Equipamento e Defeito</h3>
        <p className="text-xs text-slate-500">
          Informe os dados do aparelho, sintomas e prazos estimados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Equipamento */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Equipamento / Modelo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Smartphone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              {...register('equipment')}
              placeholder="Ex: iPhone 13 Pro 128GB, Notebook Dell Inspiron..."
              className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.equipment
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
              }`}
            />
          </div>
          {errors.equipment && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.equipment.message}</p>
          )}
        </div>

        {/* Número de Série */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Número de Série / IMEI <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Hash className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              {...register('serialNumber')}
              placeholder="Ex: SN-9872635412"
              className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.serialNumber
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
              }`}
            />
          </div>
          {errors.serialNumber && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.serialNumber.message}</p>
          )}
        </div>
      </div>

      {/* Defeito Relatado */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
            <AlertCircle className="h-4 w-4 text-slate-400" />
            <span>Defeito Relatado pelo Cliente <span className="text-red-500">*</span></span>
          </label>
          <span className={`text-xs ${reportedDefect.length > 950 ? 'font-bold text-red-500' : 'text-slate-400'}`}>
            {reportedDefect.length}/1000
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={1000}
          {...register('reportedDefect')}
          placeholder="Descreva detalhadamente o problema relatado pelo cliente ao deixar o aparelho..."
          className={`block w-full rounded-lg border p-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            errors.reportedDefect
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
          }`}
        />
        {errors.reportedDefect && (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.reportedDefect.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Prioridade */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Prioridade de Atendimento
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {priorities.map((item) => {
              const isSelected = currentPriority === item.value;
              return (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setValue('priority', item.value, { shouldValidate: true, shouldDirty: true })}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? `${item.activeColor} shadow-sm ring-2`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {errors.priority && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.priority.message}</p>
          )}
        </div>

        {/* Previsão de Entrega */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Data Prevista de Entrega <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              {...register('scheduledDate')}
              className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.scheduledDate
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
              }`}
            />
          </div>
          {errors.scheduledDate && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.scheduledDate.message}</p>
          )}
        </div>
      </div>

      {/* Comentário Inicial (Criação) ou Diagnóstico Técnico (Edição) */}
      {!isEditMode ? (
        <div>
          <label className="mb-1 flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span>Comentário Inicial de Abertura <span className="text-xs font-normal text-slate-400">(opcional, histórico)</span></span>
          </label>
          <textarea
            rows={2}
            maxLength={500}
            {...register('initialComment')}
            placeholder="Observações complementares registradas no momento do recebimento..."
            className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {errors.initialComment && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.initialComment.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="mb-1 flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
            <Stethoscope className="h-4 w-4 text-slate-400" />
            <span>Laudo / Diagnóstico Técnico <span className="text-xs font-normal text-slate-400">(opcional)</span></span>
          </label>
          <textarea
            rows={3}
            maxLength={2000}
            {...register('technicalDiagnosis')}
            placeholder="Parecer técnico detalhado sobre as causas e procedimentos executados..."
            className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {errors.technicalDiagnosis && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.technicalDiagnosis.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
