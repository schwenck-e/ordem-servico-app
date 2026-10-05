import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskDocument, maskPhone, maskCnpj, maskCep } from '@/lib/masks';
import { useCompany } from '@/hooks/useCompany';
import type { Invoice, PaymentMethod } from '@/types';

interface InvoicePrintReceiptProps {
  invoice: Invoice;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro',
  BANK_SLIP: 'Boleto Bancário',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PARTIALLY_PAID: 'Parcialmente Paga',
  PAID: 'Quitada',
  CANCELED: 'Cancelada',
};

export const InvoicePrintReceipt: React.FC<InvoicePrintReceiptProps> = ({ invoice }) => {
  const { data: company } = useCompany();

  const items = invoice.workOrder?.items || invoice.quote?.items || [];
  const statusLabel = statusLabels[invoice.status] || invoice.status;
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
              {company?.address || 'Av. Principal, 1000'}, {company?.city || 'São Paulo'} -{' '}
              {company?.state || 'SP'} • CEP:{' '}
              {company?.zipCode ? maskCep(company.zipCode) : '01310-100'}
            </p>
            <p className="text-[11px] text-slate-600">
              Telefone: {company?.phone ? maskPhone(company.phone) : '(11) 3000-0000'} • E-mail:{' '}
              {company?.email || 'contato@oficina.com.br'}
            </p>
          </div>
        </div>

        {/* Quadro Identificador da Fatura */}
        <div className="border-2 border-slate-900 rounded p-2 text-right shrink-0 min-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Fatura / Recibo
          </p>
          <p className="text-lg font-black text-slate-900 font-mono">{invoice.invoiceNumber}</p>
          <p className="text-[11px] font-semibold mt-1">
            Status: <span className="uppercase">{statusLabel}</span>
          </p>
          <p className="text-[10px] text-slate-600">Emissão: {formatDate(invoice.createdAt)}</p>
          <p className="text-[10px] font-bold text-slate-800">
            Vencimento: {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      {/* 2. Dados do Cliente e Referência da OS/Orçamento */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cliente */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Dados do Cliente
          </p>
          <p>
            <strong>Nome / Razão Social:</strong> {invoice.customer.name}
          </p>
          <p>
            <strong>CPF / CNPJ:</strong>{' '}
            {invoice.customer.document ? maskDocument(invoice.customer.document) : 'Não informado'}
          </p>
          <p>
            <strong>Telefone:</strong> {maskPhone(invoice.customer.phone)}
          </p>
          <p>
            <strong>E-mail:</strong> {invoice.customer.email || 'Não informado'}
          </p>
          {invoice.customer.address && (
            <p>
              <strong>Endereço:</strong> {invoice.customer.address}
            </p>
          )}
        </div>

        {/* Referência da Origem */}
        <div className="border border-slate-300 rounded p-2.5 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Origem do Atendimento
          </p>
          {invoice.workOrder ? (
            <>
              <p>
                <strong>Ordem de Serviço:</strong> #{invoice.workOrder.orderNumber}
              </p>
              <p>
                <strong>Equipamento:</strong> {invoice.workOrder.equipment}
              </p>
              {invoice.workOrder.serialNumber && (
                <p>
                  <strong>Nº de Série:</strong> {invoice.workOrder.serialNumber}
                </p>
              )}
              {invoice.workOrder.technician && (
                <p>
                  <strong>Técnico Responsável:</strong> {invoice.workOrder.technician.name}
                </p>
              )}
            </>
          ) : invoice.quote ? (
            <>
              <p>
                <strong>Orçamento de Origem:</strong> {invoice.quote.quoteNumber}
              </p>
              <p>
                <strong>Equipamento:</strong> {invoice.quote.equipment}
              </p>
              {invoice.quote.serialNumber && (
                <p>
                  <strong>Nº de Série:</strong> {invoice.quote.serialNumber}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500 italic">Fatura avulsa emitida manualmente.</p>
          )}
        </div>
      </div>

      {/* 3. Discriminação dos Itens Faturados */}
      {items.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Discriminação de Serviços e Peças
          </p>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border border-slate-300 px-2 py-1 text-left w-12">Item</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Descrição</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-20">Tipo</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-14">Qtd</th>
                <th className="border border-slate-300 px-2 py-1 text-right w-24">Unitário</th>
                <th className="border border-slate-300 px-2 py-1 text-right w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-slate-200">
                  <td className="border border-slate-300 px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-slate-300 px-2 py-1">{item.description}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{item.quantity}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-semibold">
                    {formatCurrency(item.subtotal || item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Quadro Resumo Financeiro */}
      <div className="flex justify-end mb-4">
        <div className="w-72 border border-slate-300 rounded p-2.5 space-y-1.5 bg-slate-50 text-[11px]">
          <div className="flex justify-between text-slate-700">
            <span>Valor Bruto:</span>
            <span>{formatCurrency(invoice.amount)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Desconto Aplicado:</span>
              <span>- {formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1 text-xs">
            <span>Total Líquido da Fatura:</span>
            <span>{formatCurrency(invoice.netAmount)}</span>
          </div>
          <div className="flex justify-between font-medium text-emerald-700">
            <span>Total Quitado:</span>
            <span>{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1">
            <span>Saldo Devedor:</span>
            <span className={invoice.remainingBalance > 0 ? 'text-amber-700' : 'text-slate-600'}>
              {formatCurrency(invoice.remainingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Histórico de Pagamentos */}
      {invoice.payments.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase text-slate-800 mb-1">
            Comprovantes de Amortização / Pagamentos Recebidos
          </p>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border border-slate-300 px-2 py-1 text-left w-36">Data / Hora</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Forma de Pagamento</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Operador / Recebido Por</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Observações</th>
                <th className="border border-slate-300 px-2 py-1 text-right w-28">Valor Pago</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-200">
                  <td className="border border-slate-300 px-2 py-1">
                    {formatDateTime(p.paidAt)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {paymentMethodLabels[p.paymentMethod] || p.paymentMethod}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {p.receivedBy}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-slate-600">
                    {p.notes || '-'}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-bold text-emerald-700">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Declaração e Assinaturas */}
      <div className="mt-8 border-t border-slate-300 pt-4">
        <p className="text-[10px] text-slate-600 mb-8 text-center">
          Declaramos para os devidos fins que os serviços e fornecimentos discriminados foram entregues conforme acordado.
          {invoice.status === 'PAID'
            ? ' A presente fatura encontra-se integralmente quitada.'
            : ' O saldo remanescente deverá ser quitado na data de vencimento estipulada.'}
        </p>

        <div className="grid grid-cols-2 gap-8 text-center text-[11px]">
          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1" />
            <p className="font-semibold text-slate-800">
              {company?.name || 'Responsável Financeiro / Emissor'}
            </p>
            <p className="text-[10px] text-slate-500">Assinatura do Emissor</p>
          </div>
          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1" />
            <p className="font-semibold text-slate-800">{invoice.customer.name}</p>
            <p className="text-[10px] text-slate-500">Assinatura do Pagador</p>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 text-center mt-6">
          Impresso em {formatDateTime(currentDate)} via Sistema de Ordem de Serviço
        </p>
      </div>
    </div>
  );
};
