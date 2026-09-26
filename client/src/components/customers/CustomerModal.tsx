import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';
import { maskDocument, maskPhone } from '@/lib/masks';
import { customerFormSchema, CustomerFormData } from '@/schemas/customer.schema';
import type { Customer } from '@/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const isEditing = Boolean(customer);
  const toast = useToast();

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const isSubmitting =
    createCustomerMutation.isPending || updateCustomerMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        reset({
          name: customer.name,
          document: maskDocument(customer.document),
          email: customer.email,
          phone: maskPhone(customer.phone),
          address: customer.address,
        });
      } else {
        reset({
          name: '',
          document: '',
          email: '',
          phone: '',
          address: '',
        });
      }
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEditing && customer) {
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data,
        });
        toast.success(`Cliente "${data.name}" atualizado com sucesso!`);
      } else {
        await createCustomerMutation.mutateAsync(data);
        toast.success(`Cliente "${data.name}" cadastrado com sucesso!`);
      }
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Erro ao processar solicitação.';
      toast.error(message);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDocument(e.target.value);
    setValue('document', masked, { shouldValidate: true });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue('phone', masked, { shouldValidate: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      description={
        isEditing
          ? 'Atualize os dados cadastrais do cliente.'
          : 'Preencha os dados abaixo para cadastrar um novo cliente.'
      }
      maxWidth="lg"
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nome Completo / Razão Social <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="Ex: João da Silva ou Empresa Ltda"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Documento (CPF/CNPJ) e Telefone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              CPF ou CNPJ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('document')}
              onChange={handleDocumentChange}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
            {errors.document && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {errors.document.message}
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

        {/* E-mail */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            E-mail <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="contato@exemplo.com"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Endereço Completo <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('address')}
            placeholder="Rua, número, complemento, bairro, cidade - UF"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.address && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.address.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};
