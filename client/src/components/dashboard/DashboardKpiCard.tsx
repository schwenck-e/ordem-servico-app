import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DashboardKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  loading?: boolean;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  loading = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="mt-2 space-y-2">
              <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
              {subtitle !== undefined && (
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              )}
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-slate-900 tracking-tight truncate">
                {value}
              </p>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              )}
            </>
          )}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};
