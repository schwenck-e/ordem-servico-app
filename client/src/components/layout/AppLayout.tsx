import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white print:block">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 print:block">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none print:m-0 print:bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
