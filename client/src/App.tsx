import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';

// Route-based dynamic imports (Code Splitting)
const LoginPage = React.lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const WorkOrdersPage = React.lazy(() => import('@/pages/WorkOrdersPage').then(m => ({ default: m.WorkOrdersPage })));
const WorkOrderFormPage = React.lazy(() => import('@/pages/WorkOrderFormPage').then(m => ({ default: m.WorkOrderFormPage })));
const WorkOrderDetailPage = React.lazy(() => import('@/pages/WorkOrderDetailPage').then(m => ({ default: m.WorkOrderDetailPage })));
const CustomersPage = React.lazy(() => import('@/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const TechniciansPage = React.lazy(() => import('@/pages/TechniciansPage').then(m => ({ default: m.TechniciansPage })));
const ProductsPage = React.lazy(() => import('@/pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const StockMovementsPage = React.lazy(() => import('@/pages/StockMovementsPage').then(m => ({ default: m.StockMovementsPage })));
const QuotesPage = React.lazy(() => import('@/pages/QuotesPage').then(m => ({ default: m.QuotesPage })));
const QuoteFormPage = React.lazy(() => import('@/pages/QuoteFormPage').then(m => ({ default: m.QuoteFormPage })));
const QuoteDetailPage = React.lazy(() => import('@/pages/QuoteDetailPage').then(m => ({ default: m.QuoteDetailPage })));
const InvoicesPage = React.lazy(() => import('@/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const InvoiceDetailPage = React.lazy(() => import('@/pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const FinancialPage = React.lazy(() => import('@/pages/FinancialPage').then(m => ({ default: m.FinancialPage })));
const UsersPage = React.lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const CompanySettingsPage = React.lazy(() => import('@/pages/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader fullScreen />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};
