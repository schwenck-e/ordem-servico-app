import React from 'react';
import { User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { maskDocument, maskPhone } from '@/lib/masks';
import type { Customer } from '@/types';

interface WorkOrderCustomerCardProps {
  customer: Customer;
}

export const WorkOrderCustomerCard: React.FC<WorkOrderCustomerCardProps> = ({ customer }) => {
  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" />
          <span>Dados do Cliente</span>
        </h2>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center shrink-0 text-sm">
          {initials || <User className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate text-base">{customer.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Doc: {customer.document ? maskDocument(customer.document) : 'Não informado'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-sm text-slate-600 pt-1">
        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          {customer.phone ? (
            <a
              href={`tel:${customer.phone.replace(/\D/g, '')}`}
              className="hover:text-primary-600 transition-colors font-medium truncate"
              title="Ligar para o cliente"
            >
              {maskPhone(customer.phone)}
            </a>
          ) : (
            <span className="text-slate-400">Não informado</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
          {customer.email ? (
            <a
              href={`mailto:${customer.email}`}
              className="hover:text-primary-600 transition-colors truncate"
              title="Enviar e-mail para o cliente"
            >
              {customer.email}
            </a>
          ) : (
            <span className="text-slate-400">Não informado</span>
          )}
        </div>

        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-slate-700 leading-snug break-words">
            {customer.address || 'Endereço não cadastrado'}
          </span>
        </div>
      </div>
    </div>
  );
};
