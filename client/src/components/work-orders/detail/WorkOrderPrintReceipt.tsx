import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskDocument, maskPhone } from '@/lib/masks';
import type { WorkOrder } from '@/types';

interface WorkOrderPrintReceiptProps {
  order: WorkOrder;
}

const statusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const WorkOrderPrintReceipt: React.FC<WorkOrderPrintReceiptProps> = ({ order }) => {
  const items = order.items || [];
  const statusLabel = statusLabels[order.status] || order.status;
  const priorityLabel = priorityLabels[order.priority] || order.priority;
  const currentDate = new Date().toISOString();

  return (
    <div className="hidden print:block font-sans text-black p-4 text-xs leading-normal">
      {/* 1. Header Institucional da Oficina */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Assistência Técnica & Gestão Operacional
          </h1>
          <p className="text-[11px] text-slate-600 mt-0.5">
            CNPJ: 12.345.678/0001-90 • Inscrição Estadual: Isento
          </p>
          <p className="text-[11px] text-slate-600">
            Av. Paulista, 1000 - Bela Vista, São Paulo - SP • CEP: 01310-100
          </p>
          <p className="text-[11px] text-slate-600">
            Telefone: (11) 3000-0000 • E-mail: contato@oficina.com.br
          </p>
        </div>

        {/* Quadro Identificador da OS */}
        <div className="border-2 border-slate-900 rounded p-2 text-right shrink-0 min-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Ordem de Serviço
          </p>
          <p className="text-lg font-mono font-bold text-slate-900 leading-none my-1">
            {order.orderNumber}
          </p>
          <p className="text-[10px] text-slate-700">
            Status: <strong>{statusLabel}</strong>
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Emissão: {formatDateTime(currentDate)}
          </p>
        </div>
      </div>

      {/* 2. Grid de Dados: Cliente & Equipamento */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Bloco do Cliente */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Dados do Cliente
          </p>
          <p>
            <span className="font-semibold text-slate-700">Nome:</span> {order.customer.name}
          </p>
          <p>
            <span className="font-semibold text-slate-700">CPF/CNPJ:</span>{' '}
            {order.customer.document ? maskDocument(order.customer.document) : 'Não informado'}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Telefone:</span>{' '}
            {order.customer.phone ? maskPhone(order.customer.phone) : 'Não informado'}
          </p>
          <p>
            <span className="font-semibold text-slate-700">E-mail:</span>{' '}
            {order.customer.email || 'Não informado'}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Endereço:</span>{' '}
            {order.customer.address || 'Não cadastrado'}
          </p>
        </div>

        {/* Bloco do Equipamento e OS */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Dados do Equipamento & Atendimento
          </p>
          <p>
            <span className="font-semibold text-slate-700">Modelo:</span> {order.equipment}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Nº de Série:</span>{' '}
            <span className="font-mono">{order.serialNumber || 'Não informado'}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Prioridade:</span> {priorityLabel}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Data de Abertura:</span>{' '}
            {formatDate(order.createdAt)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Previsão de Entrega:</span>{' '}
            {formatDate(order.scheduledDate)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Técnico Responsável:</span>{' '}
            {order.technician ? `${order.technician.name} (${order.technician.specialty})` : 'Pendente de atribuição'}
          </p>
        </div>
      </div>

      {/* 3. Defeito Reclamado */}
      <div className="border border-slate-300 rounded p-2.5 mb-4">
        <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
          Defeito Reclamado pelo Cliente
        </p>
        <p className="text-slate-900 whitespace-pre-wrap">{order.reportedDefect}</p>
      </div>

      {/* 4. Laudo Técnico (se preenchido) */}
      {order.technicalDiagnosis && (
        <div className="border border-slate-300 rounded p-2.5 mb-4">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Laudo Técnico / Parecer de Bancada
          </p>
          <p className="text-slate-900 whitespace-pre-wrap">{order.technicalDiagnosis}</p>
        </div>
      )}

      {/* 5. Tabela Discriminada de Peças e Serviços */}
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase text-slate-800 mb-1.5">
          Peças e Serviços Discriminados
        </p>
        <table className="w-full border-collapse border border-slate-300 text-left text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
              <th className="p-1.5 border-r border-slate-300 w-20">Tipo</th>
              <th className="p-1.5 border-r border-slate-300">Descrição</th>
              <th className="p-1.5 border-r border-slate-300 text-center w-14">Qtd.</th>
              <th className="p-1.5 border-r border-slate-300 text-right w-24">Vlr. Unit.</th>
              <th className="p-1.5 text-right w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-1.5 border-r border-slate-300">
                    {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                  </td>
                  <td className="p-1.5 border-r border-slate-300">{item.description}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">
                    {item.quantity}
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-mono">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="p-1.5 text-right font-mono font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-2 text-center text-slate-500 italic">
                  Nenhum item ou serviço discriminado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Quadro de Fechamento Financeiro */}
      <div className="flex justify-end mb-6">
        <div className="w-64 border border-slate-300 rounded p-2.5 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Total em Serviços:</span>
            <span className="font-mono">{formatCurrency(order.totalServices)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total em Peças:</span>
            <span className="font-mono">{formatCurrency(order.totalParts)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>Desconto:</span>
              <span className="font-mono">- {formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm">
            <span>Total Líquido:</span>
            <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 7. Termos de Garantia e Responsabilidade Legal */}
      <div className="border border-slate-300 rounded p-2.5 mb-6 text-[10px] text-slate-700 leading-tight space-y-1 print:break-inside-avoid">
        <p className="font-bold uppercase text-slate-900">
          Termo de Garantia e Condições Gerais de Atendimento
        </p>
        <p>
          1. Conforme estabelece o Artigo 26 do Código de Defesa do Consumidor (Lei nº 8.078/1990), o prazo de garantia para os serviços executados e peças aplicadas é de 90 (noventa) dias a contar da data de entrega do equipamento.
        </p>
        <p>
          2. A garantia cobre exclusivamente os serviços e componentes discriminados nesta Ordem de Serviço, cessando seus efeitos em caso de mau uso, quedas, sobrecarga elétrica, violação de lacres ou intervenção de terceiros não autorizados.
        </p>
        <p>
          3. O equipamento deverá ser retirado no prazo de até 90 dias após a notificação de conclusão, sob pena de caracterização de abandono e cobrança de custos de custódia e descarte nos termos da legislação civil vigente.
        </p>
      </div>

      {/* 8. Linhas para Assinatura */}
      <div className="grid grid-cols-2 gap-8 pt-8 print:break-inside-avoid">
        <div className="text-center">
          <div className="border-t border-slate-800 pt-1.5 mx-4">
            <p className="font-bold text-slate-900">{order.customer.name}</p>
            <p className="text-[10px] text-slate-500">Assinatura do Cliente / Responsável</p>
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-slate-800 pt-1.5 mx-4">
            <p className="font-bold text-slate-900">
              {order.technician ? order.technician.name : 'Assistência Técnica'}
            </p>
            <p className="text-[10px] text-slate-500">Responsável Técnico / Assistência</p>
          </div>
        </div>
      </div>
    </div>
  );
};
