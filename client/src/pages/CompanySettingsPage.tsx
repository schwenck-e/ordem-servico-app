import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { useCompany, useUpdateCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/useToast';
import { companyFormSchema, CompanyFormData } from '@/schemas/company.schema';
import { maskCnpj, maskPhone, maskCep } from '@/lib/masks';

export const CompanySettingsPage: React.FC = () => {
  const toast = useToast();
  const { data: company, isLoading, isError, error, refetch } = useCompany();
  const updateCompanyMutation = useUpdateCompany();

  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      tradeName: '',
      cnpj: '',
      ie: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      logoUrl: '',
      warrantyTerms: '',
      workOrderNotes: '',
    },
  });

  const watchedLogoUrl = watch('logoUrl');
  const watchedWarrantyTerms = watch('warrantyTerms') || '';
  const watchedWorkOrderNotes = watch('workOrderNotes') || '';

  // Reseta estado de erro do preview quando o usuário altera a URL
  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [watchedLogoUrl]);

  // Preenche o formulário quando os dados da empresa são carregados
  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        tradeName: company.tradeName,
        cnpj: maskCnpj(company.cnpj),
        ie: company.ie || '',
        email: company.email,
        phone: maskPhone(company.phone),
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: maskCep(company.zipCode),
        logoUrl: company.logoUrl || '',
        warrantyTerms: company.warrantyTerms || '',
        workOrderNotes: company.workOrderNotes || '',
      });
    }
  }, [company, reset]);

  const onSubmit = async (formData: CompanyFormData) => {
    try {
      await updateCompanyMutation.mutateAsync({
        name: formData.name.trim(),
        tradeName: formData.tradeName.trim(),
        cnpj: formData.cnpj.trim(),
        ie: formData.ie?.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zipCode: formData.zipCode.trim(),
        logoUrl: formData.logoUrl?.trim() || null,
        warrantyTerms: formData.warrantyTerms?.trim() || null,
        workOrderNotes: formData.workOrderNotes?.trim() || null,
      });

      toast.success('Configurações da empresa salvas com sucesso!');
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Erro ao salvar configurações da empresa.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium">Carregando configurações da empresa...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-red-900 mb-1">
          Erro ao carregar configurações
        </h3>
        <p className="text-sm text-red-700 mb-4">
          {error?.message || 'Não foi possível carregar os dados cadastrais da empresa.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configurações da Empresa
            </h1>
            <p className="text-sm text-slate-500">
              Dados institucionais, fiscais, endereço, identidade visual e cláusulas legais de O.S.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={updateCompanyMutation.isPending}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {updateCompanyMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Seção 1: Dados Institucionais e Fiscais */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Dados Institucionais & Fiscais
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Razão Social */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="Ex: Auto Mecânica e Serviços Ltda"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Nome Fantasia */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Fantasia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('tradeName')}
                placeholder="Ex: Oficina Mecânica Express"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.tradeName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.tradeName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.tradeName.message}
                </p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('cnpj')}
                onChange={(e) => {
                  setValue('cnpj', maskCnpj(e.target.value), { shouldValidate: true });
                }}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.cnpj
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.cnpj && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.cnpj.message}</p>
              )}
            </div>

            {/* Inscrição Estadual */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Inscrição Estadual (I.E.)
              </label>
              <input
                type="text"
                {...register('ie')}
                placeholder="Ex: 123.456.789.000 ou Isento"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-brand-100 focus:outline-none focus:ring-2 transition-all"
              />
              {errors.ie && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.ie.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 2: Contato e Localização */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Contato & Localização
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* E-mail */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail Institucional <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="contato@empresa.com.br"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('phone')}
                onChange={(e) => {
                  setValue('phone', maskPhone(e.target.value), { shouldValidate: true });
                }}
                maxLength={15}
                placeholder="(00) 00000-0000"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Endereço Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="Ex: Av. Brasil, 1500, Galpão B, Bairro Centro"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.address
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.address.message}</p>
              )}
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="Ex: São Paulo"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.city
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.city.message}</p>
              )}
            </div>

            {/* Estado (UF) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                UF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('state')}
                maxLength={2}
                placeholder="SP"
                className={`w-full px-3.5 py-2 text-sm uppercase rounded-lg border ${
                  errors.state
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.state && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.state.message}</p>
              )}
            </div>

            {/* CEP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                CEP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('zipCode')}
                onChange={(e) => {
                  setValue('zipCode', maskCep(e.target.value), { shouldValidate: true });
                }}
                maxLength={9}
                placeholder="00000-000"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.zipCode
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.zipCode && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 3: Identidade Visual (Logo) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Identidade Visual
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                URL da Logomarca (Imagem)
              </label>
              <input
                type="url"
                {...register('logoUrl')}
                placeholder="https://sua-empresa.com.br/logo.png"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.logoUrl
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                } focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.logoUrl && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.logoUrl.message}</p>
              )}
              <p className="text-xs text-slate-500 leading-relaxed">
                Insira a URL pública da logomarca da sua empresa (PNG, JPG ou SVG com fundo transparente ou branco recomendado).
                Esta imagem será exibida no cabeçalho das Ordens de Serviço impressas e comprovantes em PDF.
              </p>
            </div>

            {/* Preview da Logo */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center min-h-[140px]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pré-visualização da Logo
              </span>
              {watchedLogoUrl && !logoPreviewFailed ? (
                <div className="relative group max-h-24 max-w-full flex items-center justify-center">
                  <img
                    src={watchedLogoUrl}
                    alt="Pré-visualização da Logomarca"
                    onError={() => setLogoPreviewFailed(true)}
                    className="max-h-20 max-w-full object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 stroke-[1.5] mb-1" />
                  <span className="text-xs">
                    {logoPreviewFailed ? 'Falha ao carregar imagem' : 'Nenhuma logo configurada'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção 4: Termos Legais & Observações da O.S. */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Termos Legais & Instruções Operacionais da O.S.
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Termos de Garantia */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Termos Legais e Condições de Garantia
                </label>
                <span
                  className={`text-xs ${
                    watchedWarrantyTerms.length > 2900 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {watchedWarrantyTerms.length}/3000 caracteres
                </span>
              </div>
              <textarea
                rows={4}
                {...register('warrantyTerms')}
                placeholder="Ex: A garantia dos serviços prestados e peças substituídas é de 90 dias conforme Art. 26 do Código de Defesa do Consumidor..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-brand-100 focus:outline-none focus:ring-2 transition-all leading-relaxed"
              />
              {errors.warrantyTerms && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.warrantyTerms.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Texto inserido na seção de garantia do comprovante de impressão entregue ao cliente.
              </p>
            </div>

            {/* Observações da O.S. */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Observações e Orientações Padrão de Entrada da O.S.
                </label>
                <span
                  className={`text-xs ${
                    watchedWorkOrderNotes.length > 2900 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {watchedWorkOrderNotes.length}/3000 caracteres
                </span>
              </div>
              <textarea
                rows={4}
                {...register('workOrderNotes')}
                placeholder="Ex: Equipamentos não retirados em até 90 dias após a conclusão estarão sujeitos a taxa diária de guarda..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-brand-100 focus:outline-none focus:ring-2 transition-all leading-relaxed"
              />
              {errors.workOrderNotes && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.workOrderNotes.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Orientações exibidas no rodapé ou observações padrão do termo de abertura da Ordem de Serviço.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={updateCompanyMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {updateCompanyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Configurações...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
