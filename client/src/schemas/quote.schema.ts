import { z } from 'zod';

export const quoteItemFormSchema = z.object({
  productId: z.string().uuid().optional().nullable().or(z.literal('')),
  type: z.enum(['SERVICE', 'PART'], {
    message: 'Selecione o tipo do item',
  }),
  description: z
    .string()
    .trim()
    .min(2, 'Descrição do item deve ter no mínimo 2 caracteres')
    .max(255, 'Descrição do item deve ter no máximo 255 caracteres'),
  quantity: z
    .number({ message: 'Quantidade deve ser um número' })
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1'),
  unitPrice: z
    .number({ message: 'Preço unitário deve ser um número' })
    .min(0, 'Preço unitário não pode ser negativo'),
});

export const quoteFormSchema = z
  .object({
    customerId: z
      .string()
      .min(1, 'Selecione um cliente')
      .uuid('Selecione um cliente válido'),
    technicianId: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),
    equipment: z
      .string()
      .trim()
      .min(2, 'Equipamento deve ter no mínimo 2 caracteres')
      .max(100, 'Equipamento deve ter no máximo 100 caracteres'),
    serialNumber: z
      .string()
      .trim()
      .max(100, 'Número de série deve ter no máximo 100 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    reportedDefect: z
      .string()
      .trim()
      .min(3, 'Defeito relatado deve ter no mínimo 3 caracteres')
      .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres'),
    technicalDiagnosis: z
      .string()
      .trim()
      .max(2000, 'Diagnóstico técnico deve ter no máximo 2000 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    notes: z
      .string()
      .trim()
      .max(2000, 'Observações devem ter no máximo 2000 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    validUntil: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),
    discount: z
      .number({ message: 'Desconto deve ser um número' })
      .min(0, 'Desconto não pode ser negativo'),
    items: z
      .array(quoteItemFormSchema)
      .min(1, 'O orçamento deve conter pelo menos 1 item (serviço ou peça)'),
  })
  .refine(
    (data) => {
      const grossTotal = data.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      );
      return (Number(data.discount) || 0) <= grossTotal;
    },
    {
      message: 'O desconto não pode ser maior que o valor total bruto dos itens',
      path: ['discount'],
    }
  );

export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type QuoteItemFormData = z.infer<typeof quoteItemFormSchema>;
