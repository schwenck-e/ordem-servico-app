import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useWorkOrder } from '@/hooks/useWorkOrders';
import { WorkOrderHeader } from '@/components/work-orders/detail/WorkOrderHeader';
import { WorkOrderCustomerCard } from '@/components/work-orders/detail/WorkOrderCustomerCard';
import { WorkOrderEquipmentCard } from '@/components/work-orders/detail/WorkOrderEquipmentCard';
import { WorkOrderTechnicianCard } from '@/components/work-orders/detail/WorkOrderTechnicianCard';
import { WorkOrderDiagnosisCard } from '@/components/work-orders/detail/WorkOrderDiagnosisCard';
import { WorkOrderItemsList } from '@/components/work-orders/detail/WorkOrderItemsList';
import { WorkOrderTimeline } from '@/components/work-orders/detail/WorkOrderTimeline';
import { AttachmentGallery } from '@/components/attachments/AttachmentGallery';
import { WorkOrderPrintReceipt } from '@/components/work-orders/detail/WorkOrderPrintReceipt';
import { WorkOrderStatusModal } from '@/components/work-orders/WorkOrderStatusModal';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error, refetch } = useWorkOrder(id);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumb & Header Skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="bg-white rounded-xl border border-slate-200 p-6 h-28" />
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-48" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-36" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-56" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-44" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-72" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (isError || !order) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ordem de Serviço Não Encontrada</h2>
          <p className="text-sm text-slate-500 mt-1">
            {error?.message ||
              'A ordem de serviço solicitada não existe, foi removida ou o identificador informado é inválido.'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/work-orders"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Ordens</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Interactive Screen View (hidden on print) */}
      <div className="space-y-6 print:hidden">
        {/* Header with actions & breadcrumb */}
        <WorkOrderHeader
          order={order}
          onOpenStatusModal={() => setIsStatusModalOpen(true)}
          onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
          onPrint={handlePrint}
        />

        {/* 360° Two-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 cols): Equipment, Diagnosis, Items */}
          <div className="lg:col-span-8 space-y-6">
            <WorkOrderEquipmentCard order={order} />
            <WorkOrderDiagnosisCard
              order={order}
              onEditDiagnosis={() => setIsStatusModalOpen(true)}
            />
            <AttachmentGallery
              workOrderId={order.id}
              attachments={order.attachments || []}
            />
            <WorkOrderItemsList order={order} />
          </div>

          {/* Sidebar Column (4 cols): Customer, Technician, Timeline */}
          <div className="lg:col-span-4 space-y-6">
            <WorkOrderCustomerCard customer={order.customer} />
            <WorkOrderTechnicianCard
              technician={order.technician}
              onAssignTechnician={() => setIsStatusModalOpen(true)}
            />
            <WorkOrderTimeline logs={order.logs || []} />
          </div>
        </div>

        {/* Quick Status & Diagnosis Transition Modal */}
        <WorkOrderStatusModal
          order={order}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
        />

        {/* Modal de Faturamento Comercial */}
        <CreateInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          workOrder={order}
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            refetch();
          }}
        />
      </div>

      {/* Media Print / PDF Formal Receipt (visible only on print) */}
      <WorkOrderPrintReceipt order={order} />
    </>
  );
};
export default WorkOrderDetailPage;
