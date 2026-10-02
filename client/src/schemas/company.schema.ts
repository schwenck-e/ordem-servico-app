import { z } from 'zod';
import { validateCnpj } from '@/lib/validators';
import { unmask } from '@/lib/masks';

export const companyFormSchema = z.object({
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
    .min(1, 'CNPJ é obrigatório')
    .refine((val) => validateCnpj(unmask(val)), 'CNPJ inválido'),
  ie: z
    .string()
    .trim()
    .max(30, 'Inscrição Estadual deve ter no máximo 30 caracteres')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail institucional inválido'),
  phone: z
    .string()
    .trim()
    .min(10, 'Telefone de contato inválido'),
  address: z
    .string()
    .trim()
    .min(5, 'Endereço deve ter no mínimo 5 caracteres')
    .max(255, 'Endereço muito longo'),
  city: z
    .string()
    .trim()
    .min(2, 'Cidade é obrigatória')
    .max(100, 'Cidade muito longa'),
  state: z
    .string()
    .trim()
    .length(2, 'UF deve ter exatamente 2 caracteres')
    .toUpperCase(),
  zipCode: z
    .string()
    .trim()
    .min(8, 'CEP inválido'),
  logoUrl: z
    .string()
    .trim()
    .url('URL da logo deve ser válida')
    .optional()
    .or(z.literal('')),
  warrantyTerms: z
    .string()
    .trim()
    .max(3000, 'Termos de garantia não podem ultrapassar 3000 caracteres')
    .optional()
    .or(z.literal('')),
  workOrderNotes: z
    .string()
    .trim()
    .max(3000, 'Observações não podem ultrapassar 3000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;
