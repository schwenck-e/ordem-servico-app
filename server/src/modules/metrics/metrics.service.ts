import { Prisma, PrismaClient } from '@prisma/client';
import type { MetricsPeriodQuery } from './metrics.schemas';

const ALL_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'WAITING_APPROVAL',
  'COMPLETED',
  'CANCELED',
] as const;

export interface TechnicianMetricsItem {
  technicianId: string | null;
  name: string;
  email: string | null;
  specialty: string | null;
  isActive: boolean | null;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export function buildWhereClause(query: MetricsPeriodQuery): Prisma.WorkOrderWhereInput {
  const where: Prisma.WorkOrderWhereInput = {};

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) {
      where.createdAt.gte = query.startDate;
    }
    if (query.endDate) {
      const adjustedEndDate = new Date(query.endDate);
      if (
        adjustedEndDate.getUTCHours() === 0 &&
        adjustedEndDate.getUTCMinutes() === 0 &&
        adjustedEndDate.getUTCSeconds() === 0
      ) {
        adjustedEndDate.setUTCHours(23, 59, 59, 999);
      }
      where.createdAt.lte = adjustedEndDate;
    }
  }

  return where;
}

export async function getMetricsSummary(prisma: PrismaClient, query: MetricsPeriodQuery) {
  const where = buildWhereClause(query);

  const [totalOrders, statusGroups] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_PARTS: 0,
    WAITING_APPROVAL: 0,
    COMPLETED: 0,
    CANCELED: 0,
  };

  let totalRevenue = 0;
  let pendingRevenue = 0;

  for (const group of statusGroups) {
    const count = group._count._all;
    const amount = group._sum.totalAmount ?? 0;

    if (group.status in statusCounts) {
      statusCounts[group.status] = count;
    }

    if (group.status === 'COMPLETED') {
      totalRevenue = Math.round((totalRevenue + amount) * 100) / 100;
    } else if (group.status !== 'CANCELED') {
      pendingRevenue = Math.round((pendingRevenue + amount) * 100) / 100;
    }
  }

  const completedCount = statusCounts.COMPLETED;
  const averageTicket =
    completedCount > 0
      ? Math.round((totalRevenue / completedCount) * 100) / 100
      : 0;

  return {
    totalOrders,
    statusCounts,
    financial: {
      totalRevenue,
      pendingRevenue,
      averageTicket,
    },
    period: {
      startDate: query.startDate ? query.startDate.toISOString() : null,
      endDate: query.endDate ? query.endDate.toISOString() : null,
    },
  };
}

export async function getMetricsByStatus(prisma: PrismaClient, query: MetricsPeriodQuery) {
  const where = buildWhereClause(query);

  const [totalOrders, statusGroups] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const groupsMap = new Map<string, { count: number; totalAmount: number }>();
  for (const g of statusGroups) {
    groupsMap.set(g.status, {
      count: g._count._all,
      totalAmount: Math.round((g._sum.totalAmount ?? 0) * 100) / 100,
    });
  }

  const data = ALL_STATUSES.map((status) => {
    const entry = groupsMap.get(status) ?? { count: 0, totalAmount: 0 };
    const percentage =
      totalOrders > 0
        ? Math.round((entry.count / totalOrders) * 10000) / 100
        : 0;

    return {
      status,
      count: entry.count,
      percentage,
      totalAmount: entry.totalAmount,
    };
  });

  return {
    data,
    totalOrders,
    period: {
      startDate: query.startDate ? query.startDate.toISOString() : null,
      endDate: query.endDate ? query.endDate.toISOString() : null,
    },
  };
}

export async function getMetricsByTechnician(prisma: PrismaClient, query: MetricsPeriodQuery) {
  const where = buildWhereClause(query);

  const [technicians, groupedOrders] = await Promise.all([
    prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.workOrder.groupBy({
      by: ['technicianId', 'status'],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  interface TechAgg {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }

  const aggMap = new Map<string | null, TechAgg>();

  for (const row of groupedOrders) {
    const key = row.technicianId;
    let agg = aggMap.get(key);
    if (!agg) {
      agg = {
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
      };
      aggMap.set(key, agg);
    }

    const count = row._count._all;
    const amount = row._sum.totalAmount ?? 0;

    agg.totalOrders += count;

    if (row.status === 'COMPLETED') {
      agg.completedOrders += count;
      agg.totalRevenue = Math.round((agg.totalRevenue + amount) * 100) / 100;
    } else if (row.status === 'IN_PROGRESS') {
      agg.inProgressOrders += count;
    } else if (row.status !== 'CANCELED') {
      agg.pendingOrders += count;
    }
  }

  const data: TechnicianMetricsItem[] = technicians.map((tech) => {
    const agg = aggMap.get(tech.id) ?? {
      totalOrders: 0,
      completedOrders: 0,
      inProgressOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    };

    return {
      technicianId: tech.id,
      name: tech.name,
      email: tech.email,
      specialty: tech.specialty,
      isActive: tech.isActive,
      totalOrders: agg.totalOrders,
      completedOrders: agg.completedOrders,
      inProgressOrders: agg.inProgressOrders,
      pendingOrders: agg.pendingOrders,
      totalRevenue: agg.totalRevenue,
    };
  });

  const unassignedAgg = aggMap.get(null);
  if (unassignedAgg && unassignedAgg.totalOrders > 0) {
    data.push({
      technicianId: null,
      name: 'Não atribuído',
      email: null,
      specialty: null,
      isActive: null,
      totalOrders: unassignedAgg.totalOrders,
      completedOrders: unassignedAgg.completedOrders,
      inProgressOrders: unassignedAgg.inProgressOrders,
      pendingOrders: unassignedAgg.pendingOrders,
      totalRevenue: unassignedAgg.totalRevenue,
    });
  }

  return {
    data,
    period: {
      startDate: query.startDate ? query.startDate.toISOString() : null,
      endDate: query.endDate ? query.endDate.toISOString() : null,
    },
  };
}
