import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import type { StockMovement, StockMovementType } from '@/types';

interface StockMovementsTableProps {
  movements: StockMovement[];
}

export const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
  movements,
}) => {
  const renderTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'IN':
        return (
          <Badge
            variant="success"
            className="inline-flex items-center gap-1 font-semibold"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Entrada</span>
          </Badge>
        );
      case 'OUT':
        return (
          <Badge
            variant="danger"
            className="inline-flex items-center gap-1 font-semibold"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Saída</span>
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge
            variant="info"
            className="inline-flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Ajuste</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-3.5">
              Data e Hora
            </th>
            <th scope="col" className="px-6 py-3.5 text-center">
              Tipo
            </th>
            <th scope="col" className="px-6 py-3.5">
              Produto / SKU
            </th>
            <th scope="col" className="px-6 py-3.5 text-center">
              Quantidade
            </th>
            <th scope="col" className="px-6 py-3.5 text-right">
              Valor Unitário
            </th>
            <th scope="col" className="px-6 py-3.5">
              Motivo
            </th>
            <th scope="col" className="px-6 py-3.5">
              Responsável
            </th>
            <th scope="col" className="px-6 py-3.5 text-center">
              O.S. Vinculada
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {movements.map((movement) => {
            const isEntry = movement.type === 'IN';
            const isExit = movement.type === 'OUT';

            return (
              <tr
                key={movement.id}
                className="hover:bg-slate-50/75 transition-colors"
              >
                {/* Data e Hora */}
                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                  {formatDateTime(movement.createdAt)}
                </td>

                {/* Tipo de Movimentação */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {renderTypeBadge(movement.type)}
                </td>

                {/* Produto */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {movement.product?.name || 'Produto Excluído'}
                      </div>
                      {movement.product?.sku && (
                        <div className="text-xs font-mono text-slate-500">
                          {movement.product.sku}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Quantidade */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span
                    className={`font-bold ${
                      isEntry
                        ? 'text-emerald-700'
                        : isExit
                        ? 'text-rose-700'
                        : 'text-sky-700'
                    }`}
                  >
                    {isEntry ? `+${movement.quantity}` : isExit ? `-${movement.quantity}` : movement.quantity}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {movement.product?.unit || 'UN'}
                    </span>
                  </span>
                </td>

                {/* Valor Unitário */}
                <td className="px-6 py-4 text-right whitespace-nowrap text-xs text-slate-700 font-mono">
                  {movement.unitPrice !== null && movement.unitPrice !== undefined
                    ? formatCurrency(movement.unitPrice)
                    : '-'}
                </td>

                {/* Motivo */}
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-700 line-clamp-2">
                    {movement.reason}
                  </span>
                </td>

                {/* Responsável */}
                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                  {movement.createdBy}
                </td>

                {/* O.S. Vinculada */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {movement.workOrderId ? (
                    <Link
                      to={`/work-orders/${movement.workOrderId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors border border-brand-200"
                    >
                      <span>
                        {movement.workOrder?.orderNumber || 'Ver O.S.'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-brand-600" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Avulsa</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
