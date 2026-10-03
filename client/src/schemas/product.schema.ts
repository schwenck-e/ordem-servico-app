import { z } from 'zod';

export const createProductFormSchema = z.object({
  sku: z
    .string({ message: 'SKU é obrigatório' })
    .trim()
    .min(2, 'SKU deve ter no mínimo 2 caracteres')
    .max(50, 'SKU deve ter no máximo 50 caracteres'),
  name: z
    .string({ message: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  unit: z
    .string()
    .trim()
    .min(1, 'Unidade não pode ser vazia')
    .max(10, 'Unidade deve ter no máximo 10 caracteres'),
  costPrice: z
    .number({ message: 'Preço de custo deve ser um número' })
    .min(0, 'Preço de custo não pode ser negativo'),
  salePrice: z
    .number({ message: 'Preço de venda deve ser um número' })
    .min(0, 'Preço de venda não pode ser negativo'),
  initialStock: z
    .number({ message: 'Estoque inicial deve ser um número' })
    .int('Estoque inicial deve ser um número inteiro')
    .min(0, 'Estoque inicial não pode ser negativo'),
  minStock: z
    .number({ message: 'Estoque mínimo deve ser um número' })
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo não pode ser negativo'),
});

export const updateProductFormSchema = z.object({
  sku: z
    .string({ message: 'SKU é obrigatório' })
    .trim()
    .min(2, 'SKU deve ter no mínimo 2 caracteres')
    .max(50, 'SKU deve ter no máximo 50 caracteres'),
  name: z
    .string({ message: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  unit: z
    .string()
    .trim()
    .min(1, 'Unidade não pode ser vazia')
    .max(10, 'Unidade deve ter no máximo 10 caracteres'),
  costPrice: z
    .number({ message: 'Preço de custo deve ser um número' })
    .min(0, 'Preço de custo não pode ser negativo'),
  salePrice: z
    .number({ message: 'Preço de venda deve ser um número' })
    .min(0, 'Preço de venda não pode ser negativo'),
  minStock: z
    .number({ message: 'Estoque mínimo deve ser um número' })
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo não pode ser negativo'),
});

export const createStockMovementFormSchema = z.object({
  productId: z
    .string({ message: 'Selecione um produto' })
    .uuid('ID do produto inválido'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    message: 'Selecione o tipo de movimentação',
  }),
  quantity: z
    .number({ message: 'Quantidade deve ser um número' })
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero'),
  unitPrice: z
    .number({ message: 'Valor unitário deve ser um número' })
    .min(0, 'Valor unitário não pode ser negativo')
    .optional()
    .nullable(),
  reason: z
    .string({ message: 'Motivo é obrigatório' })
    .trim()
    .min(3, 'Motivo deve ter no mínimo 3 caracteres')
    .max(255, 'Motivo deve ter no máximo 255 caracteres'),
});

export type ProductFormData = z.infer<typeof createProductFormSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>;
export type StockMovementFormData = z.infer<typeof createStockMovementFormSchema>;
