import { useState, useEffect, useMemo } from 'react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatRelativeTime, getStatusColor, getPriorityColor, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { SkeletonTable } from '../components/ui/Skeleton';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  Truck,
  Calendar,
  Building2,
  X,
  Edit,
  Trash2,
  Zap,
  Phone,
  Mail,
} from 'lucide-react';

interface Order extends DocumentData {
  id: string;
  order_number: string;
  external_reference?: string;
  customer_id: string;
  status: string;
  priority: string;
  is_emergency: boolean;
  total_items?: number;
  total_quantity?: number;
  total_weight?: number;
  total_amount?: number;
  scheduled_delivery_date?: string;
  delivery_window_start?: string;
  delivery_window_end?: string;
  customer_notes?: string;
  internal_notes?: string;
  created_at: any;
  updated_at: any;
}

interface Customer extends DocumentData {
  id: string;
  name: string;
  primary_email?: string;
  primary_phone?: string;
}

export function OrdersPage() {
  const { organization } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    priority: 'normal',
    status: 'pending',
    is_emergency: false,
    total_amount: 150,
    scheduled_delivery_date: '',
    customer_notes: '',
  });

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;

    try {
      const [ordersSnapshot, customersSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'orders'),
          where('organization_id', '==', organization.id),
          orderBy('created_at', 'desc'),
          limit(100)
        )),
        getDocs(query(
          collection(db, 'customers'),
          where('organization_id', '==', organization.id)
        )),
      ]);

      const ordersData = ordersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Order[];
      const customersData = customersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Customer[];

      setOrders(ordersData);
      setCustomers(customersData);

      if (customersData.length > 0) {
        setFormData(prev => ({
          ...prev,
          customer_id: customersData[0].id,
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = searchQuery === '' ||
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.external_reference?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, searchQuery, selectedStatus, selectedPriority]);

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === 'pending' || o.status === 'draft').length,
      approved: orders.filter((o: any) => o.status === 'approved').length,
      inTransit: orders.filter((o: any) => o.status === 'in_transit').length,
      delivered: orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length,
      emergencies: orders.filter((o: any) => o.is_emergency).length,
      totalValue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
    };
  }, [orders]);

  const getCustomer = (customerId: string) => customers.find((c: any) => c.id === customerId);

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setFormData({
      customer_id: customers[0]?.id || '',
      priority: 'normal',
      status: 'pending',
      is_emergency: false,
      total_amount: 150,
      scheduled_delivery_date: new Date().toISOString().split('T')[0],
      customer_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id || '',
      priority: order.priority || 'normal',
      status: order.status || 'pending',
      is_emergency: !!order.is_emergency,
      total_amount: order.total_amount || 0,
      scheduled_delivery_date: order.scheduled_delivery_date || '',
      customer_notes: order.customer_notes || '',
    });
    setIsModalOpen(true);
    setShowOrderDetails(false); // Close details view if we open edit
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este pedido?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      setShowOrderDetails(false);
      setSelectedOrder(null);
      fetchData();
    } catch (e) {
      console.error('Error deleting order:', e);
    }
  };

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
      fetchData();
      // Update selected order view
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    try {
      if (editingOrder) {
        await updateDoc(doc(db, 'orders', editingOrder.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
      } else {
        const orderNum = `O-2026-${Math.floor(Math.random() * 90000 + 10000)}`;
        await addDoc(collection(db, 'orders'), {
          ...formData,
          order_number: orderNum,
          organization_id: organization.id,
          total_items: 2,
          total_quantity: 5,
          total_weight: 45.5,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleExport = () => {
    alert('Exportando la lista de pedidos en formato CSV...');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-5 w-5 bg-secondary-200 dark:bg-secondary-700 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="card p-4">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="card overflow-hidden">
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total Pedidos', value: orderStats.total, icon: ClipboardList, color: 'primary' },
          { label: 'Pendientes', value: orderStats.pending, icon: Clock, color: 'warning' },
          { label: 'Aprobados', value: orderStats.approved, icon: CheckCircle2, color: 'success' },
          { label: 'En Tránsito', value: orderStats.inTransit, icon: Truck, color: 'primary' },
          { label: 'Entregados', value: orderStats.delivered, icon: CheckCircle2, color: 'success' },
          { label: 'Emergencias', value: orderStats.emergencies, icon: Zap, color: 'error' },
          { label: 'Valor Total', value: formatCurrency(orderStats.totalValue), icon: ClipboardList, color: 'accent' },
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

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar por número o referencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn('btn-secondary', showFilters && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400')}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button onClick={handleExport} className="btn-secondary">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nuevo Pedido
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="scheduled">Programado</option>
                  <option value="assigned">Asignado</option>
                  <option value="in_transit">En Tránsito</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="label">Prioridad</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="input"
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                  <option value="emergency">Emergencia</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Pedido</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Prioridad</th>
                <th className="table-header-cell">Fecha de Entrega</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">No se encontraron pedidos</p>
                    <p className="text-sm text-secondary-400 dark:text-secondary-500">Cree un nuevo pedido para comenzar.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const customer = getCustomer(order.customer_id);
                  return (
                    <tr key={order.id} className="table-row-hover cursor-pointer" onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            order.is_emergency ? 'bg-error-100 dark:bg-error-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                          )}>
                            {order.is_emergency ? (
                              <Zap className="w-5 h-5 text-error-600 dark:text-error-400" />
                            ) : (
                              <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-secondary-900 dark:text-white">{order.order_number}</div>
                            <div className="text-xs text-secondary-500 dark:text-secondary-400">
                              {formatRelativeTime(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-medium text-secondary-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-secondary-400" />
                          <span>{customer?.name || 'Cliente Desconocido'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={cn('badge', `badge-${getStatusColor(order.status)}`)}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell font-semibold capitalize">
                        <span className={cn('badge', `badge-${getPriorityColor(order.priority)}`)}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="table-cell text-secondary-600 dark:text-secondary-400 font-medium">
                        {order.scheduled_delivery_date ? formatDate(order.scheduled_delivery_date) : '-'}
                      </td>
                      <td className="table-cell font-bold text-secondary-900 dark:text-white">
                        {formatCurrency(order.total_amount || 0)}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                  {editingOrder ? 'Editar Pedido' : 'Crear Pedido'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Cliente</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Prioridad</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                    >
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                      <option value="emergency">Emergencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Importe (€)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Fecha Programada</label>
                    <input
                      type="date"
                      required
                      value={formData.scheduled_delivery_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="scheduled">Programado</option>
                      <option value="in_transit">En Tránsito</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="is_emergency"
                    checked={formData.is_emergency}
                    onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_emergency" className="text-sm font-semibold text-secondary-800 dark:text-secondary-200 cursor-pointer">
                    ¿Es un pedido de Emergencia?
                  </label>
                </div>
                <div>
                  <label className="label">Notas del Cliente</label>
                  <input
                    type="text"
                    value={formData.customer_notes}
                    onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                    className="input"
                    placeholder="Instrucciones especiales de entrega..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in border border-secondary-200 dark:border-secondary-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    selectedOrder.is_emergency ? 'bg-error-100 dark:bg-error-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                  )}>
                    {selectedOrder.is_emergency ? (
                      <Zap className="w-7 h-7 text-error-600 dark:text-error-400" />
                    ) : (
                      <ClipboardList className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{selectedOrder.order_number}</h2>
                      {selectedOrder.is_emergency && (
                        <span className="badge-error badge px-2.5 py-0.5 rounded-full text-xs font-semibold">Emergencia</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn('badge', `badge-${getStatusColor(selectedOrder.status)}`)}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                      <span className={cn('badge', `badge-${getPriorityColor(selectedOrder.priority)}`)}>
                        {selectedOrder.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Order Value */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {selectedOrder.total_items || 2}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Artículos</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {selectedOrder.total_quantity || 5}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Unidades</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {selectedOrder.total_weight ? `${selectedOrder.total_weight} kg` : '45 kg'}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Peso</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(selectedOrder.total_amount || 0)}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Importe Total</div>
                </div>
              </div>

              {/* Customer & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Información del Cliente</h3>
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-secondary-400" />
                      <div>
                        <div className="font-bold text-secondary-900 dark:text-white">
                          {getCustomer(selectedOrder.customer_id)?.name || 'Cliente Desconocido'}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">Establecimiento</div>
                      </div>
                    </div>
                    {getCustomer(selectedOrder.customer_id)?.primary_email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400 font-medium">
                          {getCustomer(selectedOrder.customer_id)?.primary_email}
                        </span>
                      </div>
                    )}
                    {getCustomer(selectedOrder.customer_id)?.primary_phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400 font-medium">
                          {getCustomer(selectedOrder.customer_id)?.primary_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Planificación de la Entrega</h3>
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-secondary-400" />
                      <div>
                        <div className="font-bold text-secondary-900 dark:text-white">
                          {selectedOrder.scheduled_delivery_date ? formatDate(selectedOrder.scheduled_delivery_date) : 'No planificado'}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">Fecha de Entrega</div>
                      </div>
                    </div>
                    {(selectedOrder.delivery_window_start || selectedOrder.delivery_window_end) && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400 font-medium">
                          {selectedOrder.delivery_window_start || ''} - {selectedOrder.delivery_window_end || ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder.customer_notes || selectedOrder.internal_notes) && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Notas</h3>
                  {selectedOrder.customer_notes && (
                    <div className="card p-4">
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">Notas del Cliente</div>
                      <div className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">{selectedOrder.customer_notes}</div>
                    </div>
                  )}
                  {selectedOrder.internal_notes && (
                    <div className="card p-4 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
                      <div className="text-xs text-warning-600 dark:text-warning-400 mb-1">Notas Internas</div>
                      <div className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">{selectedOrder.internal_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(selectedOrder)} className="btn-secondary btn-sm">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button onClick={() => handleDelete(selectedOrder.id)} className="btn-secondary btn-sm text-error-600 hover:text-error-700">
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
                <div className="flex gap-2">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'approved')}
                      className="btn-primary btn-sm btn-success"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar Pedido
                    </button>
                  )}
                  {selectedOrder.status === 'approved' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'in_transit')}
                      className="btn-primary btn-sm"
                    >
                      <Truck className="w-4 h-4" /> Despachar / Enviar
                    </button>
                  )}
                  {selectedOrder.status === 'in_transit' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'delivered')}
                      className="btn-primary btn-sm btn-success"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar Entregado
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
