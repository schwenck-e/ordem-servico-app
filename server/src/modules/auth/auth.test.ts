import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables before any Prisma import
config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  if (app) await app.close();
});

beforeEach(async () => {
  // Clean users before each test to ensure a clean state
  await app.prisma.user.deleteMany();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function registerFirstAdmin(overrides = {}) {
  return app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      name: 'Administrador do Sistema',
      email: 'admin@empresa.com',
      password: 'admin123',
      ...overrides
    }
  });
}

async function loginUser(email: string, password: string) {
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password }
  });
}

// ─── POST /auth/register ────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('should register the first user as ADMIN automatically (201)', async () => {
    const res = await registerFirstAdmin();
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Administrador do Sistema');
    expect(body.email).toBe('admin@empresa.com');
    expect(body.role).toBe('ADMIN'); // First user is always ADMIN
    expect(body.isActive).toBe(true);
    expect(body.createdAt).toBeDefined();
    expect(body.passwordHash).toBeUndefined(); // Never expose hash
  });

  it('should reject second registration without auth token (401)', async () => {
    // First: register the admin
    await registerFirstAdmin();

    // Second: attempt to register without token
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Operador Teste',
        email: 'operador@empresa.com',
        password: 'operador123'
      }
    });

    expect(res.statusCode).toBe(401);
  });

  it('should allow ADMIN to register a collaborator (201)', async () => {
    // Register first admin
    await registerFirstAdmin();

    // Login as admin to get token
    const loginRes = await loginUser('admin@empresa.com', 'admin123');
    const { token } = loginRes.json();

    // Register collaborator with ADMIN token
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'Operador Técnico',
        email: 'operador@empresa.com',
        password: 'operador123',
        role: 'OPERATOR'
      }
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.role).toBe('OPERATOR');
    expect(body.email).toBe('operador@empresa.com');
  });

  it('should reject duplicate email with 409 Conflict', async () => {
    await registerFirstAdmin();

    // Try to register again with same email (no token, but user already exists so 401 before 409)
    // Actually the 401 happens first — let's login first then try conflict
    const loginRes = await loginUser('admin@empresa.com', 'admin123');
    const { token } = loginRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'Outro Admin',
        email: 'admin@empresa.com', // duplicate email
        password: 'outrasenha123'
      }
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().message).toContain('E-mail');
  });

  it('should reject registration with invalid email (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Admin',
        email: 'not-an-email',
        password: 'admin123'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject registration with short password (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Admin',
        email: 'admin2@empresa.com',
        password: '123'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 403 when OPERATOR tries to register a new user', async () => {
    // Register admin
    await registerFirstAdmin();
    const loginRes = await loginUser('admin@empresa.com', 'admin123');
    const { token: adminToken } = loginRes.json();

    // Register operator
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Operador',
        email: 'operador@empresa.com',
        password: 'operador123',
        role: 'OPERATOR'
      }
    });

    // Login as operator
    const opLoginRes = await loginUser('operador@empresa.com', 'operador123');
    const { token: opToken } = opLoginRes.json();

    // Try to register with operator token
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { Authorization: `Bearer ${opToken}` },
      payload: {
        name: 'Novo Usuário',
        email: 'novo@empresa.com',
        password: 'senha123'
      }
    });

    expect(res.statusCode).toBe(403);
  });
});

// ─── POST /auth/login ────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    // Register admin before each login test
    await registerFirstAdmin();
  });

  it('should return 200 with token and user data for valid credentials', async () => {
    const res = await loginUser('admin@empresa.com', 'admin123');
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.token.length).toBeGreaterThan(10);
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeDefined();
    expect(body.user.name).toBe('Administrador do Sistema');
    expect(body.user.email).toBe('admin@empresa.com');
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.passwordHash).toBeUndefined(); // Never expose
  });

  it('should return 401 for wrong password', async () => {
    const res = await loginUser('admin@empresa.com', 'wrongpassword');
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toContain('E-mail ou senha inválidos');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await loginUser('naoexiste@empresa.com', 'qualquercoisa');
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toContain('E-mail ou senha inválidos');
  });

  it('should return 403 for inactive user', async () => {
    // Deactivate the admin
    await app.prisma.user.updateMany({
      where: { email: 'admin@empresa.com' },
      data: { isActive: false }
    });

    const res = await loginUser('admin@empresa.com', 'admin123');
    expect(res.statusCode).toBe(403);
    expect(res.json().message).toContain('desativada');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await loginUser('not-an-email', 'admin123');
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  it('should return 200 with user profile from valid Bearer token', async () => {
    await registerFirstAdmin();
    const loginRes = await loginUser('admin@empresa.com', 'admin123');
    const { token } = loginRes.json();

    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Administrador do Sistema');
    expect(body.email).toBe('admin@empresa.com');
    expect(body.role).toBe('ADMIN');
    expect(body.passwordHash).toBeUndefined();
  });

  it('should return 401 without Authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me'
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for malformed token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for tampered/invalid JWT signature', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiQURNSU4ifQ.INVALIDSIGNATURE';
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── RBAC and User Management (/users) ──────────────────────────────────────

describe('RBAC — /users route access control', () => {
  let adminToken: string;
  let operatorToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    // Register admin
    await registerFirstAdmin();
    const adminLogin = await loginUser('admin@empresa.com', 'admin123');
    const adminData = adminLogin.json();
    adminToken = adminData.token;
    adminUserId = adminData.user.id;

    // Register operator
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Operador Técnico',
        email: 'operador@empresa.com',
        password: 'operador123',
        role: 'OPERATOR'
      }
    });

    const opLogin = await loginUser('operador@empresa.com', 'operador123');
    operatorToken = opLogin.json().token;
  });

  it('should return 403 when OPERATOR tries to access GET /users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    expect(res.statusCode).toBe(403);
  });

  it('should return 200 with user list when ADMIN accesses GET /users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2); // admin + operator
    expect(body.meta).toBeDefined();
    // Ensure no passwordHash is exposed
    body.data.forEach((u: any) => {
      expect(u.passwordHash).toBeUndefined();
    });
  });

  it('should return 401 when accessing GET /users without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users'
    });
    expect(res.statusCode).toBe(401);
  });

  it('should block self-deletion of connected admin (400)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/users/${adminUserId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('próprio usuário');
  });

  it('should allow ADMIN to delete another user', async () => {
    // Get operator's ID
    const listRes = await app.inject({
      method: 'GET',
      url: '/users',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const users = listRes.json().data;
    const operator = users.find((u: any) => u.role === 'OPERATOR');
    expect(operator).toBeDefined();

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/users/${operator.id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(deleteRes.statusCode).toBe(204);
  });
});
