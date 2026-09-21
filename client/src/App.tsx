import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { TechniciansPage } from '@/pages/TechniciansPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/technicians" element={<TechniciansPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
