import React, { useCallback, useMemo } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import type { PeriodPresetKey, MetricsPeriodFilter } from '@/types';

interface PeriodPreset {
  key: PeriodPresetKey;
  label: string;
}

const PRESETS: PeriodPreset[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
  { key: 'custom', label: 'Personalizado' },
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeDatesForPreset(preset: PeriodPresetKey): MetricsPeriodFilter {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: toLocalDateString(start), endDate: todayStr };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: toLocalDateString(start), endDate: todayStr };
    }
    case 'month':
      return {
        startDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
        endDate: todayStr,
      };
    case 'year':
      return { startDate: `${today.getFullYear()}-01-01`, endDate: todayStr };
    case 'all':
      return { startDate: undefined, endDate: undefined };
    case 'custom':
      return { startDate: undefined, endDate: undefined };
  }
}

interface DashboardPeriodFilterProps {
  activePreset: PeriodPresetKey;
  filters: MetricsPeriodFilter;
  onPresetChange: (preset: PeriodPresetKey, filters: MetricsPeriodFilter) => void;
  onCustomDateChange: (filters: MetricsPeriodFilter) => void;
  onRefresh: () => void;
}

export const DashboardPeriodFilter: React.FC<DashboardPeriodFilterProps> = ({
  activePreset,
  filters,
  onPresetChange,
  onCustomDateChange,
  onRefresh,
}) => {
  const handlePresetClick = useCallback(
    (preset: PeriodPresetKey) => {
      if (preset === 'custom') {
        onPresetChange(preset, filters);
      } else {
        const computedDates = computeDatesForPreset(preset);
        onPresetChange(preset, computedDates);
      }
    },
    [onPresetChange, filters]
  );

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCustomDateChange({ ...filters, startDate: e.target.value || undefined });
    },
    [onCustomDateChange, filters]
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCustomDateChange({ ...filters, endDate: e.target.value || undefined });
    },
    [onCustomDateChange, filters]
  );

  const isDateInvalid = useMemo(() => {
    if (filters.startDate && filters.endDate) {
      return filters.startDate > filters.endDate;
    }
    return false;
  }, [filters.startDate, filters.endDate]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-medium">Período:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activePreset === preset.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {activePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={handleStartDateChange}
              className={`px-2 py-1.5 rounded-lg border text-xs ${
                isDateInvalid ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
              } focus:outline-none focus:ring-2 focus:ring-brand-500`}
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={handleEndDateChange}
              className={`px-2 py-1.5 rounded-lg border text-xs ${
                isDateInvalid ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
              } focus:outline-none focus:ring-2 focus:ring-brand-500`}
            />
            {isDateInvalid && (
              <span className="text-xs text-rose-600">Data inicial maior que final</span>
            )}
          </div>
        )}

        <button
          onClick={onRefresh}
          className="ml-auto p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export { computeDatesForPreset };
