import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateTechnician, useUpdateTechnician } from '@/hooks/useTechnicians';
import { useToast } from '@/hooks/useToast';
import { maskPhone } from '@/lib/masks';
import { technicianFormSchema, TechnicianFormData } from '@/schemas/technician.schema';
import type { Technician } from '@/types';

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: Technician | null;
}

export const TechnicianModal: React.FC<TechnicianModalProps> = ({
  isOpen,
  onClose,
  technician,
}) => {
  const isEditing = Boolean(technician);
  const toast = useToast();

  const createTechnicianMutation = useCreateTechnician();
  const updateTechnicianMutation = useUpdateTechnician();

  const isSubmitting =
    createTechnicianMutation.isPending || updateTechnicianMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      isActive: true,
    },
  });

  const isActiveValue = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (technician) {
        reset({
          name: technician.name,
          email: technician.email,
          phone: maskPhone(technician.phone),
          specialty: technician.specialty,
          isActive: technician.isActive ?? technician.active ?? true,
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          specialty: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, technician, reset]);

  const onSubmit = async (data: TechnicianFormData) => {
    try {
      if (isEditing && technician) {
        await updateTechnicianMutation.mutateAsync({
          id: technician.id,
          data,
        });
        toast.success(`Técnico "${data.name}" atualizado com sucesso!`);
      } else {
        await createTechnicianMutation.mutateAsync(data);
        toast.success(`Técnico "${data.name}" cadastrado com sucesso!`);
      }
      onClose();
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error(
          err?.data?.message || 'Já existe um técnico cadastrado com este e-mail.'
        );
      } else {
        toast.error(
          err?.data?.message || err?.message || 'Erro ao processar solicitação.'
        );
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue('phone', masked, { shouldValidate: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Técnico' : 'Novo Técnico'}
      description={
        isEditing
          ? 'Atualize os dados e a disponibilidade do técnico.'
          : 'Preencha os dados abaixo para cadastrar um novo técnico na equipe.'
      }
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Técnico'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="Ex: Carlos Eduardo"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* E-mail e Telefone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              E-mail <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="tecnico@empresa.com"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Telefone <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('phone')}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
            {errors.phone && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Especialidade */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Especialidade Principal <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('specialty')}
            placeholder="Ex: Elétrica, Refrigeração, Redes, Hidráulica"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.specialty && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.specialty.message}
            </p>
          )}
        </div>

        {/* Status Ativo / Inativo Switch */}
        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-semibold text-slate-800">
                Técnico Ativo no Sistema
              </span>
              <p className="text-xs text-slate-500">
                {isActiveValue
                  ? 'Disponível para atribuição e atendimento de novas ordens de serviço.'
                  : 'Inativo. Não receberá novas ordens de serviço.'}
              </p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
};
