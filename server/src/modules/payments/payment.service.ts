import { PrismaClient } from '@prisma/client';
import { createHttpError } from '../invoices/invoice.service';
import type { CreatePaymentInput } from '../invoices/invoice.schemas';

export async function createPayment(
  prisma: PrismaClient,
  invoiceId: string,
  data: CreatePaymentInput,
  receivedBy: string = 'SYSTEM'
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw createHttpError(404, 'Fatura não encontrada.');
    }

    if (invoice.status === 'CANCELED') {
      throw createHttpError(400, 'Não é possível registrar pagamentos em uma fatura cancelada.');
    }

    if (invoice.status === 'PAID') {
      throw createHttpError(400, 'A fatura já está integralmente quitada.');
    }

    const remainingBalance = Math.round((invoice.netAmount - invoice.paidAmount) * 100) / 100;
    const paymentAmount = Math.round(data.amount * 100) / 100;

    if (paymentAmount <= 0) {
      throw createHttpError(400, 'O valor do pagamento deve ser maior que zero.');
    }

    if (paymentAmount > remainingBalance) {
      throw createHttpError(
        400,
        `O valor do pagamento (R$ ${paymentAmount.toFixed(2)}) excede o saldo devedor restante da fatura (R$ ${remainingBalance.toFixed(2)}).`
      );
    }

    const newPaidAmount = Math.round((invoice.paidAmount + paymentAmount) * 100) / 100;
    const isFullyPaid = newPaidAmount >= invoice.netAmount;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt || new Date(),
        receivedBy,
        notes: data.notes ?? null,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        customer: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });
}
