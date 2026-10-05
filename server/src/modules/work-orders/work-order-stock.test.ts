import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

let app: FastifyInstance;
let operatorToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  operatorToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
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

describe('Integração de Estoque no Ciclo de Vida da Ordem de Serviço', () => {
  let customer: any;
  let technician: any;
  let productSSD: any;
  let productRAM: any;

  beforeEach(async () => {
    customer = await app.prisma.customer.create({
      data: {
        name: 'Cliente Teste Estoque',
        document: '52.888.777/0001-99',
        email: 'estoque@cliente.com',
        phone: '11988887777',
        address: 'Rua das Peças, 100',
      },
    });

    technician = await app.prisma.technician.create({
      data: {
        name: 'Técnico Especialista',
        email: 'tecnico@empresa.com',
        phone: '11977778888',
        specialty: 'Hardware',
        isActive: true,
      },
    });

    productSSD = await app.prisma.product.create({
      data: {
        sku: 'SSD-1TB-NVME',
        name: 'SSD 1TB NVMe Kingston',
        costPrice: 250.0,
        salePrice: 450.0,
        currentStock: 10,
        minStock: 2,
      },
    });

    productRAM = await app.prisma.product.create({
      data: {
        sku: 'RAM-16GB-DDR4',
        name: 'Memória RAM 16GB DDR4 Corsair',
        costPrice: 180.0,
        salePrice: 320.0,
        currentStock: 5,
        minStock: 1,
      },
    });
  });

  describe('Criação de Ordem de Serviço com Peças de Estoque (POST /work-orders)', () => {
    it('deve debitar o saldo do produto e criar movimentação OUT vinculada à OS (201)', async () => {
      const payload = {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Notebook Dell G15',
        reportedDefect: 'Armazenamento insuficiente e lentidão',
        items: [
          {
            type: 'SERVICE',
            description: 'Mão de obra de instalação e clonagem',
            quantity: 1,
            unitPrice: 150.0,
          },
          {
            productId: productSSD.id,
            type: 'PART',
            description: 'SSD 1TB NVMe Kingston',
            quantity: 2,
            unitPrice: 450.0,
          },
        ],
      };

      const res = await app.inject({
        method: 'POST',
        url: '/work-orders',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload,
      });

      expect(res.statusCode).toBe(201);
      const createdOS = res.json();
      expect(createdOS.id).toBeDefined();

      // Verificar que o saldo do produto foi debitado de 10 para 8
      const updatedProduct = await app.prisma.product.findUnique({
        where: { id: productSSD.id },
      });
      expect(updatedProduct?.currentStock).toBe(8);

      // Verificar que o item da OS contém productId gravado
      const items = await app.prisma.workOrderItem.findMany({
        where: { workOrderId: createdOS.id },
      });
      const partItem = items.find((i) => i.type === 'PART');
      expect(partItem?.productId).toBe(productSSD.id);

      // Verificar movimentação de estoque OUT gerada
      const movements = await app.prisma.stockMovement.findMany({
        where: { workOrderId: createdOS.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('OUT');
      expect(movements[0].productId).toBe(productSSD.id);
      expect(movements[0].quantity).toBe(2);
      expect(movements[0].unitPrice).toBe(450.0);
      expect(movements[0].reason).toContain(createdOS.orderNumber);
    });

    it('deve retornar 400 Bad Request e NÃO criar a OS se saldo for insuficiente para a peça solicitada', async () => {
      const payload = {
        customerId: customer.id,
        equipment: 'Desktop Gamer',
        reportedDefect: 'Upgrade geral de RAM',
        items: [
          {
            productId: productRAM.id,
            type: 'PART',
            description: 'Memória RAM 16GB DDR4 Corsair',
            quantity: 8, // Estoque é apenas 5
            unitPrice: 320.0,
          },
        ],
      };

      const res = await app.inject({
        method: 'POST',
        url: '/work-orders',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload,
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('Estoque insuficiente para o produto');
      expect(res.json().message).toContain('Saldo disponível: 5, Solicitado: 8');

      // Garantir integridade atômica: nenhuma OS criada e saldo intacto
      const osCount = await app.prisma.workOrder.count();
      expect(osCount).toBe(0);

      const unchangedProduct = await app.prisma.product.findUnique({
        where: { id: productRAM.id },
      });
      expect(unchangedProduct?.currentStock).toBe(5);

      const movementCount = await app.prisma.stockMovement.count();
      expect(movementCount).toBe(0);
    });

    it('deve retornar 404 Not Found se o productId informado não existir', async () => {
      const payload = {
        customerId: customer.id,
        equipment: 'Notebook Lenovo',
        reportedDefect: 'Troca de tela',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000000',
            type: 'PART',
            description: 'Tela 15.6 LED',
            quantity: 1,
            unitPrice: 300.0,
          },
        ],
      };

      const res = await app.inject({
        method: 'POST',
        url: '/work-orders',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload,
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().message).toContain('não encontrado');
    });
  });

  describe('Edição e Reconciliação de Itens (PUT /work-orders/:id)', () => {
    let order: any;

    beforeEach(async () => {
      // Criar OS inicial com 2 unidades do SSD (saldo original 10 -> fica 8)
      const res = await app.inject({
        method: 'POST',
        url: '/work-orders',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Workstation HP',
          reportedDefect: 'Upgrade',
          items: [
            {
              productId: productSSD.id,
              type: 'PART',
              description: 'SSD 1TB NVMe Kingston',
              quantity: 2,
              unitPrice: 450.0,
            },
          ],
        },
      });
      order = res.json();
    });

    it('deve estornar a peça antiga e debitar a nova peça na substituição de itens (200)', async () => {
      // Substituir os 2 SSDs por 3 pentes de RAM (productRAM tem 5 no estoque)
      const res = await app.inject({
        method: 'PUT',
        url: `/work-orders/${order.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          items: [
            {
              productId: productRAM.id,
              type: 'PART',
              description: 'Memória RAM 16GB DDR4 Corsair',
              quantity: 3,
              unitPrice: 320.0,
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);

      // SSD deve ter sido estornado: 8 + 2 = 10
      const restoredSSD = await app.prisma.product.findUnique({
        where: { id: productSSD.id },
      });
      expect(restoredSSD?.currentStock).toBe(10);

      // RAM deve ter sido debitada: 5 - 3 = 2
      const debitedRAM = await app.prisma.product.findUnique({
        where: { id: productRAM.id },
      });
      expect(debitedRAM?.currentStock).toBe(2);

      // Deve haver movimentação de estorno (IN) para o SSD e de saída (OUT) para a RAM
      const movements = await app.prisma.stockMovement.findMany({
        where: { workOrderId: order.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(movements).toHaveLength(3); // 1 inicial (OUT), 1 estorno (IN), 1 nova (OUT)
      expect(movements[1].type).toBe('IN');
      expect(movements[1].productId).toBe(productSSD.id);
      expect(movements[1].quantity).toBe(2);
      expect(movements[1].reason).toContain('Estorno');

      expect(movements[2].type).toBe('OUT');
      expect(movements[2].productId).toBe(productRAM.id);
      expect(movements[2].quantity).toBe(3);
    });

    it('deve reverter atomicamente a edição se a nova peça não possuir estoque suficiente', async () => {
      // Tentar trocar SSD por 10 pentes de RAM (RAM tem apenas 5 disponíveis)
      const res = await app.inject({
        method: 'PUT',
        url: `/work-orders/${order.id}`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          items: [
            {
              productId: productRAM.id,
              type: 'PART',
              description: 'Memória RAM 16GB DDR4 Corsair',
              quantity: 10,
              unitPrice: 320.0,
            },
          ],
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('Estoque insuficiente');

      // Transação deve ter sofrido rollback total:
      // Saldo do SSD deve continuar em 8
      const ssd = await app.prisma.product.findUnique({ where: { id: productSSD.id } });
      expect(ssd?.currentStock).toBe(8);

      // Saldo da RAM deve continuar em 5
      const ram = await app.prisma.product.findUnique({ where: { id: productRAM.id } });
      expect(ram?.currentStock).toBe(5);

      // Os itens da OS continuam sendo os 2 SSDs originais
      const currentOrder = await app.prisma.workOrder.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      expect(currentOrder?.items).toHaveLength(1);
      expect(currentOrder?.items[0].productId).toBe(productSSD.id);
    });
  });
});
