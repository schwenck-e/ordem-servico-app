import React from 'react';
import { cn } from '@/lib/utils';
import type { WorkOrderStatus, WorkOrderPriority } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  showDot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  showDot = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    neutral: 'bg-slate-100 text-slate-800 border-slate-300',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotStyles = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-500',
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  const map: Record<WorkOrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN: { label: 'Aberta', variant: 'info' },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'warning' },
    WAITING_PARTS: { label: 'Aguardando Peças', variant: 'purple' },
    WAITING_APPROVAL: { label: 'Aguardando Aprovação', variant: 'neutral' },
    COMPLETED: { label: 'Concluída', variant: 'success' },
    CANCELED: { label: 'Cancelada', variant: 'danger' },
  };

  const config = map[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={config.variant} showDot>
      {config.label}
    </Badge>
  );
};

export const PriorityBadge: React.FC<{ priority: WorkOrderPriority }> = ({ priority }) => {
  const map: Record<WorkOrderPriority, { label: string; variant: BadgeProps['variant'] }> = {
    LOW: { label: 'Baixa', variant: 'neutral' },
    MEDIUM: { label: 'Média', variant: 'info' },
    HIGH: { label: 'Alta', variant: 'warning' },
    URGENT: { label: 'Urgente', variant: 'danger' },
  };

  const config = map[priority] || { label: priority, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
