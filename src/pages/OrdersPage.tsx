import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, formatCurrency, formatRelativeTime, getStatusColor, getPriorityColor, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { SkeletonStats, SkeletonTable } from '../components/ui/Skeleton';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Calendar,
  User,
  Building2,
  X,
  Eye,
  Edit,
  ChevronDown,
  Package,
  Zap,
  RefreshCw,
  ArrowRight,
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
          where('organization_id', '==', organization.id),
          where('status', '==', 'active')
        )),
      ]);

      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];

      setOrders(ordersData);
      setCustomers(customersData);
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
      pending: orders.filter(o => o.status === 'pending' || o.status === 'draft').length,
      approved: orders.filter(o => o.status === 'approved').length,
      inTransit: orders.filter(o => o.status === 'in_transit').length,
      delivered: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
      emergencies: orders.filter(o => o.is_emergency).length,
      totalValue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    };
  }, [orders]);

  const getCustomer = (customerId: string) => customers.find(c => c.id === customerId);

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
          { label: 'Total Orders', value: orderStats.total, icon: ClipboardList, color: 'primary' },
          { label: 'Pending', value: orderStats.pending, icon: Clock, color: 'warning' },
          { label: 'Approved', value: orderStats.approved, icon: CheckCircle2, color: 'success' },
          { label: 'In Transit', value: orderStats.inTransit, icon: Truck, color: 'primary' },
          { label: 'Delivered', value: orderStats.delivered, icon: CheckCircle2, color: 'success' },
          { label: 'Emergency', value: orderStats.emergencies, icon: Zap, color: 'error' },
          { label: 'Total Value', value: formatCurrency(orderStats.totalValue), icon: ClipboardList, color: 'accent' },
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

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by order number or reference..."
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
              Filters
            </button>
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="input"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="emergency">Emergency</option>
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
                <th className="table-header-cell">Order</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Priority</th>
                <th className="table-header-cell">Delivery Date</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">No orders found</p>
                    <p className="text-sm text-secondary-400 dark:text-secondary-500">Try adjusting your filters or create a new order</p>
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
                            <div className="font-medium text-secondary-900 dark:text-white">{order.order_number}</div>
                            <div className="text-xs text-secondary-500 dark:text-secondary-400">
                              {formatRelativeTime(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-secondary-400" />
                          <span className="text-secondary-900 dark:text-white">{customer?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={cn('badge', `badge-${getStatusColor(order.status)}`)}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={cn('badge', `badge-${getPriorityColor(order.priority)}`)}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="table-cell text-secondary-600 dark:text-secondary-400">
                        {order.scheduled_delivery_date ? formatDate(order.scheduled_delivery_date) : '-'}
                      </td>
                      <td className="table-cell font-medium text-secondary-900 dark:text-white">
                        {formatCurrency(order.total_amount || 0)}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-secondary-600"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
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
                        <span className="badge-error">Emergency</span>
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
                    {selectedOrder.total_items || 0}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Items</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {selectedOrder.total_quantity || 0}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Units</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {selectedOrder.total_weight ? `${selectedOrder.total_weight} kg` : '-'}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Weight</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(selectedOrder.total_amount || 0)}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Total</div>
                </div>
              </div>

              {/* Customer & Delivery Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Customer Information</h3>
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-secondary-400" />
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-white">
                          {getCustomer(selectedOrder.customer_id)?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">Customer</div>
                      </div>
                    </div>
                    {getCustomer(selectedOrder.customer_id)?.primary_email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {getCustomer(selectedOrder.customer_id)?.primary_email}
                        </span>
                      </div>
                    )}
                    {getCustomer(selectedOrder.customer_id)?.primary_phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {getCustomer(selectedOrder.customer_id)?.primary_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Delivery Schedule</h3>
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-secondary-400" />
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-white">
                          {selectedOrder.scheduled_delivery_date ? formatDate(selectedOrder.scheduled_delivery_date) : 'Not scheduled'}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">Delivery Date</div>
                      </div>
                    </div>
                    {(selectedOrder.delivery_window_start || selectedOrder.delivery_window_end) && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600 dark:text-secondary-400">
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
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Notes</h3>
                  {selectedOrder.customer_notes && (
                    <div className="card p-4">
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">Customer Notes</div>
                      <div className="text-sm text-secondary-700 dark:text-secondary-300">{selectedOrder.customer_notes}</div>
                    </div>
                  )}
                  {selectedOrder.internal_notes && (
                    <div className="card p-4 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
                      <div className="text-xs text-warning-600 dark:text-warning-400 mb-1">Internal Notes</div>
                      <div className="text-sm text-secondary-700 dark:text-secondary-300">{selectedOrder.internal_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50">
              <div className="flex gap-2">
                <button className="btn-primary flex-1">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button className="btn-secondary">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
