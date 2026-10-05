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
    name: 'Admin Teste',
    email: 'admin@empresa.com',
    role: 'ADMIN',
  });

  operatorToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Operador Teste',
    email: 'operador@empresa.com',
    role: 'OPERATOR',
  });
});

afterAll(async () => {
  if (app) await app.close();
});

beforeEach(async () => {
  await app.prisma.financialTransaction.deleteMany();
  await app.prisma.payment.deleteMany();
  await app.prisma.invoice.deleteMany();
  await app.prisma.quoteItem.deleteMany();
  await app.prisma.quote.deleteMany();
  await app.prisma.workOrderAttachment.deleteMany();
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.stockMovement.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.product.deleteMany();
  await app.prisma.customer.deleteMany();
  await app.prisma.technician.deleteMany();
});

describe('Módulo de Estoque e Movimentações (/stock)', () => {
  describe('POST /stock/movements', () => {
    it('deve retornar 401 se requisição não contiver token Bearer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        payload: {
          productId: '00000000-0000-0000-0000-000000000001',
          type: 'IN',
          quantity: 10,
          reason: 'Entrada sem auth',
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('deve registrar entrada manual (IN) e incrementar o saldo atual do produto (201)', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'CABO-REDE-100M',
          name: 'Bobina Cabo de Rede 100m',
          currentStock: 5,
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          productId: product.id,
          type: 'IN',
          quantity: 10,
          unitPrice: 150.0,
          reason: 'Compra com Fornecedor XYZ - NF 1234',
        },
      });

      expect(res.statusCode).toBe(201);
      const movement = res.json();
      expect(movement.type).toBe('IN');
      expect(movement.quantity).toBe(10);
      expect(movement.product.currentStock).toBe(15);

      const updatedProduct = await app.prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.currentStock).toBe(15);
    });

    it('deve registrar saída manual (OUT) e debitar o saldo atual quando houver estoque suficiente (201)', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'PASTA-TERM-PRATA',
          name: 'Pasta Térmica Prata 10g',
          currentStock: 20,
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          productId: product.id,
          type: 'OUT',
          quantity: 5,
          reason: 'Uso em bancada interna / manutenção preventiva',
        },
      });

      expect(res.statusCode).toBe(201);
      const movement = res.json();
      expect(movement.type).toBe('OUT');
      expect(movement.quantity).toBe(5);
      expect(movement.product.currentStock).toBe(15);

      const updatedProduct = await app.prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.currentStock).toBe(15);
    });

    it('deve retornar 400 Bad Request se a saída (OUT) exceder o saldo disponível', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'PLACA-MAE-AM4',
          name: 'Placa Mãe B450M AM4',
          currentStock: 2,
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          productId: product.id,
          type: 'OUT',
          quantity: 5,
          reason: 'Tentativa de retirada acima do estoque',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('Estoque insuficiente');
      expect(res.json().message).toContain('Saldo disponível: 2, Solicitado: 5');

      const unchangedProduct = await app.prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(unchangedProduct?.currentStock).toBe(2);
    });

    it('deve registrar ajuste de balanço (ADJUSTMENT) definindo o novo saldo físico absoluto (201)', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'MOUSE-USB-OPT',
          name: 'Mouse USB Básico',
          currentStock: 18,
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: 12, // Contagem física revelou 12 unidades reais
          reason: 'Balanço mensal de inventário - divergência física',
        },
      });

      expect(res.statusCode).toBe(201);
      const movement = res.json();
      expect(movement.type).toBe('ADJUSTMENT');
      expect(movement.product.currentStock).toBe(12);

      const updatedProduct = await app.prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.currentStock).toBe(12);
    });

    it('deve retornar 404 Not Found se o produto informado não existir', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/stock/movements',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          productId: '00000000-0000-0000-0000-000000000000',
          type: 'IN',
          quantity: 5,
          reason: 'Produto fantasma',
        },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().message).toContain('Produto não encontrado');
    });
  });

  describe('GET /stock/movements', () => {
    let productA: any;
    let productB: any;

    beforeEach(async () => {
      productA = await app.prisma.product.create({
        data: { sku: 'PROD-A', name: 'Item A', currentStock: 10 },
      });
      productB = await app.prisma.product.create({
        data: { sku: 'PROD-B', name: 'Item B', currentStock: 20 },
      });

      await app.prisma.stockMovement.createMany({
        data: [
          { productId: productA.id, type: 'IN', quantity: 10, reason: 'Entrada A1' },
          { productId: productA.id, type: 'OUT', quantity: 2, reason: 'Saída A2' },
          { productId: productB.id, type: 'IN', quantity: 20, reason: 'Entrada B1' },
        ],
      });
    });

    it('deve listar movimentações com paginação', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/stock/movements?page=1&limit=2',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
    });

    it('deve filtrar movimentações por productId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/stock/movements?productId=${productA.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      body.data.forEach((m: any) => {
        expect(m.productId).toBe(productA.id);
      });
    });

    it('deve filtrar movimentações por type (OUT)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/stock/movements?type=OUT',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].reason).toBe('Saída A2');
    });
  });
});
