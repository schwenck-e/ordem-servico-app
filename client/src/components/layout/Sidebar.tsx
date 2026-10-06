import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  Layers,
  ShieldCheck,
  Building2,
  Package,
  FileText,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ordens de Serviço', href: '/work-orders', icon: ClipboardList },
  { name: 'Orçamentos', href: '/quotes', icon: FileText },
  { name: 'Faturas', href: '/invoices', icon: Receipt },
  { name: 'Financeiro', href: '/financial', icon: DollarSign, adminOnly: true },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Técnicos', href: '/technicians', icon: Wrench },
  { name: 'Estoque', href: '/products', icon: Package },
  { name: 'Usuários', href: '/users', icon: ShieldCheck, adminOnly: true },
  { name: 'Configurações', href: '/settings/company', icon: Building2, adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen print:hidden shadow-xs">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="w-9 h-9 bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            Gestão de O.S.
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Painel Corporativo</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-brand-600 rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform group-hover:scale-105',
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-600 text-[11px]">Ordem de Serviço</span>
          <span className="text-[10px] font-mono text-brand-600 bg-brand-50 border border-brand-200/60 px-1.5 py-0.5 rounded-md font-bold">
            v1.4.0
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Fastify + React Monorepo</p>
      </div>
    </aside>
  );
};
