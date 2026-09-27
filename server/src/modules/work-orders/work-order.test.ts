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
      email: 'roberto.alves@empresa.com.br',
      phone: '(11) 99887-7665',
      specialty: 'Notebooks e Desktops',
      isActive: true,
      ...overrides,
    },
  });
}

// ─── POST /work-orders ──────────────────────────────────────────────────────

describe('POST /work-orders', () => {
  it('deve criar uma OS básica sem técnico com sucesso (201)', async () => {
    const customer = await createCustomerHelper();

    const payload = {
      customerId: customer.id,
      equipment: 'Dell Inspiron 15',
      serialNumber: 'SN-987654',
      reportedDefect: 'Aparelho não liga após queda de energia.',
      priority: 'MEDIUM',
      items: [
        {
          type: 'SERVICE',
          description: 'Diagnóstico e reparo da placa-mãe',
          quantity: 1,
          unitPrice: 250.0,
        },
      ],
      initialComment: 'Cliente relata cheiro de queimado.',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();

    const currentYear = new Date().getFullYear();
    expect(body.id).toBeDefined();
    expect(body.orderNumber).toBe(`OS-${currentYear}-0001`);
    expect(body.customerId).toBe(customer.id);
    expect(body.technicianId).toBeNull();
    expect(body.equipment).toBe('Dell Inspiron 15');
    expect(body.serialNumber).toBe('SN-987654');
    expect(body.reportedDefect).toBe('Aparelho não liga após queda de energia.');
    expect(body.status).toBe('OPEN');
    expect(body.priority).toBe('MEDIUM');
    expect(body.totalServices).toBe(250.0);
    expect(body.totalParts).toBe(0.0);
    expect(body.discount).toBe(0.0);
    expect(body.totalAmount).toBe(250.0);

    // Validar item criado
    expect(body.items).toHaveLength(1);
    expect(body.items[0].type).toBe('SERVICE');
    expect(body.items[0].subtotal).toBe(250.0);

    // Validar log inicial de auditoria
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].previousStatus).toBeNull();
    expect(body.logs[0].newStatus).toBe('OPEN');
    expect(body.logs[0].comment).toBe('Cliente relata cheiro de queimado.');
    expect(body.logs[0].createdBy).toBe('SYSTEM');
  });

  it('deve criar uma OS com técnico, múltiplos itens e desconto calculando totais corretamente (201)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    // Primeira OS para avançar o protocolo
    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Impressora Epson',
        reportedDefect: 'Não puxa papel.',
        items: [{ type: 'SERVICE', description: 'Limpeza de roletes', quantity: 1, unitPrice: 80.0 }],
      },
    });

    const payload = {
      customerId: customer.id,
      technicianId: technician.id,
      equipment: 'MacBook Pro 14 M1',
      reportedDefect: 'Bateria não carrega e teclado travando.',
      priority: 'HIGH',
      discount: 100.0,
      items: [
        {
          type: 'SERVICE',
          description: 'Substituição de bateria',
          quantity: 1,
          unitPrice: 350.0,
        },
        {
          type: 'SERVICE',
          description: 'Desoxidação do teclado',
          quantity: 1,
          unitPrice: 200.0,
        },
        {
          type: 'PART',
          description: 'Bateria Original Apple A2338',
          quantity: 1,
          unitPrice: 750.5,
        },
        {
          type: 'PART',
          description: 'Fita adesiva condutiva',
          quantity: 2,
          unitPrice: 25.25,
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();

    const currentYear = new Date().getFullYear();
    // Protocolo sequencial incremental
    expect(body.orderNumber).toBe(`OS-${currentYear}-0002`);
    expect(body.technicianId).toBe(technician.id);

    // Cálculos:
    // Serviços: 350 + 200 = 550.00
    // Peças: 750.50 + (2 * 25.25 = 50.50) = 801.00
    // Bruto: 550 + 801 = 1351.00
    // Desconto: 100.00
    // Total líquido: 1251.00
    expect(body.totalServices).toBe(550.0);
    expect(body.totalParts).toBe(801.0);
    expect(body.discount).toBe(100.0);
    expect(body.totalAmount).toBe(1251.0);
    expect(body.items).toHaveLength(4);
  });

  it('deve retornar 400 se a lista de itens for vazia', async () => {
    const customer = await createCustomerHelper();

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Asus',
        reportedDefect: 'Tela azul constante.',
        items: [],
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('deve retornar 400 se o desconto for superior ao valor total bruto dos itens', async () => {
    const customer = await createCustomerHelper();

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Lenovo',
        reportedDefect: 'Não liga.',
        discount: 300.0,
        items: [
          {
            type: 'SERVICE',
            description: 'Formatação básica',
            quantity: 1,
            unitPrice: 150.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('não pode ser superior ao valor total dos itens');
  });

  it('deve retornar 400 se o desconto for negativo', async () => {
    const customer = await createCustomerHelper();

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Lenovo',
        reportedDefect: 'Não liga.',
        discount: -50.0,
        items: [
          {
            type: 'SERVICE',
            description: 'Formatação',
            quantity: 1,
            unitPrice: 100.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('deve retornar 400 se item possuir quantidade menor que 1', async () => {
    const customer = await createCustomerHelper();

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Desktop Gamer',
        reportedDefect: 'Superaquecimento.',
        items: [
          {
            type: 'PART',
            description: 'Cooler Master 120mm',
            quantity: 0,
            unitPrice: 80.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('deve retornar 400 se o técnico associado estiver inativo', async () => {
    const customer = await createCustomerHelper();
    const inactiveTechnician = await createTechnicianHelper({
      email: 'inativo@empresa.com',
      isActive: false,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: inactiveTechnician.id,
        equipment: 'Monitor LG 29',
        reportedDefect: 'Linhas verticais na tela.',
        items: [
          {
            type: 'SERVICE',
            description: 'Troca de capacitor',
            quantity: 1,
            unitPrice: 120.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('inativo');
  });

  it('deve retornar 404 se o cliente informado não existir', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: 'a0000000-0000-0000-0000-000000000000',
        equipment: 'Celular Samsung',
        reportedDefect: 'Conector quebrado.',
        items: [
          {
            type: 'SERVICE',
            description: 'Troca de conector',
            quantity: 1,
            unitPrice: 150.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('Cliente não encontrado');
  });

  it('deve retornar 404 se o técnico informado não existir', async () => {
    const customer = await createCustomerHelper();

    const res = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: 'b0000000-0000-0000-0000-000000000000',
        equipment: 'Tablet iPad',
        reportedDefect: 'Touch parou de funcionar.',
        items: [
          {
            type: 'SERVICE',
            description: 'Troca de display',
            quantity: 1,
            unitPrice: 400.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('Técnico não encontrado');
  });
});

// ─── GET /work-orders ───────────────────────────────────────────────────────

describe('GET /work-orders', () => {
  it('deve listar ordens de serviço com metadados de paginação (200)', async () => {
    const customer = await createCustomerHelper();

    for (let i = 1; i <= 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/work-orders',
        payload: {
          customerId: customer.id,
          equipment: `Equipamento ${i}`,
          reportedDefect: `Defeito relatado ${i}`,
          items: [{ type: 'SERVICE', description: `Serviço ${i}`, quantity: 1, unitPrice: 100 }],
        },
      });
    }

    const res = await app.inject({
      method: 'GET',
      url: '/work-orders?page=1&limit=2',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(2);
  });

  it('deve filtrar ordens de serviço por status', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Servidor ProLiant',
        reportedDefect: 'Fonte queimada.',
        items: [{ type: 'PART', description: 'Fonte 750W', quantity: 1, unitPrice: 500 }],
      },
    });
    const orderId = createRes.json().id;

    // Simular mudança direta de status no banco para teste de filtro
    await app.prisma.workOrder.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    // Criar outra em status OPEN
    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook HP',
        reportedDefect: 'Lento.',
        items: [{ type: 'SERVICE', description: 'Otimização', quantity: 1, unitPrice: 100 }],
      },
    });

    const resCompleted = await app.inject({
      method: 'GET',
      url: '/work-orders?status=COMPLETED',
    });
    expect(resCompleted.statusCode).toBe(200);
    const completedBody = resCompleted.json();
    expect(completedBody.data).toHaveLength(1);
    expect(completedBody.data[0].id).toBe(orderId);

    const resOpen = await app.inject({
      method: 'GET',
      url: '/work-orders?status=OPEN',
    });
    expect(resOpen.statusCode).toBe(200);
    expect(resOpen.json().data).toHaveLength(1);
  });

  it('deve filtrar ordens de serviço por prioridade', async () => {
    const customer = await createCustomerHelper();

    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Urgente',
        reportedDefect: 'Precisa para viagem amanhã.',
        priority: 'URGENT',
        items: [{ type: 'SERVICE', description: 'Backup', quantity: 1, unitPrice: 150 }],
      },
    });

    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Normal',
        reportedDefect: 'Limpeza periódica.',
        priority: 'LOW',
        items: [{ type: 'SERVICE', description: 'Limpeza', quantity: 1, unitPrice: 80 }],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/work-orders?priority=URGENT',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].priority).toBe('URGENT');
  });

  it('deve filtrar ordens de serviço sem técnico atribuído (technicianId=unassigned)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    // OS sem técnico
    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Sem Técnico',
        reportedDefect: 'Defeito qualquer.',
        items: [{ type: 'SERVICE', description: 'Serviço', quantity: 1, unitPrice: 100 }],
      },
    });

    // OS com técnico
    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Com Técnico',
        reportedDefect: 'Defeito qualquer.',
        items: [{ type: 'SERVICE', description: 'Serviço', quantity: 1, unitPrice: 100 }],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/work-orders?technicianId=unassigned',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].equipment).toBe('Sem Técnico');
    expect(body.data[0].technician).toBeNull();
  });

  it('deve filtrar ordens de serviço por busca textual livre', async () => {
    const customer = await createCustomerHelper({ name: 'Carlos Eduardo da Silva' });

    await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'PlayStation 5 Slim',
        reportedDefect: 'Luz azul da morte piscando.',
        items: [{ type: 'SERVICE', description: 'Reballing APU', quantity: 1, unitPrice: 450 }],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/work-orders?search=PlayStation',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);

    const resCustomerSearch = await app.inject({
      method: 'GET',
      url: '/work-orders?search=Carlos Eduardo',
    });

    expect(resCustomerSearch.statusCode).toBe(200);
    expect(resCustomerSearch.json().data).toHaveLength(1);
  });
});

// ─── GET /work-orders/:id ───────────────────────────────────────────────────

describe('GET /work-orders/:id', () => {
  it('deve buscar uma OS por ID carregando cliente, técnico, itens e logs (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'iMac 24 M3',
        reportedDefect: 'Tela piscando intermitentemente.',
        items: [{ type: 'SERVICE', description: 'Troca de cabo flat', quantity: 1, unitPrice: 320.0 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'GET',
      url: `/work-orders/${orderId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(orderId);
    expect(body.customer.name).toBe(customer.name);
    expect(body.technician.name).toBe(technician.name);
    expect(body.items).toHaveLength(1);
    expect(body.logs).toHaveLength(1);
  });

  it('deve retornar 404 se a OS não existir', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/work-orders/00000000-0000-0000-0000-000000000000',
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('não encontrada');
  });

  it('deve retornar 400 se o ID não for um UUID válido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/work-orders/id-invalido',
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── PUT /work-orders/:id ───────────────────────────────────────────────────

describe('PUT /work-orders/:id', () => {
  it('deve atualizar dados cadastrais da OS sem alterar itens (200)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Dell',
        reportedDefect: 'Não dá vídeo.',
        items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 100 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {
        equipment: 'Notebook Dell Inspiron 5590',
        technicalDiagnosis: 'Curto circuito na linha secundária de 3.3V resolvido.',
        priority: 'HIGH',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.equipment).toBe('Notebook Dell Inspiron 5590');
    expect(body.technicalDiagnosis).toBe('Curto circuito na linha secundária de 3.3V resolvido.');
    expect(body.priority).toBe('HIGH');
    expect(body.totalAmount).toBe(100);
  });

  it('deve substituir itens com recálculo automático de subtotais e totais (200)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Desktop Office',
        reportedDefect: 'Reiniciando sozinho.',
        items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 100 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {
        discount: 20.0,
        items: [
          {
            type: 'SERVICE',
            description: 'Troca de pasta térmica e limpeza',
            quantity: 1,
            unitPrice: 120.0,
          },
          {
            type: 'PART',
            description: 'Pasta térmica Arctic MX-4',
            quantity: 1,
            unitPrice: 45.0,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    // Novo totalServices = 120.00, totalParts = 45.00, discount = 20.00, totalAmount = 145.00
    expect(body.totalServices).toBe(120.0);
    expect(body.totalParts).toBe(45.0);
    expect(body.discount).toBe(20.0);
    expect(body.totalAmount).toBe(145.0);
    expect(body.items).toHaveLength(2);
  });

  it('deve atualizar apenas o desconto e recalcular totalAmount mantendo itens existentes (200)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Acer',
        reportedDefect: 'Teclado com teclas falhando.',
        items: [{ type: 'SERVICE', description: 'Troca de teclado', quantity: 1, unitPrice: 200 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {
        discount: 30.0,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalServices).toBe(200.0);
    expect(body.discount).toBe(30.0);
    expect(body.totalAmount).toBe(170.0);
  });

  it('deve retornar 400 se o novo desconto for superior ao total dos itens na atualização', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Acer',
        reportedDefect: 'Teclado falhando.',
        items: [{ type: 'SERVICE', description: 'Troca de teclado', quantity: 1, unitPrice: 100 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {
        discount: 150.0,
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('não pode ser superior ao valor total dos itens');
  });

  it('deve retornar 404 ao tentar atualizar OS inexistente', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/work-orders/00000000-0000-0000-0000-000000000000',
      payload: {
        equipment: 'Novo Equipamento',
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it('deve retornar 400 se o corpo da requisição for vazio', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Notebook Acer',
        reportedDefect: 'Teclado falhando.',
        items: [{ type: 'SERVICE', description: 'Troca de teclado', quantity: 1, unitPrice: 100 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.issues[0].message).toContain('Ao menos um campo deve ser informado');
  });
});

// ─── PATCH /work-orders/:id/status ──────────────────────────────────────────

describe('PATCH /work-orders/:id/status', () => {
  it('deve transicionar de OPEN para IN_PROGRESS com técnico pré-vinculado (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Notebook Dell XPS 13',
        reportedDefect: 'Superaquecimento constante.',
        items: [{ type: 'SERVICE', description: 'Limpeza e troca de pasta térmica', quantity: 1, unitPrice: 150 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Técnico iniciou a desmontagem do equipamento.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.technicianId).toBe(technician.id);

    // Verificar log de auditoria
    const logs = body.logs;
    expect(logs).toHaveLength(2);
    expect(logs[1].previousStatus).toBe('OPEN');
    expect(logs[1].newStatus).toBe('IN_PROGRESS');
    expect(logs[1].comment).toBe('Técnico iniciou a desmontagem do equipamento.');
    expect(logs[1].createdBy).toBe(technician.name);
  });

  it('deve transicionar de OPEN para IN_PROGRESS atribuindo técnico ativo no payload (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Impressora Epson L3150',
        reportedDefect: 'Não puxa papel.',
        items: [{ type: 'SERVICE', description: 'Troca de rolete', quantity: 1, unitPrice: 80 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        technicianId: technician.id,
        createdBy: 'Gerente Operacional',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.technicianId).toBe(technician.id);

    const logs = body.logs;
    expect(logs[1].createdBy).toBe('Gerente Operacional');
  });

  it('deve retornar 400 ao tentar mudar para IN_PROGRESS sem técnico atribuído na OS e sem payload', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Monitor LG Ultrawide',
        reportedDefect: 'Linhas verticais na tela.',
        items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 100 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('É obrigatório atribuir um técnico responsável para iniciar o atendimento');
  });

  it('deve retornar 400 ao tentar mudar para IN_PROGRESS informando técnico inativo', async () => {
    const customer = await createCustomerHelper();
    const inactiveTechnician = await createTechnicianHelper({
      email: 'inativo@empresa.com.br',
      isActive: false,
    });

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'MacBook Pro 14',
        reportedDefect: 'Bateria não carrega.',
        items: [{ type: 'SERVICE', description: 'Troca de bateria', quantity: 1, unitPrice: 400 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        technicianId: inactiveTechnician.id,
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('O técnico selecionado está inativo');
  });

  it('deve retornar 404 ao tentar mudar para IN_PROGRESS com ID de técnico inexistente', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Desktop Gamer',
        reportedDefect: 'Reiniciando em jogos.',
        items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 120 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        technicianId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('Técnico não encontrado');
  });

  it('deve transicionar entre estados operacionais: IN_PROGRESS -> WAITING_PARTS e WAITING_APPROVAL e retorno (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Placa de Vídeo RTX 3080',
        reportedDefect: 'Artefatos na tela.',
        items: [{ type: 'SERVICE', description: 'Reballing de VRAM', quantity: 1, unitPrice: 500 }],
      },
    });

    const orderId = createRes.json().id;

    // 1. OPEN -> IN_PROGRESS
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    // 2. IN_PROGRESS -> WAITING_PARTS (com justificativa)
    const resWaitingParts = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'WAITING_PARTS',
        comment: 'Aguardando chegada dos chips de memória Samsung.',
      },
    });
    expect(resWaitingParts.statusCode).toBe(200);
    expect(resWaitingParts.json().status).toBe('WAITING_PARTS');

    // 3. WAITING_PARTS -> IN_PROGRESS
    const resResumeParts = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Peças chegaram, retomando reparo.',
      },
    });
    expect(resResumeParts.statusCode).toBe(200);
    expect(resResumeParts.json().status).toBe('IN_PROGRESS');

    // 4. IN_PROGRESS -> WAITING_APPROVAL
    const resWaitingApproval = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'WAITING_APPROVAL',
        comment: 'Orçamento enviado para aprovação do cliente via WhatsApp.',
      },
    });
    expect(resWaitingApproval.statusCode).toBe(200);
    expect(resWaitingApproval.json().status).toBe('WAITING_APPROVAL');

    // 5. WAITING_APPROVAL -> IN_PROGRESS
    const resResumeApproval = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Cliente aprovou o orçamento adicional.',
      },
    });
    expect(resResumeApproval.statusCode).toBe(200);
    expect(resResumeApproval.json().status).toBe('IN_PROGRESS');
  });

  it('deve retornar 400 ao tentar transicionar para WAITING_PARTS sem justificativa', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Notebook Dell',
        reportedDefect: 'Teclado falhando.',
        items: [{ type: 'SERVICE', description: 'Troca de teclado', quantity: 1, unitPrice: 150 }],
      },
    });

    const orderId = createRes.json().id;

    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'WAITING_PARTS',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('É obrigatório informar o motivo/peças pendentes');
  });

  it('deve transicionar para COMPLETED com laudo técnico pré-existente e gravar completedDate (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Console PlayStation 5',
        reportedDefect: 'Desligando sozinho após 10 minutos.',
        items: [{ type: 'SERVICE', description: 'Troca de metal líquido', quantity: 1, unitPrice: 220 }],
      },
    });

    const orderId = createRes.json().id;

    // Colocar em andamento e já cadastrar laudo técnico via PUT
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    await app.inject({
      method: 'PUT',
      url: `/work-orders/${orderId}`,
      payload: {
        technicalDiagnosis: 'Metal líquido oxidado foi substituído e limpeza do dissipador efetuada com sucesso.',
      },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
        comment: 'Testes de estresse executados por 2 horas sem desligamento.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('COMPLETED');
    expect(body.completedDate).toBeDefined();
    expect(new Date(body.completedDate).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('deve transicionar para COMPLETED fornecendo laudo técnico no payload do PATCH (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'iPad Air 4',
        reportedDefect: 'Touch screen com toque fantasma.',
        items: [{ type: 'SERVICE', description: 'Substituição de tela', quantity: 1, unitPrice: 450 }],
      },
    });

    const orderId = createRes.json().id;

    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: 'Tela LCD/Touch screen substituída por peça original; calibragem concluída.',
        comment: 'Aparelho pronto para retirada.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('COMPLETED');
    expect(body.technicalDiagnosis).toContain('Tela LCD/Touch screen substituída');
    expect(body.completedDate).toBeDefined();
  });

  it('deve retornar 400 ao tentar concluir OS sem laudo técnico (nem prévio, nem no payload)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Notebook Lenovo',
        reportedDefect: 'Sem som.',
        items: [{ type: 'SERVICE', description: 'Troca de alto-falantes', quantity: 1, unitPrice: 90 }],
      },
    });

    const orderId = createRes.json().id;

    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Diagnóstico técnico é obrigatório para concluir a ordem de serviço');
  });

  it('deve permitir cancelamento a partir de OPEN com justificativa obrigatória (200)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Impressora HP',
        reportedDefect: 'Atolamento.',
        items: [{ type: 'SERVICE', description: 'Revisão', quantity: 1, unitPrice: 50 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'CANCELED',
        comment: 'Cliente desistiu do orçamento e retirou o equipamento sem reparo.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('CANCELED');
  });

  it('deve retornar 400 ao tentar cancelar sem justificativa (comment)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Impressora HP',
        reportedDefect: 'Atolamento.',
        items: [{ type: 'SERVICE', description: 'Revisão', quantity: 1, unitPrice: 50 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'CANCELED',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('É obrigatório informar uma justificativa para o cancelamento');
  });

  it('deve retornar 400 ao tentar transicionar para o mesmo status (OPEN -> OPEN)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Tablet Samsung',
        reportedDefect: 'Conector quebrado.',
        items: [{ type: 'SERVICE', description: 'Reparo conector', quantity: 1, unitPrice: 110 }],
      },
    });

    const orderId = createRes.json().id;

    // Como o schema Zod aceita apenas os status mutáveis ('IN_PROGRESS', 'WAITING_PARTS', etc.),
    // testamos com IN_PROGRESS -> IN_PROGRESS
    const technician = await createTechnicianHelper();
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        technicianId: technician.id,
      },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('A ordem de serviço já se encontra no status IN_PROGRESS');
  });

  it('deve retornar 400 para saltos proibidos na máquina de estados (ex: OPEN -> COMPLETED)', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Tablet Samsung',
        reportedDefect: 'Tela quebrada.',
        items: [{ type: 'SERVICE', description: 'Troca de tela', quantity: 1, unitPrice: 200 }],
      },
    });

    const orderId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: 'Concluído diretamente.',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Transição de status inválida: de OPEN para COMPLETED');
  });

  it('deve retornar 400 ao tentar alterar status de uma OS em estado terminal COMPLETED', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Smartphone Moto G',
        reportedDefect: 'Não liga.',
        items: [{ type: 'SERVICE', description: 'Troca de conector', quantity: 1, unitPrice: 70 }],
      },
    });

    const orderId = createRes.json().id;

    // OPEN -> IN_PROGRESS -> COMPLETED
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: { status: 'IN_PROGRESS' },
    });

    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: 'Conector de carga ressoldado.',
      },
    });

    // Tentativa de alterar status após concluída
    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Não é possível alterar o status de uma ordem de serviço concluída');
  });

  it('deve retornar 400 ao tentar alterar status de uma OS em estado terminal CANCELED', async () => {
    const customer = await createCustomerHelper();

    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        equipment: 'Roteador Wi-Fi',
        reportedDefect: 'Não liga.',
        items: [{ type: 'SERVICE', description: 'Diagnóstico', quantity: 1, unitPrice: 40 }],
      },
    });

    const orderId = createRes.json().id;

    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'CANCELED',
        comment: 'Equipamento sem conserto viável.',
      },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Não é possível alterar o status de uma ordem de serviço cancelada');
  });

  it('deve retornar 404 ao tentar atualizar status de OS inexistente', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/work-orders/00000000-0000-0000-0000-000000000000/status',
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('Ordem de serviço não encontrada');
  });

  it('deve retornar 400 se o UUID na rota de status for inválido', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/work-orders/invalido-uuid/status',
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /work-orders/:id/timeline ──────────────────────────────────────────

describe('GET /work-orders/:id/timeline', () => {
  it('deve retornar histórico cronológico completo de logs de auditoria (200)', async () => {
    const customer = await createCustomerHelper();
    const technician = await createTechnicianHelper();

    // 1. Criar OS (gera log inicial OPEN)
    const createRes = await app.inject({
      method: 'POST',
      url: '/work-orders',
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'Dell Inspiron 14',
        reportedDefect: 'Lentidão severa ao iniciar.',
        items: [{ type: 'SERVICE', description: 'Upgrade SSD', quantity: 1, unitPrice: 200 }],
        initialComment: 'Aparelho recebido na bancada.',
      },
    });

    const orderId = createRes.json().id;

    // 2. Mudar para IN_PROGRESS
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Iniciada clonagem do disco.',
        createdBy: 'Carlos Supervisor',
      },
    });

    // 3. Mudar para COMPLETED
    await app.inject({
      method: 'PATCH',
      url: `/work-orders/${orderId}/status`,
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: 'SSD NVMe 500GB instalado e Windows 11 clonado com sucesso.',
        comment: 'Serviço finalizado com sucesso.',
      },
    });

    // 4. Consultar timeline
    const res = await app.inject({
      method: 'GET',
      url: `/work-orders/${orderId}/timeline`,
    });

    expect(res.statusCode).toBe(200);
    const logs = res.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(3);

    // Validar ordenação cronológica crescente
    expect(new Date(logs[0].createdAt).getTime()).toBeLessThanOrEqual(new Date(logs[1].createdAt).getTime());
    expect(new Date(logs[1].createdAt).getTime()).toBeLessThanOrEqual(new Date(logs[2].createdAt).getTime());

    // Validar primeiro log (criação)
    expect(logs[0].previousStatus).toBeNull();
    expect(logs[0].newStatus).toBe('OPEN');
    expect(logs[0].comment).toBe('Aparelho recebido na bancada.');

    // Validar segundo log
    expect(logs[1].previousStatus).toBe('OPEN');
    expect(logs[1].newStatus).toBe('IN_PROGRESS');
    expect(logs[1].createdBy).toBe('Carlos Supervisor');

    // Validar terceiro log
    expect(logs[2].previousStatus).toBe('IN_PROGRESS');
    expect(logs[2].newStatus).toBe('COMPLETED');
    expect(logs[2].comment).toBe('Serviço finalizado com sucesso.');
  });

  it('deve retornar 404 para OS inexistente na timeline', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/work-orders/00000000-0000-0000-0000-000000000000/timeline',
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toContain('Ordem de serviço não encontrada');
  });

  it('deve retornar 400 para UUID inválido na timeline', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/work-orders/uuid-invalido/timeline',
    });

    expect(res.statusCode).toBe(400);
  });
});

