import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Package,
  Truck,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Users,
  Building2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Gauge,
  AlertCircle,
  CheckCircle2,
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
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic status trends
  const [assetsAddedThisWeek, setAssetsAddedThisWeek] = useState(0);
  const [revenueChangePct, setRevenueChangePct] = useState(0);
  const [avgHealthScore, setAvgHealthScore] = useState(100);
  const [avgUtilizationRate, setAvgUtilizationRate] = useState(0);
  const [avgComplianceRate, setAvgComplianceRate] = useState(100);

  const fetchDashboardData = async () => {
    if (!organization) return;

    try {
      // Fetch stats from Firebase
      const [
        assetsSnapshot,
        ordersSnapshot,
        facilitiesSnapshot,
        customersSnapshot,
        driversSnapshot,
        routesSnapshot,
        incidentsSnapshot,
        inventorySnapshot,
        recommendationsSnapshot,
        categoriesSnapshot,
      ] = await Promise.all([
        getDocs(query(collection(db, 'assets'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'orders'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'facilities'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'customers'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'drivers'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'routes'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'incidents'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'inventory'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'ai_recommendations'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'asset_categories'), where('organization_id', '==', organization.id))),
      ]);

      const assets = assetsSnapshot.docs.map((doc: any) => doc.data());
      const orders = ordersSnapshot.docs.map((doc: any) => doc.data());
      const facilities = facilitiesSnapshot.docs;
      const customers = customersSnapshot.docs;
      const drivers = driversSnapshot.docs.map((doc: any) => doc.data());
      const routes = routesSnapshot.docs.map((doc: any) => doc.data());
      const incidents = incidentsSnapshot.docs.map((doc: any) => doc.data());

      // Calculate Revenue Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ordersDeliveredToday = orders.filter((o: any) => {
        if (o.status !== 'delivered') return false;
        const dDate = o.updated_at ? (o.updated_at.toDate ? o.updated_at.toDate() : new Date(o.updated_at)) : new Date();
        return dDate >= today;
      });
      const revenueTodayVal = ordersDeliveredToday.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const ordersDeliveredYesterday = orders.filter((o: any) => {
        if (o.status !== 'delivered') return false;
        const dDate = o.updated_at ? (o.updated_at.toDate ? o.updated_at.toDate() : new Date(o.updated_at)) : new Date();
        return dDate >= yesterday && dDate < today;
      });
      const revenueYesterday = ordersDeliveredYesterday.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      let revChange = 0;
      if (revenueYesterday > 0) {
        revChange = Math.round(((revenueTodayVal - revenueYesterday) / revenueYesterday) * 100);
      }
      setRevenueChangePct(revChange);

      const totalRevenueMonth = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      // Assets added this week
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newAssetsCount = assets.filter((a: any) => {
        if (!a.created_at) return false;
        const d = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
        return d >= sevenDaysAgo;
      }).length;
      setAssetsAddedThisWeek(newAssetsCount);

      // Average Health Score, Utilization, Compliance
      const health = assets.length > 0
        ? Math.round(assets.reduce((sum: number, a: any) => sum + (a.health_score || 0), 0) / assets.length)
        : 100;
      const utilization = assets.length > 0
        ? Math.round(assets.reduce((sum: number, a: any) => sum + (a.utilization_rate || 0), 0) / assets.length)
        : 0;
      const completed = routes.filter((r: any) => r.status === 'completed').length;
      const compliance = routes.length > 0
        ? Math.round((completed / routes.length) * 100)
        : 100;

      setAvgHealthScore(health);
      setAvgUtilizationRate(utilization);
      setAvgComplianceRate(compliance);

      setStats({
        totalAssets: assets.length,
        availableAssets: assets.filter((a: any) => a.status === 'available').length,
        inTransitAssets: assets.filter((a: any) => a.status === 'in_transit').length,
        assetsNeedingMaintenance: assets.filter((a: any) => a.status === 'maintenance').length,
        activeOrders: orders.filter((o: any) => o.status === 'active' || o.status === 'in_transit').length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        completedToday: ordersDeliveredToday.length,
        emergencyOrders: orders.filter((o: any) => o.is_emergency).length,
        activeRoutes: routes.filter((r: any) => r.status === 'in_progress').length,
        driversOnDuty: drivers.filter((d: any) => d.is_available).length,
        totalFacilities: facilities.length,
        totalCustomers: customers.length,
        incidents: incidents.length,
        criticalIncidents: incidents.filter((i: any) => i.severity === 'critical' || i.severity === 'error').length,
        inventoryLow: assets.filter((a: any) => (a.current_fill_percentage || 0) < 50).length,
        revenueToday: revenueTodayVal,
        revenueMonth: totalRevenueMonth,
      });

      // Map dynamic recent activity from DB
      const activities: RecentActivity[] = [];

      incidents.forEach((inc: any, idx: number) => {
        activities.push({
          id: inc.id || `inc-${idx}`,
          type: 'incident',
          message: `Incidencia: ${inc.title} - ${inc.description}`,
          timestamp: inc.created_at ? formatRelativeTime(inc.created_at) : 'Reciente',
          severity: inc.severity === 'critical' ? 'error' : 'warning',
        });
      });

      orders.forEach((ord: any, idx: number) => {
        activities.push({
          id: ord.id || `ord-${idx}`,
          type: 'order',
          message: `Pedido ${ord.order_number} (${ord.status === 'delivered' ? 'Entregado' : ord.status === 'in_transit' ? 'En tránsito' : 'Creado'})`,
          timestamp: ord.created_at ? formatRelativeTime(ord.created_at) : 'Reciente',
          severity: ord.status === 'delivered' ? 'success' : ord.is_emergency ? 'warning' : 'info',
        });
      });

      setRecentActivity(activities.slice(0, 8));

      // Map live routes from DB
      const dbRoutes = routes.map((rt: any) => {
        const drv = drivers.find((d: any) => d.id === rt.driver_id);
        return {
          id: rt.id,
          route_number: rt.route_number || 'R-2024-xxx',
          driver_name: drv ? `${drv.first_name || ''} ${drv.last_name || drv.name || ''}`.trim() : 'Michael Chen',
          status: rt.status || 'in_progress',
          completed_stops: rt.completed_stops || 0,
          total_stops: rt.total_stops || 8,
          eta: rt.eta || '14:45',
        };
      });
      setLiveRoutes(dbRoutes);

      // Map AI recommendations or empty
      if (!recommendationsSnapshot.empty) {
        const dbRecs = recommendationsSnapshot.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || 'Insight',
            description: data.description || '',
            type: data.type || 'forecast',
          };
        });
        setAiRecommendations(dbRecs);
      } else {
        setAiRecommendations([]);
      }

      // Map inventory status
      if (!inventorySnapshot.empty) {
        const dbInventory = inventorySnapshot.docs.map((d: any) => {
          const data = d.data();
          const cat = categoriesSnapshot.docs.find((c: any) => c.id === data.asset_category_id)?.data();
          return {
            name: cat?.name || 'Tanques de Oxígeno',
            available: data.available_quantity || 0,
            total: data.total_quantity || 0,
            fill: data.total_quantity ? Math.round((data.available_quantity / data.total_quantity) * 100) : 0,
          };
        });
        setInventoryStatus(dbInventory);
      } else {
        setInventoryStatus([]);
      }

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
      <div className="space-y-6 p-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-5 w-5 bg-secondary-200 dark:bg-secondary-700 rounded-full animate-pulse" />
              <div className="h-7 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="h-6 w-40 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 font-medium">
            Última actualización: {formatRelativeTime(new Date().toISOString())}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Activos',
            value: stats?.totalAssets || 0,
            change: `+${assetsAddedThisWeek} esta semana`,
            changeType: 'positive',
            icon: Package,
            color: 'primary',
          },
          {
            label: 'Pedidos Activos',
            value: stats?.activeOrders || 0,
            change: `${stats?.emergencyOrders || 0} de emergencia`,
            changeType: 'warning',
            icon: ClipboardList,
            color: 'accent',
          },
          {
            label: 'En Tránsito',
            value: stats?.inTransitAssets || 0,
            change: `${stats?.activeRoutes || 0} rutas activas`,
            changeType: 'neutral',
            icon: Truck,
            color: 'warning',
          },
          {
            label: 'Ingresos de Hoy',
            value: formatCurrency(stats?.revenueToday || 0),
            change: `${revenueChangePct >= 0 ? '+' : ''}${revenueChangePct}% vs ayer`,
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
          { label: 'Instalaciones', value: stats?.totalFacilities || 0, icon: Building2 },
          { label: 'Clientes', value: stats?.totalCustomers || 0, icon: Users },
          { label: 'Cond. Activos', value: stats?.driversOnDuty || 0, icon: Users },
          { label: 'Requieren Mant.', value: stats?.assetsNeedingMaintenance || 0, icon: AlertTriangle },
          { label: 'Stock Bajo', value: stats?.inventoryLow || 0, icon: Package },
          { label: 'Incidencias', value: stats?.incidents || 0, icon: AlertCircle },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto text-secondary-400" />
            <div className="mt-2 text-xl font-bold text-secondary-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium truncate">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Routes */}
          <div className="card">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Rutas Activas</h3>
                  <span className="badge-primary">{liveRoutes.length} activas</span>
                </div>
                <Link to="/routes" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-semibold">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {liveRoutes.length === 0 ? (
                <div className="p-8 text-center text-secondary-500 dark:text-secondary-400">
                  <Truck className="w-12 h-12 mx-auto mb-2 text-secondary-300 dark:text-secondary-600" />
                  <p className="text-sm font-semibold">No hay rutas activas</p>
                  <p className="text-xs text-secondary-400 mt-1">Cree una ruta para ver su seguimiento en tiempo real.</p>
                </div>
              ) : (
                liveRoutes.map((route) => (
                  <div key={route.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          route.status === 'in_progress' ? 'bg-success-500' : 'bg-warning-500'
                        )} />
                        <div>
                          <div className="font-semibold text-secondary-900 dark:text-white">{route.route_number}</div>
                          <div className="text-sm text-secondary-500 dark:text-secondary-400">{route.driver_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-secondary-900 dark:text-white">
                          {route.completed_stops}/{route.total_stops} paradas
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
                ))
              )}
            </div>
          </div>

          {/* Asset Health Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Estado de Salud Promedio',
                value: `${avgHealthScore}%`,
                trend: avgHealthScore >= 90 ? 'Excelente' : 'Revisar',
                icon: Activity,
                color: 'success',
              },
              {
                label: 'Tasa de Utilización',
                value: `${avgUtilizationRate}%`,
                trend: avgUtilizationRate > 0 ? 'Activo' : 'Sin uso',
                icon: Gauge,
                color: 'primary',
              },
              {
                label: 'Tasa de Cumplimiento',
                value: `${avgComplianceRate}%`,
                trend: 'Operativo',
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
                  <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">{item.trend}</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">{item.value}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">{item.label}</div>
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
                <span className="font-semibold">Recomendaciones de IA</span>
              </div>
              <div className="space-y-3">
                {aiRecommendations.length === 0 ? (
                  <div className="p-4 bg-white/10 rounded-lg text-center">
                    <p className="text-xs opacity-90">No hay recomendaciones de IA disponibles. Añada activos y pedidos para procesar nuevos insights.</p>
                  </div>
                ) : (
                  aiRecommendations.map((rec, idx) => (
                    <div key={rec.id || idx} className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                      <div className="text-sm font-semibold">{rec.title}</div>
                      <div className="text-xs opacity-80 mt-1">{rec.description}</div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/ai" className="block mt-4 text-sm font-semibold hover:underline">
                Ver todas las recomendaciones
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                <h3 className="font-semibold text-secondary-900 dark:text-white">Actividad Reciente</h3>
              </div>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800 max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-secondary-500 dark:text-secondary-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-secondary-300 dark:text-secondary-600" />
                  <p className="text-sm font-semibold">No hay actividad reciente</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
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
                        <p className="text-sm text-secondary-900 dark:text-white truncate font-medium">{activity.message}</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">{activity.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Acciones Rápidas</h3>
            <div className="space-y-2">
              <Link to="/orders" className="w-full btn-primary justify-start">
                <ClipboardList className="w-4 h-4" />
                Gestionar Pedidos
              </Link>
              <Link to="/assets" className="w-full btn-secondary justify-start">
                <Package className="w-4 h-4" />
                Registrar Activos
              </Link>
              <Link to="/incidents" className="w-full btn-secondary justify-start">
                <AlertTriangle className="w-4 h-4" />
                Reportar Incidencia
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Status Bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900 dark:text-white">Estado de Inventario por Tipo</h3>
          <Link to="/inventory" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-semibold">Gestionar Inventario</Link>
        </div>
        {inventoryStatus.length === 0 ? (
          <div className="p-8 text-center text-secondary-500 dark:text-secondary-400 border border-dashed border-secondary-200 dark:border-secondary-800 rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-2 text-secondary-300 dark:text-secondary-600" />
            <p className="text-sm font-semibold">No hay inventario registrado</p>
            <p className="text-xs text-secondary-400 mt-1">Configure categorías y niveles de stock para ver el estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {inventoryStatus.map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-sm text-secondary-900 dark:text-white font-semibold truncate">{item.name}</div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 font-medium">
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
                  'text-xs mt-1 font-semibold',
                  item.fill >= 70 ? 'text-success-600 dark:text-success-400' : item.fill >= 40 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'
                )}>
                  {item.fill}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
