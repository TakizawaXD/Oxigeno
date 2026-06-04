import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { MainLayout } from './components/layout/MainLayout';
import { ClientQuestionnaire } from './components/onboarding/ClientQuestionnaire';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { OrdersPage } from './pages/OrdersPage';
import { FleetPage } from './pages/FleetPage';
import { AIPage } from './pages/AIPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  CustomersPage,
  InventoryPage,
  RoutesPage,
  IncidentsPage,
  WorkflowsPage,
  FacilitiesPage,
  DocumentsPage,
} from './pages/Placeholders';

function App() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg text-primary-600 mx-auto" />
          <p className="mt-4 text-secondary-500 dark:text-secondary-400">Loading HealthLogix OS...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<ClientQuestionnaire />} />

        {/* Main app routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/:id" element={<AssetsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrdersPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="ai" element={<AIPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
