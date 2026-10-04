import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Smartphone,
  Hash,
  Calendar,
  AlertTriangle,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';
import { quoteFormSchema, type QuoteFormData } from '@/schemas/quote.schema';
import { useQuote, useCreateQuote, useUpdateQuote } from '@/hooks/useQuotes';
import { CustomerSelector } from '@/components/work-orders/form/CustomerSelector';
import { TechnicianSelector } from '@/components/work-orders/form/TechnicianSelector';
import { QuoteItemsTable } from '@/components/quotes/QuoteItemsTable';
import { QuoteTotalsCard } from '@/components/quotes/QuoteTotalsCard';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { useToast } from '@/context/ToastContext';
import type { CreateQuoteInput, UpdateQuoteInput } from '@/types';

function getDefaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

export const QuoteFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const {
    data: existingQuote,
    isLoading: isLoadingQuote,
    isError: isQuoteError,
  } = useQuote(id);

  const createMutation = useCreateQuote();
  const updateMutation = useUpdateQuote();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customerId: '',
      technicianId: '',
      equipment: '',
      serialNumber: '',
      reportedDefect: '',
      technicalDiagnosis: '',
      notes: '',
      validUntil: getDefaultValidUntil(),
      discount: 0,
      items: [
        {
          productId: null,
          type: 'SERVICE',
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  // Validação em modo edição: apenas DRAFT pode ser editado
  useEffect(() => {
    if (isEditMode && existingQuote) {
      if (existingQuote.status !== 'DRAFT') {
        error(
          `O orçamento ${existingQuote.quoteNumber} está em status "${existingQuote.status}" e não pode ser editado.`
        );
        navigate(`/quotes/${existingQuote.id}`);
        return;
      }

      reset({
        customerId: existingQuote.customerId,
        technicianId: existingQuote.technicianId || '',
        equipment: existingQuote.equipment,
        serialNumber: existingQuote.serialNumber || '',
        reportedDefect: existingQuote.reportedDefect,
        technicalDiagnosis: existingQuote.technicalDiagnosis || '',
        notes: existingQuote.notes || '',
        validUntil: existingQuote.validUntil ? existingQuote.validUntil.split('T')[0] : '',
        discount: existingQuote.discount || 0,
        items:
          existingQuote.items && existingQuote.items.length > 0
            ? existingQuote.items.map((item) => ({
                productId: item.productId || null,
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }))
            : [
                {
                  productId: null,
                  type: 'SERVICE',
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                },
              ],
      });
    }
  }, [isEditMode, existingQuote, reset, error, navigate]);

  const onSubmit = async (data: QuoteFormData) => {
    try {
      const payloadItems = data.items.map((item) => ({
        productId: item.type === 'PART' && item.productId ? item.productId : null,
        type: item.type,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));

      const basePayload: CreateQuoteInput = {
        customerId: data.customerId,
        technicianId: data.technicianId ? data.technicianId : null,
        equipment: data.equipment.trim(),
        serialNumber: data.serialNumber?.trim() || null,
        reportedDefect: data.reportedDefect.trim(),
        technicalDiagnosis: data.technicalDiagnosis?.trim() || null,
        notes: data.notes?.trim() || null,
        validUntil: data.validUntil ? new Date(`${data.validUntil}T23:59:59`).toISOString() : null,
        discount: Number(data.discount) || 0,
        items: payloadItems,
      };

      if (isEditMode && id) {
        const updatePayload: UpdateQuoteInput = { ...basePayload };
        const updated = await updateMutation.mutateAsync({ id, data: updatePayload });
        success(`Orçamento ${updated.quoteNumber} atualizado com sucesso!`);
        navigate(`/quotes/${updated.id}`);
      } else {
        const created = await createMutation.mutateAsync(basePayload);
        success(`Orçamento ${created.quoteNumber} emitido com sucesso!`);
        navigate(`/quotes/${created.id}`);
      }
    } catch (err: any) {
      error(err?.message || 'Falha ao salvar orçamento. Verifique os dados e tente novamente.');
    }
  };

  if (isEditMode && isLoadingQuote) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Carregando dados da proposta...</p>
      </div>
    );
  }

  if (isEditMode && isQuoteError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-base font-bold text-red-800">Orçamento não encontrado</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">
          Não foi possível carregar as informações do orçamento solicitado.
        </p>
        <Link
          to="/quotes"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Orçamentos</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(isEditMode && id ? `/quotes/${id}` : '/quotes')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {isEditMode ? `Editar Orçamento ${existingQuote?.quoteNumber}` : 'Novo Orçamento'}
                </h1>
                {isEditMode && existingQuote && (
                  <QuoteStatusBadge status={existingQuote.status} />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Modifique os serviços, peças e termos comerciais da proposta.'
                  : 'Preencha os dados do cliente, aparelho e proposta técnica-comercial.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Principal: Formulário e Itens */}
          <div className="space-y-6 lg:col-span-2">
            {/* Seletor de Cliente */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <CustomerSelector
                value={watch('customerId')}
                onChange={(customerId) =>
                  setValue('customerId', customerId, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.customerId?.message}
                initialCustomer={existingQuote?.customer}
              />
            </div>

            {/* Dados do Equipamento & Defeito */}
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Equipamento & Proposta Comercial</h3>
                <p className="text-xs text-slate-500">
                  Dados do equipamento avaliado, defeito informado e prazo de validade.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Equipamento */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Equipamento / Modelo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Smartphone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      {...register('equipment')}
                      placeholder="Ex: Notebook Lenovo ThinkPad E14..."
                      className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.equipment
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
                      }`}
                    />
                  </div>
                  {errors.equipment && (
                    <p className="mt-1 text-xs text-red-600">{errors.equipment.message}</p>
                  )}
                </div>

                {/* Número de Série */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Número de Série / IMEI
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      {...register('serialNumber')}
                      placeholder="Ex: SN-88392019A"
                      className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Validade da Proposta */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Validade da Proposta
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      {...register('validUntil')}
                      className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Técnico Responsável */}
                <div>
                  <TechnicianSelector
                    value={watch('technicianId')}
                    onChange={(techId) =>
                      setValue('technicianId', techId, { shouldValidate: true, shouldDirty: true })
                    }
                    error={errors.technicianId?.message}
                  />
                </div>
              </div>

              {/* Defeito Relatado */}
              <div>
                <label className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                    <span>Defeito Relatado / Solicitação do Cliente</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {(watch('reportedDefect') || '').length}/1000
                  </span>
                </label>
                <textarea
                  rows={2}
                  {...register('reportedDefect')}
                  placeholder="Descreva detalhadamente o problema relatado pelo cliente..."
                  className={`block w-full rounded-lg border p-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.reportedDefect
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
                  }`}
                />
                {errors.reportedDefect && (
                  <p className="mt-1 text-xs text-red-600">{errors.reportedDefect.message}</p>
                )}
              </div>

              {/* Diagnóstico Técnico */}
              <div>
                <label className="mb-1 flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
                  <Stethoscope className="h-4 w-4 text-slate-400" />
                  <span>Diagnóstico Técnico Preliminar</span>
                </label>
                <textarea
                  rows={2}
                  {...register('technicalDiagnosis')}
                  placeholder="Análise técnica preliminar sobre o defeito encontrado e testes realizados..."
                  className="block w-full rounded-lg border border-slate-300 p-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Observações Comerciais */}
              <div>
                <label className="mb-1 flex items-center space-x-1.5 text-sm font-semibold text-slate-700">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span>Observações & Condições Comerciais</span>
                </label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="Condições de pagamento, garantias especiais ou observações ao cliente..."
                  className="block w-full rounded-lg border border-slate-300 p-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Tabela Dinâmica de Itens */}
            <QuoteItemsTable
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          </div>

          {/* Coluna Lateral: Resumo de Totais e Salvar */}
          <div className="lg:col-span-1">
            <QuoteTotalsCard
              register={register}
              watch={watch}
              errors={errors}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
              onCancel={() => navigate(isEditMode && id ? `/quotes/${id}` : '/quotes')}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
