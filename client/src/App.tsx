import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { WorkOrderFormPage } from '@/pages/WorkOrderFormPage';
import { WorkOrderDetailPage } from '@/pages/WorkOrderDetailPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { TechniciansPage } from '@/pages/TechniciansPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { StockMovementsPage } from '@/pages/StockMovementsPage';
import { QuotesPage } from '@/pages/QuotesPage';
import { QuoteFormPage } from '@/pages/QuoteFormPage';
import { QuoteDetailPage } from '@/pages/QuoteDetailPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { FinancialPage } from '@/pages/FinancialPage';
import { UsersPage } from '@/pages/UsersPage';
import { CompanySettingsPage } from '@/pages/CompanySettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/work-orders" element={<WorkOrdersPage />} />
              <Route path="/work-orders/new" element={<WorkOrderFormPage />} />
              <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
              <Route path="/work-orders/:id/edit" element={<WorkOrderFormPage />} />
              <Route path="/quotes" element={<QuotesPage />} />
              <Route path="/quotes/new" element={<QuoteFormPage />} />
              <Route path="/quotes/:id" element={<QuoteDetailPage />} />
              <Route path="/quotes/:id/edit" element={<QuoteFormPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route
                path="/financial"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <FinancialPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/technicians" element={<TechniciansPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/stock/movements" element={<StockMovementsPage />} />

              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings/company"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CompanySettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};
