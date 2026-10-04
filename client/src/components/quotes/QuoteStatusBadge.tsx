import React from 'react';
import { Badge } from '@/components/common/Badge';
import type { QuoteStatus } from '@/types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

export const quoteStatusConfig: Record<
  QuoteStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }
> = {
  DRAFT: { label: 'Rascunho', variant: 'neutral' },
  SENT: { label: 'Enviado', variant: 'info' },
  APPROVED: { label: 'Aprovado', variant: 'success' },
  REJECTED: { label: 'Recusado', variant: 'danger' },
  EXPIRED: { label: 'Expirado', variant: 'warning' },
};

export const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status, className }) => {
  const config = quoteStatusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
