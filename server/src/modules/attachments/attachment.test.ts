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
let operator1Token: string;
let operator2Token: string;

let testCustomerId: string;
let testTechnicianId: string;
let testWorkOrderId: string;

const createdFilePaths: string[] = [];

// Helper para construir payload multipart manual para injeção no Fastify
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

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  // Tokens JWT para diferentes perfis e usuários
  adminToken = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Admin Master',
    email: 'admin@master.com',
    role: 'ADMIN',
  });

  operator1Token = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Operador Um',
    email: 'op1@oficina.com',
    role: 'OPERATOR',
  });

  operator2Token = app.jwt.sign({
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Operador Dois',
    email: 'op2@oficina.com',
    role: 'OPERATOR',
  });
});

afterAll(async () => {
  // Limpeza de quaisquer arquivos físicos criados durante os testes
  for (const f of createdFilePaths) {
    if (fs.existsSync(f)) {
      await fs.promises.unlink(f).catch(() => {});
    }
  }
  if (app) await app.close();
});

beforeEach(async () => {
  // Limpeza de tabelas no banco de dados de teste
  await app.prisma.workOrderAttachment.deleteMany();
  await app.prisma.workOrderLog.deleteMany();
  await app.prisma.workOrderItem.deleteMany();
  await app.prisma.workOrder.deleteMany();
  await app.prisma.technician.deleteMany();
  await app.prisma.customer.deleteMany();

  // Criação de entidades base para teste
  const customer = await app.prisma.customer.create({
    data: {
      name: 'Cliente Anexos Teste',
      document: '123.456.789-00',
      email: 'cliente.anexos@exemplo.com',
      phone: '(11) 99999-1111',
      address: 'Rua dos Anexos, 100',
    },
  });
  testCustomerId = customer.id;

  const technician = await app.prisma.technician.create({
    data: {
      name: 'Técnico Especialista',
      email: 'tecnico.anexos@exemplo.com',
      phone: '(11) 98888-2222',
      specialty: 'Eletrônica',
      isActive: true,
    },
  });
  testTechnicianId = technician.id;

  const workOrder = await app.prisma.workOrder.create({
    data: {
      orderNumber: 'OS-ANEXOS-001',
      customerId: testCustomerId,
      technicianId: testTechnicianId,
      equipment: 'Impressora Laser 3D',
      reportedDefect: 'Falha no cabeçote e manchas no papel',
      status: 'OPEN',
      priority: 'HIGH',
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico técnico',
            quantity: 1,
            unitPrice: 150.0,
            subtotal: 150.0,
          },
        ],
      },
    },
  });
  testWorkOrderId = workOrder.id;
});

describe('Módulo de Upload e Gestão de Anexos da OS (/work-orders/:id/attachments)', () => {
  describe('POST /work-orders/:id/attachments', () => {
    it('deve realizar upload de foto JPEG com categoria BEFORE com sucesso (201)', async () => {
      const fakeImage = Buffer.from('FAKE-JPEG-DATA-HEADER-JFIF-STREAM');
      const { headers, payload } = createMultipartPayload(
        {
          filename: 'foto_avaria_inicial.jpg',
          mimetype: 'image/jpeg',
          content: fakeImage,
        },
        { type: 'BEFORE' }
      );

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();

      expect(data).toHaveProperty('id');
      expect(data.workOrderId).toBe(testWorkOrderId);
      expect(data.originalName).toBe('foto_avaria_inicial.jpg');
      expect(data.mimeType).toBe('image/jpeg');
      expect(data.type).toBe('BEFORE');
      expect(data.uploadedBy).toBe('Operador Um');
      expect(data.url).toMatch(/^\/uploads\/work-orders\/[a-f0-9-]+\.jpg$/i);
      expect(data.size).toBe(fakeImage.length);

      // Verificação física da existência do arquivo em disco
      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', data.fileName);
      createdFilePaths.push(diskPath);
      expect(fs.existsSync(diskPath)).toBe(true);
      expect(fs.readFileSync(diskPath)).toEqual(fakeImage);

      // Verificação de entrega do arquivo via endpoint estático GET /uploads/work-orders/:file
      const staticResponse = await app.inject({
        method: 'GET',
        url: data.url,
      });
      expect(staticResponse.statusCode).toBe(200);
      expect(staticResponse.headers['content-type']).toMatch(/image\/jpeg/);
      expect(staticResponse.rawPayload).toEqual(fakeImage);
    });

    it('deve realizar upload de laudo técnico em PDF com categoria DOCUMENT por ADMIN (201)', async () => {
      const fakePdf = Buffer.from('%PDF-1.4 Fake PDF Content for OS Attachment');
      const { headers, payload } = createMultipartPayload(
        {
          filename: 'laudo_pericial.pdf',
          mimetype: 'application/pdf',
          content: fakePdf,
        },
        { type: 'DOCUMENT' }
      );

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${adminToken}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.type).toBe('DOCUMENT');
      expect(data.mimeType).toBe('application/pdf');
      expect(data.uploadedBy).toBe('Admin Master');

      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', data.fileName);
      createdFilePaths.push(diskPath);
      expect(fs.existsSync(diskPath)).toBe(true);
    });

    it('deve assumir DOCUMENT como padrão quando type não for informado', async () => {
      const fakePng = Buffer.from('FAKE-PNG-STREAM');
      const { headers, payload } = createMultipartPayload({
        filename: 'foto_placa.png',
        mimetype: 'image/png',
        content: fakePng,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.type).toBe('DOCUMENT');

      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', data.fileName);
      createdFilePaths.push(diskPath);
    });

    it('deve retornar 401 Unauthorized se requisição não contiver token de autenticação', async () => {
      const { headers, payload } = createMultipartPayload({
        filename: 'foto.jpg',
        mimetype: 'image/jpeg',
        content: Buffer.from('abc'),
      });

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve retornar 404 se a Ordem de Serviço não existir e não manter arquivo em disco', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const { headers, payload } = createMultipartPayload({
        filename: 'foto_teste.jpg',
        mimetype: 'image/jpeg',
        content: Buffer.from('teste'),
      });

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${nonExistentId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toMatch(/não encontrada/i);
    });

    it('deve retornar 400 se o ID da Ordem de Serviço for inválido (não UUID)', async () => {
      const { headers, payload } = createMultipartPayload({
        filename: 'foto_teste.jpg',
        mimetype: 'image/jpeg',
        content: Buffer.from('teste'),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/work-orders/uuid-invalido-123/attachments',
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
    });

    it('deve retornar 400 se o tipo MIME não for permitido (ex: text/plain)', async () => {
      const { headers, payload } = createMultipartPayload({
        filename: 'script_malicioso.txt',
        mimetype: 'text/plain',
        content: Buffer.from('conteudo de texto proibido'),
      });

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(/tipo de arquivo não permitido/i);
    });

    it('deve retornar 400 se a categoria fornecida for inválida', async () => {
      const { headers, payload } = createMultipartPayload(
        {
          filename: 'foto.jpg',
          mimetype: 'image/jpeg',
          content: Buffer.from('imagem'),
        },
        { type: 'INVALID_CATEGORY' }
      );

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(/categoria de anexo inválida/i);
    });

    it('deve retornar 400 se o arquivo enviado for vazio (0 bytes)', async () => {
      const { headers, payload } = createMultipartPayload({
        filename: 'vazio.jpg',
        mimetype: 'image/jpeg',
        content: Buffer.alloc(0),
      });

      const response = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: {
          ...headers,
          authorization: `Bearer ${operator1Token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(/vazio/i);
    });
  });

  describe('GET /work-orders/:id/attachments e Integração na OS', () => {
    it('deve listar todos os anexos da OS em ordem cronológica decrescente', async () => {
      // Criar 3 anexos
      const p1 = createMultipartPayload(
        { filename: 'foto_1.jpg', mimetype: 'image/jpeg', content: Buffer.from('foto 1') },
        { type: 'BEFORE' }
      );
      const res1 = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p1.headers, authorization: `Bearer ${operator1Token}` },
        payload: p1.payload,
      });
      createdFilePaths.push(path.resolve(process.cwd(), 'uploads/work-orders', res1.json().fileName));

      const p2 = createMultipartPayload(
        { filename: 'foto_2.webp', mimetype: 'image/webp', content: Buffer.from('foto 2') },
        { type: 'AFTER' }
      );
      const res2 = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p2.headers, authorization: `Bearer ${operator1Token}` },
        payload: p2.payload,
      });
      createdFilePaths.push(path.resolve(process.cwd(), 'uploads/work-orders', res2.json().fileName));

      const p3 = createMultipartPayload(
        { filename: 'documento.pdf', mimetype: 'application/pdf', content: Buffer.from('doc') },
        { type: 'DOCUMENT' }
      );
      const res3 = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p3.headers, authorization: `Bearer ${adminToken}` },
        payload: p3.payload,
      });
      createdFilePaths.push(path.resolve(process.cwd(), 'uploads/work-orders', res3.json().fileName));

      // Listar todos
      const listRes = await app.inject({
        method: 'GET',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { authorization: `Bearer ${operator2Token}` },
      });

      expect(listRes.statusCode).toBe(200);
      const list = listRes.json();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(3);
      expect(list[0].originalName).toBe('documento.pdf'); // Mais recente primeiro
      expect(list[1].originalName).toBe('foto_2.webp');
      expect(list[2].originalName).toBe('foto_1.jpg');

      // Filtrar por type=BEFORE
      const filterBeforeRes = await app.inject({
        method: 'GET',
        url: `/work-orders/${testWorkOrderId}/attachments?type=BEFORE`,
        headers: { authorization: `Bearer ${operator2Token}` },
      });
      expect(filterBeforeRes.statusCode).toBe(200);
      const listBefore = filterBeforeRes.json();
      expect(listBefore.length).toBe(1);
      expect(listBefore[0].type).toBe('BEFORE');
      expect(listBefore[0].originalName).toBe('foto_1.jpg');

      // Filtrar por type=AFTER
      const filterAfterRes = await app.inject({
        method: 'GET',
        url: `/work-orders/${testWorkOrderId}/attachments?type=AFTER`,
        headers: { authorization: `Bearer ${operator2Token}` },
      });
      expect(filterAfterRes.statusCode).toBe(200);
      expect(filterAfterRes.json().length).toBe(1);
      expect(filterAfterRes.json()[0].type).toBe('AFTER');

      // Verificar que GET /work-orders/:id traz os anexos embutidos
      const getWoRes = await app.inject({
        method: 'GET',
        url: `/work-orders/${testWorkOrderId}`,
        headers: { authorization: `Bearer ${operator1Token}` },
      });
      expect(getWoRes.statusCode).toBe(200);
      const woData = getWoRes.json();
      expect(woData).toHaveProperty('attachments');
      expect(Array.isArray(woData.attachments)).toBe(true);
      expect(woData.attachments.length).toBe(3);
    });

    it('deve retornar 404 ao tentar listar anexos de OS inexistente', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/work-orders/00000000-0000-0000-0000-000000000000/attachments',
        headers: { authorization: `Bearer ${operator1Token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /work-orders/:id/attachments/:attachmentId e RBAC', () => {
    it('deve impedir que outro operador exclua anexo enviado por operador diferente (403 Forbidden)', async () => {
      // OPERATOR 1 faz upload
      const p = createMultipartPayload(
        { filename: 'foto_op1.jpg', mimetype: 'image/jpeg', content: Buffer.from('conteudo') },
        { type: 'BEFORE' }
      );
      const uploadRes = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p.headers, authorization: `Bearer ${operator1Token}` },
        payload: p.payload,
      });
      const attachment = uploadRes.json();
      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', attachment.fileName);
      createdFilePaths.push(diskPath);

      // OPERATOR 2 tenta excluir
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/work-orders/${testWorkOrderId}/attachments/${attachment.id}`,
        headers: { authorization: `Bearer ${operator2Token}` },
      });

      expect(deleteRes.statusCode).toBe(403);
      expect(deleteRes.json().message).toMatch(/Acesso negado/i);

      // Certificar que o registro e o arquivo físico continuam intactos
      expect(fs.existsSync(diskPath)).toBe(true);
      const inDb = await app.prisma.workOrderAttachment.findUnique({ where: { id: attachment.id } });
      expect(inDb).not.toBeNull();
    });

    it('deve permitir que o próprio autor (OPERATOR 1) exclua seu anexo (200 OK e exclusão física)', async () => {
      const p = createMultipartPayload(
        { filename: 'meu_anexo.jpg', mimetype: 'image/jpeg', content: Buffer.from('meus bytes') },
        { type: 'AFTER' }
      );
      const uploadRes = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p.headers, authorization: `Bearer ${operator1Token}` },
        payload: p.payload,
      });
      const attachment = uploadRes.json();
      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', attachment.fileName);
      expect(fs.existsSync(diskPath)).toBe(true);

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/work-orders/${testWorkOrderId}/attachments/${attachment.id}`,
        headers: { authorization: `Bearer ${operator1Token}` },
      });

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.json().message).toMatch(/sucesso/i);

      // Verificar que foi removido do banco
      const inDb = await app.prisma.workOrderAttachment.findUnique({ where: { id: attachment.id } });
      expect(inDb).toBeNull();

      // Verificar que o arquivo físico foi removido do disco
      expect(fs.existsSync(diskPath)).toBe(false);
    });

    it('deve permitir que ADMIN exclua anexo enviado por qualquer usuário (200 OK e exclusão física)', async () => {
      const p = createMultipartPayload(
        { filename: 'anexo_do_operador.pdf', mimetype: 'application/pdf', content: Buffer.from('laudo') },
        { type: 'DOCUMENT' }
      );
      const uploadRes = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p.headers, authorization: `Bearer ${operator1Token}` },
        payload: p.payload,
      });
      const attachment = uploadRes.json();
      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', attachment.fileName);
      expect(fs.existsSync(diskPath)).toBe(true);

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/work-orders/${testWorkOrderId}/attachments/${attachment.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(deleteRes.statusCode).toBe(200);

      // Verificar remoção do banco e do disco
      const inDb = await app.prisma.workOrderAttachment.findUnique({ where: { id: attachment.id } });
      expect(inDb).toBeNull();
      expect(fs.existsSync(diskPath)).toBe(false);
    });

    it('deve retornar 404 ao tentar excluir anexo inexistente', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/work-orders/${testWorkOrderId}/attachments/00000000-0000-0000-0000-000000000000`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('deve excluir anexos em cascata ao remover a Ordem de Serviço no banco', async () => {
      const p = createMultipartPayload(
        { filename: 'cascade_foto.jpg', mimetype: 'image/jpeg', content: Buffer.from('cascade') },
        { type: 'BEFORE' }
      );
      const uploadRes = await app.inject({
        method: 'POST',
        url: `/work-orders/${testWorkOrderId}/attachments`,
        headers: { ...p.headers, authorization: `Bearer ${adminToken}` },
        payload: p.payload,
      });
      const attachment = uploadRes.json();
      const diskPath = path.resolve(process.cwd(), 'uploads/work-orders', attachment.fileName);
      createdFilePaths.push(diskPath);

      // Deletar a OS
      await app.prisma.workOrder.delete({
        where: { id: testWorkOrderId },
      });

      // Anexo deve ter sido removido do banco via onDelete: Cascade
      const inDb = await app.prisma.workOrderAttachment.findUnique({
        where: { id: attachment.id },
      });
      expect(inDb).toBeNull();
    });
  });
});
