import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';
import { es } from '../../lib/translations';
import {
  Activity,
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  Truck,
  Users,
  Sparkles,
  Workflow,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

const mainNavigation = [
  { name: es.navigation.dashboard, href: '/', icon: LayoutDashboard },
  { name: es.navigation.assets, href: '/assets', icon: Package },
  { name: es.navigation.inventory, href: '/inventory', icon: Warehouse },
  { name: es.navigation.orders, href: '/orders', icon: ClipboardList },
  { name: es.navigation.fleet, href: '/fleet', icon: Truck },
  { name: es.navigation.routes, href: '/routes', icon: Truck },
  { name: es.navigation.customers, href: '/customers', icon: Users },
  { name: es.navigation.incidents, href: '/incidents', icon: AlertTriangle },
];

const aiNavigation = [
  { name: es.navigation.ai, href: '/ai', icon: Sparkles },
  { name: es.navigation.workflows, href: '/workflows', icon: Workflow },
];

const settingsNavigation = [
  { name: es.navigation.facilities, href: '/facilities', icon: Building2 },
  { name: es.navigation.documents, href: '/documents', icon: FileText },
  { name: es.navigation.settings, href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, organization, signOut } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } = useUIStore();
  const location = useLocation();

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 transition-all duration-300 ease-in-out flex flex-col',
          sidebarCollapsed ? 'w-20' : 'w-72',
          'lg:block',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/25">
              <Activity className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="text-lg font-bold text-secondary-900 dark:text-white truncate">
                  HealthLogix
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Operating System</div>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Organization selector */}
        {!sidebarCollapsed && organization && (
          <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-800">
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {organization.name}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                  {organization.role}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">
                {es.navigation.operations}
              </div>
            )}
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100',
                    sidebarCollapsed && 'justify-center'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}

            {!sidebarCollapsed && (
              <div className="pt-4 px-3">
                <div className="h-px bg-secondary-200 dark:bg-secondary-800" />
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">
                {es.navigation.intelligence}
              </div>
            )}
            {aiNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100',
                    sidebarCollapsed && 'justify-center'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}

            {!sidebarCollapsed && (
              <div className="pt-4 px-3">
                <div className="h-px bg-secondary-200 dark:bg-secondary-800" />
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">
                {es.navigation.administration}
              </div>
            )}
            {settingsNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100',
                    sidebarCollapsed && 'justify-center'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User section */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 p-4">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {user?.email}
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  {es.common.signOut}
                </button>
              </div>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600 dark:hover:text-error-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
