import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import {
  workOrderFormSchema,
  type WorkOrderFormData,
} from '@/schemas/work-order.schema';
import {
  useWorkOrder,
  useCreateWorkOrder,
  useUpdateWorkOrder,
} from '@/hooks/useWorkOrders';
import { CustomerSelector } from '@/components/work-orders/form/CustomerSelector';
import { TechnicianSelector } from '@/components/work-orders/form/TechnicianSelector';
import { EquipmentSection } from '@/components/work-orders/form/EquipmentSection';
import { WorkOrderItemsTable } from '@/components/work-orders/form/WorkOrderItemsTable';
import { WorkOrderTotalsCard } from '@/components/work-orders/form/WorkOrderTotalsCard';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import type { CreateWorkOrderInput, UpdateWorkOrderInput } from '@/types';

export function WorkOrderFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: existingWorkOrder,
    isLoading: isLoadingOrder,
    isError: isOrderError,
  } = useWorkOrder(id);

  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      customerId: '',
      technicianId: '',
      equipment: '',
      serialNumber: '',
      reportedDefect: '',
      technicalDiagnosis: '',
      priority: 'MEDIUM',
      scheduledDate: '',
      discount: 0,
      initialComment: '',
      items: [
        {
          type: 'SERVICE',
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  // Populate form with existing data when in edit mode
  useEffect(() => {
    if (isEditMode && existingWorkOrder) {
      reset({
        customerId: existingWorkOrder.customerId,
        technicianId: existingWorkOrder.technicianId || '',
        equipment: existingWorkOrder.equipment,
        serialNumber: existingWorkOrder.serialNumber || '',
        reportedDefect: existingWorkOrder.reportedDefect,
        technicalDiagnosis: existingWorkOrder.technicalDiagnosis || '',
        priority: existingWorkOrder.priority,
        scheduledDate: existingWorkOrder.scheduledDate
          ? existingWorkOrder.scheduledDate.split('T')[0]
          : '',
        discount: existingWorkOrder.discount || 0,
        items:
          existingWorkOrder.items && existingWorkOrder.items.length > 0
            ? existingWorkOrder.items.map((item) => ({
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }))
            : [
                {
                  type: 'SERVICE',
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                },
              ],
      });
    }
  }, [isEditMode, existingWorkOrder, reset]);

  const customerId = watch('customerId');
  const technicianId = watch('technicianId');

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const sanitizedItems = data.items.map((item) => ({
        type: item.type,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));

      const scheduledDateFormatted =
        data.scheduledDate && data.scheduledDate.trim() !== ''
          ? new Date(data.scheduledDate).toISOString()
          : null;

      if (isEditMode && id) {
        const updatePayload: UpdateWorkOrderInput = {
          customerId: data.customerId,
          technicianId:
            data.technicianId && data.technicianId.trim() !== ''
              ? data.technicianId
              : null,
          equipment: data.equipment.trim(),
          serialNumber:
            data.serialNumber && data.serialNumber.trim() !== ''
              ? data.serialNumber.trim()
              : null,
          reportedDefect: data.reportedDefect.trim(),
          technicalDiagnosis:
            data.technicalDiagnosis && data.technicalDiagnosis.trim() !== ''
              ? data.technicalDiagnosis.trim()
              : null,
          priority: data.priority,
          scheduledDate: scheduledDateFormatted,
          discount: Number(data.discount) || 0,
          items: sanitizedItems,
        };

        const updated = await updateMutation.mutateAsync({ id, data: updatePayload });
        toast.success(`A ordem ${updated.orderNumber} foi atualizada com sucesso.`);
        navigate('/work-orders');
      } else {
        const createPayload: CreateWorkOrderInput = {
          customerId: data.customerId,
          technicianId:
            data.technicianId && data.technicianId.trim() !== ''
              ? data.technicianId
              : null,
          equipment: data.equipment.trim(),
          serialNumber:
            data.serialNumber && data.serialNumber.trim() !== ''
              ? data.serialNumber.trim()
              : null,
          reportedDefect: data.reportedDefect.trim(),
          priority: data.priority,
          scheduledDate: scheduledDateFormatted,
          discount: Number(data.discount) || 0,
          items: sanitizedItems,
          initialComment:
            data.initialComment && data.initialComment.trim() !== ''
              ? data.initialComment.trim()
              : undefined,
        };

        const created = await createMutation.mutateAsync(createPayload);
        toast.success(`A ordem ${created.orderNumber} foi aberta com sucesso.`);
        navigate('/work-orders');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a ordem de serviço.';
      toast.error(errorMsg);
    }
  };

  if (isEditMode && isLoadingOrder) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">
          Carregando dados da ordem de serviço...
        </p>
      </div>
    );
  }

  if (isEditMode && isOrderError) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-3 text-lg font-bold text-red-800">
          Ordem de Serviço Não Encontrada
        </h3>
        <p className="mt-1 text-sm text-red-600">
          Não foi possível carregar os dados desta ordem de serviço ou ela foi removida.
        </p>
        <Link
          to="/work-orders"
          className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar para o Painel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header com Navegação e Título */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/work-orders"
            className="inline-flex items-center text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Voltar para Ordens de Serviço
          </Link>
          <div className="mt-1 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isEditMode ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                </h1>
                {isEditMode && existingWorkOrder && (
                  <span className="text-lg font-semibold text-slate-500">
                    #{existingWorkOrder.orderNumber}
                  </span>
                )}
                {isEditMode && existingWorkOrder && (
                  <StatusBadge status={existingWorkOrder.status} />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Atualize os dados do equipamento, serviços prestados ou laudo técnico.'
                  : 'Preencha as informações abaixo para abrir uma nova ordem de serviço.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Principal (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Seleção de Cliente e Técnico */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Cliente e Responsável</h3>
                <p className="text-xs text-slate-500">
                  Identifique o proprietário do aparelho e atribua o técnico executor.
                </p>
              </div>

              <CustomerSelector
                value={customerId}
                onChange={(newId) =>
                  setValue('customerId', newId, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.customerId?.message}
                initialCustomer={existingWorkOrder?.customer}
              />

              <TechnicianSelector
                value={technicianId}
                onChange={(newId) =>
                  setValue('technicianId', newId, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.technicianId?.message}
              />
            </div>

            {/* Dados do Equipamento, Defeito e Prazos */}
            <EquipmentSection
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isEditMode={isEditMode}
            />

            {/* Tabela Dinâmica de Itens */}
            <WorkOrderItemsTable
              control={control}
              register={register}
              errors={errors}
              watch={watch}
            />
          </div>

          {/* Coluna Lateral (1/3) - Resumo Financeiro e Ações */}
          <div className="lg:col-span-1">
            <WorkOrderTotalsCard
              register={register}
              watch={watch}
              errors={errors}
              isSubmitting={isSubmitting || createMutation.isPending || updateMutation.isPending}
              isEditMode={isEditMode}
              onCancel={() => navigate('/work-orders')}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
