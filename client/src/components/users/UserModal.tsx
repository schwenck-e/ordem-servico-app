import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { userFormSchema, UserFormData } from '@/schemas/user.schema';
import type { User } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const isEditing = Boolean(user);
  const toast = useToast();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'OPERATOR',
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: '',
          role: user.role,
          isActive: user.isActive,
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'OPERATOR',
          isActive: true,
        });
      }
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: UserFormData) => {
    if (!isEditing && (!data.password || data.password.trim().length < 6)) {
      setError('password', {
        type: 'manual',
        message: 'A senha é obrigatória na criação (mínimo 6 caracteres)',
      });
      return;
    }

    try {
      if (isEditing && user) {
        const updatePayload: Record<string, any> = {
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
        };
        if (data.password && data.password.trim().length >= 6) {
          updatePayload.password = data.password.trim();
        }

        await updateUserMutation.mutateAsync({
          id: user.id,
          data: updatePayload,
        });
        toast.success(`Usuário "${data.name}" atualizado com sucesso!`);
      } else {
        await createUserMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: data.role,
          isActive: data.isActive,
        });
        toast.success(`Usuário "${data.name}" cadastrado com sucesso!`);
      }
      onClose();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Erro ao processar usuário.';
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
      description={
        isEditing
          ? 'Atualize os dados cadastrais e permissões do usuário.'
          : 'Cadastre um novo colaborador com perfil e credenciais de acesso.'
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}
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
            placeholder="Ex: Carlos Silva"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            E-mail de Acesso <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="carlos@empresa.com"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            {isEditing ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'} {!isEditing && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Papel e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Papel / Perfil <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            >
              <option value="OPERATOR">Operador (Acesso padrão)</option>
              <option value="ADMIN">Administrador (Acesso total)</option>
            </select>
            {errors.role && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {errors.role.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status da Conta
            </label>
            <div className="mt-2 flex items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Conta Ativa
                </span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
