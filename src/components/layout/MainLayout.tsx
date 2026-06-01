import { useEffect, useRef } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../lib/translations';
import { useTerminology } from '../../lib/terminology';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Truck,
  Settings,
  Warehouse,
  Map,
  Users,
  AlertTriangle,
  Brain,
  GitBranch,
} from 'lucide-react';

export function MainLayout() {
  const { user, isInitialized } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const { t } = useTranslation();
  const { t: term } = useTerminology();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector('.mobile-nav-active');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [location.pathname]);

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

  const mobileNavItems = [
    { name: t.navigation.dashboard, href: '/', icon: LayoutDashboard },
    { name: term.assets, href: '/assets', icon: Package },
    { name: 'Inventario', href: '/inventory', icon: Warehouse },
    { name: t.navigation.orders, href: '/orders', icon: ClipboardList },
    { name: t.navigation.fleet, href: '/fleet', icon: Truck },
    { name: 'Rutas', href: '/routes', icon: Map },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Incidencias', href: '/incidents', icon: AlertTriangle },
    { name: 'Centro IA', href: '/ai', icon: Brain },
    { name: 'Flujos', href: '/workflows', icon: GitBranch },
    { name: t.navigation.settings, href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out pl-0',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="pt-20 pb-28 px-4 sm:px-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Roulette/Carousel Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-lg border-t border-secondary-200 dark:border-secondary-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] lg:hidden h-20 pb-safe flex items-center">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-secondary-900 to-transparent pointer-events-none z-10" />
        
        {/* Horizontally scrollable roulette list */}
        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex gap-2 px-6 overflow-x-auto w-full items-center h-full snap-x snap-mandatory scroll-smooth"
        >
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-shrink-0 snap-center min-w-[76px] h-16 py-1 text-3xs transition-all duration-300 gap-1 rounded-xl relative',
                  isActive
                    ? 'mobile-nav-active text-primary-600 dark:text-primary-400 font-bold scale-110'
                    : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm',
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-950/80 scale-105 border border-primary-200 dark:border-primary-800 shadow-md ring-2 ring-primary-500/20'
                      : 'bg-secondary-50 dark:bg-secondary-800/60 border border-transparent'
                  )}
                >
                  <item.icon className={cn('w-4 h-4 transition-transform duration-300', isActive && 'rotate-[360deg]')} />
                </div>
                <span className="truncate max-w-[74px] text-2xs">{item.name}</span>
                
                {/* Roulette Pointer Line */}
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-secondary-900 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
