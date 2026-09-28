import { z } from 'zod';

export const workOrderItemFormSchema = z.object({
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

export const workOrderFormSchema = z
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
      .max(150, 'Equipamento deve ter no máximo 150 caracteres'),
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
      .min(5, 'Defeito relatado deve ter no mínimo 5 caracteres')
      .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres'),
    technicalDiagnosis: z
      .string()
      .trim()
      .max(2000, 'Diagnóstico técnico deve ter no máximo 2000 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    scheduledDate: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),
    discount: z
      .number({ message: 'Desconto deve ser um número' })
      .min(0, 'Desconto não pode ser negativo'),
    initialComment: z
      .string()
      .trim()
      .max(500, 'Comentário inicial deve ter no máximo 500 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    items: z
      .array(workOrderItemFormSchema)
      .min(1, 'A ordem de serviço deve conter ao menos um item (serviço ou peça)'),
  })
  .refine(
    (data) => {
      const grossTotal = (data.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      );
      const discount = Number(data.discount) || 0;
      return discount <= grossTotal;
    },
    {
      message: 'O valor do desconto não pode ser superior ao valor total dos itens',
      path: ['discount'],
    }
  );

export type WorkOrderItemFormData = z.infer<typeof workOrderItemFormSchema>;
export type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;
