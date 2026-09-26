import { z } from 'zod';

export const technicianFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
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
  specialty: z
    .string()
    .trim()
    .min(2, 'Especialidade deve ter no mínimo 2 caracteres')
    .max(100, 'Especialidade deve ter no máximo 100 caracteres'),
  isActive: z.boolean(),
});

export type TechnicianFormData = z.infer<typeof technicianFormSchema>;
