import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

// Carregar variáveis de ambiente de teste
config({ path: resolve(__dirname, '../../../.env.example') });
process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let adminToken: string;
let operatorToken: string;

const createdFilePaths: string[] = [];

// Helper para construir payload multipart manual para upload de anexos via inject
function createMultipartPayload(
  file?: { filename: string; mimetype: string; content: Buffer },
  fields?: Record<string, string>
) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const CRLF = '\r\n';
  const parts: Buffer[] = [];

  if (fields) {
    for (const [key, val] of Object.entries(fields)) {
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}${val}${CRLF}`
        )
      );
    }
  }

  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${file.filename}"${CRLF}Content-Type: ${file.mimetype}${CRLF}${CRLF}`
      )
    );
    parts.push(file.content);
    parts.push(Buffer.from(`${CRLF}`));
  }

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  return {
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.concat(parts),
  };
}

// Ordem rigorosa reversa de deleção para preservar integridade referencial do SQLite
async function cleanDatabase(appInstance: FastifyInstance) {
  if (appInstance?.prisma) {
    // 1. Módulo Financeiro & Pagamentos
    await appInstance.prisma.financialTransaction.deleteMany();
    await appInstance.prisma.payment.deleteMany();
    await appInstance.prisma.invoice.deleteMany();

    // 2. Módulo de Orçamentos
    await appInstance.prisma.quoteItem.deleteMany();
    await appInstance.prisma.quote.deleteMany();

    // 3. Módulo de Ordens de Serviço & Estoque
    await appInstance.prisma.workOrderLog.deleteMany();
    await appInstance.prisma.stockMovement.deleteMany();
    await appInstance.prisma.workOrderItem.deleteMany();
    await appInstance.prisma.workOrderAttachment.deleteMany();
    await appInstance.prisma.workOrder.deleteMany();

    // 4. Cadastros Base
    await appInstance.prisma.product.deleteMany();
    await appInstance.prisma.technician.deleteMany();
    await appInstance.prisma.customer.deleteMany();

    // 5. Configurações da Empresa e Usuários
    await appInstance.prisma.company.deleteMany();
    await appInstance.prisma.user.deleteMany();
  }
}

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  // Usuário Administrador
  adminToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Administrador Master',
    email: 'admin.e2e@oficina.com',
    role: 'ADMIN',
  });

  // Usuário Operador Técnico
  operatorToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Operador de Bancada',
    email: 'operador.e2e@oficina.com',
    role: 'OPERATOR',
  });
});

afterAll(async () => {
  // Limpeza física de arquivos temporários de upload gerados durante os testes
  for (const f of createdFilePaths) {
    if (fs.existsSync(f)) {
      await fs.promises.unlink(f).catch(() => {});
    }
  }

  // Também verificar diretório de uploads local
  const uploadsDirs = [
    path.resolve(process.cwd(), 'uploads/work-orders'),
    path.resolve(process.cwd(), 'server/uploads/work-orders'),
  ];
  for (const dir of uploadsDirs) {
    if (fs.existsSync(dir)) {
      const files = await fs.promises.readdir(dir).catch(() => []);
      for (const file of files) {
        if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp')) {
          await fs.promises.unlink(path.join(dir, file)).catch(() => {});
        }
      }
    }
  }

  if (app) {
    await cleanDatabase(app);
    await app.close();
  }
});

beforeEach(async () => {
  await cleanDatabase(app);
});

describe('ENG-34: Suíte E2E de Integração do Ciclo Completo de Atendimento', () => {
  it('deve executar o fluxo integrado ponta a ponta (Golden Path): Governança ➔ Estoque ➔ Orçamento ➔ OS ➔ Fotos ➔ Laudo ➔ Fatura ➔ PIX ➔ Fluxo de Caixa', async () => {
    // =========================================================================
    // ESTÁGIO 1 & 2: Autenticação & Validação de Bloqueio RBAC (403 Forbidden)
    // =========================================================================
    // Operador sem privilégios tenta alterar as configurações fiscais da empresa
    const forbiddenCompanyRes = await app.inject({
      method: 'PUT',
      url: '/company',
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        name: 'Tentativa Invasiva Ltda',
        tradeName: 'Hacker Tech',
        cnpj: '11.222.333/0001-81',
        email: 'invasao@oficina.com',
        phone: '(11) 99999-0000',
        address: 'Rua Desconhecida, 0',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
    });

    expect(forbiddenCompanyRes.statusCode).toBe(403);
    const forbiddenBody = forbiddenCompanyRes.json();
    expect(forbiddenBody.message).toContain('Acesso negado');

    // =========================================================================
    // ESTÁGIO 3: Setup Corporativo com ADMIN e Cadastro de Peça no Estoque
    // =========================================================================
    // 3.1 Setup da Empresa por Administrador
    const companyRes = await app.inject({
      method: 'PUT',
      url: '/company',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Assistência Técnica Premium Especializada Ltda',
        tradeName: 'Premium Tech Soluções',
        cnpj: '11.222.333/0001-81',
        email: 'contato@premiumtech.com.br',
        phone: '(11) 3214-5500',
        address: 'Av. Paulista, 1500 - Conjunto 42',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-200',
        warrantyTerms: 'Garantia de 90 dias para peças substituídas e mão de obra técnica conforme CDC.',
        workOrderNotes: 'Aparelhos não retirados após 90 dias poderão ter cobrança de diária de armazenagem.',
      },
    });

    expect(companyRes.statusCode).toBe(200);
    const company = companyRes.json();
    expect(company.cnpj).toBe('11.222.333/0001-81');
    expect(company.tradeName).toBe('Premium Tech Soluções');

    // 3.2 Cadastro de Produto/Peça com saldo inicial no Estoque
    const productRes = await app.inject({
      method: 'POST',
      url: '/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        sku: 'BATT-IP13PRO-OEM',
        name: 'Bateria iPhone 13 Pro Premium',
        description: 'Célula de Íon de Lítio OEM alta densidade com BMS integrado',
        unit: 'UN',
        costPrice: 120.0,
        salePrice: 280.0,
        initialStock: 15,
        minStock: 3,
      },
    });

    expect(productRes.statusCode).toBe(201);
    const product = productRes.json();
    expect(product.id).toBeDefined();
    expect(product.sku).toBe('BATT-IP13PRO-OEM');
    expect(product.currentStock).toBe(15);

    // Validação da movimentação inicial do estoque
    const initialMovementsRes = await app.inject({
      method: 'GET',
      url: `/stock/movements?productId=${product.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(initialMovementsRes.statusCode).toBe(200);
    const initialMovements = initialMovementsRes.json().data;
    expect(initialMovements).toHaveLength(1);
    expect(initialMovements[0].type).toBe('IN');
    expect(initialMovements[0].quantity).toBe(15);
    expect(initialMovements[0].reason).toContain('Saldo inicial cadastrado');

    // =========================================================================
    // ESTÁGIO 4: Elaboração Comercial do Orçamento
    // =========================================================================
    // 4.1 Cadastro de Cliente
    const customerRes = await app.inject({
      method: 'POST',
      url: '/customers',
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        name: 'Guilherme Silveira Ramos',
        document: '529.982.247-25',
        email: 'guilherme.ramos@techcorp.com',
        phone: '(11) 98765-4321',
        address: 'Rua Bela Cintra, 850, Apto 101 - Consolação, São Paulo - SP',
      },
    });
    expect(customerRes.statusCode).toBe(201);
    const customer = customerRes.json();

    // 4.2 Cadastro de Técnico Especialista
    const technicianRes = await app.inject({
      method: 'POST',
      url: '/technicians',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Lucas Martins Hardware Specialist',
        email: 'lucas.martins@premiumtech.com.br',
        phone: '(11) 97123-4567',
        specialty: 'Smartphones e Microeletrônica SMD',
        isActive: true,
      },
    });
    expect(technicianRes.statusCode).toBe(201);
    const technician = technicianRes.json();

    // 4.3 Criação do Orçamento Comercial (DRAFT) com Serviço e Peça do Estoque
    const quoteRes = await app.inject({
      method: 'POST',
      url: '/quotes',
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        customerId: customer.id,
        technicianId: technician.id,
        equipment: 'iPhone 13 Pro 256GB Grafite',
        serialNumber: 'DN6FL29G0D6M',
        reportedDefect: 'Aparelho descarrega rapidamente, superaquece durante carregamento e saúde da bateria está em 71%.',
        items: [
          {
            type: 'SERVICE',
            description: 'Substituição de Bateria e Calibração BMS',
            quantity: 1,
            unitPrice: 150.0,
          },
          {
            productId: product.id,
            type: 'PART',
            description: 'Bateria iPhone 13 Pro Premium',
            quantity: 1,
            unitPrice: 280.0,
          },
        ],
        notes: 'Cliente solicitou prioridade para retirada no mesmo dia.',
      },
    });

    expect(quoteRes.statusCode).toBe(201);
    const quote = quoteRes.json();
    expect(quote.id).toBeDefined();
    expect(quote.quoteNumber).toMatch(/^ORC-\d{4}-\d{4}$/);
    expect(quote.status).toBe('DRAFT');
    expect(quote.totalServices).toBe(150.0);
    expect(quote.totalParts).toBe(280.0);
    expect(quote.discount).toBe(0.0);
    expect(quote.totalAmount).toBe(430.0);
    expect(quote.items).toHaveLength(2);

    // =========================================================================
    // ESTÁGIO 5: Aprovação Comercial e Conversão Atômica em Ordem de Serviço
    // =========================================================================
    // 5.1 Enviar Proposta para o Cliente
    const sendQuoteRes = await app.inject({
      method: 'PATCH',
      url: `/quotes/${quote.id}/status`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        status: 'SENT',
      },
    });
    expect(sendQuoteRes.statusCode).toBe(200);
    expect(sendQuoteRes.json().status).toBe('SENT');

    // 5.2 Conversão em Ordem de Serviço (Baixa no estoque e criação da OS)
    const convertRes = await app.inject({
      method: 'POST',
      url: `/quotes/${quote.id}/convert-to-work-order`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });

    expect(convertRes.statusCode).toBe(201);
    const convertData = convertRes.json();
    const workOrder = convertData.workOrder;
    const updatedQuote = convertData.quote;

    expect(workOrder.id).toBeDefined();
    expect(workOrder.orderNumber).toMatch(/^OS-\d{4}-\d{4}$/);
    expect(workOrder.status).toBe('OPEN');
    expect(workOrder.totalAmount).toBe(430.0);
    expect(workOrder.customerId).toBe(customer.id);
    expect(workOrder.technicianId).toBe(technician.id);

    // Orçamento atualizado para APPROVED e associado à OS
    expect(updatedQuote.status).toBe('APPROVED');
    expect(updatedQuote.workOrderId).toBe(workOrder.id);

    // 5.3 Auditoria de baixa no Estoque físico (15 -> 14)
    const checkProductAfterConvert = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(checkProductAfterConvert.statusCode).toBe(200);
    expect(checkProductAfterConvert.json().currentStock).toBe(14);

    // Auditoria da movimentação de saída (OUT)
    const movementsAfterConvertRes = await app.inject({
      method: 'GET',
      url: `/stock/movements?productId=${product.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const movementsAfterConvert = movementsAfterConvertRes.json().data;
    expect(movementsAfterConvert).toHaveLength(2);
    const outMovement = movementsAfterConvert.find((m: any) => m.type === 'OUT');
    expect(outMovement).toBeDefined();
    expect(outMovement.quantity).toBe(1);
    expect(outMovement.reason).toContain(quote.quoteNumber);
    expect(outMovement.reason).toContain(workOrder.orderNumber);

    // =========================================================================
    // ESTÁGIO 6: Upload de Fotos de Entrada (Inspeção Física BEFORE)
    // =========================================================================
    const fakeBeforeJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    const beforePayload = createMultipartPayload(
      {
        filename: 'aparelho_entrada_tela_intacta.jpg',
        mimetype: 'image/jpeg',
        content: fakeBeforeJpg,
      },
      {
        type: 'BEFORE',
      }
    );

    const uploadBeforeRes = await app.inject({
      method: 'POST',
      url: `/work-orders/${workOrder.id}/attachments`,
      headers: {
        Authorization: `Bearer ${operatorToken}`,
        ...beforePayload.headers,
      },
      payload: beforePayload.payload,
    });

    expect(uploadBeforeRes.statusCode).toBe(201);
    const beforeAttachment = uploadBeforeRes.json();
    expect(beforeAttachment.id).toBeDefined();
    expect(beforeAttachment.type).toBe('BEFORE');
    expect(beforeAttachment.url).toMatch(/^\/uploads\/work-orders\/.+\.jpg$/);

    // Registrar para deleção física no teardown
    const diskPathBefore = path.resolve(process.cwd(), 'uploads/work-orders', path.basename(beforeAttachment.url));
    createdFilePaths.push(diskPathBefore);

    // =========================================================================
    // ESTÁGIO 7: Execução Técnica e Conclusão com Laudo Técnico Obrigatório
    // =========================================================================
    // 7.1 Iniciar execução técnica (OPEN -> IN_PROGRESS)
    const inProgressRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${workOrder.id}/status`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        status: 'IN_PROGRESS',
        comment: 'Aparelho alocado na bancada 3 para abertura e isolamento do circuito.',
      },
    });
    expect(inProgressRes.statusCode).toBe(200);
    expect(inProgressRes.json().status).toBe('IN_PROGRESS');

    // 7.2 Regra de Validação: Tentativa de concluir OS sem laudo técnico (400 Bad Request)
    const completeWithoutDiagnosisRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${workOrder.id}/status`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: '', // em branco propositalmente
      },
    });
    expect(completeWithoutDiagnosisRes.statusCode).toBe(400);
    expect(completeWithoutDiagnosisRes.json().message).toContain('Diagnóstico técnico é obrigatório');

    // 7.3 Conclusão bem-sucedida com laudo técnico completo
    const completeValidRes = await app.inject({
      method: 'PATCH',
      url: `/work-orders/${workOrder.id}/status`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        status: 'COMPLETED',
        technicalDiagnosis: 'Substituição de bateria executada com sucesso. Calibração BMS realizada com ciclo completo de 100% de saúde e vedação IP68 reinstalada.',
        comment: 'Serviço finalizado e equipamento limpo para entrega.',
      },
    });
    expect(completeValidRes.statusCode).toBe(200);
    const completedWo = completeValidRes.json();
    expect(completedWo.status).toBe('COMPLETED');
    expect(completedWo.completedDate).toBeDefined();
    expect(completedWo.technicalDiagnosis).toContain('Substituição de bateria executada');

    // 7.4 Garantir que o estoque não sofreu dupla baixa (permaneceu em 14)
    const productCheckAfterCompletion = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(productCheckAfterCompletion.json().currentStock).toBe(14);

    // =========================================================================
    // ESTÁGIO 8: Upload de Fotos de Saída (Inspeção de Entrega AFTER)
    // =========================================================================
    const fakeAfterJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x01]);
    const afterPayload = createMultipartPayload(
      {
        filename: 'aparelho_concluido_saude_100.jpg',
        mimetype: 'image/jpeg',
        content: fakeAfterJpg,
      },
      {
        type: 'AFTER',
      }
    );

    const uploadAfterRes = await app.inject({
      method: 'POST',
      url: `/work-orders/${workOrder.id}/attachments`,
      headers: {
        Authorization: `Bearer ${operatorToken}`,
        ...afterPayload.headers,
      },
      payload: afterPayload.payload,
    });

    expect(uploadAfterRes.statusCode).toBe(201);
    const afterAttachment = uploadAfterRes.json();
    expect(afterAttachment.id).toBeDefined();
    expect(afterAttachment.type).toBe('AFTER');

    const diskPathAfter = path.resolve(process.cwd(), 'uploads/work-orders', path.basename(afterAttachment.url));
    createdFilePaths.push(diskPathAfter);

    // Verificar listagem de anexos da OS contendo BEFORE e AFTER
    const attachmentsListRes = await app.inject({
      method: 'GET',
      url: `/work-orders/${workOrder.id}/attachments`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(attachmentsListRes.statusCode).toBe(200);
    const allAttachments = attachmentsListRes.json();
    expect(allAttachments).toHaveLength(2);
    expect(allAttachments.some((a: any) => a.type === 'BEFORE')).toBe(true);
    expect(allAttachments.some((a: any) => a.type === 'AFTER')).toBe(true);

    // =========================================================================
    // ESTÁGIO 9: Emissão de Fatura a partir da OS Concluída
    // =========================================================================
    const currentYear = new Date().getFullYear();
    const invoiceRes = await app.inject({
      method: 'POST',
      url: '/invoices',
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        workOrderId: workOrder.id,
        dueDate: '2026-10-30',
        notes: 'Fatura referente à substituição de bateria iPhone 13 Pro.',
      },
    });

    expect(invoiceRes.statusCode).toBe(201);
    const invoice = invoiceRes.json();
    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(new RegExp(`^FAT-${currentYear}-\\d{4}$`));
    expect(invoice.workOrderId).toBe(workOrder.id);
    expect(invoice.customerId).toBe(customer.id);
    expect(invoice.amount).toBe(430.0);
    expect(invoice.netAmount).toBe(430.0);
    expect(invoice.paidAmount).toBe(0.0);
    expect(invoice.status).toBe('PENDING');

    // =========================================================================
    // ESTÁGIO 10: Registro de Pagamento via PIX e Liquidação da Fatura
    // =========================================================================
    const paymentRes = await app.inject({
      method: 'POST',
      url: `/invoices/${invoice.id}/payments`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      payload: {
        amount: 430.0,
        paymentMethod: 'PIX',
        notes: 'Pagamento instantâneo via QR Code PIX confirmado no balcão da assistência.',
      },
    });

    expect(paymentRes.statusCode).toBe(201);
    const paymentData = paymentRes.json();
    expect(paymentData.payment.id).toBeDefined();
    expect(paymentData.payment.amount).toBe(430.0);
    expect(paymentData.payment.paymentMethod).toBe('PIX');
    expect(paymentData.invoice.status).toBe('PAID');
    expect(paymentData.invoice.paidAmount).toBe(430.0);

    // Conferência do status atual da fatura via GET individual
    const getInvoiceRes = await app.inject({
      method: 'GET',
      url: `/invoices/${invoice.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(getInvoiceRes.statusCode).toBe(200);
    const freshInvoice = getInvoiceRes.json();
    expect(freshInvoice.status).toBe('PAID');
    expect(freshInvoice.remainingBalance).toBe(0);
    expect(freshInvoice.payments).toHaveLength(1);

    // =========================================================================
    // ESTÁGIO 11: Auditoria em Tempo Real no Financeiro e Fluxo de Caixa
    // =========================================================================
    // 11.1 Conferir transação contábil criada automaticamente pela quitação
    const transactionsRes = await app.inject({
      method: 'GET',
      url: `/financial/transactions?invoiceId=${invoice.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(transactionsRes.statusCode).toBe(200);
    const transactions = transactionsRes.json().data;
    expect(transactions).toHaveLength(1);
    const tx = transactions[0];
    expect(tx.type).toBe('REVENUE');
    expect(tx.category).toBe('SERVICE_REVENUE');
    expect(tx.status).toBe('PAID');
    expect(tx.amount).toBe(430.0);
    expect(tx.invoiceId).toBe(invoice.id);

    // 11.2 Conferir consolidação do Fluxo de Caixa (/financial/cashflow)
    const cashflowRes = await app.inject({
      method: 'GET',
      url: '/financial/cashflow',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(cashflowRes.statusCode).toBe(200);
    const cashflow = cashflowRes.json();
    expect(cashflow.currentBalance).toBe(430.0);
    expect(cashflow.period.paidRevenue).toBe(430.0);
    expect(cashflow.period.paidExpense).toBe(0.0);
    expect(cashflow.period.periodBalance).toBe(430.0);
    expect(cashflow.period.totalToReceive).toBe(0.0);
    expect(cashflow.period.totalToPay).toBe(0.0);
  });

  describe('Casos de Borda e Proteções de Integridade da Release v1.1', () => {
    it('deve rejeitar tentativa de faturamento de Ordem de Serviço não concluída (400 Bad Request)', async () => {
      // 1. Criar cliente e OS em status OPEN
      const customer = await app.prisma.customer.create({
        data: {
          name: 'Cliente OS Pendente',
          document: '529.982.247-25',
          email: 'pendente@oficina.com',
          phone: '(11) 98888-0001',
          address: 'Rua das Amoreiras, 100',
        },
      });

      const currentYear = new Date().getFullYear();
      const openWorkOrder = await app.prisma.workOrder.create({
        data: {
          orderNumber: `OS-${currentYear}-9901`,
          customerId: customer.id,
          equipment: 'Console PlayStation 5',
          reportedDefect: 'Sem sinal HDMI',
          status: 'OPEN',
          totalAmount: 350.0,
        },
      });

      // 2. Tentar faturar a OS aberta
      const invoiceRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          workOrderId: openWorkOrder.id,
        },
      });

      expect(invoiceRes.statusCode).toBe(400);
      expect(invoiceRes.json().message).toContain('concluída');
    });

    it('deve rejeitar conversão de orçamento quando a peça do catálogo não possui estoque suficiente (400 Bad Request)', async () => {
      // 1. Criar cliente e produto com estoque zerado
      const customer = await app.prisma.customer.create({
        data: {
          name: 'Cliente Estoque Baixo',
          document: '529.982.247-25',
          email: 'estoque.baixo@oficina.com',
          phone: '(11) 98888-0002',
          address: 'Rua dos Pinheiros, 200',
        },
      });

      const outOfStockProduct = await app.prisma.product.create({
        data: {
          sku: 'DISP-OLED-S23',
          name: 'Display OLED Galaxy S23 Ultra',
          unit: 'UN',
          costPrice: 600.0,
          salePrice: 1100.0,
          currentStock: 0, // Estoque insuficiente
          minStock: 1,
        },
      });

      // 2. Criar orçamento demandando 1 unidade da peça zerada
      const quoteRes = await app.inject({
        method: 'POST',
        url: '/quotes',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          customerId: customer.id,
          equipment: 'Samsung Galaxy S23 Ultra',
          reportedDefect: 'Display trincado sem touch',
          items: [
            {
              productId: outOfStockProduct.id,
              type: 'PART',
              description: outOfStockProduct.name,
              quantity: 1,
              unitPrice: 1100.0,
            },
          ],
        },
      });
      expect(quoteRes.statusCode).toBe(201);
      const quoteId = quoteRes.json().id;

      // 3. Tentar converter em OS
      const convertRes = await app.inject({
        method: 'POST',
        url: `/quotes/${quoteId}/convert-to-work-order`,
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(convertRes.statusCode).toBe(400);
      expect(convertRes.json().message).toContain('insuficiente');
    });

    it('deve rejeitar pagamento com valor superior ao saldo devedor restante da fatura (400 Bad Request)', async () => {
      // 1. Criar cliente, OS concluída e fatura
      const customer = await app.prisma.customer.create({
        data: {
          name: 'Cliente Pagamento Excedente',
          document: '529.982.247-25',
          email: 'overpay@oficina.com',
          phone: '(11) 98888-0003',
          address: 'Rua Augusta, 400',
        },
      });

      const currentYear = new Date().getFullYear();
      const completedWo = await app.prisma.workOrder.create({
        data: {
          orderNumber: `OS-${currentYear}-9902`,
          customerId: customer.id,
          equipment: 'MacBook Air M2',
          reportedDefect: 'Troca de teclado',
          technicalDiagnosis: 'Teclado ABNT2 substituído com sucesso.',
          status: 'COMPLETED',
          totalServices: 500.0,
          totalParts: 0.0,
          totalAmount: 500.0,
        },
      });

      const invoiceRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          workOrderId: completedWo.id,
        },
      });
      expect(invoiceRes.statusCode).toBe(201);
      const invoiceId = invoiceRes.json().id;

      // 2. Tentar pagar R$ 600,00 numa fatura de R$ 500,00
      const overpaymentRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          amount: 600.0,
          paymentMethod: 'PIX',
        },
      });

      expect(overpaymentRes.statusCode).toBe(400);
      expect(overpaymentRes.json().message).toContain('saldo devedor');
    });

    it('deve rejeitar pagamento em fatura já totalmente quitada (400 Bad Request)', async () => {
      // 1. Criar fatura de R$ 200,00
      const customer = await app.prisma.customer.create({
        data: {
          name: 'Cliente Fatura Quitada',
          document: '529.982.247-25',
          email: 'quitada@oficina.com',
          phone: '(11) 98888-0004',
          address: 'Av. Brigadeiro Faria Lima, 2000',
        },
      });

      const currentYear = new Date().getFullYear();
      const completedWo = await app.prisma.workOrder.create({
        data: {
          orderNumber: `OS-${currentYear}-9903`,
          customerId: customer.id,
          equipment: 'iPad Pro 11',
          reportedDefect: 'Troca de conector USB-C',
          technicalDiagnosis: 'Conector reparado com sucesso.',
          status: 'COMPLETED',
          totalServices: 200.0,
          totalParts: 0.0,
          totalAmount: 200.0,
        },
      });

      const invoiceRes = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          workOrderId: completedWo.id,
        },
      });
      const invoiceId = invoiceRes.json().id;

      // 2. Liquidar fatura integralmente
      const payRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          amount: 200.0,
          paymentMethod: 'PIX',
        },
      });
      expect(payRes.statusCode).toBe(201);
      expect(payRes.json().invoice.status).toBe('PAID');

      // 3. Tentar realizar um segundo pagamento adicional
      const extraPayRes = await app.inject({
        method: 'POST',
        url: `/invoices/${invoiceId}/payments`,
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: {
          amount: 50.0,
          paymentMethod: 'CASH',
        },
      });

      expect(extraPayRes.statusCode).toBe(400);
      expect(extraPayRes.json().message).toContain('integralmente quitada');
    });
  });
});
