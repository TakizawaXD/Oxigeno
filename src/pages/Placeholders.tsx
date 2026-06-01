import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { SkeletonList, SkeletonCard } from '../components/ui/Skeleton';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertTriangle,
  Warehouse,
  Truck,
  Workflow,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Check,
  Download,
  AlertCircle,
  Play
} from 'lucide-react';

// ==========================================
// 1. CUSTOMERS PAGE
// ==========================================
export function CustomersPage() {
  const { organization } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'hospital',
    primary_email: '',
    primary_phone: '',
    address: '',
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'customers'),
        where('organization_id', '==', organization.id),
        orderBy('created_at', 'desc')
      ));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      type: 'hospital',
      primary_email: '',
      primary_phone: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      type: customer.type || 'hospital',
      primary_email: customer.primary_email || '',
      primary_phone: customer.primary_phone || '',
      address: customer.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'customers'), {
          ...formData,
          organization_id: organization.id,
          is_active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.primary_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.primary_phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonList items={6} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" />Agregar Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">No se encontraron clientes</p>
            <p className="text-sm text-secondary-400">Agregue un cliente para comenzar</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="card p-5 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">{customer.name}</h3>
                    <span className={`badge ${
                      customer.type === 'hospital' ? 'badge-primary' :
                      customer.type === 'clinic' ? 'badge-warning' :
                      customer.type === 'pharmacy' ? 'badge-success' : 'badge-secondary'
                    } capitalize`}>
                      {customer.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(customer)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {customer.primary_email && (
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  <Mail className="w-4 h-4 text-secondary-400" />
                  {customer.primary_email}
                </div>
              )}
              {customer.primary_phone && (
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  <Phone className="w-4 h-4 text-secondary-400" />
                  {customer.primary_phone}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  <MapPin className="w-4 h-4 text-secondary-400" />
                  {customer.address}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Agregar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingCustomer ? 'Editar Cliente' : 'Agregar Cliente'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre del Cliente</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Ej. Hospital Alfa"
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clínica</option>
                    <option value="pharmacy">Farmacia</option>
                    <option value="other">Otro / Particular</option>
                  </select>
                </div>
                <div>
                  <label className="label">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.primary_email}
                    onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                    className="input"
                    placeholder="Ej. admin@hospital.com"
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="text"
                    value={formData.primary_phone}
                    onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                    className="input"
                    placeholder="Ej. +34 912 345 678"
                  />
                </div>
                <div>
                  <label className="label">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="Ej. Av. de la Salud 123"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar
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

// ==========================================
// 2. INVENTORY PAGE
// ==========================================
export function InventoryPage() {
  const { organization } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    facility_id: '',
    asset_category_id: '',
    mode: 'add', // add, subtract, set
    quantity: 10,
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      // 1. Fetch dropdown relationships
      const facSnapshot = await getDocs(query(collection(db, 'facilities'), where('organization_id', '==', organization.id)));
      const facs = facSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setFacilities(facs);
      
      const catSnapshot = await getDocs(query(collection(db, 'asset_categories'), where('organization_id', '==', organization.id)));
      const cats = catSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);

      // 2. Fetch inventory list
      const snapshot = await getDocs(query(
        collection(db, 'inventory'),
        where('organization_id', '==', organization.id)
      ));
      
      const data = snapshot.docs.map((doc: any) => {
        const item = doc.data();
        const facility = facs.find((f: any) => f.id === item.facility_id);
        const category = cats.find((c: any) => c.id === item.asset_category_id);
        return {
          id: doc.id,
          ...item,
          facility,
          category,
        };
      });
      setInventory(data);

      // Initialize default form selections
      if (facs.length > 0 && cats.length > 0) {
        setFormData(prev => ({
          ...prev,
          facility_id: facs[0].id,
          asset_category_id: cats[0].id,
        }));
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = () => {
    setIsModalOpen(true);
  };

  const handleAdjustInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    try {
      // Check if entry already exists
      const existing = inventory.find(
        (item) => item.facility_id === formData.facility_id && item.asset_category_id === formData.asset_category_id
      );

      const qtyChange = Number(formData.quantity);

      if (existing) {
        let newTotal = existing.total_quantity;
        let newAvailable = existing.available_quantity;

        if (formData.mode === 'add') {
          newTotal += qtyChange;
          newAvailable += qtyChange;
        } else if (formData.mode === 'subtract') {
          newTotal = Math.max(0, newTotal - qtyChange);
          newAvailable = Math.max(0, newAvailable - qtyChange);
        } else {
          newTotal = qtyChange;
          newAvailable = qtyChange;
        }

        await updateDoc(doc(db, 'inventory', existing.id), {
          total_quantity: newTotal,
          available_quantity: newAvailable,
          updated_at: serverTimestamp(),
        });
      } else {
        const finalQty = formData.mode === 'subtract' ? 0 : qtyChange;
        await addDoc(collection(db, 'inventory'), {
          organization_id: organization.id,
          facility_id: formData.facility_id,
          asset_category_id: formData.asset_category_id,
          total_quantity: finalQty,
          available_quantity: finalQty,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }
  };

// Handle Excel file upload for bulk inventory adjustments
const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    console.log('Excel rows', rows);
    for (const row of rows) {
      const facility_id = row.facility_id?.toString() || '';
      const asset_category_id = row.asset_category_id?.toString() || '';
      const quantity = Number(row.quantity) || 0;
      const mode = (row.mode?.toString() || 'add') as 'add' | 'subtract' | 'set';
      const existing = inventory.find(
        (item) => item.facility_id === facility_id && item.asset_category_id === asset_category_id
      );
      let newTotal = existing?.total_quantity || 0;
      let newAvailable = existing?.available_quantity || 0;
      if (existing) {
        if (mode === 'add') {
          newTotal += quantity;
          newAvailable += quantity;
        } else if (mode === 'subtract') {
          newTotal = Math.max(0, newTotal - quantity);
          newAvailable = Math.max(0, newAvailable - quantity);
        } else {
          newTotal = quantity;
          newAvailable = quantity;
        }
        await updateDoc(doc(db, 'inventory', existing.id), {
          total_quantity: newTotal,
          available_quantity: newAvailable,
          updated_at: serverTimestamp(),
        });
      } else {
        const finalQty = mode === 'subtract' ? 0 : quantity;
        await addDoc(collection(db, 'inventory'), {
          organization_id: organization.id,
          facility_id,
          asset_category_id,
          total_quantity: finalQty,
          available_quantity: finalQty,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    }
    fetchData();
  } catch (error) {
    console.error('Error processing Excel file', error);
  }
};

  const filteredInventory = inventory.filter(item =>
    item.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.facility?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar por almacén o categoría..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Excel upload button */}
          <label className="btn-primary flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelUpload}
            />
            <Plus className="w-4 h-4" />Subir Excel
          </label>
          {/* Existing manual adjust button */}
          <button onClick={handleOpenAdjust} className="btn-primary">
            <Plus className="w-4 h-4" />Ajustar Inventario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Warehouse className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">No hay datos de inventario</p>
            <p className="text-sm text-secondary-400">Los datos aparecerán cuando registre activos o realice un ajuste.</p>
          </div>
        ) : (
          filteredInventory.map((item: any) => (
            <div key={item.id} className="card p-4 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs badge badge-primary">
                  {item.category?.unit_of_measure || 'L'}
                </span>
                <Warehouse className="w-5 h-5 text-secondary-400" />
              </div>
              <div className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                {item.category?.name || 'Categoría Desconocida'}
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-4 truncate">
                {item.facility?.name || 'Almacén Desconocido'}
              </div>
              <div className="flex items-end justify-between border-t border-secondary-100 dark:border-secondary-800 pt-3">
                <div>
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {item.total_quantity}
                  </div>
                  <div className="text-[10px] text-secondary-500 font-medium uppercase">Total</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {item.available_quantity}
                  </div>
                  <div className="text-[10px] text-secondary-500 font-medium uppercase">Disponible</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Ajustar Inventario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Ajustar Niveles de Inventario</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdjustInventorySubmit} className="space-y-4">
                <div>
                  <label className="label">Almacén / Instalación</label>
                  <select
                    value={formData.facility_id}
                    onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                    className="input"
                    required
                  >
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Categoría de Activo</label>
                  <select
                    value={formData.asset_category_id}
                    onChange={(e) => setFormData({ ...formData, asset_category_id: e.target.value })}
                    className="input"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.unit_of_measure})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tipo de Ajuste</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'add', label: 'Agregar' },
                      { value: 'subtract', label: 'Retirar' },
                      { value: 'set', label: 'Establecer' }
                    ].map((modeOpt) => (
                      <button
                        key={modeOpt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: modeOpt.value })}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                          formData.mode === modeOpt.value
                            ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                            : 'bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300'
                        }`}
                      >
                        {modeOpt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Realizar Ajuste
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

// ==========================================
// 3. ROUTES PAGE
// ==========================================
export function RoutesPage() {
  const { organization } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);

  const [formData, setFormData] = useState({
    route_number: '',
    driver_id: '',
    vehicle_id: '',
    status: 'planned', // planned, in_progress, completed
    completed_stops: 0,
    total_stops: 5,
    eta: '18:00',
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      // 1. Fetch relations
      const drvSnapshot = await getDocs(query(collection(db, 'drivers'), where('organization_id', '==', organization.id)));
      const drvs = drvSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setDrivers(drvs);

      const vhcSnapshot = await getDocs(query(collection(db, 'vehicles'), where('organization_id', '==', organization.id)));
      const vhcs = vhcSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setVehicles(vhcs);

      // 2. Fetch routes
      const snapshot = await getDocs(query(
        collection(db, 'routes'),
        where('organization_id', '==', organization.id),
        orderBy('created_at', 'desc'),
        limit(50)
      ));
      
      const data = snapshot.docs.map((doc: any) => {
        const route = doc.data();
        const driver = drvs.find((d: any) => d.id === route.driver_id);
        const vehicle = vhcs.find((v: any) => v.id === route.vehicle_id);
        return {
          id: doc.id,
          ...route,
          driver,
          vehicle,
        };
      });
      setRoutes(data);

      if (drvs.length > 0 && vhcs.length > 0) {
        setFormData(prev => ({
          ...prev,
          driver_id: drvs[0].id,
          vehicle_id: vhcs[0].id,
          route_number: `R-2026-${Math.floor(Math.random() * 900 + 100)}`,
        }));
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      route_number: `R-2026-${Math.floor(Math.random() * 900 + 100)}`,
      driver_id: drivers[0]?.id || '',
      vehicle_id: vehicles[0]?.id || '',
      status: 'planned',
      completed_stops: 0,
      total_stops: 5,
      eta: '18:00',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (route: any) => {
    setEditingRoute(route);
    setFormData({
      route_number: route.route_number || '',
      driver_id: route.driver_id || '',
      vehicle_id: route.vehicle_id || '',
      status: route.status || 'planned',
      completed_stops: route.completed_stops || 0,
      total_stops: route.total_stops || 5,
      eta: route.eta || '18:00',
    });
    setIsModalOpen(true);
  };

  const handleQuickStatus = async (route: any, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'routes', route.id), {
        status: newStatus,
        completed_stops: newStatus === 'completed' ? route.total_stops : route.completed_stops,
        updated_at: serverTimestamp(),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desea eliminar esta ruta?')) return;
    try {
      await deleteDoc(doc(db, 'routes', id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      if (editingRoute) {
        await updateDoc(doc(db, 'routes', editingRoute.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'routes'), {
          ...formData,
          organization_id: organization.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Planificadas', value: routes.filter(r => r.status === 'planned').length, color: 'text-secondary-500' },
          { label: 'En Progreso', value: routes.filter(r => r.status === 'in_progress').length, color: 'text-warning-600' },
          { label: 'Completadas', value: routes.filter(r => r.status === 'completed').length, color: 'text-success-600' },
          { label: 'Total Rutas', value: routes.length, color: 'text-primary-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-800 flex justify-between items-center">
          <h3 className="font-semibold text-secondary-900 dark:text-white">Panel de Control de Rutas</h3>
          <button onClick={handleOpenAdd} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />Nueva Ruta
          </button>
        </div>

        {routes.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500">No hay rutas planificadas</p>
            <button onClick={handleOpenAdd} className="btn-secondary mt-3">Crear primera ruta</button>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {routes.map((route) => (
              <div key={route.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400 flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-secondary-900 dark:text-white">{route.route_number}</span>
                      <span className={`badge ${
                        route.status === 'completed' ? 'badge-success' :
                        route.status === 'in_progress' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {route.status === 'completed' ? 'Completada' :
                         route.status === 'in_progress' ? 'En Progreso' : 'Planificada'}
                      </span>
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      Conductor: <span className="font-medium text-secondary-800 dark:text-secondary-200">{route.driver?.name || 'Sin Asignar'}</span>
                      {' • '}
                      Vehículo: <span className="font-medium text-secondary-800 dark:text-secondary-200">{route.vehicle?.name || 'Sin Asignar'} ({route.vehicle?.plate_number})</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Stops progress */}
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-secondary-500 font-medium">Paradas Realizadas</div>
                    <div className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                      {route.completed_stops || 0} / {route.total_stops || 0}
                    </div>
                  </div>

                  {/* ETA */}
                  <div>
                    <div className="text-xs text-secondary-500 font-medium">ETA / Finalizado</div>
                    <div className="text-sm font-semibold text-secondary-850 dark:text-secondary-250 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-secondary-400" />
                      {route.eta || 'N/A'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {route.status === 'planned' && (
                      <button
                        onClick={() => handleQuickStatus(route, 'in_progress')}
                        className="btn btn-secondary btn-sm text-primary-600 hover:text-primary-700"
                        title="Iniciar Ruta"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />Iniciar
                      </button>
                    )}
                    {route.status === 'in_progress' && (
                      <button
                        onClick={() => handleQuickStatus(route, 'completed')}
                        className="btn btn-success btn-sm"
                        title="Completar Ruta"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />Completar
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(route)}
                      className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nueva/Editar Ruta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingRoute ? 'Editar Ruta' : 'Crear Nueva Ruta'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Número de Ruta</label>
                  <input
                    type="text"
                    required
                    value={formData.route_number}
                    onChange={(e) => setFormData({ ...formData, route_number: e.target.value })}
                    className="input"
                    placeholder="Ej. R-2026-101"
                  />
                </div>
                <div>
                  <label className="label">Conductor</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Seleccione conductor...</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>{drv.name} ({drv.license_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Vehículo</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Seleccione vehículo...</option>
                    {vehicles.map((vhc) => (
                      <option key={vhc.id} value={vhc.id}>{vhc.name} ({vhc.plate_number})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Paradas Totales</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.total_stops}
                      onChange={(e) => setFormData({ ...formData, total_stops: parseInt(e.target.value) || 1 })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Paradas Completadas</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.total_stops}
                      required
                      value={formData.completed_stops}
                      onChange={(e) => setFormData({ ...formData, completed_stops: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">ETA (Hora Est.)</label>
                    <input
                      type="text"
                      required
                      value={formData.eta}
                      onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                      className="input"
                      placeholder="Ej. 18:30"
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="planned">Planificada</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completada</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Ruta
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

// ==========================================
// 4. INCIDENTS PAGE
// ==========================================
export function IncidentsPage() {
  const { organization } = useAuthStore();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'warning', // critical, warning, info
    status: 'open', // open, resolved
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'incidents'),
        where('organization_id', '==', organization.id),
        orderBy('created_at', 'desc'),
        limit(50)
      ));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingIncident(null);
    setFormData({
      title: '',
      description: '',
      severity: 'warning',
      status: 'open',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (incident: any) => {
    setEditingIncident(incident);
    setFormData({
      title: incident.title || '',
      description: incident.description || '',
      severity: incident.severity || 'warning',
      status: incident.status || 'open',
    });
    setIsModalOpen(true);
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'incidents', id), {
        status: 'resolved',
        updated_at: serverTimestamp(),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desea eliminar este reporte de incidente?')) return;
    try {
      await deleteDoc(doc(db, 'incidents', id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      if (editingIncident) {
        await updateDoc(doc(db, 'incidents', editingIncident.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'incidents'), {
          ...formData,
          organization_id: organization.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error reporting incident:', error);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Reportes de Incidencias</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">Monitoree y gestione fallos mecánicos, demoras u otros problemas en la operación.</p>
          </div>
          <button onClick={handleOpenAdd} className="btn bg-error-650 hover:bg-error-700 btn-danger">
            <AlertTriangle className="w-4 h-4" />Reportar Incidente
          </button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-650" />
          <p className="mt-2 text-secondary-500 dark:text-secondary-400">Sin incidencias registradas</p>
          <p className="text-sm text-secondary-400">¡Buen trabajo! La operación fluye con normalidad.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident: any) => (
            <div
              key={incident.id}
              className={`card p-5 border-l-4 transition-all ${
                incident.status === 'resolved' ? 'border-l-success-500' :
                incident.severity === 'critical' ? 'border-l-error-500' :
                incident.severity === 'warning' ? 'border-l-warning-500' : 'border-l-primary-500'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {incident.severity === 'critical' ? (
                      <AlertCircle className="w-5 h-5 text-error-600" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 ${incident.status === 'resolved' ? 'text-success-655' : 'text-warning-600'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-secondary-900 dark:text-white">{incident.title}</span>
                      <span className={`badge ${
                        incident.severity === 'critical' ? 'badge-error' :
                        incident.severity === 'warning' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {incident.severity === 'critical' ? 'Crítica' :
                         incident.severity === 'warning' ? 'Advertencia' : 'Informativa'}
                      </span>
                      <span className={`badge ${incident.status === 'resolved' ? 'badge-success' : 'badge-error'}`}>
                        {incident.status === 'resolved' ? 'Resuelto' : 'Abierto'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">{incident.description}</p>
                    <div className="text-[10px] text-secondary-400 mt-3 font-medium">
                      Reportado el: {incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Recientemente'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {incident.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(incident.id)}
                      className="btn btn-success btn-sm"
                      title="Marcar como Resuelto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Resolver
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(incident)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(incident.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Reportar Incidente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingIncident ? 'Modificar Reporte' : 'Reportar Incidente'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Título del Incidente</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="Ej. Fuga de gas menor"
                  />
                </div>
                <div>
                  <label className="label">Descripción Detallada</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Escriba aquí los detalles del problema o anomalía detectada..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Severidad</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="input"
                    >
                      <option value="info">Informativa</option>
                      <option value="warning">Advertencia</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="open">Abierto / Activo</option>
                      <option value="resolved">Resuelto</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary btn-danger">
                    Enviar Reporte
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

// ==========================================
// 5. WORKFLOWS PAGE
// ==========================================
export function WorkflowsPage() {
  const { organization } = useAuthStore();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    trigger: 'Order Created',
    status: 'Active',
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'workflows'),
        where('organization_id', '==', organization.id)
      ));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setWorkflows(data);
    } catch (e) {
      console.error('Error fetching workflows:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingWorkflow(null);
    setFormData({
      name: '',
      desc: '',
      trigger: 'Order Created',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wf: any) => {
    setEditingWorkflow(wf);
    setFormData({
      name: wf.name || '',
      desc: wf.desc || '',
      trigger: wf.trigger || 'Order Created',
      status: wf.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (wf: any) => {
    const nextStatus = wf.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDoc(doc(db, 'workflows', wf.id), {
        status: nextStatus,
        updated_at: serverTimestamp(),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desea eliminar esta automatización?')) return;
    try {
      await deleteDoc(doc(db, 'workflows', id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      if (editingWorkflow) {
        await updateDoc(doc(db, 'workflows', editingWorkflow.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'workflows'), {
          ...formData,
          organization_id: organization.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Motor de Automatización</h1>
              <p className="text-primary-100 text-sm">Automatice flujos de trabajo en base a eventos del sistema sin escribir código.</p>
            </div>
          </div>
          <button onClick={handleOpenAdd} className="btn bg-white hover:bg-secondary-50 text-primary-600 font-semibold px-4 py-2 rounded-lg shadow-md border-0">
            <Plus className="w-4 h-4 mr-1 text-primary-600" />Nuevo Flujo
          </button>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="card p-12 text-center border border-dashed border-secondary-200 dark:border-secondary-800">
          <Workflow className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-2" />
          <p className="font-semibold text-secondary-900 dark:text-white">No hay flujos de automatización configurados</p>
          <p className="text-sm text-secondary-400 mt-1">Cree una nueva automatización para optimizar e integrar eventos en su logística de oxígeno.</p>
          <button onClick={handleOpenAdd} className="btn-secondary mt-4 font-semibold">Configurar primer flujo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="card p-5 flex flex-col justify-between hover:shadow-medium transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Workflow className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span
                    onClick={() => handleToggleStatus(wf)}
                    className={`badge cursor-pointer hover:opacity-85 ${wf.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}
                    title="Presione para cambiar estado"
                  >
                    {wf.status === 'Active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="font-semibold text-secondary-900 dark:text-white truncate">{wf.name}</h3>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2 font-medium">Disparador: {wf.trigger}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 min-h-[40px]">{wf.desc}</p>
              </div>

              <div className="flex justify-end gap-1.5 pt-4 mt-4 border-t border-secondary-100 dark:border-secondary-800">
                <button
                  onClick={() => handleOpenEdit(wf)}
                  className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wf.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary-150 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Workflow */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingWorkflow ? 'Editar Automatización' : 'Configurar Automatización'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre de Automatización</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Ej. Alerta stock mínimo"
                  />
                </div>
                <div>
                  <label className="label">Evento Disparador (Trigger)</label>
                  <select
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                    className="input"
                  >
                    <option value="Order Created">Pedido Creado (Order Created)</option>
                    <option value="Inventory Alert">Alerta de Stock (Inventory Alert)</option>
                    <option value="Maintenance Due">Mantenimiento de Activo (Maintenance Due)</option>
                    <option value="Incident Logged">Incidente Registrado (Incident Logged)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Descripción de la Acción</label>
                  <textarea
                    required
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="input min-h-[90px]"
                    placeholder="Ej. Enviar correo al supervisor y actualizar estatus del almacén central..."
                  />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Flujo
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

// ==========================================
// 6. FACILITIES PAGE
// ==========================================
export function FacilitiesPage() {
  const { organization } = useAuthStore();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'warehouse',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'facilities'),
        where('organization_id', '==', organization.id)
      ));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setFormData({
      name: '',
      type: 'warehouse',
      city: '',
      state: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac: any) => {
    setEditingFacility(fac);
    setFormData({
      name: fac.name || '',
      type: fac.type || 'warehouse',
      city: fac.city || '',
      state: fac.state || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desea eliminar esta instalación?')) return;
    try {
      await deleteDoc(doc(db, 'facilities', id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      if (editingFacility) {
        await updateDoc(doc(db, 'facilities', editingFacility.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'facilities'), {
          ...formData,
          organization_id: organization.id,
          is_active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonList items={3} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Gestión de Instalaciones</h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">Configure plantas de producción, almacenes centrales o depósitos regionales.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />Agregar Instalación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500">No hay instalaciones configuradas</p>
          </div>
        ) : (
          facilities.map((facility) => (
            <div key={facility.id} className="card p-5 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">{facility.name}</h3>
                    <span className="badge badge-secondary capitalize">{facility.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(facility)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(facility.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {facility.city && (
                <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400 pt-2 border-t border-secondary-55 dark:border-secondary-85">
                  <MapPin className="w-4 h-4 text-secondary-400" />
                  {facility.city}, {facility.state}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Añadir/Editar Instalación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  {editingFacility ? 'Editar Instalación' : 'Registrar Instalación'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre de Instalación</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Ej. Almacén Central de Distribución"
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="warehouse">Almacén (Warehouse)</option>
                    <option value="plant">Planta de Llenado (Filling Plant)</option>
                    <option value="depot">Depósito Médico (Medical Depot)</option>
                    <option value="office">Oficina Central (Central Office)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Ciudad</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                      placeholder="Ej. Madrid"
                    />
                  </div>
                  <div>
                    <label className="label">Provincia / Estado</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input"
                      placeholder="Ej. MD"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Instalación
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

// ==========================================
// 7. DOCUMENTS PAGE
// ==========================================
export function DocumentsPage() {
  const { organization } = useAuthStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Certificate', // Certificate, Contract, Invoice, Other
    size: '1.2 MB',
  });

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'documents'),
        where('organization_id', '==', organization.id)
      ));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      type: 'Certificate',
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
    });
    setIsModalOpen(true);
  };

  const handleDownload = (docItem: any) => {
    alert(`Descargando el archivo virtual: ${docItem.name} (${docItem.size})`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desea eliminar permanentemente este documento?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      const docName = formData.name.endsWith('.pdf') ? formData.name : `${formData.name}.pdf`;
      await addDoc(collection(db, 'documents'), {
        name: docName,
        type: formData.type,
        size: formData.size,
        organization_id: organization.id,
        created_at: new Date().toISOString().split('T')[0],
      });
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="card p-5 space-y-3">
        <SkeletonCard />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white font-semibold">Repositorio de Documentos</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">Guarde contratos de clientes, certificados de calidad de tanques de O2, facturas y pólizas.</p>
          </div>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" />Subir Documento
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
          <p className="mt-2 text-secondary-500 dark:text-secondary-400">No hay documentos registrados</p>
          <button onClick={handleOpenAdd} className="btn-secondary mt-3">Subir primer documento</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Nombre</th>
                  <th className="table-header-cell">Tipo</th>
                  <th className="table-header-cell">Tamaño</th>
                  <th className="table-header-cell">Subido el</th>
                  <th className="table-header-cell text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {documents.map((docItem) => (
                  <tr key={docItem.id} className="table-row-hover">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-secondary-900 dark:text-white">{docItem.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        docItem.type === 'Certificate' ? 'badge-success' :
                        docItem.type === 'Contract' ? 'badge-primary' :
                        docItem.type === 'Invoice' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {docItem.type === 'Certificate' ? 'Certificado' :
                         docItem.type === 'Contract' ? 'Contrato' :
                         docItem.type === 'Invoice' ? 'Factura' : 'Otro'}
                      </span>
                    </td>
                    <td className="table-cell">{docItem.size}</td>
                    <td className="table-cell">{docItem.created_at || 'Reciente'}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(docItem)}
                          className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(docItem.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Subir Documento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-800">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Subir Nuevo Documento</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre del Documento</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Ej. Ficha Tecnica Oxigeno Med"
                  />
                </div>
                <div>
                  <label className="label">Categoría / Tipo de Archivo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="Certificate">Certificado de Calidad (Quality Cert)</option>
                    <option value="Contract">Contrato de Distribución (Contract)</option>
                    <option value="Invoice">Factura de Compra (Invoice)</option>
                    <option value="Other">Otro documento (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tamaño Estimado</label>
                  <input
                    type="text"
                    disabled
                    value={formData.size}
                    className="input opacity-60"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirmar Carga
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
