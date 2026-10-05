import { z } from 'zod';

export const transactionTypeEnum = z.enum(['REVENUE', 'EXPENSE']);

export const transactionCategoryEnum = z.enum([
  'FIXED_EXPENSE',
  'VARIABLE_EXPENSE',
  'PARTS_PURCHASE',
  'SERVICE_REVENUE',
  'OTHER',
]);

export const transactionFormSchema = z.object({
  type: transactionTypeEnum,
  category: transactionCategoryEnum,
  description: z
    .string()
    .trim()
    .min(3, 'A descrição deve ter no mínimo 3 caracteres')
    .max(255, 'A descrição deve ter no máximo 255 caracteres'),
  amount: z
    .number({ message: 'Informe um valor numérico válido' })
    .positive('O valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  paymentDate: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'PAID']),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;
