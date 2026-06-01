import { useState, useEffect } from 'react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  DocumentData,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { getStatusColor, formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';
import { SkeletonStats, SkeletonTable } from '../components/ui/Skeleton';
import {
  Truck,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  Fuel,
  Gauge,
  Wrench,
  User,
  Navigation,
  X,
  Edit,
  Trash2,
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    name: '',
    make: '',
    vehicle_type: 'van', // van, light_truck, heavy_truck
    status: 'active', // active, in_use, maintenance, out_of_service
    license_plate: '',
    current_mileage: 10000,
    current_driver_id: '',
    current_facility_id: '',
  });

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
          where('organization_id', '==', organization.id)
        )),
        getDocs(query(
          collection(db, 'routes'),
          where('organization_id', '==', organization.id),
          where('status', 'in', ['planned', 'assigned', 'in_progress'])
        )),
      ]);

      const vehiclesData = vehiclesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Vehicle[];
      const driversData = driversSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Driver[];
      const routesData = routesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Route[];

      setVehicles(vehiclesData);
      setDrivers(driversData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_number: `V-${vehicles.length + 1}`,
      name: '',
      make: '',
      vehicle_type: 'van',
      status: 'active',
      license_plate: '',
      current_mileage: 15000,
      current_driver_id: '',
      current_facility_id: 'Almacén Central',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      name: vehicle.name || '',
      make: vehicle.make || '',
      vehicle_type: vehicle.vehicle_type || 'van',
      status: vehicle.status || 'active',
      license_plate: vehicle.license_plate || '',
      current_mileage: vehicle.current_mileage || 0,
      current_driver_id: vehicle.current_driver_id || '',
      current_facility_id: vehicle.current_facility_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este vehículo de la flota?')) return;
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      fetchData();
    } catch (e) {
      console.error('Error deleting vehicle:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    try {
      if (editingVehicle) {
        await updateDoc(doc(db, 'vehicles', editingVehicle.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...formData,
          organization_id: organization.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const getDriverName = (driverId: string) => {
    if (!driverId) return 'No asignado';
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'No asignado';
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
    active: vehicles.filter((v: any) => v.status === 'active' || v.status === 'in_use').length,
    maintenance: vehicles.filter((v: any) => v.status === 'maintenance').length,
    availableDrivers: drivers.filter((d: any) => d.status === 'active' || d.is_available).length,
    activeRoutes: routes.filter((r: any) => r.status === 'in_progress').length,
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
          { label: 'Total Vehículos', value: fleetStats.total, icon: Truck, color: 'primary' },
          { label: 'Activos', value: fleetStats.active, icon: CheckCircle2, color: 'success' },
          { label: 'En Taller', value: fleetStats.maintenance, icon: Wrench, color: 'warning' },
          { label: 'Cond. Activos', value: fleetStats.availableDrivers, icon: User, color: 'accent' },
          { label: 'Rutas Activas', value: fleetStats.activeRoutes, icon: Navigation, color: 'primary' },
          { label: 'Uso de Flota', value: '78%', icon: Gauge, color: 'success' },
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
            <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium truncate">{stat.label}</div>
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
                placeholder="Buscar por placa, número o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-auto min-w-[150px]"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="in_use">En uso</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="out_of_service">Fuera de servicio</option>
            </select>
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Añadir Vehículo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehículo</th>
                <th className="table-header-cell">Tipo</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Conductor</th>
                <th className="table-header-cell">Ubicación</th>
                <th className="table-header-cell">Kilometraje</th>
                <th className="table-header-cell">Combustible</th>
                <th className="table-header-cell text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-12">
                    <Truck className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">No se encontraron vehículos</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="table-row-hover">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          vehicle.status === 'active' ? 'bg-success-100 dark:bg-success-900/30' :
                          vehicle.status === 'in_use' ? 'bg-primary-100 dark:bg-primary-900/30' :
                          'bg-warning-100 dark:bg-warning-900/30'
                        )}>
                          <Truck className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-secondary-900 dark:text-white">{vehicle.vehicle_number}</div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">{vehicle.name || vehicle.make}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary capitalize">{vehicle.vehicle_type}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', `badge-${getStatusColor(vehicle.status)}`)}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400 font-medium">
                      {getDriverName(vehicle.current_driver_id || '')}
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400 font-medium">
                      <MapPin className="w-4 h-4 inline mr-1 text-secondary-400" />
                      {vehicle.current_facility_id || 'En Ruta'}
                    </td>
                    <td className="table-cell text-secondary-600 dark:text-secondary-400 font-medium">
                      {vehicle.current_mileage ? `${formatNumber(vehicle.current_mileage)} km` : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-secondary-400" />
                        <div className="w-16 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                          <div className="h-full bg-success-500 rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(vehicle)}
                          className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingVehicle ? 'Editar Vehículo' : 'Añadir Vehículo a la Flota'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Código de Vehículo</label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      className="input"
                      placeholder="Ej. V-04"
                    />
                  </div>
                  <div>
                    <label className="label">Matrícula / Placa</label>
                    <input
                      type="text"
                      required
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                      className="input"
                      placeholder="Ej. 1234-BBB"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Nombre / Marca de Vehículo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Ej. Ford Transit Van"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo de Vehículo</label>
                    <select
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      className="input"
                    >
                      <option value="van">Furgoneta (Van)</option>
                      <option value="light_truck">Camión Ligero (Light Truck)</option>
                      <option value="heavy_truck">Camión Pesado (Heavy Truck)</option>
                      <option value="trailer">Tráiler / Remolque (Trailer)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Activo</option>
                      <option value="in_use">En uso</option>
                      <option value="maintenance">En Taller / Mantenimiento</option>
                      <option value="out_of_service">Fuera de servicio</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Kilometraje (km)</label>
                    <input
                      type="number"
                      required
                      value={formData.current_mileage}
                      onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Ubicación Actual</label>
                    <input
                      type="text"
                      value={formData.current_facility_id}
                      onChange={(e) => setFormData({ ...formData, current_facility_id: e.target.value })}
                      className="input"
                      placeholder="Ej. Almacén Central"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Conductor Asignado</label>
                  <select
                    value={formData.current_driver_id}
                    onChange={(e) => setFormData({ ...formData, current_driver_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Ninguno / Sin Asignar</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>{drv.first_name} {drv.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Vehículo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
