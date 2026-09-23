import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables before any Prisma import
config({ path: resolve(__dirname, '../../../.env.example') });
// Force test environment to avoid pino-pretty transport issues
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
  // Clean up customers and dependent records before each test
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.customer.deleteMany();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const validCpfCustomer = {
  name: 'Maria Oliveira',
  document: '529.982.247-25', // valid CPF
  email: 'maria@email.com',
  phone: '(11) 98765-4321',
  address: 'Rua das Palmeiras, 500 - Centro, SP',
};

const validCnpjCustomer = {
  name: 'Tech Solutions Ltda',
  document: '11.222.333/0001-81', // valid CNPJ
  email: 'contato@techsolutions.com.br',
  phone: '(11) 3456-7890',
  address: 'Av. Paulista, 2000 - Bela Vista, São Paulo - SP',
};

async function createTestCustomer(data = validCpfCustomer) {
  const res = await app.inject({
    method: 'POST',
    url: '/customers',
    payload: data,
  });
  return res;
}

// ─── POST /customers ────────────────────────────────────────────────────────

describe('POST /customers', () => {
  it('should create a customer with valid CPF (201)', async () => {
    const res = await createTestCustomer();
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(validCpfCustomer.name);
    expect(body.document).toBe(validCpfCustomer.document);
    expect(body.email).toBe(validCpfCustomer.email);
    expect(body.createdAt).toBeDefined();
  });

  it('should create a customer with valid CNPJ (201)', async () => {
    const res = await createTestCustomer(validCnpjCustomer);
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.name).toBe(validCnpjCustomer.name);
    expect(body.document).toBe(validCnpjCustomer.document);
  });

  it('should return 400 for invalid CPF', async () => {
    const res = await createTestCustomer({
      ...validCpfCustomer,
      document: '111.111.111-11', // all same digits
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid email', async () => {
    const res = await createTestCustomer({
      ...validCpfCustomer,
      email: 'not-an-email',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for name too short', async () => {
    const res = await createTestCustomer({
      ...validCpfCustomer,
      name: 'AB',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 409 for duplicate document', async () => {
    await createTestCustomer();
    const res = await createTestCustomer();
    expect(res.statusCode).toBe(409);

    const body = res.json();
    expect(body.message).toContain('documento');
  });
});

// ─── GET /customers ─────────────────────────────────────────────────────────

describe('GET /customers', () => {
  it('should return paginated list with meta (200)', async () => {
    await createTestCustomer(validCpfCustomer);
    await createTestCustomer(validCnpjCustomer);

    const res = await app.inject({
      method: 'GET',
      url: '/customers',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(2);
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.total).toBe(2);
    expect(body.meta.totalPages).toBe(1);
  });

  it('should filter by search term (name)', async () => {
    await createTestCustomer(validCpfCustomer);
    await createTestCustomer(validCnpjCustomer);

    const res = await app.inject({
      method: 'GET',
      url: '/customers?search=Maria',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe(validCpfCustomer.name);
  });

  it('should filter by search term (document)', async () => {
    await createTestCustomer(validCpfCustomer);
    await createTestCustomer(validCnpjCustomer);

    const res = await app.inject({
      method: 'GET',
      url: '/customers?search=11.222',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].document).toBe(validCnpjCustomer.document);
  });

  it('should respect pagination parameters', async () => {
    await createTestCustomer(validCpfCustomer);
    await createTestCustomer(validCnpjCustomer);

    const res = await app.inject({
      method: 'GET',
      url: '/customers?page=1&limit=1',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.meta.total).toBe(2);
    expect(body.meta.totalPages).toBe(2);
  });

  it('should return 400 for invalid page (0)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers?page=0',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid limit (0)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers?limit=0',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /customers/:id ─────────────────────────────────────────────────────

describe('GET /customers/:id', () => {
  it('should return customer by UUID with workOrder count (200)', async () => {
    const created = (await createTestCustomer()).json();

    const res = await app.inject({
      method: 'GET',
      url: `/customers/${created.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(validCpfCustomer.name);
    expect(body._count).toBeDefined();
    expect(body._count.workOrders).toBe(0);
  });

  it('should return 404 for non-existent UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for invalid UUID format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers/not-a-uuid',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── PUT /customers/:id ─────────────────────────────────────────────────────

describe('PUT /customers/:id', () => {
  it('should update customer name and phone (200)', async () => {
    const created = (await createTestCustomer()).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/customers/${created.id}`,
      payload: {
        name: 'Maria Oliveira Santos',
        phone: '(21) 91234-5678',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe('Maria Oliveira Santos');
    expect(body.phone).toBe('(21) 91234-5678');
    // Unchanged fields should persist
    expect(body.email).toBe(validCpfCustomer.email);
  });

  it('should return 404 for non-existent customer', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/customers/00000000-0000-0000-0000-000000000000',
      payload: { name: 'Updated Name' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 409 when changing document to one already in use', async () => {
    await createTestCustomer(validCpfCustomer);
    const second = (await createTestCustomer(validCnpjCustomer)).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/customers/${second.id}`,
      payload: { document: validCpfCustomer.document },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should return 400 for empty body', async () => {
    const created = (await createTestCustomer()).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/customers/${created.id}`,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── DELETE /customers/:id ──────────────────────────────────────────────────

describe('DELETE /customers/:id', () => {
  it('should delete customer without work orders (204)', async () => {
    const created = (await createTestCustomer()).json();

    const res = await app.inject({
      method: 'DELETE',
      url: `/customers/${created.id}`,
    });
    expect(res.statusCode).toBe(204);

    // Verify deletion
    const getRes = await app.inject({
      method: 'GET',
      url: `/customers/${created.id}`,
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('should return 404 for non-existent customer', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/customers/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 409 when customer has associated work orders', async () => {
    const created = (await createTestCustomer()).json();

    // Create a work order linked to this customer
    await app.prisma.workOrder.create({
      data: {
        orderNumber: 'OS-TEST-0001',
        customerId: created.id,
        equipment: 'Test Equipment',
        reportedDefect: 'Test defect',
        status: 'OPEN',
        priority: 'MEDIUM',
      },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/customers/${created.id}`,
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toContain('ordens de serviço');
  });
});
