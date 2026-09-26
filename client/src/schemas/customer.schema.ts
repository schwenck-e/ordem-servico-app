import { z } from 'zod';
import { validateDocument } from '@/lib/validators';

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  document: z
    .string()
    .trim()
    .refine((val) => validateDocument(val), {
      message: 'CPF ou CNPJ inválido',
    }),
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
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;
