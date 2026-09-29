import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente de teste
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
  // Limpeza reversa das tabelas antes de cada teste
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.technician.deleteMany();
  await app.prisma.customer.deleteMany();
});

// ─── Helpers de Teste ───────────────────────────────────────────────────────

async function createCustomerHelper(overrides = {}) {
  return app.prisma.customer.create({
    data: {
      name: 'Cliente Teste',
      document: '529.982.247-25',
      email: 'cliente@teste.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123 - Centro, SP',
      ...overrides,
    },
  });
}

async function createTechnicianHelper(overrides = {}) {
  return app.prisma.technician.create({
    data: {
      name: 'Técnico Teste',
      email: 'tecnico@teste.com',
      phone: '(11) 99887-7665',
      specialty: 'Notebooks e Desktops',
      isActive: true,
      ...overrides,
    },
  });
}

let orderSequence = 1000;
async function createWorkOrderHelper(
  customerId: string,
  overrides: Record<string, any> = {}
) {
  orderSequence += 1;
  const currentYear = new Date().getFullYear();
  return app.prisma.workOrder.create({
    data: {
      orderNumber: overrides.orderNumber || `OS-${currentYear}-${orderSequence}`,
      customerId,
      equipment: 'Dell Inspiron 15',
      reportedDefect: 'Notebook não liga',
      status: 'OPEN',
      priority: 'MEDIUM',
      totalServices: 500.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 500.0,
      ...overrides,
    },
  });
}

// ─── GET /metrics/summary ───────────────────────────────────────────────────

describe('GET /metrics/summary', () => {
  it('deve retornar contadores zerados quando o banco estiver vazio (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(0);
    expect(body.statusCounts).toEqual({
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_PARTS: 0,
      WAITING_APPROVAL: 0,
      COMPLETED: 0,
      CANCELED: 0,
    });
    expect(body.financial).toEqual({
      totalRevenue: 0,
      pendingRevenue: 0,
      averageTicket: 0,
    });
    expect(body.period).toEqual({
      startDate: null,
      endDate: null,
    });
  });

  it('deve consolidar totais por status, receita realizada, pipeline pendente e ticket médio (200)', async () => {
    const customer = await createCustomerHelper();
    const tech = await createTechnicianHelper();

    // 1 OPEN (R$ 300.00)
    await createWorkOrderHelper(customer.id, {
      status: 'OPEN',
      totalAmount: 300.0,
      technicianId: tech.id,
    });

    // 1 IN_PROGRESS (R$ 500.00)
    await createWorkOrderHelper(customer.id, {
      status: 'IN_PROGRESS',
      totalAmount: 500.0,
      technicianId: tech.id,
    });

    // 1 WAITING_PARTS (R$ 200.00)
    await createWorkOrderHelper(customer.id, {
      status: 'WAITING_PARTS',
      totalAmount: 200.0,
    });

    // 1 WAITING_APPROVAL (R$ 150.00)
    await createWorkOrderHelper(customer.id, {
      status: 'WAITING_APPROVAL',
      totalAmount: 150.0,
    });

    // 2 COMPLETED (R$ 1000.00 + R$ 600.00 = R$ 1600.00)
    await createWorkOrderHelper(customer.id, {
      status: 'COMPLETED',
      totalAmount: 1000.0,
      completedDate: new Date(),
    });
    await createWorkOrderHelper(customer.id, {
      status: 'COMPLETED',
      totalAmount: 600.0,
      completedDate: new Date(),
    });

    // 1 CANCELED (R$ 400.00) — não deve entrar no faturamento nem no pendente
    await createWorkOrderHelper(customer.id, {
      status: 'CANCELED',
      totalAmount: 400.0,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(7);
    expect(body.statusCounts).toEqual({
      OPEN: 1,
      IN_PROGRESS: 1,
      WAITING_PARTS: 1,
      WAITING_APPROVAL: 1,
      COMPLETED: 2,
      CANCELED: 1,
    });

    // Receita realizada: 1000 + 600 = 1600.00
    // Pipeline pendente: 300 + 500 + 200 + 150 = 1150.00
    // Ticket médio: 1600 / 2 = 800.00
    expect(body.financial.totalRevenue).toBe(1600);
    expect(body.financial.pendingRevenue).toBe(1150);
    expect(body.financial.averageTicket).toBe(800);
  });

  it('deve filtrar métricas pelo intervalo de datas startDate e endDate (200)', async () => {
    const customer = await createCustomerHelper();

    // OS criada em 2026-08-10 (fora do período de setembro)
    await createWorkOrderHelper(customer.id, {
      status: 'COMPLETED',
      totalAmount: 500.0,
      createdAt: new Date('2026-08-10T10:00:00Z'),
    });

    // OS criada em 2026-09-15 (dentro do período)
    await createWorkOrderHelper(customer.id, {
      status: 'COMPLETED',
      totalAmount: 800.0,
      createdAt: new Date('2026-09-15T14:30:00Z'),
    });

    // OS criada em 2026-10-05 (fora do período)
    await createWorkOrderHelper(customer.id, {
      status: 'OPEN',
      totalAmount: 400.0,
      createdAt: new Date('2026-10-05T09:00:00Z'),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary?startDate=2026-09-01T00:00:00Z&endDate=2026-09-30T23:59:59Z',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(1);
    expect(body.statusCounts.COMPLETED).toBe(1);
    expect(body.financial.totalRevenue).toBe(800);
    expect(body.financial.averageTicket).toBe(800);
    expect(body.period.startDate).toBe('2026-09-01T00:00:00.000Z');
    expect(body.period.endDate).toBe('2026-09-30T23:59:59.000Z');
  });

  it('deve ajustar inclusivamente a data final quando informada no formato simples YYYY-MM-DD (200)', async () => {
    const customer = await createCustomerHelper();

    // OS criada às 20:00:00 do dia 2026-09-15
    await createWorkOrderHelper(customer.id, {
      status: 'OPEN',
      totalAmount: 250.0,
      createdAt: new Date('2026-09-15T20:00:00Z'),
    });

    // Consulta passando endDate=2026-09-15 (sem horário especificado)
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary?startDate=2026-09-15&endDate=2026-09-15',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalOrders).toBe(1);
    expect(body.statusCounts.OPEN).toBe(1);
  });

  it('deve retornar 400 quando startDate for posterior a endDate', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary?startDate=2026-09-30&endDate=2026-09-01',
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('Bad Request');
    expect(body.message).toContain('Falha na validação');
  });

  it('deve retornar 400 quando fornecida data em formato inválido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/summary?startDate=invalido',
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /metrics/by-status ─────────────────────────────────────────────────

describe('GET /metrics/by-status', () => {
  it('deve retornar todos os 6 status com count 0 e percentage 0.0 na base vazia (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-status',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(0);
    expect(body.data).toHaveLength(6);

    const statuses = body.data.map((item: any) => item.status);
    expect(statuses).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'WAITING_APPROVAL',
      'COMPLETED',
      'CANCELED',
    ]);

    for (const item of body.data) {
      expect(item.count).toBe(0);
      expect(item.percentage).toBe(0);
      expect(item.totalAmount).toBe(0);
    }
  });

  it('deve calcular corretamente contagens, percentuais e totalAmount por status (200)', async () => {
    const customer = await createCustomerHelper();

    // 2 OPEN (2 * R$ 200 = R$ 400)
    await createWorkOrderHelper(customer.id, { status: 'OPEN', totalAmount: 200.0 });
    await createWorkOrderHelper(customer.id, { status: 'OPEN', totalAmount: 200.0 });

    // 1 IN_PROGRESS (R$ 300)
    await createWorkOrderHelper(customer.id, { status: 'IN_PROGRESS', totalAmount: 300.0 });

    // 1 COMPLETED (R$ 500)
    await createWorkOrderHelper(customer.id, { status: 'COMPLETED', totalAmount: 500.0 });

    // Total = 4 ordens
    // OPEN: 2/4 = 50%
    // IN_PROGRESS: 1/4 = 25%
    // COMPLETED: 1/4 = 25%
    // Demais: 0%

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-status',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(4);

    const openStat = body.data.find((d: any) => d.status === 'OPEN');
    expect(openStat).toEqual({
      status: 'OPEN',
      count: 2,
      percentage: 50,
      totalAmount: 400,
    });

    const inProgressStat = body.data.find((d: any) => d.status === 'IN_PROGRESS');
    expect(inProgressStat).toEqual({
      status: 'IN_PROGRESS',
      count: 1,
      percentage: 25,
      totalAmount: 300,
    });

    const completedStat = body.data.find((d: any) => d.status === 'COMPLETED');
    expect(completedStat).toEqual({
      status: 'COMPLETED',
      count: 1,
      percentage: 25,
      totalAmount: 500,
    });

    const waitingPartsStat = body.data.find((d: any) => d.status === 'WAITING_PARTS');
    expect(waitingPartsStat).toEqual({
      status: 'WAITING_PARTS',
      count: 0,
      percentage: 0,
      totalAmount: 0,
    });
  });

  it('deve filtrar os status de acordo com o período solicitado (200)', async () => {
    const customer = await createCustomerHelper();

    // OS fora do período
    await createWorkOrderHelper(customer.id, {
      status: 'OPEN',
      totalAmount: 100.0,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    // OS dentro do período
    await createWorkOrderHelper(customer.id, {
      status: 'OPEN',
      totalAmount: 200.0,
      createdAt: new Date('2026-06-15T00:00:00Z'),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-status?startDate=2026-06-01T00:00:00Z&endDate=2026-06-30T23:59:59Z',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalOrders).toBe(1);
    const openStat = body.data.find((d: any) => d.status === 'OPEN');
    expect(openStat.count).toBe(1);
    expect(openStat.totalAmount).toBe(200);
    expect(openStat.percentage).toBe(100);
  });

  it('deve retornar 400 quando startDate > endDate na rota by-status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-status?startDate=2026-12-31&endDate=2026-01-01',
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /metrics/by-technician ─────────────────────────────────────────────

describe('GET /metrics/by-technician', () => {
  it('deve retornar array vazio quando não existirem técnicos nem ordens cadastradas (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
    expect(body.period).toEqual({ startDate: null, endDate: null });
  });

  it('deve listar técnicos cadastrados mesmo que não possuam ordens atribuídas (200)', async () => {
    const tech = await createTechnicianHelper({
      name: 'Carlos Oliveira',
      email: 'carlos@empresa.com',
      specialty: 'Impressoras',
      isActive: true,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toEqual({
      technicianId: tech.id,
      name: 'Carlos Oliveira',
      email: 'carlos@empresa.com',
      specialty: 'Impressoras',
      isActive: true,
      totalOrders: 0,
      completedOrders: 0,
      inProgressOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    });
  });

  it('deve consolidar desempenho e faturamento por técnico e incluir grupo Não atribuído (200)', async () => {
    const customer = await createCustomerHelper();
    const tech1 = await createTechnicianHelper({
      name: 'Ana Souza',
      email: 'ana@empresa.com',
    });
    const tech2 = await createTechnicianHelper({
      name: 'Bruno Lima',
      email: 'bruno@empresa.com',
    });

    // Tech 1: 1 COMPLETED (R$ 800), 1 IN_PROGRESS (R$ 400)
    await createWorkOrderHelper(customer.id, {
      technicianId: tech1.id,
      status: 'COMPLETED',
      totalAmount: 800.0,
    });
    await createWorkOrderHelper(customer.id, {
      technicianId: tech1.id,
      status: 'IN_PROGRESS',
      totalAmount: 400.0,
    });

    // Tech 2: 1 WAITING_PARTS (R$ 350), 1 CANCELED (R$ 200)
    await createWorkOrderHelper(customer.id, {
      technicianId: tech2.id,
      status: 'WAITING_PARTS',
      totalAmount: 350.0,
    });
    await createWorkOrderHelper(customer.id, {
      technicianId: tech2.id,
      status: 'CANCELED',
      totalAmount: 200.0,
    });

    // Ordem Não Atribuída: 1 OPEN (R$ 150)
    await createWorkOrderHelper(customer.id, {
      technicianId: null,
      status: 'OPEN',
      totalAmount: 150.0,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.data).toHaveLength(3); // Ana, Bruno, Não atribuído

    const anaMetrics = body.data.find((d: any) => d.technicianId === tech1.id);
    expect(anaMetrics).toEqual({
      technicianId: tech1.id,
      name: 'Ana Souza',
      email: 'ana@empresa.com',
      specialty: 'Notebooks e Desktops',
      isActive: true,
      totalOrders: 2,
      completedOrders: 1,
      inProgressOrders: 1,
      pendingOrders: 0,
      totalRevenue: 800,
    });

    const brunoMetrics = body.data.find((d: any) => d.technicianId === tech2.id);
    expect(brunoMetrics).toEqual({
      technicianId: tech2.id,
      name: 'Bruno Lima',
      email: 'bruno@empresa.com',
      specialty: 'Notebooks e Desktops',
      isActive: true,
      totalOrders: 2,
      completedOrders: 0,
      inProgressOrders: 0,
      pendingOrders: 1, // WAITING_PARTS conta como pendente; CANCELED não entra em pendingOrders
      totalRevenue: 0,
    });

    const unassignedMetrics = body.data.find((d: any) => d.technicianId === null);
    expect(unassignedMetrics).toEqual({
      technicianId: null,
      name: 'Não atribuído',
      email: null,
      specialty: null,
      isActive: null,
      totalOrders: 1,
      completedOrders: 0,
      inProgressOrders: 0,
      pendingOrders: 1,
      totalRevenue: 0,
    });
  });

  it('deve aplicar filtros de período em by-technician (200)', async () => {
    const customer = await createCustomerHelper();
    const tech = await createTechnicianHelper({ name: 'Marcos Dias' });

    // OS fora do período
    await createWorkOrderHelper(customer.id, {
      technicianId: tech.id,
      status: 'COMPLETED',
      totalAmount: 1000.0,
      createdAt: new Date('2025-12-01T00:00:00Z'),
    });

    // OS dentro do período
    await createWorkOrderHelper(customer.id, {
      technicianId: tech.id,
      status: 'COMPLETED',
      totalAmount: 500.0,
      createdAt: new Date('2026-05-10T12:00:00Z'),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician?startDate=2026-05-01T00:00:00Z&endDate=2026-05-31T23:59:59Z',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    const techMetrics = body.data.find((d: any) => d.technicianId === tech.id);
    expect(techMetrics.totalOrders).toBe(1);
    expect(techMetrics.completedOrders).toBe(1);
    expect(techMetrics.totalRevenue).toBe(500);
  });

  it('deve retornar 400 se startDate > endDate na rota by-technician', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician?startDate=2026-05-31&endDate=2026-05-01',
    });

    expect(res.statusCode).toBe(400);
  });
});
