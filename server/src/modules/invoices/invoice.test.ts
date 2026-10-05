import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

let app: FastifyInstance;
let authToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  authToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Operador Financeiro',
    email: 'financeiro@empresa.com',
    role: 'ADMIN',
  });
});

afterAll(async () => {
  if (app) {
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
    await app.close();
  }
});

beforeEach(async () => {
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
});

// ─── Helpers de Criação de Entidades ────────────────────────────────────────

async function createCustomerHelper(overrides = {}) {
  return app.prisma.customer.create({
    data: {
      name: 'Cliente Teste',
      document: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: `cliente-${Date.now()}@teste.com`,
      phone: '(11) 98888-7777',
      address: 'Av. Paulista, 1000, SP',
      ...overrides,
    },
  });
}

async function createWorkOrderHelper(customerId: string, status: string = 'COMPLETED', overrides = {}) {
  const currentYear = new Date().getFullYear();
  const randSeq = Math.floor(Math.random() * 9000) + 1000;
  return app.prisma.workOrder.create({
    data: {
      orderNumber: `OS-${currentYear}-${randSeq}`,
      customerId,
      equipment: 'Notebook Dell Latitude',
      reportedDefect: 'Não liga',
      technicalDiagnosis: 'Fonte trocada e limpeza realizada',
      status,
      totalServices: 250.0,
      totalParts: 150.0,
      discount: 20.0,
      totalAmount: 380.0,
      completedDate: status === 'COMPLETED' ? new Date() : null,
      ...overrides,
    },
  });
}

async function createQuoteHelper(customerId: string, status: string = 'APPROVED', overrides = {}) {
  const currentYear = new Date().getFullYear();
  const randSeq = Math.floor(Math.random() * 9000) + 1000;
  return app.prisma.quote.create({
    data: {
      quoteNumber: `ORC-${currentYear}-${randSeq}`,
      customerId,
      equipment: 'Impressora Epson L3150',
      reportedDefect: 'Falha no tracionamento de papel',
      status,
      totalServices: 180.0,
      totalParts: 70.0,
      discount: 0.0,
      totalAmount: 250.0,
      ...overrides,
    },
  });
}

describe('Módulo de Faturamento e Pagamentos (Invoices & Payments)', () => {
  describe('POST /invoices — Criação de Faturas', () => {
    it('deve faturar uma Ordem de Serviço concluída (COMPLETED) com sucesso gerando protocolo anual FAT-YYYY-XXXX (201)', async () => {
      const customer = await createCustomerHelper();
      const workOrder = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          workOrderId: workOrder.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const invoice = response.json();
      const currentYear = new Date().getFullYear();
      expect(invoice.invoiceNumber).toMatch(new RegExp(`^FAT-${currentYear}-\\d{4}$`));
      expect(invoice.customerId).toBe(customer.id);
      expect(invoice.workOrderId).toBe(workOrder.id);
      expect(invoice.amount).toBe(400); // 250 + 150
      expect(invoice.discount).toBe(20);
      expect(invoice.netAmount).toBe(380);
      expect(invoice.paidAmount).toBe(0);
      expect(invoice.status).toBe('PENDING');
      expect(invoice.customer.name).toBe(customer.name);
    });

    it('deve gerar protocolos sequenciais anuais consecutivos FAT-YYYY-0001 e FAT-YYYY-0002', async () => {
      const customer = await createCustomerHelper();
      const wo1 = await createWorkOrderHelper(customer.id, 'COMPLETED');
      const wo2 = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const res1 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo1.id },
      });
      const res2 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo2.id },
      });

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);
      const currentYear = new Date().getFullYear();
      expect(res1.json().invoiceNumber).toBe(`FAT-${currentYear}-0001`);
      expect(res2.json().invoiceNumber).toBe(`FAT-${currentYear}-0002`);
    });

    it('deve faturar um Orçamento aprovado (APPROVED) com sucesso (201)', async () => {
      const customer = await createCustomerHelper();
      const quote = await createQuoteHelper(customer.id, 'APPROVED');

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          quoteId: quote.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const invoice = response.json();
      expect(invoice.quoteId).toBe(quote.id);
      expect(invoice.amount).toBe(250);
      expect(invoice.netAmount).toBe(250);
      expect(invoice.status).toBe('PENDING');
    });

    it('deve permitir faturamento avulso informando customerId e amount (201)', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          amount: 500.0,
          discount: 50.0,
          notes: 'Consultoria de TI avulsa',
        },
      });

      expect(response.statusCode).toBe(201);
      const invoice = response.json();
      expect(invoice.customerId).toBe(customer.id);
      expect(invoice.amount).toBe(500);
      expect(invoice.discount).toBe(50);
      expect(invoice.netAmount).toBe(450);
      expect(invoice.notes).toBe('Consultoria de TI avulsa');
    });

    it('deve rejeitar faturamento de Ordem de Serviço com status diferente de COMPLETED (400)', async () => {
      const customer = await createCustomerHelper();
      const openWO = await createWorkOrderHelper(customer.id, 'OPEN');

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          workOrderId: openWO.id,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('Apenas ordens de serviço concluídas (COMPLETED) podem ser faturadas');
    });

    it('deve rejeitar faturamento de Orçamento com status diferente de APPROVED (400)', async () => {
      const customer = await createCustomerHelper();
      const draftQuote = await createQuoteHelper(customer.id, 'DRAFT');

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          quoteId: draftQuote.id,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('Apenas orçamentos aprovados (APPROVED) podem ser faturados');
    });

    it('deve bloquear faturamento duplicado para a mesma Ordem de Serviço (409)', async () => {
      const customer = await createCustomerHelper();
      const workOrder = await createWorkOrderHelper(customer.id, 'COMPLETED');

      // Primeira fatura
      const res1 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: workOrder.id },
      });
      expect(res1.statusCode).toBe(201);

      // Segunda tentativa para a mesma OS
      const res2 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: workOrder.id },
      });
      expect(res2.statusCode).toBe(409);
      expect(res2.json().message).toContain('já possui uma fatura ativa');
    });

    it('deve bloquear faturamento duplicado para o mesmo Orçamento (409)', async () => {
      const customer = await createCustomerHelper();
      const quote = await createQuoteHelper(customer.id, 'APPROVED');

      const res1 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { quoteId: quote.id },
      });
      expect(res1.statusCode).toBe(201);

      const res2 = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { quoteId: quote.id },
      });
      expect(res2.statusCode).toBe(409);
      expect(res2.json().message).toContain('já possui uma fatura ativa');
    });

    it('deve rejeitar criação quando desconto for maior que o valor bruto (400)', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          amount: 100,
          discount: 150,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('não pode ser superior ao valor bruto');
    });

    it('deve retornar 404 quando a Ordem de Serviço informada não for encontrada', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          workOrderId: '00000000-0000-0000-0000-000000000099',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toContain('Ordem de serviço não encontrada');
    });

    it('deve retornar 401 sem cabeçalho Authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        payload: {
          amount: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /invoices — Listagem e Filtros', () => {
    it('deve listar faturas com paginação data e meta (200)', async () => {
      const customer = await createCustomerHelper();
      const wo1 = await createWorkOrderHelper(customer.id, 'COMPLETED');
      const wo2 = await createWorkOrderHelper(customer.id, 'COMPLETED');

      await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo1.id },
      });
      await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo2.id },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/invoices?page=1&limit=10',
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('deve filtrar faturas por status', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      // Fatura pendente
      const resPending = await app.inject({
        method: 'GET',
        url: '/invoices?status=PENDING',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(resPending.statusCode).toBe(200);
      expect(resPending.json().data.length).toBe(1);

      // Quitar fatura
      await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 380, paymentMethod: 'PIX' },
      });

      // Buscar por PAID
      const resPaid = await app.inject({
        method: 'GET',
        url: '/invoices?status=PAID',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(resPaid.statusCode).toBe(200);
      expect(resPaid.json().data.length).toBe(1);

      // Buscar por PENDING agora deve ser 0
      const resPendingAfter = await app.inject({
        method: 'GET',
        url: '/invoices?status=PENDING',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(resPendingAfter.json().data.length).toBe(0);
    });

    it('deve filtrar faturas por customerId', async () => {
      const c1 = await createCustomerHelper();
      const c2 = await createCustomerHelper();
      const wo1 = await createWorkOrderHelper(c1.id, 'COMPLETED');
      const wo2 = await createWorkOrderHelper(c2.id, 'COMPLETED');

      await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo1.id },
      });
      await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo2.id },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/invoices?customerId=${c1.id}`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].customer.id).toBe(c1.id);
    });
  });

  describe('GET /invoices/:id — Detalhes da Fatura', () => {
    it('deve buscar fatura por ID incluindo dados do cliente e saldo remanescente (200)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      const response = await app.inject({
        method: 'GET',
        url: `/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(200);
      const invoice = response.json();
      expect(invoice.id).toBe(invoiceId);
      expect(invoice.remainingBalance).toBe(380);
      expect(invoice.customer.id).toBe(customer.id);
      expect(invoice.payments).toEqual([]);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/00000000-0000-0000-0000-000000000099',
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toContain('Fatura não encontrada');
    });

    it('deve retornar 400 para ID que não é UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/nao-e-uuid',
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /invoices/:id/payments — Registro de Pagamentos', () => {
    it('deve registrar pagamento integral e transicionar fatura para PAID (201)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      const payRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 380.0,
          paymentMethod: 'PIX',
          notes: 'Pagamento via PIX instantâneo',
        },
      });

      expect(payRes.statusCode).toBe(201);
      const body = payRes.json();
      expect(body.payment.amount).toBe(380);
      expect(body.payment.paymentMethod).toBe('PIX');
      expect(body.payment.receivedBy).toBe('Operador Financeiro');
      expect(body.invoice.paidAmount).toBe(380);
      expect(body.invoice.status).toBe('PAID');

      // Verificar via GET /invoices/:id que remainingBalance é 0
      const getRes = await app.inject({
        method: 'GET',
        url: `/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(getRes.json().remainingBalance).toBe(0);
      expect(getRes.json().status).toBe('PAID');
    });

    it('deve processar múltiplos pagamentos parciais com transições PENDING -> PARTIALLY_PAID -> PAID', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED'); // netAmount: 380

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      // 1. Pagamento Parcial de R$ 100,00 (Entrada)
      const pay1 = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 100.0,
          paymentMethod: 'CASH',
          notes: 'Entrada em dinheiro',
        },
      });
      expect(pay1.statusCode).toBe(201);
      expect(pay1.json().invoice.paidAmount).toBe(100);
      expect(pay1.json().invoice.status).toBe('PARTIALLY_PAID');

      // Consultar saldo restante
      const get1 = await app.inject({
        method: 'GET',
        url: `/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(get1.json().remainingBalance).toBe(280);

      // 2. Pagamento Parcial de R$ 150,00
      const pay2 = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 150.0,
          paymentMethod: 'CREDIT_CARD',
          notes: 'Cartão de crédito 1x',
        },
      });
      expect(pay2.statusCode).toBe(201);
      expect(pay2.json().invoice.paidAmount).toBe(250);
      expect(pay2.json().invoice.status).toBe('PARTIALLY_PAID');

      // 3. Pagamento Quitação do saldo restante R$ 130,00
      const pay3 = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 130.0,
          paymentMethod: 'DEBIT_CARD',
          notes: 'Quitação no débito',
        },
      });
      expect(pay3.statusCode).toBe(201);
      expect(pay3.json().invoice.paidAmount).toBe(380);
      expect(pay3.json().invoice.status).toBe('PAID');

      const getFinal = await app.inject({
        method: 'GET',
        url: `/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(getFinal.json().remainingBalance).toBe(0);
      expect(getFinal.json().payments.length).toBe(3);
    });

    it('deve rejeitar pagamento com valor que excede o saldo devedor restante (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED'); // netAmount: 380

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      const payRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 400.0, // excede 380
          paymentMethod: 'PIX',
        },
      });

      expect(payRes.statusCode).toBe(400);
      expect(payRes.json().message).toContain('excede o saldo devedor restante da fatura');
    });

    it('deve rejeitar pagamento com valor zero ou negativo (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      const payZero = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 0, paymentMethod: 'PIX' },
      });
      expect(payZero.statusCode).toBe(400);

      const payNeg = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: -50, paymentMethod: 'PIX' },
      });
      expect(payNeg.statusCode).toBe(400);
    });

    it('deve rejeitar pagamento em fatura já integralmente quitada PAID (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      // Quitar
      await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 380, paymentMethod: 'PIX' },
      });

      // Tentar pagar novamente
      const payAgain = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 10, paymentMethod: 'PIX' },
      });

      expect(payAgain.statusCode).toBe(400);
      expect(payAgain.json().message).toContain('já está integralmente quitada');
    });

    it('deve rejeitar pagamento em fatura cancelada CANCELED (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      // Cancelar
      await app.inject({
        method: 'PATCH',
        url: `/invoices/${invoiceId}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { reason: 'Cliente desistiu' },
      });

      // Tentar pagar
      const payCancel = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 100, paymentMethod: 'PIX' },
      });

      expect(payCancel.statusCode).toBe(400);
      expect(payCancel.json().message).toContain('fatura cancelada');
    });
  });

  describe('PATCH /invoices/:id/cancel — Cancelamento de Faturas', () => {
    it('deve cancelar fatura pendente sem pagamentos com sucesso (200)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id, notes: 'Fatura de teste' },
      });
      const invoiceId = createRes.json().id;

      const cancelRes = await app.inject({
        method: 'PATCH',
        url: `/invoices/${invoiceId}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { reason: 'Erro de faturamento detectado pelo operador' },
      });

      expect(cancelRes.statusCode).toBe(200);
      const invoice = cancelRes.json();
      expect(invoice.status).toBe('CANCELED');
      expect(invoice.notes).toContain('[Cancelamento] Erro de faturamento detectado pelo operador');
    });

    it('deve bloquear cancelamento de fatura com pagamentos já registrados (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      // Pagar parcial
      await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 50, paymentMethod: 'BANK_SLIP' },
      });

      // Tentar cancelar
      const cancelRes = await app.inject({
        method: 'PATCH',
        url: `/invoices/${invoiceId}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { reason: 'Tentando cancelar com pagamento ativo' },
      });

      expect(cancelRes.statusCode).toBe(400);
      expect(cancelRes.json().message).toContain('Não é possível cancelar uma fatura com pagamentos já registrados');
    });

    it('deve bloquear cancelamento de fatura já cancelada (400)', async () => {
      const customer = await createCustomerHelper();
      const wo = await createWorkOrderHelper(customer.id, 'COMPLETED');

      const createRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { workOrderId: wo.id },
      });
      const invoiceId = createRes.json().id;

      await app.inject({
        method: 'PATCH',
        url: `/invoices/${invoiceId}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      const cancelAgain = await app.inject({
        method: 'PATCH',
        url: `/invoices/${invoiceId}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(cancelAgain.statusCode).toBe(400);
      expect(cancelAgain.json().message).toContain('A fatura já se encontra cancelada');
    });
  });
});
