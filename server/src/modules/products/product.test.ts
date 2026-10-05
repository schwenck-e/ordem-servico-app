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

describe('Módulo de Produtos (/products)', () => {
  const validProduct = {
    sku: 'MEM-DDR4-8GB',
    name: 'Memória RAM DDR4 8GB Kingston Fury',
    description: 'Módulo de memória 2666MHz CL16',
    unit: 'UN',
    costPrice: 120.5,
    salePrice: 220.0,
    initialStock: 15,
    minStock: 5,
  };

  describe('POST /products', () => {
    it('deve retornar 401 se requisição não contiver token Bearer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        payload: validProduct,
      });
      expect(res.statusCode).toBe(401);
    });

    it('deve cadastrar produto com sucesso (201) e criar movimentação de estoque inicial se initialStock > 0', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: validProduct,
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.sku).toBe('MEM-DDR4-8GB');
      expect(body.name).toBe(validProduct.name);
      expect(body.currentStock).toBe(15);
      expect(body.minStock).toBe(5);

      // Verificar criação da movimentação IN de saldo inicial
      const movements = await app.prisma.stockMovement.findMany({
        where: { productId: body.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('IN');
      expect(movements[0].quantity).toBe(15);
      expect(movements[0].reason).toContain('Saldo inicial cadastrado');
    });

    it('deve cadastrar produto com initialStock = 0 sem gerar movimentação inicial', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          ...validProduct,
          sku: 'MEM-DDR5-16GB',
          initialStock: 0,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.currentStock).toBe(0);

      const movements = await app.prisma.stockMovement.findMany({
        where: { productId: body.id },
      });
      expect(movements).toHaveLength(0);
    });

    it('deve normalizar SKU para caixa alta automaticamente', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          ...validProduct,
          sku: 'ssd-nvme-1tb',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().sku).toBe('SSD-NVME-1TB');
    });

    it('deve retornar 409 Conflict ao tentar cadastrar produto com SKU já existente', async () => {
      await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: validProduct,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          ...validProduct,
          name: 'Outro nome com mesmo SKU',
        },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().message).toContain('Já existe um produto cadastrado com o SKU informado');
    });

    it('deve retornar 400 se campos obrigatórios forem inválidos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          sku: 'A', // min 2
          name: '',
          costPrice: -10, // negative
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      await app.prisma.product.createMany({
        data: [
          { sku: 'DISC-SSD-240', name: 'SSD 240GB Kingston', currentStock: 10, minStock: 2 },
          { sku: 'DISC-SSD-480', name: 'SSD 480GB Kingston', currentStock: 4, minStock: 5 },
          { sku: 'CABO-HDMI-2M', name: 'Cabo HDMI 2 Metros', currentStock: 20, minStock: 5 },
        ],
      });
    });

    it('deve listar produtos com metadados de paginação', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/products?page=1&limit=2',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.totalPages).toBe(2);
    });

    it('deve filtrar produtos por busca textual (nome ou SKU)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/products?search=HDMI',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].sku).toBe('CABO-HDMI-2M');
    });
  });

  describe('GET /products/low-stock', () => {
    it('deve retornar apenas produtos onde currentStock <= minStock', async () => {
      await app.prisma.product.createMany({
        data: [
          { sku: 'PROD-OK-1', name: 'Produto em Estoque Normal', currentStock: 10, minStock: 5 },
          { sku: 'PROD-LOW-1', name: 'Produto em Estoque Baixo', currentStock: 3, minStock: 5 },
          { sku: 'PROD-ZERO-1', name: 'Produto Zerado', currentStock: 0, minStock: 2 },
          { sku: 'PROD-EQUAL-1', name: 'Produto no Limite Mínimo', currentStock: 4, minStock: 4 },
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: '/products/low-stock',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const list = res.json();
      expect(list).toHaveLength(3);
      const skus = list.map((p: any) => p.sku);
      expect(skus).toContain('PROD-LOW-1');
      expect(skus).toContain('PROD-ZERO-1');
      expect(skus).toContain('PROD-EQUAL-1');
      expect(skus).not.toContain('PROD-OK-1');
    });
  });

  describe('GET /products/:id', () => {
    it('deve retornar detalhes do produto com contagens e histórico recente', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'FONTE-500W',
          name: 'Fonte Corsair 500W',
          costPrice: 200,
          salePrice: 350,
          currentStock: 8,
          minStock: 2,
        },
      });

      await app.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: 8,
          reason: 'Lote de compra',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/products/${product.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(product.id);
      expect(body.movements).toHaveLength(1);
      expect(body._count.movements).toBe(1);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/products/00000000-0000-0000-0000-000000000000',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().message).toContain('Produto não encontrado');
    });

    it('deve retornar 400 para UUID inválido', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/products/invalido',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /products/:id', () => {
    it('deve atualizar dados cadastrais do produto com sucesso (200)', async () => {
      const product = await app.prisma.product.create({
        data: {
          sku: 'COOLER-120',
          name: 'Cooler Fan 120mm',
          salePrice: 40,
        },
      });

      const res = await app.inject({
        method: 'PUT',
        url: `/products/${product.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          name: 'Cooler Fan 120mm RGB Silencioso',
          salePrice: 55,
          minStock: 3,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.name).toBe('Cooler Fan 120mm RGB Silencioso');
      expect(body.salePrice).toBe(55);
      expect(body.minStock).toBe(3);
    });

    it('deve retornar 409 se alteração de SKU conflitar com outro produto', async () => {
      await app.prisma.product.create({
        data: { sku: 'PROD-A', name: 'Produto A' },
      });
      const prodB = await app.prisma.product.create({
        data: { sku: 'PROD-B', name: 'Produto B' },
      });

      const res = await app.inject({
        method: 'PUT',
        url: `/products/${prodB.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: { sku: 'PROD-A' },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().message).toContain('Já existe um produto cadastrado com o SKU informado');
    });
  });

  describe('DELETE /products/:id', () => {
    it('deve retornar 403 Forbidden se OPERATOR tentar excluir produto', async () => {
      const product = await app.prisma.product.create({
        data: { sku: 'EXCLUIR-1', name: 'Para exclusão' },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/products/${product.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(403);
    });

    it('deve permitir que ADMIN exclua produto sem movimentações nem ordens de serviço (204)', async () => {
      const product = await app.prisma.product.create({
        data: { sku: 'EXCLUIR-2', name: 'Produto virgem' },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/products/${product.id}`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(204);

      const found = await app.prisma.product.findUnique({ where: { id: product.id } });
      expect(found).toBeNull();
    });

    it('deve retornar 409 Conflict ao tentar excluir produto com movimentações de estoque vinculadas', async () => {
      const product = await app.prisma.product.create({
        data: { sku: 'EXCLUIR-3', name: 'Produto com histórico' },
      });

      await app.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: 5,
          reason: 'Lote teste',
        },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/products/${product.id}`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().message).toContain('Não é possível excluir o produto pois existem movimentações de estoque');
    });
  });
});
