import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed global e relacional do banco de dados (v1.1)...');

  // ─── Etapa 0: Limpeza Relacional Segura ──────────────────────────────────────
  // Exclusão na ordem estrita de dependência de chaves estrangeiras
  await prisma.financialTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.workOrderAttachment.deleteMany();
  await prisma.workOrderLog.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.product.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('🧹 Limpeza concluída: Todas as 15 tabelas limpas com integridade referencial.');

  // ─── Etapa 1: Usuários & Controle de Acesso (RBAC) ──────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userAdmin = await prisma.user.create({
    data: {
      name: 'Administrador do Sistema',
      email: 'admin@empresa.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const operatorPassword = await bcrypt.hash('operador123', 10);
  const userOperator = await prisma.user.create({
    data: {
      name: 'Operador Técnico',
      email: 'operador@empresa.com',
      passwordHash: operatorPassword,
      role: 'OPERATOR',
      isActive: true,
    },
  });

  console.log('🔐 2 Usuários criados: admin@empresa.com (ADMIN) / operador@empresa.com (OPERATOR).');

  // ─── Etapa 2: Empresa Institucional ─────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: 'Ordem de Serviço Assistência Técnica Ltda',
      tradeName: 'OS Assistência & Tecnologia',
      cnpj: '11.222.333/0001-81',
      ie: '123.456.789.110',
      email: 'contato@osassistencia.com.br',
      phone: '(11) 3344-5566',
      address: 'Rua da Tecnologia, 500 - Bloco B - Santa Ifigênia',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01209-000',
      logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
      warrantyTerms: 'Garantia legal de 90 dias sobre peças substituídas e serviços executados nos termos do Art. 26 do Código de Defesa do Consumidor (CDC).',
      workOrderNotes: 'Equipamentos não retirados em até 90 dias após a notificação formal de conclusão estarão sujeitos a cobrança diária de armazenagem.',
    },
  });

  console.log('🏢 Empresa cadastrada com dados corporativos, fiscais e termos de garantia.');

  // ─── Etapa 3: Clientes & Técnicos ───────────────────────────────────────────
  const customerLawFirm = await prisma.customer.create({
    data: {
      name: 'Silva & Associados Advocacia',
      document: '12.345.678/0001-90',
      email: 'contato@silvaadv.com.br',
      phone: '(11) 3214-5500',
      address: 'Av. Paulista, 1000, Cj 142 - Bela Vista, São Paulo - SP',
    },
  });

  const customerClinic = await prisma.customer.create({
    data: {
      name: 'Clínica Médica São Lucas',
      document: '98.765.432/0001-10',
      email: 'suporte@saolucas.med.br',
      phone: '(11) 3322-8899',
      address: 'Rua Vergueiro, 450 - Paraíso, São Paulo - SP',
    },
  });

  const customerPerson = await prisma.customer.create({
    data: {
      name: 'Carlos Eduardo Mendes',
      document: '123.456.789-00',
      email: 'carlos.mendes@email.com',
      phone: '(11) 98765-4321',
      address: 'Rua Domingos de Morais, 1200, Apto 54 - Vila Mariana, São Paulo - SP',
    },
  });

  console.log('👥 3 Clientes criados (2 PJ e 1 PF).');

  const techRoberto = await prisma.technician.create({
    data: {
      name: 'Roberto Alves',
      email: 'roberto.alves@ordemapp.local',
      phone: '(11) 97111-2233',
      specialty: 'Hardware & Microeletrônica',
      isActive: true,
    },
  });

  const techMariana = await prisma.technician.create({
    data: {
      name: 'Mariana Costa',
      email: 'mariana.costa@ordemapp.local',
      phone: '(11) 97222-4455',
      specialty: 'Redes & Infraestrutura',
      isActive: true,
    },
  });

  console.log('🔧 2 Técnicos especializados criados.');

  // ─── Etapa 4: Catálogo de Produtos & Movimentações Iniciais de Estoque ───────
  const productSsd = await prisma.product.create({
    data: {
      sku: 'SSD-NVME-1TB',
      name: 'SSD NVMe Kingston NV2 1TB M.2 2280',
      description: 'Leitura 3500MB/s e gravação 2100MB/s para alta performance corporativa.',
      unit: 'UN',
      costPrice: 260.0,
      salePrice: 420.0,
      currentStock: 12,
      minStock: 4,
    },
  });

  const productRam = await prisma.product.create({
    data: {
      sku: 'MEM-DDR4-16GB',
      name: 'Memória RAM Kingston Fury 16GB DDR4 3200MHz',
      description: 'Módulo de memória gamer/workstation com dissipador térmico em alumínio.',
      unit: 'UN',
      costPrice: 140.0,
      salePrice: 250.0,
      currentStock: 18,
      minStock: 6,
    },
  });

  const productPaste = await prisma.product.create({
    data: {
      sku: 'PAS-TERM-ARTIC',
      name: 'Pasta Térmica Arctic MX-4 4g Alto Desempenho',
      description: 'Composto térmico de micropartículas de carbono para processadores e GPUs.',
      unit: 'UN',
      costPrice: 25.0,
      salePrice: 55.0,
      currentStock: 25,
      minStock: 8,
    },
  });

  const productFan = await prisma.product.create({
    data: {
      sku: 'FAN-CM-120MM',
      name: 'Cooler Master Fan Industrial 120mm PWM',
      description: 'Ventoinha de rolamento duplo para chassis de servidores e refrigeração de racks.',
      unit: 'UN',
      costPrice: 45.0,
      salePrice: 85.0,
      currentStock: 8,
      minStock: 3,
    },
  });

  const productDisk = await prisma.product.create({
    data: {
      sku: 'HD-SAS-2TB',
      name: 'Disco Enterprise SAS 2TB Seagate Exos',
      description: 'HD de alta confiabilidade operacional 24/7 para controladoras RAID de servidores.',
      unit: 'UN',
      costPrice: 380.0,
      salePrice: 650.0,
      currentStock: 5,
      minStock: 2,
    },
  });

  const productPsu = await prisma.product.create({
    data: {
      sku: 'FNT-COR-650W',
      name: 'Fonte Corsair CV650 650W 80 Plus Bronze',
      description: 'Fonte de alimentação ATX para computadores e estações gráficas.',
      unit: 'UN',
      costPrice: 240.0,
      salePrice: 380.0,
      currentStock: 2, // Estoque crítico (2 <= minStock 3) para demonstrar alerta no dashboard
      minStock: 3,
    },
  });

  console.log('📦 6 Produtos cadastrados (incluindo 1 item com alerta de estoque baixo).');

  // Registrar entradas iniciais de estoque (IN) para os 6 produtos
  const allProducts = [
    { prod: productSsd, qty: 12, cost: 260.0 },
    { prod: productRam, qty: 18, cost: 140.0 },
    { prod: productPaste, qty: 25, cost: 25.0 },
    { prod: productFan, qty: 10, cost: 45.0 }, // 10 iniciais (2 serão consumidos na OS 2)
    { prod: productDisk, qty: 6, cost: 380.0 }, // 6 iniciais (1 será consumido na OS 2)
    { prod: productPsu, qty: 2, cost: 240.0 },
  ];

  for (const item of allProducts) {
    await prisma.stockMovement.create({
      data: {
        productId: item.prod.id,
        type: 'IN',
        quantity: item.qty,
        unitPrice: item.cost,
        reason: 'Carga inicial de estoque / Aquisição de fornecedor',
        createdBy: userAdmin.name,
      },
    });
  }

  console.log('📈 6 Movimentações de entrada de estoque registradas.');

  // ─── Etapa 5: Ordens de Serviço Operacionais ─────────────────────────────────
  // OS 1: ABERTA (Notebook Dell Latitude - Silva & Associados)
  const os1 = await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0001',
      customerId: customerLawFirm.id,
      equipment: 'Notebook Dell Latitude 5420',
      serialNumber: 'DELL-LAT-9821',
      reportedDefect: 'Não liga após oscilação de energia elétrica no escritório.',
      status: 'OPEN',
      priority: 'HIGH',
      totalServices: 150.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 150.0,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico técnico inicial e análise de curto na placa-mãe',
            quantity: 1,
            unitPrice: 150.0,
            subtotal: 150.0,
          },
        ],
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Ordem de serviço registrada pelo canal de atendimento corporativo.',
            createdBy: userOperator.name,
          },
        ],
      },
    },
  });

  // OS 2: EM ANDAMENTO (Servidor HP ProLiant - Clínica São Lucas)
  // Atribuída a Roberto Alves, com peças reais vinculadas ao estoque
  const os2 = await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0002',
      customerId: customerClinic.id,
      technicianId: techRoberto.id,
      equipment: 'Servidor HP ProLiant MicroServer Gen10',
      serialNumber: 'HP-SRV-4412',
      reportedDefect: 'Alarme sonoro de superaquecimento e degradação de performance no array RAID.',
      technicalDiagnosis: 'Falha mecânica em ventoinha primária e bloco defeituoso no disco 2.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      totalServices: 220.0,
      totalParts: 820.0,
      discount: 40.0,
      totalAmount: 1000.0,
      scheduledDate: new Date(),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Desmontagem, limpeza do chassi térmico e reinstalação de ventoinhas',
            quantity: 1,
            unitPrice: 220.0,
            subtotal: 220.0,
          },
          {
            productId: productFan.id,
            type: 'PART',
            description: 'Cooler Master Fan Industrial 120mm PWM',
            quantity: 2,
            unitPrice: 85.0,
            subtotal: 170.0,
          },
          {
            productId: productDisk.id,
            type: 'PART',
            description: 'Disco Enterprise SAS 2TB Seagate Exos',
            quantity: 1,
            unitPrice: 650.0,
            subtotal: 650.0,
          },
        ],
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'OS aberta com prioridade de emergência para servidor de prontuários médicos.',
            createdBy: userOperator.name,
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciada a substituição do cooler e rebuild do array RAID no laboratório.',
            createdBy: techRoberto.name,
          },
        ],
      },
    },
  });

  // Registrar saídas de estoque (OUT) para as peças consumidas na OS 2
  await prisma.stockMovement.create({
    data: {
      productId: productFan.id,
      workOrderId: os2.id,
      type: 'OUT',
      quantity: 2,
      unitPrice: 85.0,
      reason: `Baixa por aplicação na ordem de serviço ${os2.orderNumber}`,
      createdBy: techRoberto.name,
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: productDisk.id,
      workOrderId: os2.id,
      type: 'OUT',
      quantity: 1,
      unitPrice: 650.0,
      reason: `Baixa por aplicação na ordem de serviço ${os2.orderNumber}`,
      createdBy: techRoberto.name,
    },
  });

  // OS 3: CONCLUÍDA (MacBook Pro 14 M1 - Carlos Eduardo Mendes)
  // Atribuída a Mariana Costa com fotos e laudo
  const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const finishDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const os3 = await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0003',
      customerId: customerPerson.id,
      technicianId: techMariana.id,
      equipment: 'MacBook Pro 14 M1 (2021)',
      serialNumber: 'C02GF389MD6R',
      reportedDefect: 'Lentidão extrema e erros de kernel panic ao inicializar.',
      technicalDiagnosis: 'Corrupção no APFS decorrente de desligamento abrupto; reinstalação limpa do macOS efetuada e bateria testada 100% OK.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      totalServices: 350.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 350.0,
      scheduledDate: pastDate,
      completedDate: finishDate,
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Restauração do macOS, backup de perfil de usuário e diagnóstico geral de hardware',
            quantity: 1,
            unitPrice: 350.0,
            subtotal: 350.0,
          },
        ],
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Recebido na recepção para análise técnica em bancada.',
            createdBy: userOperator.name,
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciado teste de estresse de memória unificada e integridade do SSD.',
            createdBy: techMariana.name,
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'WAITING_APPROVAL',
            comment: 'Orçamento de restauração enviado para o cliente por WhatsApp.',
            createdBy: techMariana.name,
          },
          {
            previousStatus: 'WAITING_APPROVAL',
            newStatus: 'IN_PROGRESS',
            comment: 'Orçamento autorizado pelo cliente.',
            createdBy: userOperator.name,
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'COMPLETED',
            comment: 'Instalação concluída com sucesso e equipamento pronto para entrega com garantia.',
            createdBy: techMariana.name,
          },
        ],
      },
    },
  });

  console.log('📋 3 Ordens de Serviço populadas (OPEN, IN_PROGRESS, COMPLETED) com logs e itens.');

  // ─── Etapa 6: Anexos Fotográficos & Documentais da OS ────────────────────────
  await prisma.workOrderAttachment.createMany({
    data: [
      {
        workOrderId: os3.id,
        fileName: 'macbook-entrada-tela-danificada.jpg',
        originalName: 'foto_recepcao_macbook.jpg',
        mimeType: 'image/jpeg',
        size: 2451200,
        url: '/uploads/work-orders/os3-before-macbook.jpg',
        type: 'BEFORE',
        uploadedBy: userOperator.name,
      },
      {
        workOrderId: os3.id,
        fileName: 'macbook-reparado-bancada.jpg',
        originalName: 'macbook_finalizado_sucesso.jpg',
        mimeType: 'image/jpeg',
        size: 3120400,
        url: '/uploads/work-orders/os3-after-macbook.jpg',
        type: 'AFTER',
        uploadedBy: techMariana.name,
      },
      {
        workOrderId: os3.id,
        fileName: 'laudo-pericial-conclusao-macbook.pdf',
        originalName: 'laudo_tecnico_restauracao.pdf',
        mimeType: 'application/pdf',
        size: 541200,
        url: '/uploads/work-orders/laudo-macbook-final.pdf',
        type: 'DOCUMENT',
        uploadedBy: techMariana.name,
      },
    ],
  });

  console.log('📷 3 Anexos de OS criados (BEFORE, AFTER e DOCUMENT).');

  // ─── Etapa 7: Orçamentos Comerciais (Quotes) ────────────────────────────────
  // Orçamento 1: SENT para Silva & Associados
  await prisma.quote.create({
    data: {
      quoteNumber: 'ORC-2026-0001',
      customerId: customerLawFirm.id,
      technicianId: techRoberto.id,
      equipment: 'Parque de Estações Dell OptiPlex (3 Unidades)',
      serialNumber: 'LOTE-DELL-3X',
      reportedDefect: 'Lentidão generalizada no carregamento do sistema e banco de processos jurídicos.',
      technicalDiagnosis: 'Necessidade de upgrade de armazenamento para SSDs NVMe e reinstalação dos sistemas operacionais.',
      status: 'SENT',
      notes: 'Validade de 15 dias corridos. Condições de pagamento: 30 dias no faturamento.',
      discount: 60.0,
      totalServices: 450.0,
      totalParts: 1260.0,
      totalAmount: 1650.0,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: productSsd.id,
            type: 'PART',
            description: 'SSD NVMe Kingston NV2 1TB M.2 2280',
            quantity: 3,
            unitPrice: 420.0,
            subtotal: 1260.0,
          },
          {
            type: 'SERVICE',
            description: 'Instalação física, clonagem de disco e configuração de estações',
            quantity: 3,
            unitPrice: 150.0,
            subtotal: 450.0,
          },
        ],
      },
    },
  });

  // Orçamento 2: APPROVED vinculado à OS-2026-0002
  await prisma.quote.create({
    data: {
      quoteNumber: 'ORC-2026-0002',
      customerId: customerClinic.id,
      technicianId: techRoberto.id,
      workOrderId: os2.id,
      equipment: 'Servidor HP ProLiant MicroServer Gen10',
      serialNumber: 'HP-SRV-4412',
      reportedDefect: 'Superaquecimento e falha no subsistema de armazenamento SAS.',
      technicalDiagnosis: 'Substituição preventiva de fan industrial e unidade defeituosa de disco SAS.',
      status: 'APPROVED',
      notes: 'Orçamento aprovado pela coordenação técnica da clínica médica.',
      discount: 40.0,
      totalServices: 220.0,
      totalParts: 820.0,
      totalAmount: 1000.0,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Desmontagem, limpeza do chassi térmico e reinstalação de ventoinhas',
            quantity: 1,
            unitPrice: 220.0,
            subtotal: 220.0,
          },
          {
            productId: productFan.id,
            type: 'PART',
            description: 'Cooler Master Fan Industrial 120mm PWM',
            quantity: 2,
            unitPrice: 85.0,
            subtotal: 170.0,
          },
          {
            productId: productDisk.id,
            type: 'PART',
            description: 'Disco Enterprise SAS 2TB Seagate Exos',
            quantity: 1,
            unitPrice: 650.0,
            subtotal: 650.0,
          },
        ],
      },
    },
  });

  // Orçamento 3: DRAFT para Carlos Eduardo Mendes
  await prisma.quote.create({
    data: {
      quoteNumber: 'ORC-2026-0003',
      customerId: customerPerson.id,
      technicianId: techMariana.id,
      equipment: 'Gabinete Custom PC Gamer',
      serialNumber: 'GAMER-CUSTOM-2025',
      reportedDefect: 'Upgrade geral de performance para renderização de vídeo e jogos.',
      technicalDiagnosis: 'Acréscimo de 16GB de RAM DDR4 e troca preventiva de pasta térmica de alto rendimento.',
      status: 'DRAFT',
      notes: 'Proposta inicial em elaboração para envio ao cliente.',
      discount: 0.0,
      totalServices: 100.0,
      totalParts: 305.0,
      totalAmount: 405.0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: productRam.id,
            type: 'PART',
            description: 'Memória RAM Kingston Fury 16GB DDR4 3200MHz',
            quantity: 1,
            unitPrice: 250.0,
            subtotal: 250.0,
          },
          {
            productId: productPaste.id,
            type: 'PART',
            description: 'Pasta Térmica Arctic MX-4 4g Alto Desempenho',
            quantity: 1,
            unitPrice: 55.0,
            subtotal: 55.0,
          },
          {
            type: 'SERVICE',
            description: 'Mão de obra de limpeza interna, repaste de GPU e teste de estabilidade',
            quantity: 1,
            unitPrice: 100.0,
            subtotal: 100.0,
          },
        ],
      },
    },
  });

  console.log('💼 3 Orçamentos comerciais populados (SENT, APPROVED, DRAFT).');

  // ─── Etapa 8: Faturamento & Baixas de Pagamento ──────────────────────────────
  // Fatura 1: PAGA vinculada à OS 3 (MacBook Pro)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAT-2026-0001',
      customerId: customerPerson.id,
      workOrderId: os3.id,
      amount: 350.0,
      discount: 0.0,
      netAmount: 350.0,
      paidAmount: 350.0,
      status: 'PAID',
      dueDate: new Date(),
      notes: 'Fatura liquidada integralmente no balcão no ato da entrega do equipamento.',
    },
  });

  // Pagamento da Fatura 1 via PIX
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 350.0,
      paymentMethod: 'PIX',
      paidAt: new Date(),
      receivedBy: userAdmin.name,
      notes: 'Comprovante PIX validado com sucesso pela tesouraria.',
    },
  });

  // Fatura 2: PENDENTE vinculada à OS 2 (Servidor HP)
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAT-2026-0002',
      customerId: customerClinic.id,
      workOrderId: os2.id,
      amount: 1040.0,
      discount: 40.0,
      netAmount: 1000.0,
      paidAmount: 0.0,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: 'Faturamento faturado com boleto bancário para 10 dias após entrega técnica.',
    },
  });

  console.log('💳 2 Faturas criadas (1 PAID com baixa PIX, 1 PENDING com vencimento futuro).');

  // ─── Etapa 9: Fluxo de Caixa & Transações Financeiras ────────────────────────
  // Transação 1: Receita liquidada da Fatura 1
  await prisma.financialTransaction.create({
    data: {
      type: 'REVENUE',
      category: 'SERVICE_REVENUE',
      description: `Recebimento de serviços — OS-2026-0003 (Fatura ${invoice1.invoiceNumber})`,
      amount: 350.0,
      dueDate: new Date(),
      paymentDate: new Date(),
      status: 'PAID',
      invoiceId: invoice1.id,
    },
  });

  // Transação 2: Receita a receber prevista da Fatura 2
  await prisma.financialTransaction.create({
    data: {
      type: 'REVENUE',
      category: 'SERVICE_REVENUE',
      description: `Faturamento previsto — OS-2026-0002 (Fatura ${invoice2.invoiceNumber})`,
      amount: 1000.0,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      invoiceId: invoice2.id,
    },
  });

  // Transação 3: Despesa paga de compra de peças para estoque
  const pastDays5 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await prisma.financialTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'PARTS_PURCHASE',
      description: 'Aquisição de lote de peças e componentes para reposição de estoque (Distribuidora Tech)',
      amount: 4250.0,
      dueDate: pastDays5,
      paymentDate: pastDays5,
      status: 'PAID',
    },
  });

  // Transação 4: Despesa fixa paga operacional da oficina
  const pastDays2 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  await prisma.financialTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'FIXED_EXPENSE',
      description: 'Despesas de infraestrutura, utilidades e manutenção da bancada do laboratório',
      amount: 1200.0,
      dueDate: pastDays2,
      paymentDate: pastDays2,
      status: 'PAID',
    },
  });

  console.log('📊 4 Transações financeiras integradas ao Fluxo de Caixa (receitas e despesas).');

  console.log('\n================================================================');
  console.log('🚀 Seed Global Finalizado com Sucesso!');
  console.log('   - 2 Usuários (admin@empresa.com / operador@empresa.com)');
  console.log('   - 1 Empresa (OS Assistência & Tecnologia)');
  console.log('   - 3 Clientes (Silva & Associados, Clínica São Lucas, Carlos Mendes)');
  console.log('   - 2 Técnicos (Roberto Alves, Mariana Costa)');
  console.log('   - 6 Produtos (1 em estoque crítico para testes de alerta)');
  console.log('   - 8 Movimentações de Estoque (6 IN, 2 OUT)');
  console.log('   - 3 Orçamentos Comerciais (SENT, APPROVED, DRAFT)');
  console.log('   - 3 Ordens de Serviço (OPEN, IN_PROGRESS, COMPLETED)');
  console.log('   - 3 Anexos de Ordem de Serviço (BEFORE, AFTER, DOCUMENT)');
  console.log('   - 2 Faturas (1 Paga, 1 Pendente)');
  console.log('   - 1 Pagamento PIX liquidado');
  console.log('   - 4 Transações no Fluxo de Caixa');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
