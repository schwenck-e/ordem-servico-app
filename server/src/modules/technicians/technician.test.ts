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
  // Clean up technicians and dependent records before each test
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.technician.deleteMany();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const validTechnician = {
  name: 'Carlos Pereira',
  email: 'carlos.pereira@ordemapp.local',
  phone: '(11) 98765-4321',
  specialty: 'Eletrônica & Microeletrônica',
};

const secondTechnician = {
  name: 'Ana Silva',
  email: 'ana.silva@ordemapp.local',
  phone: '(21) 91234-5678',
  specialty: 'Redes & Infraestrutura',
};

async function createTestTechnician(data: Record<string, unknown> = validTechnician) {
  const res = await app.inject({
    method: 'POST',
    url: '/technicians',
    payload: data,
  });
  return res;
}

// ─── POST /technicians ──────────────────────────────────────────────────────

describe('POST /technicians', () => {
  it('should create a technician with valid data (201)', async () => {
    const res = await createTestTechnician();
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(validTechnician.name);
    expect(body.email).toBe(validTechnician.email);
    expect(body.phone).toBe(validTechnician.phone);
    expect(body.specialty).toBe(validTechnician.specialty);
    expect(body.isActive).toBe(true);
    expect(body.active).toBe(true);
    expect(body.createdAt).toBeDefined();
  });

  it('should return 400 for invalid email', async () => {
    const res = await createTestTechnician({
      ...validTechnician,
      email: 'not-an-email',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid phone', async () => {
    const res = await createTestTechnician({
      ...validTechnician,
      phone: '123',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for name too short', async () => {
    const res = await createTestTechnician({
      ...validTechnician,
      name: 'AB',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for specialty too short', async () => {
    const res = await createTestTechnician({
      ...validTechnician,
      specialty: 'X',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 409 for duplicate email', async () => {
    await createTestTechnician();
    const res = await createTestTechnician();
    expect(res.statusCode).toBe(409);

    const body = res.json();
    expect(body.message).toContain('e-mail');
  });
});

// ─── GET /technicians ───────────────────────────────────────────────────────

describe('GET /technicians', () => {
  it('should return paginated list with meta (200)', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician(secondTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians',
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

  it('should include active alias field in list items', async () => {
    await createTestTechnician(validTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians',
    });

    const body = res.json();
    expect(body.data[0].active).toBe(true);
    expect(body.data[0].isActive).toBe(true);
  });

  it('should filter by search term (name)', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician(secondTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?search=Carlos',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe(validTechnician.name);
  });

  it('should filter by search term (specialty)', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician(secondTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?search=Redes',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe(secondTechnician.name);
  });

  it('should filter by isActive=true', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician({ ...secondTechnician, isActive: false });

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?isActive=true',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe(validTechnician.name);
  });

  it('should filter by isActive=false', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician({ ...secondTechnician, isActive: false });

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?isActive=false',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe(secondTechnician.name);
  });

  it('should filter by specialty', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician(secondTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?specialty=Redes',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].specialty).toBe(secondTechnician.specialty);
  });

  it('should respect pagination parameters', async () => {
    await createTestTechnician(validTechnician);
    await createTestTechnician(secondTechnician);

    const res = await app.inject({
      method: 'GET',
      url: '/technicians?page=1&limit=1',
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
      url: '/technicians?page=0',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /technicians/:id ───────────────────────────────────────────────────

describe('GET /technicians/:id', () => {
  it('should return technician by UUID with workOrder count (200)', async () => {
    const created = (await createTestTechnician()).json();

    const res = await app.inject({
      method: 'GET',
      url: `/technicians/${created.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(validTechnician.name);
    expect(body.active).toBe(true);
    expect(body._count).toBeDefined();
    expect(body._count.workOrders).toBe(0);
  });

  it('should return 404 for non-existent UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/technicians/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for invalid UUID format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/technicians/not-a-uuid',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── PUT /technicians/:id ───────────────────────────────────────────────────

describe('PUT /technicians/:id', () => {
  it('should update technician specialty and phone (200)', async () => {
    const created = (await createTestTechnician()).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/technicians/${created.id}`,
      payload: {
        specialty: 'Software & Automação',
        phone: '(31) 99876-5432',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.specialty).toBe('Software & Automação');
    expect(body.phone).toBe('(31) 99876-5432');
    // Unchanged fields should persist
    expect(body.name).toBe(validTechnician.name);
    expect(body.email).toBe(validTechnician.email);
  });

  it('should update isActive status (200)', async () => {
    const created = (await createTestTechnician()).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/technicians/${created.id}`,
      payload: { isActive: false },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isActive).toBe(false);
    expect(body.active).toBe(false);
  });

  it('should return 404 for non-existent technician', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/technicians/00000000-0000-0000-0000-000000000000',
      payload: { name: 'Updated Name' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 409 when changing email to one already in use', async () => {
    await createTestTechnician(validTechnician);
    const second = (await createTestTechnician(secondTechnician)).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/technicians/${second.id}`,
      payload: { email: validTechnician.email },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should return 400 for empty body', async () => {
    const created = (await createTestTechnician()).json();

    const res = await app.inject({
      method: 'PUT',
      url: `/technicians/${created.id}`,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── DELETE /technicians/:id ────────────────────────────────────────────────

describe('DELETE /technicians/:id', () => {
  it('should delete technician without active work orders (204)', async () => {
    const created = (await createTestTechnician()).json();

    const res = await app.inject({
      method: 'DELETE',
      url: `/technicians/${created.id}`,
    });
    expect(res.statusCode).toBe(204);

    // Verify deletion
    const getRes = await app.inject({
      method: 'GET',
      url: `/technicians/${created.id}`,
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('should return 404 for non-existent technician', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/technicians/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 409 when technician has active work orders', async () => {
    const created = (await createTestTechnician()).json();

    // Create a customer first (work orders require one)
    const customer = await app.prisma.customer.create({
      data: {
        name: 'Test Customer',
        document: '76109277000160', // unique CNPJ
        email: 'test-delete-409@email.com',
        phone: '(11) 91234-5678',
        address: 'Rua Teste, 123',
      },
    });

    // Create an active work order linked to this technician
    await app.prisma.workOrder.create({
      data: {
        orderNumber: 'OS-TEST-0001',
        customerId: customer.id,
        technicianId: created.id,
        equipment: 'Test Equipment',
        reportedDefect: 'Test defect',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/technicians/${created.id}`,
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toContain('ordens de serviço ativas');
  });

  it('should allow deletion when technician has only completed/cancelled work orders', async () => {
    const created = (await createTestTechnician()).json();

    // Create a customer
    const customer = await app.prisma.customer.create({
      data: {
        name: 'Test Customer 2',
        document: '30462862000105', // unique CNPJ
        email: 'test-delete-204@email.com',
        phone: '(11) 91234-5678',
        address: 'Rua Teste, 456',
      },
    });

    // Create only completed work orders for this technician
    await app.prisma.workOrder.create({
      data: {
        orderNumber: 'OS-TEST-0002',
        customerId: customer.id,
        technicianId: created.id,
        equipment: 'Completed Equipment',
        reportedDefect: 'Resolved defect',
        status: 'COMPLETED',
        priority: 'LOW',
      },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/technicians/${created.id}`,
    });
    expect(res.statusCode).toBe(204);
  });
});
