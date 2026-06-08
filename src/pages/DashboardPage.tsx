import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import {
  Package,
  Truck,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';

interface DashboardStats {
  totalAssets: number;
  activeOrders: number;
  fleetVehicles: number;
  totalRevenue: number;
  monthlyGrowth: number;
  customerCount: number;
  pendingInvoices: number;
  completedToday: number;
}

export function DashboardPage() {
  const { user, organization } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    activeOrders: 0,
    fleetVehicles: 0,
    totalRevenue: 0,
    monthlyGrowth: 12.5,
    customerCount: 0,
    pendingInvoices: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);

  useEffect(() => {
    if (organization) {
      fetchDashboardData();
    }
  }, [organization]);

  const fetchDashboardData = async () => {
    try {
      // Fetch invoices for pending count
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organization?.id)
        .eq('payment_status', 'pending');

      // Simulating more data - in production this would come from actual tables
      const pendingInvoices = invoices?.length || 0;

      setStats(prev => ({
        ...prev,
        pendingInvoices,
        totalAssets: 248,
        activeOrders: 12,
        fleetVehicles: 18,
        totalRevenue: 125400,
        customerCount: 47,
        completedToday: 8,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
    onClick
  }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: number;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={cn(
        'card p-6 rounded-2xl transition-all duration-300 hover:shadow-lg',
        onClick && 'cursor-pointer hover:scale-105'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-secondary-900 dark:text-white">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error-600" />
              )}
              <span className={cn('text-sm font-medium', trend > 0 ? 'text-success-600' : 'text-error-600')}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Bienvenido, {user?.displayName || 'Usuario'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition">
            <Zap className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          </button>
          <button className="px-4 py-3 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Hoy
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          label="Activos Totales"
          value={stats.totalAssets}
          trend={3.2}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Órdenes Activas"
          value={stats.activeOrders}
          trend={8.5}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Truck}
          label="Vehículos en Flota"
          value={stats.fleetVehicles}
          trend={0}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={DollarSign}
          label={showRevenue ? 'Ingresos' : '••••••'}
          value={showRevenue ? `$${stats.totalRevenue.toLocaleString()}` : '••••••'}
          trend={stats.monthlyGrowth}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          onClick={() => setShowRevenue(!showRevenue)}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Completadas Hoy</h3>
            <CheckCircle2 className="w-5 h-5 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {stats.completedToday}
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            De {stats.activeOrders} órdenes activas
          </p>
          <div className="mt-4 w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
            <div
              className="bg-success-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.completedToday / stats.activeOrders) * 100}%` }}
            />
          </div>
        </div>

        <div className="card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Facturas Pendientes</h3>
            <AlertTriangle className="w-5 h-5 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {stats.pendingInvoices}
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Requieren atención
          </p>
          <button className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
            Ver todas →
          </button>
        </div>

        <div className="card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Clientes Activos</h3>
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {stats.customerCount}
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Trabajando actualmente
          </p>
          <div className="mt-4 flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white dark:border-secondary-900 flex items-center justify-center text-white text-xs font-semibold"
              >
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">
            Actividad Reciente
          </h2>
          <div className="space-y-4">
            {[
              {
                type: 'order',
                icon: ClipboardList,
                title: 'Nueva orden completada',
                description: 'Orden #ORD-2024-001',
                time: 'Hace 2 horas',
                color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              },
              {
                type: 'invoice',
                icon: DollarSign,
                title: 'Factura pagada',
                description: 'INV-2024-042 - $1,250.00',
                time: 'Hace 4 horas',
                color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
              },
              {
                type: 'asset',
                icon: Package,
                title: 'Activo registrado',
                description: 'Ambulancia - Unidad #07',
                time: 'Hace 6 horas',
                color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
              },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-secondary-200 dark:border-secondary-800 last:border-0 last:pb-0">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', activity.color)}>
                  <activity.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-900 dark:text-white text-sm">
                    {activity.title}
                  </p>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {activity.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">
            Acciones Rápidas
          </h2>
          <div className="space-y-3">
            <button className="w-full p-4 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition font-medium flex items-center gap-2 justify-center">
              <Plus className="w-4 h-4" />
              Nueva Orden
            </button>
            <button className="w-full p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition font-medium flex items-center gap-2 justify-center">
              <DollarSign className="w-4 h-4" />
              Crear Factura
            </button>
            <button className="w-full p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition font-medium flex items-center gap-2 justify-center">
              <Package className="w-4 h-4" />
              Registrar Activo
            </button>
            <button className="w-full p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition font-medium flex items-center gap-2 justify-center">
              <Activity className="w-4 h-4" />
              Ver Reportes
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ingresos Este Mes
          </h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 45, 78, 92, 75, 88, 95].map((value, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="w-6 rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500 transition" style={{ height: `${(value / 100) * 240}px` }} />
                <span className="text-xs text-secondary-600 dark:text-secondary-400">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribución por Tipo
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Órdenes Completadas', value: 65, color: 'bg-success-600' },
              { label: 'Órdenes Pendientes', value: 20, color: 'bg-warning-600' },
              { label: 'Órdenes Canceladas', value: 15, color: 'bg-error-600' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-300', item.color)}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper imports
import { Plus } from 'lucide-react';
