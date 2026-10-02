import { z } from 'zod';
import { validateCnpj } from '../customers/customer.schemas';

export const updateCompanySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Razão Social deve ter no mínimo 3 caracteres')
      .max(150, 'Razão Social deve ter no máximo 150 caracteres'),
    tradeName: z
      .string()
      .trim()
      .min(2, 'Nome Fantasia deve ter no mínimo 2 caracteres')
      .max(150, 'Nome Fantasia deve ter no máximo 150 caracteres'),
    cnpj: z
      .string()
      .trim()
      .refine(validateCnpj, 'CNPJ inválido'),
    ie: z
      .string()
      .trim()
      .max(30, 'Inscrição Estadual deve ter no máximo 30 caracteres')
      .optional()
      .nullable(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Formato de e-mail inválido'),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4}|\d{10,11})$/,
        'Telefone inválido'
      ),
    address: z
      .string()
      .trim()
      .min(5, 'Endereço deve ter no mínimo 5 caracteres')
      .max(255, 'Endereço deve ter no máximo 255 caracteres'),
    city: z
      .string()
      .trim()
      .min(2, 'Cidade deve ter no mínimo 2 caracteres')
      .max(100, 'Cidade deve ter no máximo 100 caracteres'),
    state: z
      .string()
      .trim()
      .length(2, 'UF deve conter exatamente 2 letras')
      .toUpperCase(),
    zipCode: z
      .string()
      .trim()
      .regex(/^\d{5}-?\d{3}$/, 'CEP deve seguir o formato 00000-000 ou 00000000'),
    logoUrl: z
      .string()
      .trim()
      .url('URL da logo deve ser válida')
      .optional()
      .nullable()
      .or(z.literal('')),
    warrantyTerms: z
      .string()
      .trim()
      .max(3000, 'Termos de garantia não podem ultrapassar 3000 caracteres')
      .optional()
      .nullable(),
    workOrderNotes: z
      .string()
      .trim()
      .max(3000, 'Observações da OS não podem ultrapassar 3000 caracteres')
      .optional()
      .nullable(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Ao menos um campo deve ser informado para atualização'
  );

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const getCompanySwaggerSchema = {
  tags: ['Company'],
  summary: 'Consultar configurações da empresa',
  description:
    'Retorna os dados institucionais, fiscais e termos de garantia da empresa prestadora (acessível a usuários autenticados).',
  security: [{ bearerAuth: [] }],
};

export const updateCompanySwaggerSchema = {
  tags: ['Company'],
  summary: 'Atualizar configurações da empresa',
  description:
    'Atualiza parcial ou totalmente os dados cadastrais da empresa (exclusivo para perfil ADMIN).',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      tradeName: { type: 'string' as const },
      cnpj: { type: 'string' as const },
      ie: { type: 'string' as const, nullable: true },
      email: { type: 'string' as const },
      phone: { type: 'string' as const },
      address: { type: 'string' as const },
      city: { type: 'string' as const },
      state: { type: 'string' as const },
      zipCode: { type: 'string' as const },
      logoUrl: { type: 'string' as const, nullable: true },
      warrantyTerms: { type: 'string' as const, nullable: true },
      workOrderNotes: { type: 'string' as const, nullable: true },
    },
  },
};
