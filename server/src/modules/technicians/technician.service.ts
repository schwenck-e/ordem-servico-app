import { PrismaClient, Prisma } from '@prisma/client';
import type {
  CreateTechnicianInput,
  UpdateTechnicianInput,
  ListTechniciansQuery,
} from './technician.schemas';

// ─── Domain Error Helper ────────────────────────────────────────────────────

function createHttpError(
  statusCode: number,
  message: string
): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function listTechnicians(
  prisma: PrismaClient,
  { page, limit, search, isActive, specialty }: ListTechniciansQuery
) {
  const where: Prisma.TechnicianWhereInput = {};

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (specialty) {
    where.specialty = { contains: specialty };
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { specialty: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.technician.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.technician.count({ where }),
  ]);

  return {
    data: data.map((t) => ({ ...t, active: t.isActive })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTechnicianById(prisma: PrismaClient, id: string) {
  const technician = await prisma.technician.findUnique({
    where: { id },
    include: { _count: { select: { workOrders: true } } },
  });

  if (!technician) {
    throw createHttpError(404, 'Técnico não encontrado.');
  }

  return { ...technician, active: technician.isActive };
}

export async function createTechnician(
  prisma: PrismaClient,
  data: CreateTechnicianInput
) {
  const existing = await prisma.technician.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw createHttpError(
      409,
      'Já existe um técnico cadastrado com este e-mail.'
    );
  }

  const technician = await prisma.technician.create({ data });
  return { ...technician, active: technician.isActive };
}

export async function updateTechnician(
  prisma: PrismaClient,
  id: string,
  data: UpdateTechnicianInput
) {
  const technician = await prisma.technician.findUnique({ where: { id } });

  if (!technician) {
    throw createHttpError(404, 'Técnico não encontrado.');
  }

  if (data.email) {
    const duplicate = await prisma.technician.findUnique({
      where: { email: data.email },
    });

    if (duplicate && duplicate.id !== id) {
      throw createHttpError(
        409,
        'Já existe um técnico cadastrado com este e-mail.'
      );
    }
  }

  const updated = await prisma.technician.update({
    where: { id },
    data,
  });

  return { ...updated, active: updated.isActive };
}

export async function deleteTechnician(prisma: PrismaClient, id: string) {
  const technician = await prisma.technician.findUnique({ where: { id } });

  if (!technician) {
    throw createHttpError(404, 'Técnico não encontrado.');
  }

  const activeOrderCount = await prisma.workOrder.count({
    where: {
      technicianId: id,
      status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL'] },
    },
  });

  if (activeOrderCount > 0) {
    throw createHttpError(
      409,
      'Não é possível excluir o técnico pois existem ordens de serviço ativas atribuídas a ele. Realoque as ordens ou inative o cadastro.'
    );
  }

  await prisma.technician.delete({ where: { id } });
}
