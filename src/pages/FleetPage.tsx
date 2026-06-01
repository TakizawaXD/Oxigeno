import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, formatRelativeTime, getStatusColor, getPriorityColor, formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';
import { SkeletonStats, SkeletonTable } from '../components/ui/Skeleton';
import {
  Truck,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Fuel,
  Gauge,
  Wrench,
  User,
  Navigation,
  Activity,
  Phone,
  Mail,
  X,
  Eye,
  Edit,
  Calendar,
  Battery,
} from 'lucide-react';

interface Vehicle extends DocumentData {
  id: string;
  vehicle_number: string;
  name?: string;
  make?: string;
  vehicle_type: string;
  status: string;
  license_plate?: string;
  current_driver_id?: string;
  current_facility_id?: string;
  current_mileage?: number;
  created_at: any;
}

interface Driver extends DocumentData {
  id: string;
  first_name: string;
  last_name: string;
  is_available: boolean;
  status: string;
}

interface Route extends DocumentData {
  id: string;
  status: string;
}

export function FleetPage() {
  const { organization } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;

    try {
      const [vehiclesSnapshot, driversSnapshot, routesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'vehicles'),
          where('organization_id', '==', organization.id),
          orderBy('created_at', 'desc')
        )),
        getDocs(query(
          collection(db, 'drivers'),
          where('organization_id', '==', organization.id),
          where('status', '==', 'active')
        )),
        getDocs(query(
          collection(db, 'routes'),
          where('organization_id', '==', organization.id),
          where('status', 'in', ['planned', 'assigned', 'in_progress']),
          orderBy('scheduled_date', 'asc')
        )),
      ]);

      const vehiclesData = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[];
      const driversData = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Driver[];
      const routesData = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Route[];

      setVehicles(vehiclesData);
      setDrivers(driversData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = searchQuery === '' ||
      vehicle.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const fleetStats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active' || v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    availableDrivers: drivers.filter(d => d.is_available).length,
    activeRoutes: routes.filter(r => r.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <SkeletonStats />
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            </div>
          </div>
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Vehicles', value: fleetStats.total, icon: Truck, color: 'primary' },
          { label: 'Active', value: fleetStats.active, icon: CheckCircle2, color: 'success' },
          { label: 'Maintenance', value: fleetStats.maintenance, icon: Wrench, color: 'warning' },
          { label: 'Available Drivers', value: fleetStats.availableDrivers, icon: User, color: 'accent' },
          { label: 'Active Routes', value: fleetStats.activeRoutes, icon: Navigation, color: 'primary' },
          { label: 'Fleet Utilization', value: '78%', icon: Gauge, color: 'success' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <stat.icon className={cn(
              'w-5 h-5',
              stat.color === 'primary' && 'text-primary-500',
              stat.color === 'success' && 'text-success-500',
              stat.color === 'warning' && 'text-warning-500',
              stat.color === 'error' && 'text-error-500',
              stat.color === 'accent' && 'text-accent-500',
            )} />
            <div className="mt-2 text-xl font-bold text-secondary-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Vehicles Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Mileage</th>
                <th className="table-header-cell">Fuel</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-12">
                    <Truck className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">No vehicles found</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="table-row-hover">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          vehicle.status === 'active' ? 'bg-success-100 dark:bg-success-900/30' :
                          vehicle.status === 'in_use' ? 'bg-primary-100 dark:bg-primary-900/30' :
                          'bg-warning-100 dark:bg-warning-900/30'
                        )}>
                          <Truck className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900 dark:text-white">{vehicle.vehicle_number}</div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">{vehicle.name || vehicle.make}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-secondary capitalize">{vehicle.vehicle_type}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', `badge-${getStatusColor(vehicle.status)}`)}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400">
                      {vehicle.current_driver_id ?
                        drivers.find(d => d.id === vehicle.current_driver_id)?.first_name + ' ' + drivers.find(d => d.id === vehicle.current_driver_id)?.last_name :
                        'Unassigned'
                      }
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {vehicle.current_facility_id || 'On route'}
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400">
                      {vehicle.current_mileage ? `${formatNumber(vehicle.current_mileage)} km` : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-secondary-400" />
                        <div className="w-16 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                          <div className="h-full bg-success-500 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <button className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
