import { z } from 'zod';

export const metricsPeriodQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'A data inicial (startDate) não pode ser posterior à data final (endDate)',
      path: ['startDate'],
    }
  );

export type MetricsPeriodQuery = z.infer<typeof metricsPeriodQuerySchema>;

export const metricsSummarySwaggerSchema = {
  tags: ['Metrics'],
  summary: 'Resumo operacional e financeiro de ordens de serviço',
  description:
    'Retorna contadores consolidados por status, total geral de ordens, faturamento realizado e ticket médio no período informado.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Data inicial do período (ISO 8601 ou YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'Data final do período (ISO 8601 ou YYYY-MM-DD)' },
    },
  },
};

export const metricsByStatusSwaggerSchema = {
  tags: ['Metrics'],
  summary: 'Distribuição analítica de ordens de serviço por status',
  description:
    'Retorna a quantidade, percentual e valor total financeiro agrupado por cada status do domínio.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Data inicial do período (ISO 8601 ou YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'Data final do período (ISO 8601 ou YYYY-MM-DD)' },
    },
  },
};

export const metricsByTechnicianSwaggerSchema = {
  tags: ['Metrics'],
  summary: 'Produtividade e distribuição de ordens de serviço por técnico',
  description:
    'Retorna métricas consolidadas por técnico cadastrado (totais, concluídas, em andamento, pendentes e faturamento gerado), além de ordens não atribuídas.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Data inicial do período (ISO 8601 ou YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'Data final do período (ISO 8601 ou YYYY-MM-DD)' },
    },
  },
};
