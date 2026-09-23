import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Página Não Encontrada</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
        O endereço solicitado não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        Voltar para o Dashboard
      </Link>
    </div>
  );
};
