import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { Navigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';

export function MainLayout() {
  const { user, isInitialized } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed } = useUIStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <div className="spinner-lg text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}
          ${sidebarOpen ? 'pl-72' : 'pl-0'}
        `}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
