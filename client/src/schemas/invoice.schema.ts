import { z } from 'zod';

export const paymentMethodEnum = z.enum([
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'BANK_SLIP',
]);

export const paymentFormSchema = z.object({
  amount: z
    .number({ message: 'Informe um valor numérico válido' })
    .positive('O valor deve ser maior que zero'),
  paymentMethod: paymentMethodEnum,
  paidAt: z.string().min(1, 'A data do pagamento é obrigatória'),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

export const createInvoiceFormSchema = z.object({
  workOrderId: z.string().uuid().optional().nullable(),
  quoteId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional(),
  amount: z.coerce.number().min(0, 'O valor não pode ser negativo').optional(),
  discount: z.coerce.number().min(0, 'O desconto não pode ser negativo').default(0),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceFormSchema>;
