import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { SkeletonList, SkeletonTable, SkeletonCard } from '../components/ui/Skeleton';
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
  ClipboardList,
  Warehouse,
  Truck,
  Workflow,
  MoreHorizontal,
  Package,
  Users,
  Settings,
  Eye,
  Edit,
} from 'lucide-react';

export function CustomersPage() {
  const { organization } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-secondary-200 dark:bg-secondary-700 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
                <div className="h-3 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input type="text" placeholder="Search customers..." className="input pl-10" />
          </div>
          <button className="btn-primary"><Plus className="w-4 h-4" />Add Customer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">No customers found</p>
            <p className="text-sm text-secondary-400">Add your first customer to get started</p>
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="card p-5 hover:shadow-medium transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">{customer.name}</h3>
                    <span className="badge-secondary capitalize">{customer.type}</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              {customer.primary_email && (
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  <Mail className="w-4 h-4" />
                  {customer.primary_email}
                </div>
              )}
              {customer.primary_phone && (
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  <Phone className="w-4 h-4" />
                  {customer.primary_phone}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function InventoryPage() {
  const { organization } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'inventory'),
        where('organization_id', '==', organization.id)
      ));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-40 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-3 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-8 w-16 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Inventory Overview</h2>
          <button className="btn-primary"><Plus className="w-4 h-4" />Adjust Inventory</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Warehouse className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">No inventory data</p>
            <p className="text-sm text-secondary-400">Inventory will appear when you add assets to facilities</p>
          </div>
        ) : (
          inventory.map((item: any) => (
            <div key={item.id} className="card p-4">
              <div className="text-sm font-medium text-secondary-900 dark:text-white">{item.category?.name || 'Unknown'}</div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{item.facility?.name || 'Unknown Facility'}</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">{item.total_quantity}</div>
                  <div className="text-xs text-secondary-500">Total</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-success-600">{item.available_quantity}</div>
                  <div className="text-xs text-secondary-500">Available</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RoutesPage() {
  const { organization } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'routes'),
        where('organization_id', '==', organization.id),
        orderBy('created_at', 'desc'),
        limit(50)
      ));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 text-center space-y-2">
            <div className="h-7 w-12 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse mx-auto" />
            <div className="h-3 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-800 flex justify-between">
          <div className="h-5 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          <div className="h-8 w-28 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Planned', value: routes.filter(r => r.status === 'planned').length },
          { label: 'In Progress', value: routes.filter(r => r.status === 'in_progress').length },
          { label: 'Completed', value: routes.filter(r => r.status === 'completed').length },
          { label: 'Total Today', value: routes.length },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-secondary-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-secondary-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-800 flex justify-between">
          <h3 className="font-semibold">Routes</h3>
          <button className="btn-primary btn-sm"><Plus className="w-4 h-4" />New Route</button>
        </div>
        <div className="p-8 text-center">
          <Truck className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
          <p className="mt-2 text-secondary-500">Routes will appear here</p>
        </div>
      </div>
    </div>
  );
}

export function IncidentsPage() {
  const { organization } = useAuthStore();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-3 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Incident Management</h2>
            <p className="text-sm text-secondary-500">Track and resolve issues</p>
          </div>
          <button className="btn-error"><AlertTriangle className="w-4 h-4" />Report Incident</button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
          <p className="mt-2 text-secondary-500">No incidents reported</p>
        </div>
      ) : (
        <div className="space-y-4">{incidents.map((i: any) => (
          <div key={i.id} className="card p-4">
            <div className="font-medium">{i.title}</div>
            <div className="text-sm text-secondary-500">{i.description}</div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export function WorkflowsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Workflow className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Workflow Engine</h1>
            <p className="text-primary-100">Automate business processes without code</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Order Created', desc: 'Automated order processing flow', icon: ClipboardList, status: 'Active' },
          { name: 'Inventory Alert', desc: 'Low stock notification workflow', icon: Package, status: 'Active' },
          { name: 'Maintenance Due', desc: 'Scheduled maintenance reminder', icon: Calendar, status: 'Active' },
        ].map((wf) => (
          <div key={wf.name} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <wf.icon className="w-5 h-5 text-primary-600" />
              <span className="badge-success">{wf.status}</span>
            </div>
            <h3 className="font-semibold">{wf.name}</h3>
            <p className="text-sm text-secondary-500 mt-1">{wf.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-12 text-center">
        <Workflow className="w-12 h-12 mx-auto text-secondary-300" />
        <p className="mt-2 text-secondary-500">Create and manage workflows</p>
        <button className="btn-primary mt-4"><Plus className="w-4 h-4" />Create Workflow</button>
      </div>
    </div>
  );
}

export function FacilitiesPage() {
  const { organization } = useAuthStore();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between">
        <div className="h-6 w-40 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Facility Management</h2>
        <button className="btn-primary"><Plus className="w-4 h-4" />Add Facility</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-secondary-300" />
            <p className="mt-2 text-secondary-500">No facilities configured</p>
          </div>
        ) : (
          facilities.map((facility) => (
            <div key={facility.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{facility.name}</h3>
                  <span className="badge-secondary capitalize">{facility.type}</span>
                </div>
              </div>
              {facility.city && (
                <div className="flex items-center gap-2 text-sm text-secondary-500">
                  <MapPin className="w-4 h-4" />
                  {facility.city}, {facility.state}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DocumentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-secondary-300" />
        <p className="mt-2 text-secondary-500">Document Management</p>
        <p className="text-sm text-secondary-400">Store and manage all your documents, certificates, and contracts</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { organization, user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Organization Name</label>
            <input type="text" className="input" defaultValue={organization?.name} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input type="text" className="input" defaultValue={organization?.slug} />
          </div>
          <button className="btn-primary"><Settings className="w-4 h-4" />Save Changes</button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" defaultValue={user?.email} />
          </div>
          <button className="btn-secondary">Update Profile</button>
        </div>
      </div>
    </div>
  );
}
