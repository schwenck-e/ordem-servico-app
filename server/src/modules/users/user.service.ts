import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ListUsersQuery, CreateUserInput, UpdateUserInput } from './user.schemas';

const SALT_ROUNDS = 10;

// Helper: omit passwordHash from user object
function safeUser(user: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

/**
 * List users with pagination and optional filters.
 * Never exposes passwordHash.
 */
export async function listUsers(prisma: PrismaClient, query: ListUsersQuery) {
  const { page, limit, search, role, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  if (role !== undefined) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get a user by UUID without exposing passwordHash.
 */
export async function getUserById(prisma: PrismaClient, id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    const err = new Error('Usuário não encontrado.') as any;
    err.statusCode = 404;
    err.name = 'Not Found';
    throw err;
  }

  return user;
}

/**
 * Create a new user with hashed password.
 * Validates unique email.
 */
export async function createUser(prisma: PrismaClient, data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('E-mail já está em uso por outro usuário.') as any;
    err.statusCode = 409;
    err.name = 'Conflict';
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'OPERATOR',
      isActive: data.isActive ?? true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return user;
}

/**
 * Update user fields; re-hashes password if provided.
 * Checks email uniqueness if email is changed.
 */
export async function updateUser(prisma: PrismaClient, id: string, data: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuário não encontrado.') as any;
    err.statusCode = 404;
    err.name = 'Not Found';
    throw err;
  }

  // Check for email conflict if email is being changed
  if (data.email && data.email !== existing.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailConflict) {
      const err = new Error('E-mail já está em uso por outro usuário.') as any;
      err.statusCode = 409;
      err.name = 'Conflict';
      throw err;
    }
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return user;
}

/**
 * Delete a user by UUID.
 * Prevents self-deletion by the currently connected admin.
 */
export async function deleteUser(prisma: PrismaClient, id: string, currentUserId: string) {
  if (id === currentUserId) {
    const err = new Error('Não é permitido excluir o próprio usuário conectado.') as any;
    err.statusCode = 400;
    err.name = 'Bad Request';
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuário não encontrado.') as any;
    err.statusCode = 404;
    err.name = 'Not Found';
    throw err;
  }

  await prisma.user.delete({ where: { id } });
}
