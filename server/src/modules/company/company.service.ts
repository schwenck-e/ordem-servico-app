import { PrismaClient } from '@prisma/client';
import { UpdateCompanyInput } from './company.schemas';

export async function getCompany(prisma: PrismaClient) {
  const company = await prisma.company.findFirst();

  if (!company) {
    const error = new Error('Configurações da empresa não encontradas.');
    (error as any).statusCode = 404;
    throw error;
  }

  return company;
}

export async function updateCompany(prisma: PrismaClient, data: UpdateCompanyInput) {
  const existing = await prisma.company.findFirst();

  if (existing) {
    return prisma.company.update({
      where: { id: existing.id },
      data,
    });
  }

  // Se nenhum registro existir, realiza o cadastro inicial (upsert)
  // Campos obrigatórios recebem fallback caso não fornecidos na primeira criação
  return prisma.company.create({
    data: {
      name: data.name ?? 'Empresa Padrão',
      tradeName: data.tradeName ?? 'Assistência Técnica',
      cnpj: data.cnpj ?? '11.222.333/0001-81',
      ie: data.ie ?? null,
      email: data.email ?? 'contato@empresa.com',
      phone: data.phone ?? '(11) 3344-5566',
      address: data.address ?? 'Endereço Comercial, 100',
      city: data.city ?? 'São Paulo',
      state: data.state ?? 'SP',
      zipCode: data.zipCode ?? '01000-000',
      logoUrl: data.logoUrl ?? null,
      warrantyTerms: data.warrantyTerms ?? null,
      workOrderNotes: data.workOrderNotes ?? null,
    },
  });
}
