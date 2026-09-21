import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ordens de Serviço', href: '/work-orders', icon: ClipboardList },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Técnicos', href: '/technicians', icon: Wrench },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            Gestão de O.S.
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Painel Operacional</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
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
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
        <p className="font-medium text-slate-500">Ordem de Serviço v1.0</p>
        <p className="mt-0.5">Fastify + React Monorepo</p>
      </div>
    </aside>
  );
};
