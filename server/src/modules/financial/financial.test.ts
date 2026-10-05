import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

let app: FastifyInstance;
let adminToken: string;
let operatorToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  adminToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Administrador Financeiro',
    email: 'admin@empresa.com',
    role: 'ADMIN',
  });

  operatorToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Operador Padrão',
    email: 'operador@empresa.com',
    role: 'OPERATOR',
  });
});

async function cleanDatabase() {
  if (app?.prisma) {
    await app.prisma.financialTransaction.deleteMany();
    await app.prisma.payment.deleteMany();
    await app.prisma.invoice.deleteMany();
    await app.prisma.quoteItem.deleteMany();
    await app.prisma.quote.deleteMany();
    await app.prisma.workOrderLog.deleteMany();
    await app.prisma.stockMovement.deleteMany();
    await app.prisma.workOrderItem.deleteMany();
    await app.prisma.workOrderAttachment.deleteMany();
    await app.prisma.workOrder.deleteMany();
    await app.prisma.product.deleteMany();
    await app.prisma.technician.deleteMany();
    await app.prisma.customer.deleteMany();
  }
}

afterAll(async () => {
  if (app) {
    await cleanDatabase();
    await app.close();
  }
});

beforeEach(async () => {
  await cleanDatabase();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createCustomerHelper(overrides = {}) {
  return app.prisma.customer.create({
    data: {
      name: 'Cliente Teste Financeiro',
      document: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: `cliente-${Date.now()}@teste.com`,
      phone: '(11) 98888-7777',
      address: 'Av. Paulista, 1000, SP',
      ...overrides,
    },
  });
}

async function createWorkOrderHelper(customerId: string, status: string = 'COMPLETED') {
  const currentYear = new Date().getFullYear();
  const randSeq = Math.floor(Math.random() * 9000) + 1000;
  return app.prisma.workOrder.create({
    data: {
      orderNumber: `OS-${currentYear}-${randSeq}`,
      customerId,
      equipment: 'Notebook Dell Latitude 3420',
      reportedDefect: 'Teclado falhando e aquecimento excessivo',
      technicalDiagnosis: 'Troca de teclado e limpeza preventiva',
      status,
      totalServices: 300.0,
      totalParts: 200.0,
      discount: 0.0,
      totalAmount: 500.0,
      completedDate: status === 'COMPLETED' ? new Date() : null,
    },
  });
}

// ─── Suíte de Testes ──────────────────────────────────────────────────────────

describe('Módulo Financeiro e Fluxo de Caixa (Financial & Cashflow)', () => {
  describe('POST /financial/transactions — Lançamentos Financeiros e RBAC', () => {
    it('deve permitir lançamento avulso de despesa (EXPENSE) por usuário ADMIN com sucesso (201)', async () => {
      const payload = {
        type: 'EXPENSE',
        category: 'FIXED_EXPENSE',
        description: 'Aluguel do Galpão Comercial',
        amount: 2500.5,
        dueDate: '2026-10-15T00:00:00.000Z',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/financial/transactions',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data).toHaveProperty('id');
      expect(data.type).toBe('EXPENSE');
      expect(data.category).toBe('FIXED_EXPENSE');
      expect(data.description).toBe('Aluguel do Galpão Comercial');
      expect(data.amount).toBe(2500.5);
      expect(data.status).toBe('PENDING');
      expect(data.paymentDate).toBeNull();
      expect(data.invoiceId).toBeNull();
    });

    it('deve permitir lançamento avulso de receita (REVENUE) por usuário ADMIN (201)', async () => {
      const payload = {
        type: 'REVENUE',
        category: 'SERVICE_REVENUE',
        description: 'Consultoria Técnica Especializada',
        amount: 1200.0,
        dueDate: '2026-10-20T00:00:00.000Z',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/financial',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.type).toBe('REVENUE');
      expect(data.category).toBe('SERVICE_REVENUE');
      expect(data.amount).toBe(1200.0);
      expect(data.status).toBe('PENDING');
    });

    it('deve bloquear criação avulsa por usuário OPERATOR com 403 Forbidden', async () => {
      const payload = {
        type: 'EXPENSE',
        category: 'VARIABLE_EXPENSE',
        description: 'Material de Limpeza',
        amount: 150.0,
        dueDate: '2026-10-10T00:00:00.000Z',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/financial/transactions',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload,
      });

      expect(response.statusCode).toBe(403);
      const data = response.json();
      expect(data.message).toContain('Acesso negado: seu perfil não possui permissão para esta operação');
    });

    it('deve rejeitar criação sem token com 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/financial/transactions',
        payload: {
          type: 'EXPENSE',
          category: 'OTHER',
          description: 'Teste sem autenticação',
          amount: 50.0,
          dueDate: '2026-10-10T00:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve rejeitar criação com valor zero ou negativo (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/financial/transactions',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          type: 'EXPENSE',
          category: 'FIXED_EXPENSE',
          description: 'Valor Inválido',
          amount: -50.0,
          dueDate: '2026-10-10T00:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('deve rejeitar categoria ou tipo inválidos (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/financial/transactions',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          type: 'INVALID_TYPE',
          category: 'UNKNOWN_CATEGORY',
          description: 'Tipo inválido',
          amount: 100.0,
          dueDate: '2026-10-10T00:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /financial/transactions — Listagem e Filtros', () => {
    beforeEach(async () => {
      // Cria conjunto de dados de teste
      await app.prisma.financialTransaction.createMany({
        data: [
          {
            type: 'EXPENSE',
            category: 'FIXED_EXPENSE',
            description: 'Conta de Energia Elétrica',
            amount: 450.0,
            dueDate: new Date('2026-10-05T00:00:00.000Z'),
            status: 'PAID',
            paymentDate: new Date('2026-10-05T10:00:00.000Z'),
          },
          {
            type: 'EXPENSE',
            category: 'PARTS_PURCHASE',
            description: 'Aquisição de Lote de Telas LCD',
            amount: 1800.0,
            dueDate: new Date('2026-10-25T00:00:00.000Z'),
            status: 'PENDING',
          },
          {
            type: 'REVENUE',
            category: 'SERVICE_REVENUE',
            description: 'Atendimento Corporativo VIP',
            amount: 3200.0,
            dueDate: new Date('2026-10-18T00:00:00.000Z'),
            status: 'PAID',
            paymentDate: new Date('2026-10-18T14:30:00.000Z'),
          },
          {
            type: 'REVENUE',
            category: 'OTHER',
            description: 'Rendimento de Aplicação',
            amount: 150.0,
            dueDate: new Date('2026-11-01T00:00:00.000Z'),
            status: 'PENDING',
          },
        ],
      });
    });

    it('deve listar transações com paginação data e meta (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/financial/transactions?page=1&limit=2',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(data.data.length).toBe(2);
      expect(data.meta.total).toBe(4);
      expect(data.meta.page).toBe(1);
      expect(data.meta.limit).toBe(2);
      expect(data.meta.totalPages).toBe(2);
    });

    it('deve filtrar transações por tipo (type=EXPENSE)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/financial/transactions?type=EXPENSE',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.data.length).toBe(2);
      expect(data.data.every((t: any) => t.type === 'EXPENSE')).toBe(true);
    });

    it('deve filtrar transações por status (status=PAID)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/financial/transactions?status=PAID',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.data.length).toBe(2);
      expect(data.data.every((t: any) => t.status === 'PAID')).toBe(true);
    });

    it('deve filtrar transações por intervalo de datas de vencimento', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/financial/transactions?startDate=2026-10-01&endDate=2026-10-20',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.data.length).toBe(2);
    });

    it('deve buscar transações por texto na descrição (search)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/financial/transactions?search=Energia',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.data.length).toBe(1);
      expect(data.data[0].description).toBe('Conta de Energia Elétrica');
    });
  });

  describe('PATCH /financial/transactions/:id/pay — Liquidação de Transação', () => {
    it('deve liquidar transação pendente com sucesso transicionando para PAID e registrando paymentDate (200)', async () => {
      const tx = await app.prisma.financialTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'VARIABLE_EXPENSE',
          description: 'Internet Fibra Óptica',
          amount: 220.0,
          dueDate: new Date('2026-10-10T00:00:00.000Z'),
          status: 'PENDING',
        },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/financial/transactions/${tx.id}/pay`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          paymentDate: '2026-10-09T15:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.id).toBe(tx.id);
      expect(data.status).toBe('PAID');
      expect(data.paymentDate).toBeTruthy();

      const inDb = await app.prisma.financialTransaction.findUnique({
        where: { id: tx.id },
      });
      expect(inDb?.status).toBe('PAID');
      expect(inDb?.paymentDate).toBeTruthy();
    });

    it('deve rejeitar liquidação de transação já quitada (400)', async () => {
      const tx = await app.prisma.financialTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'VARIABLE_EXPENSE',
          description: 'Serviço Já Pago',
          amount: 100.0,
          dueDate: new Date('2026-10-10T00:00:00.000Z'),
          status: 'PAID',
          paymentDate: new Date(),
        },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/financial/transactions/${tx.id}/pay`,
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.message).toContain('já foi liquidada/paga');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/financial/transactions/00000000-0000-0000-0000-000000000099/pay',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('deve retornar 400 para ID que não é UUID válido', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/financial/transactions/id-invalido-123/pay',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /financial/cashflow — Fluxo de Caixa Consolidado', () => {
    it('deve calcular corretamente currentBalance, totais a pagar e a receber no período, e gráfico mensal', async () => {
      // Setup de transações:
      // 1. Receita Paga: 5000.00
      await app.prisma.financialTransaction.create({
        data: {
          type: 'REVENUE',
          category: 'SERVICE_REVENUE',
          description: 'Receita Faturada Paga',
          amount: 5000.0,
          dueDate: new Date('2026-10-02T00:00:00.000Z'),
          status: 'PAID',
          paymentDate: new Date('2026-10-02T10:00:00.000Z'),
        },
      });

      // 2. Despesa Paga: 1500.00
      await app.prisma.financialTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'FIXED_EXPENSE',
          description: 'Aluguel Pago',
          amount: 1500.0,
          dueDate: new Date('2026-10-05T00:00:00.000Z'),
          status: 'PAID',
          paymentDate: new Date('2026-10-05T11:00:00.000Z'),
        },
      });

      // 3. Despesa Pendente no Período: 800.00
      await app.prisma.financialTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'PARTS_PURCHASE',
          description: 'Compra de Peças Pendente',
          amount: 800.0,
          dueDate: new Date('2026-10-20T00:00:00.000Z'),
          status: 'PENDING',
        },
      });

      // 4. Receita Pendente no Período: 2200.00
      await app.prisma.financialTransaction.create({
        data: {
          type: 'REVENUE',
          category: 'SERVICE_REVENUE',
          description: 'Serviço Pendente a Receber',
          amount: 2200.0,
          dueDate: new Date('2026-10-28T00:00:00.000Z'),
          status: 'PENDING',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/financial/cashflow?startDate=2026-10-01&endDate=2026-10-31',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();

      // Saldo Atual Consolidado: 5000 - 1500 = 3500
      expect(data.currentBalance).toBe(3500.0);

      // Indicadores do período
      expect(data.period.totalToPay).toBe(800.0);
      expect(data.period.totalToReceive).toBe(2200.0);
      expect(data.period.paidRevenue).toBe(5000.0);
      expect(data.period.paidExpense).toBe(1500.0);
      expect(data.period.periodBalance).toBe(3500.0);

      // Gráfico mensal
      expect(Array.isArray(data.monthly)).toBe(true);
      expect(data.monthly.length).toBeGreaterThanOrEqual(6);

      const octEntry = data.monthly.find((m: any) => m.month === '2026-10');
      expect(octEntry).toBeDefined();
      expect(octEntry.revenue).toBe(5000.0);
      expect(octEntry.expense).toBe(1500.0);
      expect(octEntry.netBalance).toBe(3500.0);
    });
  });

  describe('Integração Automática Downstream: Invoices & Payments -> Financial', () => {
    it('deve gerar automaticamente FinancialTransaction ao quitar pagamento de fatura', async () => {
      const customer = await createCustomerHelper();
      const workOrder = await createWorkOrderHelper(customer.id, 'COMPLETED');

      // 1. Criar Fatura a partir da OS concluída
      const invoiceRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          workOrderId: workOrder.id,
          discount: 50.0,
        },
      });

      expect(invoiceRes.statusCode).toBe(201);
      const invoice = invoiceRes.json();
      expect(invoice.netAmount).toBe(450.0);

      // 2. Registrar Pagamento da Fatura
      const paymentRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoice.id}/payments`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          amount: 450.0,
          paymentMethod: 'PIX',
          notes: 'Pagamento instantâneo via chave PIX',
        },
      });

      expect(paymentRes.statusCode).toBe(201);

      // 3. Verificar que a FinancialTransaction foi gerada no razão financeiro
      const transactions = await app.prisma.financialTransaction.findMany({
        where: { invoiceId: invoice.id },
      });

      expect(transactions.length).toBe(1);
      const ft = transactions[0];
      expect(ft.type).toBe('REVENUE');
      expect(ft.category).toBe('SERVICE_REVENUE');
      expect(ft.amount).toBe(450.0);
      expect(ft.status).toBe('PAID');
      expect(ft.description).toContain(invoice.invoiceNumber);

      // 4. Verificar reflexo imediato no fluxo de caixa
      const cashflowRes = await app.inject({
        method: 'GET',
        url: '/financial/cashflow',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(cashflowRes.statusCode).toBe(200);
      const cashflow = cashflowRes.json();
      expect(cashflow.currentBalance).toBe(450.0);
    });
  });
});
