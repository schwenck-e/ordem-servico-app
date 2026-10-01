import { z } from 'zod';

export const userFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'A senha deve ter no mínimo 6 caracteres',
    }),
  role: z.enum(['ADMIN', 'OPERATOR'], {
    message: 'Selecione um papel válido',
  }),
  isActive: z.boolean(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
