import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RegisterInput } from './auth.schemas';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Validate user credentials: find by email, check isActive and compare hash.
 * Returns the user object (without passwordHash) or null if invalid.
 */
export async function validateUserCredentials(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<{ id: string; name: string; email: string; role: string; isActive: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
}

/**
 * Register a new user.
 * If isFirstUser is true, forces role = 'ADMIN'.
 * Otherwise uses the role from input.
 */
export async function registerUser(
  prisma: PrismaClient,
  data: RegisterInput,
  isFirstUser: boolean
): Promise<{ id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date }> {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('E-mail já está em uso por outro usuário.') as any;
    err.statusCode = 409;
    err.name = 'Conflict';
    throw err;
  }

  const passwordHash = await hashPassword(data.password);
  const role = isFirstUser ? 'ADMIN' : (data.role ?? 'OPERATOR');

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role,
      isActive: true
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}
