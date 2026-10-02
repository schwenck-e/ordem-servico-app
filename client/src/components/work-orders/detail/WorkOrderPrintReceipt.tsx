import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskDocument, maskPhone, maskCnpj, maskCep } from '@/lib/masks';
import { useCompany } from '@/hooks/useCompany';
import { getFileUrl } from '@/lib/api';
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
  const { data: company } = useCompany();

  const items = order.items || [];
  const statusLabel = statusLabels[order.status] || order.status;
  const priorityLabel = priorityLabels[order.priority] || order.priority;
  const currentDate = new Date().toISOString();

  // Filtrar fotos de comprovação visual (Antes / Depois)
  const photographicAttachments = (order.attachments || []).filter(
    (att) =>
      (att.type === 'BEFORE' || att.type === 'AFTER') &&
      att.mimeType.startsWith('image/')
  );

  return (
    <div className="hidden print:block font-sans text-black p-4 text-xs leading-normal">
      {/* 1. Header Institucional da Oficina */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          {company?.logoUrl && (
            <img
              src={company.logoUrl}
              alt="Logo da Empresa"
              className="max-h-16 max-w-[120px] object-contain shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {company?.tradeName || company?.name || 'Assistência Técnica & Gestão Operacional'}
            </h1>
            {company?.tradeName && company?.name && company.tradeName !== company.name && (
              <p className="text-[11px] font-semibold text-slate-700">{company.name}</p>
            )}
            <p className="text-[11px] text-slate-600 mt-0.5">
              CNPJ: {company?.cnpj ? maskCnpj(company.cnpj) : '12.345.678/0001-90'} • Inscrição
              Estadual: {company?.ie || 'Isento'}
            </p>
            <p className="text-[11px] text-slate-600">
              {company?.address || 'Av. Paulista, 1000 - Bela Vista'}, {company?.city || 'São Paulo'} -{' '}
              {company?.state || 'SP'} • CEP:{' '}
              {company?.zipCode ? maskCep(company.zipCode) : '01310-100'}
            </p>
            <p className="text-[11px] text-slate-600">
              Telefone: {company?.phone ? maskPhone(company.phone) : '(11) 3000-0000'} • E-mail:{' '}
              {company?.email || 'contato@oficina.com.br'}
            </p>
          </div>
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
            <strong>Nome / Razão Social:</strong> {order.customer.name}
          </p>
          <p>
            <strong>CPF / CNPJ:</strong> {maskDocument(order.customer.document)}
          </p>
          <p>
            <strong>Telefone:</strong> {maskPhone(order.customer.phone)}
          </p>
          <p>
            <strong>E-mail:</strong> {order.customer.email || 'Não informado'}
          </p>
          <p>
            <strong>Endereço:</strong> {order.customer.address}
          </p>
        </div>

        {/* Bloco do Equipamento e Dados Operacionais */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Equipamento & Prazos
          </p>
          <p>
            <strong>Equipamento / Modelo:</strong> {order.equipment}
          </p>
          <p>
            <strong>Número de Série:</strong> {order.serialNumber || 'N/A'}
          </p>
          <p>
            <strong>Prioridade de Atendimento:</strong> {priorityLabel}
          </p>
          <p>
            <strong>Técnico Responsável:</strong>{' '}
            {order.technician ? `${order.technician.name} (${order.technician.specialty})` : 'Não atribuído'}
          </p>
          <p>
            <strong>Data Prevista:</strong>{' '}
            {order.scheduledDate ? formatDate(order.scheduledDate) : 'Não agendada'}
          </p>
          <p>
            <strong>Data de Conclusão:</strong>{' '}
            {order.completedDate ? formatDateTime(order.completedDate) : 'Em aberto'}
          </p>
        </div>
      </div>

      {/* 3. Defeito Reclamado */}
      <div className="border border-slate-300 rounded p-2.5 mb-3">
        <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
          Defeito Reclamado pelo Cliente
        </p>
        <p className="text-slate-700 whitespace-pre-wrap">{order.reportedDefect}</p>
      </div>

      {/* 4. Laudo Técnico / Diagnóstico */}
      {order.technicalDiagnosis && (
        <div className="border border-slate-300 rounded p-2.5 mb-3 bg-slate-50/50">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Parecer e Diagnóstico Técnico
          </p>
          <p className="text-slate-700 whitespace-pre-wrap">{order.technicalDiagnosis}</p>
        </div>
      )}

      {/* 5. Tabela de Peças e Serviços */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <div className="bg-slate-100 p-2 font-bold uppercase text-slate-800 border-b border-slate-300">
          Itens, Serviços e Peças Aplicadas
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-600 uppercase font-semibold">
              <th className="p-2 w-16">Tipo</th>
              <th className="p-2">Descrição Detalhada</th>
              <th className="p-2 text-center w-16">Qtd</th>
              <th className="p-2 text-right w-24">Valor Unit.</th>
              <th className="p-2 text-right w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="p-2 font-semibold">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${
                      item.type === 'SERVICE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                  </span>
                </td>
                <td className="p-2 text-slate-800">{item.description}</td>
                <td className="p-2 text-center font-mono">{item.quantity}</td>
                <td className="p-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                <td className="p-2 text-right font-mono font-medium">
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
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

      {/* 7. Registro Fotográfico Comprobatório (Antes / Depois) na Impressão */}
      {photographicAttachments.length > 0 && (
        <div className="border border-slate-300 rounded p-2.5 mb-6 print:break-inside-avoid">
          <p className="font-bold uppercase text-slate-900 text-[11px] border-b border-slate-200 pb-1.5 mb-2.5">
            Registro Fotográfico Comprobatório (Antes / Depois)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photographicAttachments.map((photo) => {
              const photoUrl = getFileUrl(photo.url);
              const isBefore = photo.type === 'BEFORE';

              return (
                <div
                  key={photo.id}
                  className="border border-slate-200 rounded p-1.5 flex flex-col items-center bg-slate-50/50"
                >
                  <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded bg-white border border-slate-100">
                    <img
                      src={photoUrl}
                      alt={photo.originalName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="w-full text-center mt-1.5">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isBefore
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {isBefore ? 'Antes do Reparo' : 'Depois do Reparo'}
                    </span>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5" title={photo.originalName}>
                      {photo.originalName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Termos de Garantia e Observações da Empresa */}
      <div className="border border-slate-300 rounded p-2.5 mb-6 text-[10px] text-slate-700 leading-tight space-y-2 print:break-inside-avoid">
        <p className="font-bold uppercase text-slate-900">
          Termo de Garantia e Condições Gerais de Atendimento
        </p>
        {company?.warrantyTerms ? (
          <p className="whitespace-pre-wrap">{company.warrantyTerms}</p>
        ) : (
          <>
            <p>
              1. Conforme estabelece o Artigo 26 do Código de Defesa do Consumidor (Lei nº
              8.078/1990), o prazo de garantia para os serviços executados e peças aplicadas é de 90
              (noventa) dias a contar da data de entrega do equipamento.
            </p>
            <p>
              2. A garantia cobre exclusivamente os serviços e componentes discriminados nesta Ordem
              de Serviço, cessando seus efeitos em caso de mau uso, quedas, sobrecarga elétrica,
              violação de lacres ou intervenção de terceiros não autorizados.
            </p>
            <p>
              3. O equipamento deverá ser retirado no prazo de até 90 dias após a notificação de
              conclusão, sob pena de caracterização de abandono e cobrança de custos de custódia e
              descarte nos termos da legislação civil vigente.
            </p>
          </>
        )}

        {company?.workOrderNotes && (
          <div className="pt-1.5 border-t border-slate-200 mt-2">
            <p className="font-bold uppercase text-slate-900 mb-0.5">Observações da Empresa:</p>
            <p className="whitespace-pre-wrap">{company.workOrderNotes}</p>
          </div>
        )}
      </div>

      {/* 9. Linhas para Assinatura */}
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
              {order.technician ? order.technician.name : company?.tradeName || company?.name || 'Assistência Técnica'}
            </p>
            <p className="text-[10px] text-slate-500">Responsável Técnico / Assistência</p>
          </div>
        </div>
      </div>
    </div>
  );
};
