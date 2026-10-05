import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente de teste
config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

let app: FastifyInstance;
let authToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  // Generate a valid ADMIN JWT token for testing
  authToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN'
  });
});

afterAll(async () => {
  if (app) await app.close();
});

beforeEach(async () => {
  // Limpeza reversa das tabelas antes de cada teste
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
  await app.prisma.technician.deleteMany();
  await app.prisma.customer.deleteMany();
});


describe('E2E: Ciclo de Vida Completo da Ordem de Serviço', () => {
  it('deve executar o fluxo integrado ponta a ponta: abertura, transições de status, laudo e fechamento, refletindo na timeline e nas métricas', async () => {
    // -------------------------------------------------------------------------
    // 1. POST /customers -> Cadastro do Cliente
    // -------------------------------------------------------------------------
    const customerRes = await app.inject({
      method: 'POST',
      url: '/customers',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        name: 'Carlos Eduardo Silva',
        document: '529.982.247-25',
        email: 'carlos.silva@empresa.com.br',
        phone: '(11) 98765-4321',
        address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      },
    });

    expect(customerRes.statusCode).toBe(201);
    const customer = customerRes.json();
    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Carlos Eduardo Silva');

    // -------------------------------------------------------------------------
    // 2. POST /technicians -> Cadastro dos Técnicos (Primário e Substituto)
    // -------------------------------------------------------------------------
    const tech1Res = await app.inject({
      method: 'POST',
      url: '/technicians',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        name: 'Roberto Tech Lead',
        email: 'roberto.lead@assistencia.com',
        phone: '(11) 91234-5678',
        specialty: 'Hardware e Placa-Mãe',
        isActive: true,
      },
    });
    expect(tech1Res.statusCode).toBe(201);
    const techPrimary = tech1Res.json();
    expect(techPrimary.id).toBeDefined();

    const tech2Res = await app.inject({
      method: 'POST',
      url: '/technicians',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        name: 'Ana Carolina Especialista',
        email: 'ana.especialista@assistencia.com',
        phone: '(11) 99876-5432',
        specialty: 'Solda BGA e Microeletrônica',
        isActive: true,
      },
    });
    expect(tech2Res.statusCode).toBe(201);
    const techSecondary = tech2Res.json();
    expect(techSecondary.id).toBeDefined();

    // -------------------------------------------------------------------------
    // 3. POST /work-orders -> Abertura de OS com itens (SERVICE e PART) em status OPEN
    // -------------------------------------------------------------------------
    const currentYear = new Date().getFullYear();
    const createWoRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        customerId: customer.id,
        equipment: 'MacBook Pro M1 16"',
        serialNumber: 'C02G1234MD6R',
        reportedDefect: 'Notebook desliga subitamente sob carga moderada e aquece em excesso.',
        priority: 'HIGH',
        items: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico avançado e limpeza de câmara de vapor',
            quantity: 1,
            unitPrice: 200.0,
          },
          {
            type: 'PART',
            description: 'Composto térmico de metal líquido / pasta térmica de alta condutividade',
            quantity: 1,
            unitPrice: 150.0,
          },
        ],
        initialComment: 'Aparelho recebido na bancada sem avarias físicas aparentes.',
      },
    });

    expect(createWoRes.statusCode).toBe(201);
    const order = createWoRes.json();
    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBe(`OS-${currentYear}-0001`);
    expect(order.status).toBe('OPEN');
    expect(order.priority).toBe('HIGH');
    expect(order.technicianId).toBeNull();
    expect(order.totalServices).toBe(200.0);
    expect(order.totalParts).toBe(150.0);
    expect(order.discount).toBe(0.0);
    expect(order.totalAmount).toBe(350.0);
    expect(order.items).toHaveLength(2);

    // -------------------------------------------------------------------------
    // 4. PATCH /work-orders/:id/status -> Transição para IN_PROGRESS com atribuição de técnico
    // -------------------------------------------------------------------------
    const inProgressRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'IN_PROGRESS',
        technicianId: techPrimary.id,
        comment: 'Técnico Roberto assumiu a bancada de testes para análise térmica.',
      },
    });

    expect(inProgressRes.statusCode).toBe(200);
    const orderInProgress = inProgressRes.json();
    expect(orderInProgress.status).toBe('IN_PROGRESS');
    expect(orderInProgress.technicianId).toBe(techPrimary.id);

    // -------------------------------------------------------------------------
    // 5. PUT /work-orders/:id -> Diagnóstico preliminar e inclusão de peça sobressalente
    // -------------------------------------------------------------------------
    const updateWoRes = await app.inject({
      method: 'PUT',
      url: `/work-orders/${order.id}`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        equipment: 'MacBook Pro M1 16"',
        serialNumber: 'C02G1234MD6R',
        reportedDefect: 'Notebook desliga subitamente sob carga moderada e aquece em excesso.',
        priority: 'HIGH',
        technicalDiagnosis: 'Ventoinha direita com rolamento danificado gerando travamento mecânico.',
        discount: 50.0,
        items: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico avançado e desmontagem completa',
            quantity: 1,
            unitPrice: 200.0,
          },
          {
            type: 'PART',
            description: 'Ventoinha MagLev Original Apple Direita',
            quantity: 1,
            unitPrice: 300.0,
          },
          {
            type: 'PART',
            description: 'Pad térmico cerâmico 1.5mm',
            quantity: 2,
            unitPrice: 25.0,
          },
        ],
      },
    });

    expect(updateWoRes.statusCode).toBe(200);
    const orderUpdated = updateWoRes.json();
    expect(orderUpdated.technicalDiagnosis).toBe(
      'Ventoinha direita com rolamento danificado gerando travamento mecânico.'
    );
    expect(orderUpdated.totalServices).toBe(200.0);
    // Peças: 1x 300.0 + 2x 25.0 = 350.0
    expect(orderUpdated.totalParts).toBe(350.0);
    expect(orderUpdated.discount).toBe(50.0);
    // Total: 200 + 350 - 50 = 500.0
    expect(orderUpdated.totalAmount).toBe(500.0);
    expect(orderUpdated.items).toHaveLength(3);

    // -------------------------------------------------------------------------
    // 6. PATCH /work-orders/:id/status -> Transição para WAITING_PARTS com justificativa
    // -------------------------------------------------------------------------
    const waitingPartsRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'WAITING_PARTS',
        comment: 'Aguardando entrega do lote de ventoinhas originais pelo fornecedor oficial.',
      },
    });

    expect(waitingPartsRes.statusCode).toBe(200);
    expect(waitingPartsRes.json().status).toBe('WAITING_PARTS');

    // -------------------------------------------------------------------------
    // 7. PATCH /work-orders/:id/status -> Retorno para IN_PROGRESS após chegada das peças
    // -------------------------------------------------------------------------
    const resumeProgressRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Peças recebidas no estoque. Instalação e testes de estresse iniciados.',
      },
    });

    expect(resumeProgressRes.statusCode).toBe(200);
    expect(resumeProgressRes.json().status).toBe('IN_PROGRESS');

    // -------------------------------------------------------------------------
    // 8. PATCH /work-orders/:id/status -> Transição para WAITING_APPROVAL e aprovação
    // -------------------------------------------------------------------------
    const waitingApprovalRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'WAITING_APPROVAL',
        comment: 'Orçamento com acréscimo de ventoinha enviado por WhatsApp ao cliente.',
      },
    });
    expect(waitingApprovalRes.statusCode).toBe(200);
    expect(waitingApprovalRes.json().status).toBe('WAITING_APPROVAL');

    const approveProgressRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Cliente Carlos aprovou o orçamento adicional. Prosseguindo com montagem.',
      },
    });
    expect(approveProgressRes.statusCode).toBe(200);
    expect(approveProgressRes.json().status).toBe('IN_PROGRESS');

    // -------------------------------------------------------------------------
    // 9. PATCH /work-orders/:id/status -> Conclusão para COMPLETED com laudo final
    // -------------------------------------------------------------------------
    const finalDiagnosis =
      'Substituição da ventoinha direita concluída. Troca de pasta térmica realizada. Testes de estresse (Prime95 / FurMark) executados por 2 horas com temperatura estabilizada em 68°C. Equipamento aprovado para entrega.';

    const completeRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: finalDiagnosis,
        comment: 'Serviço finalizado com sucesso. Equipamento limpo e disponível para retirada.',
      },
    });

    expect(completeRes.statusCode).toBe(200);
    const orderCompleted = completeRes.json();
    expect(orderCompleted.status).toBe('COMPLETED');
    expect(orderCompleted.technicalDiagnosis).toBe(finalDiagnosis);
    expect(orderCompleted.completedDate).not.toBeNull();
    expect(new Date(orderCompleted.completedDate).getTime()).not.toBeNaN();

    // -------------------------------------------------------------------------
    // 10. GET /work-orders/:id/timeline -> Auditoria da linha do tempo completa
    // -------------------------------------------------------------------------
    const timelineRes = await app.inject({
      method: 'GET',
      url: `/work-orders/${order.id}/timeline`,
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(timelineRes.statusCode).toBe(200);
    const timeline = timelineRes.json();
    expect(Array.isArray(timeline)).toBe(true);
    // Esperamos:
    // 1. Criação (OPEN)
    // 2. Transição -> IN_PROGRESS
    // 3. Transição -> WAITING_PARTS
    // 4. Retorno -> IN_PROGRESS
    // 5. Transição -> WAITING_APPROVAL
    // 6. Retorno -> IN_PROGRESS
    // 7. Conclusão -> COMPLETED
    expect(timeline.length).toBeGreaterThanOrEqual(7);

    // Verificar se a sequência cronológica dos status confere
    const statusSequence = timeline.map((l: { newStatus: string }) => l.newStatus);
    expect(statusSequence).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'IN_PROGRESS',
      'WAITING_APPROVAL',
      'IN_PROGRESS',
      'COMPLETED',
    ]);

    // Verificar se todos os logs possuem timestamp válido
    for (const log of timeline) {
      expect(log.createdAt).toBeDefined();
      expect(new Date(log.createdAt).getTime()).not.toBeNaN();
    }

    // -------------------------------------------------------------------------
    // 11. Validação de Impacto Analítico nas Métricas
    // -------------------------------------------------------------------------
    // Resumo Geral: GET /metrics/summary
    const summaryRes = await app.inject({
      method: 'GET',
      url: '/metrics/summary',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(summaryRes.statusCode).toBe(200);
    const summary = summaryRes.json();
    expect(summary.totalOrders).toBe(1);
    expect(summary.statusCounts.COMPLETED).toBe(1);
    expect(summary.statusCounts.OPEN).toBe(0);
    expect(summary.statusCounts.IN_PROGRESS).toBe(0);
    expect(summary.financial.totalRevenue).toBe(500.0);
    expect(summary.financial.averageTicket).toBe(500.0);

    // Distribuição por Status: GET /metrics/by-status
    const byStatusRes = await app.inject({
      method: 'GET',
      url: '/metrics/by-status',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(byStatusRes.statusCode).toBe(200);
    const byStatus = byStatusRes.json();
    const completedStatus = byStatus.data.find((s: { status: string }) => s.status === 'COMPLETED');
    expect(completedStatus).toBeDefined();
    expect(completedStatus.count).toBe(1);
    expect(completedStatus.percentage).toBe(100.0);

    // Produtividade por Técnico: GET /metrics/by-technician
    const byTechRes = await app.inject({
      method: 'GET',
      url: '/metrics/by-technician',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(byTechRes.statusCode).toBe(200);
    const byTech = byTechRes.json();
    const techMetrics = byTech.data.find((t: { technicianId: string }) => t.technicianId === techPrimary.id);
    expect(techMetrics).toBeDefined();
    expect(techMetrics.totalOrders).toBe(1);
    expect(techMetrics.completedOrders).toBe(1);
    expect(techMetrics.inProgressOrders).toBe(0);
    expect(techMetrics.totalRevenue).toBe(500.0);
  });

  it('deve impedir a conclusão da OS se o laudo técnico não estiver preenchido', async () => {
    // 1. Criar cliente e técnico
    const customer = await app.prisma.customer.create({
      data: {
        name: 'Maria Oliveira',
        document: '341.876.543-12',
        email: 'maria@teste.com',
        phone: '(11) 97777-8888',
        address: 'Rua Augusta, 500',
      },
    });

    const tech = await app.prisma.technician.create({
      data: {
        name: 'Carlos Técnico',
        email: 'carlos.tec@teste.com',
        phone: '(11) 96666-5555',
        specialty: 'Smartphones',
        isActive: true,
      },
    });

    // 2. Criar OS em IN_PROGRESS sem technicalDiagnosis prévio
    const order = await app.prisma.workOrder.create({
      data: {
        orderNumber: 'OS-2026-9998',
        customerId: customer.id,
        technicianId: tech.id,
        equipment: 'iPhone 13 Pro',
        reportedDefect: 'Bateria descarregando rápido',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        technicalDiagnosis: null,
      },
    });

    // 3. Tentar concluir sem enviar laudo técnico no payload
    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'COMPLETED',
        comment: 'Tentativa de conclusão sem laudo',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.message).toContain('Diagnóstico técnico');
  });

  it('deve registrar corretamente o cancelamento de uma OS em aberto com justificativa', async () => {
    // 1. Criar cliente
    const customer = await app.prisma.customer.create({
      data: {
        name: 'Bruno Ramos',
        document: '123.456.789-00',
        email: 'bruno.ramos@teste.com',
        phone: '(11) 94444-3333',
        address: 'Rua Oscar Freire, 200',
      },
    });

    // 2. Criar OS em OPEN
    const order = await app.prisma.workOrder.create({
      data: {
        orderNumber: 'OS-2026-9999',
        customerId: customer.id,
        equipment: 'Monitor LG 4K',
        reportedDefect: 'Linhas verticais na tela',
        status: 'OPEN',
        priority: 'LOW',
      },
    });

    // 3. Cancelar com justificativa
    const cancelRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'CANCELED',
        comment: 'Cliente desistiu do reparo por considerar valor de reposição inviável.',
      },
    });

    expect(cancelRes.statusCode).toBe(200);
    const canceledOrder = cancelRes.json();
    expect(canceledOrder.status).toBe('CANCELED');

    // 4. Verificar se log de auditoria foi registrado com o motivo
    const timelineRes = await app.inject({
      method: 'GET',
      url: `/work-orders/${order.id}/timeline`,
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(timelineRes.statusCode).toBe(200);
    const timeline = timelineRes.json();
    const cancelLog = timeline.find((l: { newStatus: string }) => l.newStatus === 'CANCELED');
    expect(cancelLog).toBeDefined();
    expect(cancelLog.previousStatus).toBe('OPEN');
    expect(cancelLog.comment).toBe(
      'Cliente desistiu do reparo por considerar valor de reposição inviável.'
    );

    // 5. Garantir que estados terminais não aceitam novas transições
    const attemptReopenRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${order.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        status: 'OPEN',
        comment: 'Tentando reabrir OS cancelada',
      },
    });
    expect(attemptReopenRes.statusCode).toBe(400);
  });
});
