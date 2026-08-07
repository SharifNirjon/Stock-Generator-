import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import CollectionsListPage from '../pages/CollectionsListPage';
import CollectionBuilderPage from '../pages/CollectionBuilderPage';
import CollectionDetailPage from '../pages/CollectionDetailPage';
import ReportBuilderPage from '../pages/ReportBuilderPage';
import SavedReportsPage from '../pages/SavedReportsPage';
import StockReportPage from '../pages/StockReportPage';
import InvoicePrintPage from '../pages/InvoicePrintPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/collections/:id/entries/:entryId/print"
        element={
          <PrivateRoute>
            <InvoicePrintPage />
          </PrivateRoute>
        }
      />

      <Route
        element={
          <PrivateRoute>
            <ProtectedLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/collections" element={<CollectionsListPage />} />
        <Route path="/collections/new" element={<CollectionBuilderPage />} />
        <Route path="/collections/:id/edit" element={<CollectionBuilderPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/reports/new" element={<ReportBuilderPage />} />
        <Route path="/reports/templates" element={<SavedReportsPage />} />
        <Route path="/reports/templates/:id" element={<ReportBuilderPage />} />
        <Route path="/reports/stock" element={<StockReportPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
