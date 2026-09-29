import React from 'react';
import { ClipboardList, Clock, CheckCircle2, TrendingUp, Coins, Receipt } from 'lucide-react';
import { DashboardKpiCard } from './DashboardKpiCard';
import { formatCurrency } from '@/lib/formatters';
import type { MetricsSummary } from '@/types';

interface DashboardKpiGridProps {
  summary: MetricsSummary | undefined;
  loading: boolean;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({ summary, loading }) => {
  const totalOrders = summary?.totalOrders ?? 0;
  const inProgressCount =
    (summary?.statusCounts?.IN_PROGRESS ?? 0) +
    (summary?.statusCounts?.WAITING_PARTS ?? 0) +
    (summary?.statusCounts?.WAITING_APPROVAL ?? 0);
  const completedCount = summary?.statusCounts?.COMPLETED ?? 0;
  const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;

  const cards = [
    {
      title: 'Total de OS',
      value: totalOrders.toLocaleString('pt-BR'),
      subtitle: 'Ordens de serviço',
      icon: ClipboardList,
      iconColor: 'text-brand-600',
      iconBgColor: 'bg-brand-50',
    },
    {
      title: 'Em Andamento / Gargalo',
      value: inProgressCount.toLocaleString('pt-BR'),
      subtitle: 'Em progresso, aguardando peças ou aprovação',
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBgColor: 'bg-amber-50',
    },
    {
      title: 'Concluídas',
      value: completedCount.toLocaleString('pt-BR'),
      subtitle: `Taxa de resolução: ${completionRate}%`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-50',
    },
    {
      title: 'Faturamento Realizado',
      value: formatCurrency(summary?.financial?.totalRevenue),
      subtitle: 'Ordens concluídas',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-50',
    },
    {
      title: 'Receita Prevista',
      value: formatCurrency(summary?.financial?.pendingRevenue),
      subtitle: 'Pipeline pendente',
      icon: Coins,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-50',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(summary?.financial?.averageTicket),
      subtitle: 'Valor médio por OS',
      icon: Receipt,
      iconColor: 'text-cyan-600',
      iconBgColor: 'bg-cyan-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <DashboardKpiCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBgColor={card.iconBgColor}
          loading={loading}
        />
      ))}
    </div>
  );
};
