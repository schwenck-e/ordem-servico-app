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
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN',
  });
});

afterAll(async () => {
  if (app) {
    await app.prisma.quoteItem.deleteMany();
    await app.prisma.quote.deleteMany();
    await app.prisma.workOrderLog.deleteMany();
    await app.prisma.stockMovement.deleteMany();
    await app.prisma.workOrderItem.deleteMany();
    await app.prisma.workOrder.deleteMany();
    await app.prisma.product.deleteMany();
    await app.prisma.technician.deleteMany();
    await app.prisma.customer.deleteMany();
    await app.close();
  }
});

beforeEach(async () => {
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.stockMovement.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.quoteItem.deleteMany();
  await app.prisma.quote.deleteMany();
  await app.prisma.workOrderAttachment.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.product.deleteMany();
  await app.prisma.technician.deleteMany();
  await app.prisma.customer.deleteMany();
});

// ─── Helpers de Teste ───────────────────────────────────────────────────────

async function createCustomerHelper(overrides = {}) {
  return app.prisma.customer.create({
    data: {
      name: 'João da Silva',
      document: '529.982.247-25',
      email: 'joao.silva@exemplo.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123 - Centro, SP',
      ...overrides,
    },
  });
}

async function createTechnicianHelper(overrides = {}) {
  return app.prisma.technician.create({
    data: {
      name: 'Roberto Alves',
      email: 'roberto.alves@assistencia.com',
      phone: '(11) 91234-5678',
      specialty: 'Eletrônica e Placas',
      isActive: true,
      ...overrides,
    },
  });
}

async function createProductHelper(overrides = {}) {
  return app.prisma.product.create({
    data: {
      sku: 'SSD-NVME-1TB',
      name: 'SSD NVMe Kingston 1TB',
      description: 'SSD NVMe M.2 2280 PCIe 4.0',
      unit: 'UN',
      costPrice: 280.0,
      salePrice: 450.0,
      currentStock: 10,
      minStock: 2,
      ...overrides,
    },
  });
}

// ─── Suíte de Testes do Módulo de Orçamentos ─────────────────────────────────

describe('Módulo de Orçamentos (Quotes)', () => {
  // ─── POST /quotes ─────────────────────────────────────────────────────────
  describe('POST /quotes', () => {
    it('deve criar um orçamento básico em DRAFT calculando totais corretamente (201)', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Notebook Dell XPS 15',
          reportedDefect: 'Superaquecimento e desligando sozinho',
          discount: 50,
          items: [
            {
              type: 'SERVICE',
              description: 'Limpeza interna e troca de pasta térmica',
              quantity: 1,
              unitPrice: 200,
            },
            {
              type: 'PART',
              description: 'Pasta Térmica Artic Silver',
              quantity: 1,
              unitPrice: 80,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      expect(body.id).toBeDefined();
      expect(body.quoteNumber).toMatch(/^ORC-\d{4}-\d{4}$/);
      expect(body.status).toBe('DRAFT');
      expect(body.totalServices).toBe(200);
      expect(body.totalParts).toBe(80);
      expect(body.discount).toBe(50);
      expect(body.totalAmount).toBe(230); // 280 - 50 = 230
      expect(body.items).toHaveLength(2);
      expect(body.workOrderId).toBeNull();
    });

    it('deve gerar protocolos sequenciais anuais ORC-YYYY-0001, ORC-YYYY-0002', async () => {
      const customer = await createCustomerHelper();
      const currentYear = new Date().getFullYear();

      const res1 = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Aparelho 1',
          reportedDefect: 'Defeito 1',
          items: [{ type: 'SERVICE', description: 'Serviço 1', quantity: 1, unitPrice: 100 }],
        },
      });
      expect(res1.statusCode).toBe(201);
      expect(res1.json().quoteNumber).toBe(`ORC-${currentYear}-0001`);

      const res2 = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Aparelho 2',
          reportedDefect: 'Defeito 2',
          items: [{ type: 'SERVICE', description: 'Serviço 2', quantity: 1, unitPrice: 150 }],
        },
      });
      expect(res2.statusCode).toBe(201);
      expect(res2.json().quoteNumber).toBe(`ORC-${currentYear}-0002`);
    });

    it('NÃO deve baixar estoque de peças cadastradas durante a criação do orçamento', async () => {
      const customer = await createCustomerHelper();
      const product = await createProductHelper({ currentStock: 10 });

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'PC Gamer',
          reportedDefect: 'Upgrade de armazenamento',
          items: [
            {
              productId: product.id,
              type: 'PART',
              description: product.name,
              quantity: 2,
              unitPrice: product.salePrice,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);

      // Saldo do produto deve permanecer inalterado (10)
      const freshProduct = await app.prisma.product.findUnique({ where: { id: product.id } });
      expect(freshProduct?.currentStock).toBe(10);
    });

    it('deve retornar 400 se a lista de itens for vazia', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Console PS5',
          reportedDefect: 'Não liga',
          items: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('deve retornar 400 se o desconto for superior ao valor total bruto dos itens', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Monitor 4K',
          reportedDefect: 'Tela piscando',
          discount: 500,
          items: [{ type: 'SERVICE', description: 'Reparo placa lógica', quantity: 1, unitPrice: 300 }],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('desconto');
    });

    it('deve retornar 400 se o desconto for negativo', async () => {
      const customer = await createCustomerHelper();

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Notebook',
          reportedDefect: 'Tela quebrada',
          discount: -20,
          items: [{ type: 'SERVICE', description: 'Troca de tela', quantity: 1, unitPrice: 400 }],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('deve retornar 404 se o cliente informado não existir', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: 'a0000000-0000-0000-0000-000000000099',
          equipment: 'Notebook',
          reportedDefect: 'Defeito',
          items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 50 }],
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toContain('Cliente não encontrado');
    });

    it('deve retornar 400 se o técnico informado estiver inativo', async () => {
      const customer = await createCustomerHelper();
      const technician = await createTechnicianHelper({ isActive: false });

      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          technicianId: technician.id,
          equipment: 'Notebook',
          reportedDefect: 'Defeito',
          items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 50 }],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('inativo');
    });

    it('deve retornar 401 sem cabeçalho Authorization', async () => {
      const customer = await createCustomerHelper();
      const response = await app.inject({
        method: 'POST',
        url: '/quotes',
        payload: {
          customerId: customer.id,
          equipment: 'Notebook',
          reportedDefect: 'Defeito',
          items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 50 }],
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ─── GET /quotes & GET /quotes/:id ─────────────────────────────────────────
  describe('GET /quotes & GET /quotes/:id', () => {
    it('deve listar orçamentos com paginação meta e data (200)', async () => {
      const customer = await createCustomerHelper();

      for (let i = 1; i <= 3; i++) {
        await app.inject({
          method: 'POST',
          url: '/quotes',
          headers: { authorization: `Bearer ${authToken}` },
          payload: {
            customerId: customer.id,
            equipment: `Equipamento ${i}`,
            reportedDefect: `Defeito ${i}`,
            items: [{ type: 'SERVICE', description: `Serviço ${i}`, quantity: 1, unitPrice: 100 * i }],
          },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/quotes?page=1&limit=2',
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.page).toBe(1);
      expect(body.meta.totalPages).toBe(2);
    });

    it('deve filtrar orçamentos por status', async () => {
      const customer = await createCustomerHelper();

      const res = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Tablet',
          reportedDefect: 'Bateria estufada',
          items: [{ type: 'SERVICE', description: 'Troca bateria', quantity: 1, unitPrice: 150 }],
        },
      });
      const quoteId = res.json().id;

      // Promove para SENT
      await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'SENT' },
      });

      const listDraft = await app.inject({
        method: 'GET',
        url: '/quotes?status=DRAFT',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(listDraft.json().data).toHaveLength(0);

      const listSent = await app.inject({
        method: 'GET',
        url: '/quotes?status=SENT',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(listSent.json().data).toHaveLength(1);
      expect(listSent.json().data[0].id).toBe(quoteId);
    });

    it('deve buscar detalhes do orçamento por ID incluindo cliente e itens (200)', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Impressora Laser',
          reportedDefect: 'Atolamento constante',
          items: [{ type: 'SERVICE', description: 'Troca de rolete', quantity: 1, unitPrice: 120 }],
        },
      });

      const quoteId = created.json().id;

      const response = await app.inject({
        method: 'GET',
        url: `/quotes/${quoteId}`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(quoteId);
      expect(body.customer.name).toBe('João da Silva');
      expect(body.items).toHaveLength(1);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/quotes/b0000000-0000-0000-0000-000000000099',
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ─── PUT /quotes/:id ──────────────────────────────────────────────────────
  describe('PUT /quotes/:id', () => {
    it('deve atualizar dados e itens com sucesso em status DRAFT (200)', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Notebook HP',
          reportedDefect: 'Teclado falhando',
          items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 100 }],
        },
      });
      const quoteId = created.json().id;

      const response = await app.inject({
        method: 'PUT',
        url: `/quotes/${quoteId}`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          equipment: 'Notebook HP EliteBook',
          reportedDefect: 'Teclado falhando tecla Shift e Enter',
          discount: 20,
          items: [
            { type: 'SERVICE', description: 'Troca de teclado', quantity: 1, unitPrice: 120 },
            { type: 'PART', description: 'Teclado ABNT2 HP', quantity: 1, unitPrice: 180 },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.equipment).toBe('Notebook HP EliteBook');
      expect(body.totalServices).toBe(120);
      expect(body.totalParts).toBe(180);
      expect(body.discount).toBe(20);
      expect(body.totalAmount).toBe(280); // 300 - 20 = 280
      expect(body.items).toHaveLength(2);
    });

    it('deve bloquear edição (HTTP 400) se o orçamento já estiver em status SENT', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'MacBook Pro',
          reportedDefect: 'Bateria viciada',
          items: [{ type: 'SERVICE', description: 'Troca bateria', quantity: 1, unitPrice: 350 }],
        },
      });
      const quoteId = created.json().id;

      // Altera status para SENT
      await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'SENT' },
      });

      // Tenta editar
      const response = await app.inject({
        method: 'PUT',
        url: `/quotes/${quoteId}`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          equipment: 'MacBook Pro 16',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('Apenas orçamentos em rascunho (DRAFT) podem ser alterados');
    });
  });

  // ─── PATCH /quotes/:id/status ─────────────────────────────────────────────
  describe('PATCH /quotes/:id/status', () => {
    it('deve transicionar status no fluxo regular: DRAFT -> SENT -> APPROVED (200)', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Desktop',
          reportedDefect: 'Não liga',
          items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 80 }],
        },
      });
      const quoteId = created.json().id;

      // 1. DRAFT -> SENT
      const resSent = await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'SENT', notes: 'Enviado por WhatsApp ao cliente' },
      });
      expect(resSent.statusCode).toBe(200);
      expect(resSent.json().status).toBe('SENT');
      expect(resSent.json().notes).toContain('WhatsApp');

      // 2. SENT -> APPROVED
      const resApproved = await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'APPROVED', notes: 'Aprovado pelo cliente' },
      });
      expect(resApproved.statusCode).toBe(200);
      expect(resApproved.json().status).toBe('APPROVED');
    });

    it('deve permitir rejeitar um orçamento em DRAFT ou SENT', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Smartphone',
          reportedDefect: 'Tela trincada',
          items: [{ type: 'SERVICE', description: 'Troca de frontal', quantity: 1, unitPrice: 300 }],
        },
      });
      const quoteId = created.json().id;

      const resRejected = await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'REJECTED', notes: 'Cliente achou o valor elevado' },
      });
      expect(resRejected.statusCode).toBe(200);
      expect(resRejected.json().status).toBe('REJECTED');
    });

    it('deve rejeitar transições inválidas (ex: DRAFT para EXPIRED)', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Monitor',
          reportedDefect: 'Sem imagem',
          items: [{ type: 'SERVICE', description: 'Reparo', quantity: 1, unitPrice: 100 }],
        },
      });
      const quoteId = created.json().id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'EXPIRED' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('Transição de status inválida');
    });
  });

  // ─── POST /quotes/:id/convert-to-work-order ───────────────────────────────
  describe('POST /quotes/:id/convert-to-work-order', () => {
    it('deve converter com sucesso o orçamento em Ordem de Serviço com baixa em estoque e log', async () => {
      const customer = await createCustomerHelper();
      const technician = await createTechnicianHelper();
      const product = await createProductHelper({ currentStock: 5 });

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          technicianId: technician.id,
          equipment: 'Notebook Dell Latitude',
          serialNumber: 'DL-998877',
          reportedDefect: 'Lentidão extrema no boot',
          technicalDiagnosis: 'HDD original com setores defeituosos, recomendado upgrade para NVMe',
          discount: 30,
          items: [
            {
              type: 'SERVICE',
              description: 'Clonagem de sistema operacional e instalação de SSD',
              quantity: 1,
              unitPrice: 150,
            },
            {
              productId: product.id,
              type: 'PART',
              description: product.name,
              quantity: 2,
              unitPrice: product.salePrice,
            },
          ],
        },
      });
      expect(created.statusCode).toBe(201);
      const quoteId = created.json().id;

      // Conversão do Orçamento em OS
      const response = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(201);
      const { workOrder, quote } = response.json();

      // 1. Validação da WorkOrder gerada
      expect(workOrder.id).toBeDefined();
      expect(workOrder.orderNumber).toMatch(/^OS-\d{4}-\d{4}$/);
      expect(workOrder.customerId).toBe(customer.id);
      expect(workOrder.technicianId).toBe(technician.id);
      expect(workOrder.equipment).toBe('Notebook Dell Latitude');
      expect(workOrder.serialNumber).toBe('DL-998877');
      expect(workOrder.reportedDefect).toBe('Lentidão extrema no boot');
      expect(workOrder.technicalDiagnosis).toBe('HDD original com setores defeituosos, recomendado upgrade para NVMe');
      expect(workOrder.status).toBe('OPEN');
      expect(workOrder.totalServices).toBe(150);
      expect(workOrder.totalParts).toBe(900); // 2 * 450
      expect(workOrder.discount).toBe(30);
      expect(workOrder.totalAmount).toBe(1020); // 1050 - 30 = 1020
      expect(workOrder.items).toHaveLength(2);

      // 2. Validação do log inicial da OS referenciando o orçamento
      expect(workOrder.logs).toHaveLength(1);
      expect(workOrder.logs[0].comment).toContain(`Ordem de serviço gerada a partir da conversão do orçamento ${quote.quoteNumber}`);

      // 3. Validação do Orçamento atualizado
      expect(quote.status).toBe('APPROVED');
      expect(quote.workOrderId).toBe(workOrder.id);

      // 4. Validação da baixa de estoque físico
      const freshProduct = await app.prisma.product.findUnique({ where: { id: product.id } });
      expect(freshProduct?.currentStock).toBe(3); // 5 - 2 = 3

      // 5. Validação da movimentação de estoque OUT
      const movements = await app.prisma.stockMovement.findMany({
        where: { workOrderId: workOrder.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('OUT');
      expect(movements[0].quantity).toBe(2);
      expect(movements[0].productId).toBe(product.id);
      expect(movements[0].reason).toContain(`Conversão do Orçamento ${quote.quoteNumber} para OS ${workOrder.orderNumber}`);
    });

    it('deve abortar transação (HTTP 400) se o estoque for insuficiente e manter tudo inalterado', async () => {
      const customer = await createCustomerHelper();
      const product = await createProductHelper({ currentStock: 1 });

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Workstation',
          reportedDefect: 'Substituição de peças',
          items: [
            {
              productId: product.id,
              type: 'PART',
              description: product.name,
              quantity: 2, // Solicitando 2, mas só tem 1 em estoque
              unitPrice: product.salePrice,
            },
          ],
        },
      });
      const quoteId = created.json().id;

      const response = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('Estoque insuficiente');

      // Saldo do produto permanece 1
      const freshProduct = await app.prisma.product.findUnique({ where: { id: product.id } });
      expect(freshProduct?.currentStock).toBe(1);

      // Nenhuma OS criada
      const workOrders = await app.prisma.workOrder.findMany();
      expect(workOrders).toHaveLength(0);

      // Orçamento continua em DRAFT sem OS vinculada
      const freshQuote = await app.prisma.quote.findUnique({ where: { id: quoteId } });
      expect(freshQuote?.status).toBe('DRAFT');
      expect(freshQuote?.workOrderId).toBeNull();
    });

    it('deve retornar 409 ao tentar converter um orçamento já convertido', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Notebook',
          reportedDefect: 'Formatação',
          items: [{ type: 'SERVICE', description: 'Formatação e backup', quantity: 1, unitPrice: 150 }],
        },
      });
      const quoteId = created.json().id;

      // Primeira conversão: Sucesso (201)
      const first = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(first.statusCode).toBe(201);

      // Segunda conversão: Bloqueio 409 Conflict
      const second = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(second.statusCode).toBe(409);
      expect(second.json().message).toContain('já foi convertido');
    });

    it('deve retornar 400 ao tentar converter um orçamento REJECTED', async () => {
      const customer = await createCustomerHelper();

      const created = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Smart TV',
          reportedDefect: 'Sem som',
          items: [{ type: 'SERVICE', description: 'Reparo placa de áudio', quantity: 1, unitPrice: 180 }],
        },
      });
      const quoteId = created.json().id;

      // Rejeita o orçamento
      await app.inject({
        method: 'PATCH',
        url: `/quotes/${quoteId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'REJECTED' },
      });

      // Tenta converter
      const response = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { authorization: `Bearer ${authToken}` },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('REJECTED');
    });
  });
});
