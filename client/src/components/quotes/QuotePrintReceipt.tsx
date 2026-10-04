import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskDocument, maskPhone, maskCnpj, maskCep } from '@/lib/masks';
import { useCompany } from '@/hooks/useCompany';
import type { Quote } from '@/types';

interface QuotePrintReceiptProps {
  quote: Quote;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado ao Cliente',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  EXPIRED: 'Expirado',
};

export const QuotePrintReceipt: React.FC<QuotePrintReceiptProps> = ({ quote }) => {
  const { data: company } = useCompany();

  const items = quote.items || [];
  const statusLabel = statusLabels[quote.status] || quote.status;
  const currentDate = new Date().toISOString();

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

        {/* Quadro Identificador do Orçamento */}
        <div className="border-2 border-slate-900 rounded p-2 text-right shrink-0 min-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Proposta de Orçamento
          </p>
          <p className="text-lg font-black text-slate-900 font-mono">{quote.quoteNumber}</p>
          <p className="text-[11px] font-semibold mt-1">
            Status: <span className="uppercase">{statusLabel}</span>
          </p>
          <p className="text-[10px] text-slate-600">Emissão: {formatDate(quote.createdAt)}</p>
          {quote.validUntil && (
            <p className="text-[10px] font-bold text-slate-800">
              Validade: {formatDate(quote.validUntil)}
            </p>
          )}
        </div>
      </div>

      {/* 2. Dados do Cliente e do Aparelho */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cliente */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Dados do Cliente
          </p>
          <p>
            <strong>Nome / Razão Social:</strong> {quote.customer.name}
          </p>
          <p>
            <strong>CPF / CNPJ:</strong>{' '}
            {quote.customer.document ? maskDocument(quote.customer.document) : 'Não informado'}
          </p>
          <p>
            <strong>Telefone:</strong> {maskPhone(quote.customer.phone)}
          </p>
          <p>
            <strong>E-mail:</strong> {quote.customer.email || 'Não informado'}
          </p>
          {quote.customer.address && (
            <p>
              <strong>Endereço:</strong> {quote.customer.address}
            </p>
          )}
        </div>

        {/* Equipamento */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Equipamento & Avaliação
          </p>
          <p>
            <strong>Equipamento / Modelo:</strong> {quote.equipment}
          </p>
          <p>
            <strong>Número de Série / IMEI:</strong> {quote.serialNumber || 'N/A'}
          </p>
          <p>
            <strong>Técnico Avaliador:</strong>{' '}
            {quote.technician
              ? `${quote.technician.name} (${quote.technician.specialty || 'Geral'})`
              : 'Não atribuído'}
          </p>
          <p>
            <strong>Validade da Proposta:</strong>{' '}
            {quote.validUntil ? formatDate(quote.validUntil) : '15 dias'}
          </p>
        </div>
      </div>

      {/* 3. Defeito Reclamado */}
      <div className="border border-slate-300 rounded p-2.5 mb-3">
        <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
          Defeito Relatado / Solicitação do Cliente
        </p>
        <p className="text-slate-700 whitespace-pre-wrap">{quote.reportedDefect}</p>
      </div>

      {/* 4. Diagnóstico Técnico */}
      {quote.technicalDiagnosis && (
        <div className="border border-slate-300 rounded p-2.5 mb-3 bg-slate-50/50">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Parecer e Diagnóstico Técnico Preliminar
          </p>
          <p className="text-slate-700 whitespace-pre-wrap">{quote.technicalDiagnosis}</p>
        </div>
      )}

      {/* 5. Tabela de Peças e Serviços */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <div className="bg-slate-100 p-2 font-bold uppercase text-slate-800 border-b border-slate-300">
          Discriminação de Serviços e Peças Propostas
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
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="p-2 text-[10px] font-bold uppercase text-slate-600">
                  {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                </td>
                <td className="p-2">
                  <span className="font-semibold text-slate-800">{item.description}</span>
                  {item.product && (
                    <span className="block text-[10px] text-slate-500 font-mono">
                      SKU: {item.product.sku}
                    </span>
                  )}
                </td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. Resumo Financeiro */}
      <div className="flex justify-end mb-6">
        <div className="w-64 border border-slate-300 rounded p-2.5 bg-slate-50/50 space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Serviços:</span>
            <span>{formatCurrency(quote.totalServices)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Peças:</span>
            <span>{formatCurrency(quote.totalParts)}</span>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Desconto:</span>
              <span>-{formatCurrency(quote.discount)}</span>
            </div>
          )}
          <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
            <span>TOTAL GERAL:</span>
            <span>{formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 7. Observações e Condições Comerciais */}
      {quote.notes && (
        <div className="border border-slate-300 rounded p-2.5 mb-6">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Condições Comerciais e Observações
          </p>
          <p className="text-slate-700 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* 8. Termos de Aceite & Assinaturas */}
      <div className="border border-slate-300 rounded p-3 mb-6 bg-slate-50/40 text-[10px] text-slate-600 space-y-1">
        <p className="font-bold uppercase text-slate-800">Termos de Aceite da Proposta Comercial:</p>
        <p>
          1. Os valores orçados são válidos até a data limite indicada neste documento ou pelo prazo
          máximo de 15 (quinze) dias corridos a contar da data de emissão.
        </p>
        <p>
          2. A aprovação desta proposta autoriza a assistência técnica a iniciar a execução dos
          serviços e realizar a reserva e baixa das peças necessárias em estoque.
        </p>
        <p>
          3. Garantia legal de 90 (noventa) dias para serviços e peças substituídas conforme Art. 26
          do Código de Defesa do Consumidor (Lei 8.078/90).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-8">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800">
              {company?.tradeName || company?.name || 'Responsável Técnico / Oficina'}
            </p>
            <p className="text-[10px] text-slate-500">Assinatura do Atendente / Técnico</p>
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800">{quote.customer.name}</p>
            <p className="text-[10px] text-slate-500">De acordo do Cliente (Aprovação)</p>
          </div>
        </div>
      </div>

      {/* Rodapé de Impressão */}
      <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
        <span>Documento gerado automaticamente pelo Sistema de Gestão de Ordens de Serviço.</span>
        <span>Impresso em: {formatDateTime(currentDate)}</span>
      </div>
    </div>
  );
};
