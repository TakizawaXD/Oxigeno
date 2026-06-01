import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatNumber, formatPercent, formatRelativeTime, getStatusColor, getPriorityColor } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Package,
  Truck,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Users,
  Building2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  BarChart3,
  PieChart,
  Zap,
  Fuel,
  Thermometer,
  Gauge,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Stats {
  totalAssets: number;
  availableAssets: number;
  inTransitAssets: number;
  assetsNeedingMaintenance: number;
  activeOrders: number;
  pendingOrders: number;
  completedToday: number;
  emergencyOrders: number;
  activeRoutes: number;
  driversOnDuty: number;
  totalFacilities: number;
  totalCustomers: number;
  incidents: number;
  criticalIncidents: number;
  inventoryLow: number;
  revenueToday: number;
  revenueMonth: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: string;
}

interface LiveRoute {
  id: string;
  route_number: string;
  driver_name: string;
  status: string;
  completed_stops: number;
  total_stops: number;
  eta: string;
}

export function DashboardPage() {
  const { organization } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [liveRoutes, setLiveRoutes] = useState<LiveRoute[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!organization) return;

    try {
      // Fetch stats from Firebase
      const [assetsSnapshot, ordersSnapshot, facilitiesSnapshot, customersSnapshot, driversSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'assets'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'orders'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'facilities'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'customers'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'drivers'), where('organization_id', '==', organization.id))),
      ]);

      const assets = assetsSnapshot.docs.map(doc => doc.data());
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      const facilities = facilitiesSnapshot.docs;
      const customers = customersSnapshot.docs;
      const drivers = driversSnapshot.docs.map(doc => doc.data());

      setStats({
        totalAssets: assets.length,
        availableAssets: assets.filter((a: any) => a.status === 'available').length,
        inTransitAssets: assets.filter((a: any) => a.status === 'in_transit').length,
        assetsNeedingMaintenance: assets.filter((a: any) => a.status === 'maintenance').length,
        activeOrders: orders.filter((o: any) => o.status === 'active' || o.status === 'in_transit').length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        completedToday: orders.filter((o: any) => o.status === 'delivered').length,
        emergencyOrders: orders.filter((o: any) => o.is_emergency).length,
        activeRoutes: 0,
        driversOnDuty: drivers.filter((d: any) => d.is_available).length,
        totalFacilities: facilities.length,
        totalCustomers: customers.length,
        incidents: 0,
        criticalIncidents: 0,
        inventoryLow: 0,
        revenueToday: 47832,
        revenueMonth: 1247392,
      });

      // Simulated recent activity
      setRecentActivity([
        { id: '1', type: 'asset', message: 'Oxygen cylinder #2847 filled and ready', timestamp: '2 minutes ago', severity: 'success' },
        { id: '2', type: 'order', message: 'Emergency order #12847 created for Hospital Alpha', timestamp: '5 minutes ago', severity: 'warning' },
        { id: '3', type: 'route', message: 'Route #124 completed - 12/12 deliveries successful', timestamp: '12 minutes ago', severity: 'success' },
        { id: '4', type: 'incident', message: 'Low inventory alert at Downtown Warehouse', timestamp: '18 minutes ago', severity: 'warning' },
        { id: '5', type: 'asset', message: 'Asset #1947 marked for maintenance', timestamp: '25 minutes ago', severity: 'info' },
        { id: '6', type: 'order', message: 'Order #12846 delivered to Clinic Beta', timestamp: '32 minutes ago', severity: 'success' },
        { id: '7', type: 'telemetry', message: 'Telemetry received from 847 assets', timestamp: '1 hour ago', severity: 'info' },
        { id: '8', type: 'route', message: 'Driver assigned to Route #129', timestamp: '1 hour ago', severity: 'info' },
      ]);

      // Simulated live routes
      setLiveRoutes([
        { id: '1', route_number: 'R-2024-127', driver_name: 'Michael Chen', status: 'in_progress', completed_stops: 8, total_stops: 12, eta: '14:45' },
        { id: '2', route_number: 'R-2024-128', driver_name: 'Sarah Williams', status: 'in_progress', completed_stops: 3, total_stops: 8, eta: '16:20' },
        { id: '3', route_number: 'R-2024-129', driver_name: 'James Rodriguez', status: 'in_progress', completed_stops: 10, total_stops: 10, eta: '13:55' },
        { id: '4', route_number: 'R-2024-130', driver_name: 'Emily Johnson', status: 'en_route', completed_stops: 0, total_stops: 6, eta: '17:30' },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [organization]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner-lg text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Last updated: {formatRelativeTime(new Date().toISOString())}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Assets',
            value: stats?.totalAssets || 0,
            change: '+12 this week',
            changeType: 'positive',
            icon: Package,
            color: 'primary',
          },
          {
            label: 'Active Orders',
            value: stats?.activeOrders || 0,
            change: `${stats?.emergencyOrders || 0} emergency`,
            changeType: 'warning',
            icon: ClipboardList,
            color: 'accent',
          },
          {
            label: 'In Transit',
            value: stats?.inTransitAssets || 0,
            change: `${stats?.activeRoutes || 0} routes`,
            changeType: 'neutral',
            icon: Truck,
            color: 'warning',
          },
          {
            label: 'Today\'s Revenue',
            value: formatCurrency(stats?.revenueToday || 0),
            change: '+18% vs yesterday',
            changeType: 'positive',
            icon: TrendingUp,
            color: 'success',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card group hover:shadow-medium transition-shadow">
            <div className="flex items-start justify-between">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                stat.color === 'primary' && 'bg-primary-100 dark:bg-primary-900/30',
                stat.color === 'accent' && 'bg-accent-100 dark:bg-accent-900/30',
                stat.color === 'warning' && 'bg-warning-100 dark:bg-warning-900/30',
                stat.color === 'success' && 'bg-success-100 dark:bg-success-900/30',
              )}>
                <stat.icon className={cn(
                  'w-6 h-6',
                  stat.color === 'primary' && 'text-primary-600 dark:text-primary-400',
                  stat.color === 'accent' && 'text-accent-600 dark:text-accent-400',
                  stat.color === 'warning' && 'text-warning-600 dark:text-warning-400',
                  stat.color === 'success' && 'text-success-600 dark:text-success-400',
                )} />
              </div>
              <ArrowUpRight className={cn(
                'w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-secondary-400',
              )} />
            </div>
            <div className="mt-4">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className={cn(
                'stat-change',
                stat.changeType === 'positive' && 'stat-change-positive',
                stat.changeType === 'negative' && 'stat-change-negative',
                stat.changeType === 'warning' && 'text-warning-600 dark:text-warning-400',
              )}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Facilities', value: stats?.totalFacilities || 0, icon: Building2 },
          { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users },
          { label: 'Drivers On Duty', value: stats?.driversOnDuty || 0, icon: Users },
          { label: 'Needs Maintenance', value: stats?.assetsNeedingMaintenance || 0, icon: AlertTriangle },
          { label: 'Low Inventory', value: stats?.inventoryLow || 0, icon: Package },
          { label: 'Incidents', value: stats?.incidents || 0, icon: AlertCircle },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto text-secondary-400" />
            <div className="mt-2 text-xl font-bold text-secondary-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operations - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Routes */}
          <div className="card">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Live Routes</h3>
                  <span className="badge-primary">{liveRoutes.length} active</span>
                </div>
                <Link to="/routes" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {liveRoutes.map((route) => (
                <div key={route.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        route.status === 'in_progress' ? 'bg-success-500' : 'bg-warning-500'
                      )} />
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-white">{route.route_number}</div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">{route.driver_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-secondary-900 dark:text-white">
                        {route.completed_stops}/{route.total_stops} stops
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">
                        ETA {route.eta}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${(route.completed_stops / route.total_stops) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Health Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Health Score',
                value: '94.2%',
                trend: '+2.1%',
                icon: Activity,
                color: 'success',
              },
              {
                label: 'Utilization Rate',
                value: '78.5%',
                trend: '+5.3%',
                icon: Gauge,
                color: 'primary',
              },
              {
                label: 'Compliance Rate',
                value: '98.7%',
                trend: '+0.2%',
                icon: CheckCircle2,
                color: 'accent',
              },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <div className="flex items-center justify-between">
                  <item.icon className={cn(
                    'w-5 h-5',
                    item.color === 'success' && 'text-success-500',
                    item.color === 'primary' && 'text-primary-500',
                    item.color === 'accent' && 'text-accent-500',
                  )} />
                  <span className="text-xs text-success-600 dark:text-success-400">{item.trend}</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">{item.value}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">AI Insights</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="text-sm font-medium">Demand Forecast</div>
                  <div className="text-xs opacity-80 mt-1">
                    Oxygen demand expected to increase 15% next week for Hospital Alpha
                  </div>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="text-sm font-medium">Optimization Suggestion</div>
                  <div className="text-xs opacity-80 mt-1">
                    Relocate 50 cylinders from Warehouse A to Warehouse B to reduce delivery time
                  </div>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="text-sm font-medium">Preventive Action</div>
                  <div className="text-xs opacity-80 mt-1">
                    Schedule maintenance for 12 assets before week end to avoid failures
                  </div>
                </div>
              </div>
              <Link to="/ai" className="block mt-4 text-sm hover:underline">
                View all recommendations
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                <h3 className="font-semibold text-secondary-900 dark:text-white">Recent Activity</h3>
              </div>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800 max-h-[400px] overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-3 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
                      activity.severity === 'success' && 'bg-success-500',
                      activity.severity === 'warning' && 'bg-warning-500',
                      activity.severity === 'info' && 'bg-primary-500',
                      activity.severity === 'error' && 'bg-error-500',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-secondary-900 dark:text-white truncate">{activity.message}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">{activity.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/orders/new" className="w-full btn-primary justify-start">
                <ClipboardList className="w-4 h-4" />
                New Order
              </Link>
              <Link to="/assets/new" className="w-full btn-secondary justify-start">
                <Package className="w-4 h-4" />
                Register Asset
              </Link>
              <Link to="/incidents/new" className="w-full btn-secondary justify-start">
                <AlertTriangle className="w-4 h-4" />
                Report Incident
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Status Bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900 dark:text-white">Inventory Status by Type</h3>
          <Link to="/inventory" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Manage inventory</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Oxygen Cylinders', available: 1823, total: 2400, fill: 76 },
            { name: 'Nitrogen Cylinders', available: 412, total: 500, fill: 82 },
            { name: 'Medical CO2', available: 89, total: 150, fill: 59 },
            { name: 'Concentrators', available: 124, total: 180, fill: 69 },
            { name: 'Ventilators', available: 47, total: 65, fill: 72 },
            { name: 'Other Equipment', available: 892, total: 1200, fill: 74 },
          ].map((item) => (
            <div key={item.name} className="text-center">
              <div className="text-sm text-secondary-900 dark:text-white font-medium truncate">{item.name}</div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                {item.available.toLocaleString()} / {item.total.toLocaleString()}
              </div>
              <div className="mt-2">
                <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.fill >= 70 ? 'bg-success-500' : item.fill >= 40 ? 'bg-warning-500' : 'bg-error-500'
                    )}
                    style={{ width: `${item.fill}%` }}
                  />
                </div>
              </div>
              <div className={cn(
                'text-xs mt-1 font-medium',
                item.fill >= 70 ? 'text-success-600 dark:text-success-400' : item.fill >= 40 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'
              )}>
                {item.fill}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
