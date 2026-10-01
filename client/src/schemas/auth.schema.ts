import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Informe sua senha')
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
