import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  User,
  LogOut,
  HelpCircle,
  X,
  Package,
  Truck,
  Warehouse,
  Building2,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

const searchSuggestions = [
  { type: 'Assets', query: 'Oxygen cylinders in maintenance', icon: Package },
  { type: 'Orders', query: 'Order #12345 delivery status', icon: ClipboardList },
  { type: 'Routes', query: 'Active routes near downtown', icon: Truck },
  { type: 'Facilities', query: 'Warehouse capacity utilization', icon: Warehouse },
  { type: 'Customers', query: 'Hospital Alpha contract renewal', icon: Building2 },
  { type: 'AI Insights', query: 'Predicted inventory shortages', icon: Sparkles },
];

const moduleTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Operations Dashboard', description: 'Real-time overview of all operations' },
  '/assets': { title: 'Asset Management', description: 'Track and manage all physical assets' },
  '/inventory': { title: 'Inventory Control', description: 'Monitor stock across all facilities' },
  '/orders': { title: 'Order Management', description: 'Process and track customer orders' },
  '/fleet': { title: 'Fleet Management', description: 'Manage vehicles and drivers' },
  '/routes': { title: 'Route Management', description: 'Optimize delivery routes' },
  '/customers': { title: 'Customer Relations', description: 'Manage customers and contracts' },
  '/incidents': { title: 'Incident Management', description: 'Track and resolve issues' },
  '/ai': { title: 'AI Operations Center', description: 'AI-powered insights and automation' },
  '/workflows': { title: 'Workflow Engine', description: 'Automate business processes' },
  '/facilities': { title: 'Facility Management', description: 'Configure locations and zones' },
  '/documents': { title: 'Document Center', description: 'Manage files and certificates' },
  '/settings': { title: 'Settings', description: 'Configure system preferences' },
};

export function Header() {
  const location = useLocation();
  const { user, organization, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarOpen, darkMode, setDarkMode } = useUIStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentModule = moduleTitles[location.pathname] || { title: 'HealthLogix OS', description: '' };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'New emergency order', message: 'Order #12847 requires immediate delivery', time: '2m ago', read: false },
    { id: 2, title: 'Maintenance due', message: 'Oxygen cylinder #2847 needs inspection', time: '1h ago', read: false },
    { id: 3, title: 'Route completed', message: 'Route #124 delivered all orders successfully', time: '3h ago', read: true },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 h-16 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800 z-40 transition-all duration-300" style={{ left: sidebarCollapsed ? '5rem' : undefined }}>
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Module title */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-secondary-900 dark:text-white">{currentModule.title}</h1>
            {currentModule.description && (
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{currentModule.description}</p>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div ref={searchRef} className="flex-1 max-w-xl relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search assets, orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary-100 dark:bg-secondary-800 border-0 rounded-xl text-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-secondary-400 dark:text-secondary-500 bg-white dark:bg-secondary-900 rounded border border-secondary-200 dark:border-secondary-700">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Search dropdown */}
          {showSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-large overflow-hidden animate-scale-in">
              <div className="p-2">
                {searchQuery ? (
                  <div className="p-3 text-center text-secondary-500 dark:text-secondary-400 text-sm">
                    Press Enter to search for "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase">Quick Suggestions</div>
                    {searchSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0">
                          <suggestion.icon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-secondary-900 dark:text-white truncate">{suggestion.query}</div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">{suggestion.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-large overflow-hidden animate-scale-in">
                <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-secondary-900 dark:text-white">Notifications</h3>
                    <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Mark all read</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 border-b border-secondary-100 dark:border-secondary-800 last:border-0 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors cursor-pointer',
                        !notif.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          !notif.read ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-secondary-900 dark:text-white">{notif.title}</div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{notif.message}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">{notif.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-secondary-200 dark:border-secondary-800">
                  <button className="w-full btn-ghost text-sm py-2">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-secondary-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-large overflow-hidden animate-scale-in">
                <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
                  <div className="text-sm font-medium text-secondary-900 dark:text-white truncate">{user?.email}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{organization?.name}</div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left transition-colors">
                    <User className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Your profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left transition-colors">
                    <Settings className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left transition-colors">
                    <HelpCircle className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Help & support</span>
                  </button>
                </div>
                <div className="p-2 border-t border-secondary-200 dark:border-secondary-800">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-error-500" />
                    <span className="text-sm text-error-600 dark:text-error-400">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
