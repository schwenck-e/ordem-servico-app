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
  await app.prisma.company.deleteMany();
});

describe('Módulo de Configurações da Empresa (/company)', () => {
  describe('GET /company', () => {
    it('deve retornar 401 Unauthorized se requisição não contiver token Bearer', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/company',
      });
      expect(res.statusCode).toBe(401);
    });

    it('deve retornar 404 Not Found se dados da empresa não tiverem sido configurados', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/company',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().message).toContain('Configurações da empresa não encontradas');
    });

    it('deve permitir consulta com perfil OPERATOR (200 OK)', async () => {
      await app.prisma.company.create({
        data: {
          name: 'Empresa Teste Ltda',
          tradeName: 'Empresa Teste',
          cnpj: '11.222.333/0001-81',
          email: 'contato@teste.com',
          phone: '(11) 98888-7777',
          address: 'Rua Central, 100',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/company',
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.tradeName).toBe('Empresa Teste');
      expect(data.cnpj).toBe('11.222.333/0001-81');
    });

    it('deve permitir consulta com perfil ADMIN (200 OK)', async () => {
      await app.prisma.company.create({
        data: {
          name: 'Empresa Teste Ltda',
          tradeName: 'Empresa Teste',
          cnpj: '11.222.333/0001-81',
          email: 'contato@teste.com',
          phone: '(11) 98888-7777',
          address: 'Rua Central, 100',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe('Empresa Teste Ltda');
    });
  });

  describe('PUT /company', () => {
    it('deve retornar 401 Unauthorized se requisição não contiver token Bearer', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        payload: { tradeName: 'Novo Nome' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('deve retornar 403 Forbidden se usuário possuir perfil OPERATOR', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${operatorToken}` },
        payload: { tradeName: 'Tentativa Operador' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().message).toContain('Acesso negado');
    });

    it('deve retornar 400 Bad Request se payload contiver CNPJ inválido', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { cnpj: '11.111.111/1111-11' },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().issues).toBeDefined();
    });

    it('deve retornar 400 Bad Request se payload contiver e-mail inválido', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { email: 'email_invalido_sem_arroba' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('deve retornar 400 Bad Request se payload for vazio', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('deve criar a empresa (upsert) com ADMIN se banco estiver vazio (200 OK)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Oficina Central de Reparos Ltda',
          tradeName: 'Oficina Central',
          cnpj: '11.222.333/0001-81',
          email: 'contato@oficinacentral.com.br',
          phone: '(11) 2233-4455',
          address: 'Av. Ipiranga, 200 - República',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01046-010',
          warrantyTerms: '90 dias de garantia.',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.id).toBeDefined();
      expect(data.tradeName).toBe('Oficina Central');

      // Verifica persistência no banco
      const count = await app.prisma.company.count();
      expect(count).toBe(1);
    });

    it('deve atualizar os campos parciais da empresa com sucesso (200 OK)', async () => {
      await app.prisma.company.create({
        data: {
          name: 'Oficina Antiga Ltda',
          tradeName: 'Oficina Antiga',
          cnpj: '11.222.333/0001-81',
          email: 'antigo@oficina.com',
          phone: '(11) 1111-2222',
          address: 'Rua Velha, 10',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
        },
      });

      const res = await app.inject({
        method: 'PUT',
        url: '/company',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          tradeName: 'Oficina Renovada & Tech',
          phone: '(11) 99999-8888',
          warrantyTerms: 'Termos renovados para 120 dias.',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.tradeName).toBe('Oficina Renovada & Tech');
      expect(data.phone).toBe('(11) 99999-8888');
      expect(data.warrantyTerms).toBe('Termos renovados para 120 dias.');
      expect(data.name).toBe('Oficina Antiga Ltda'); // campo não alterado mantido
    });
  });
});
