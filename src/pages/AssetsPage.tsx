import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, formatRelativeTime, formatNumber, getStatusColor, formatDate, getInitials } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Gauge,
  QrCode,
  BarChart3,
  X,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Battery,
  Thermometer,
  Heart,
  Shield,
  Calendar,
  History,
} from 'lucide-react';

interface Asset extends DocumentData {
  id: string;
  asset_number: string;
  name?: string;
  category_id: string;
  status: string;
  current_facility_id?: string;
  serial_number?: string;
  qr_code?: string;
  primary_photo_url?: string;
  health_score?: number;
  risk_score?: number;
  utilization_rate?: number;
  ownership_type: string;
  lifecycle_stage: string;
  manufacturer?: string;
  model_number?: string;
  capacity?: number;
  current_fill_percentage?: number;
  last_maintenance_at?: any;
  next_maintenance_date?: string;
  total_rental_days?: number;
  total_fills_cycles?: number;
  total_distance_traveled_km?: number;
  updated_at: any;
  created_at: any;
}

interface AssetCategory extends DocumentData {
  id: string;
  name: string;
  unit_of_measure?: string;
}

interface Facility extends DocumentData {
  id: string;
  name: string;
}

export function AssetsPage() {
  const { organization } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetails, setShowAssetDetails] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;

    try {
      const [assetsSnapshot, categoriesSnapshot, facilitiesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'assets'),
          where('organization_id', '==', organization.id),
          orderBy('created_at', 'desc'),
          limit(100)
        )),
        getDocs(query(
          collection(db, 'asset_categories'),
          where('organization_id', '==', organization.id),
          where('is_active', '==', true)
        )),
        getDocs(query(
          collection(db, 'facilities'),
          where('organization_id', '==', organization.id),
          where('is_active', '==', true)
        )),
      ]);

      const assetsData = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Asset[];
      const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AssetCategory[];
      const facilitiesData = facilitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Facility[];

      setAssets(assetsData);
      setCategories(categoriesData);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = searchQuery === '' ||
        asset.asset_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.qr_code?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || asset.category_id === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
      const matchesFacility = selectedFacility === 'all' || asset.current_facility_id === selectedFacility;

      return matchesSearch && matchesCategory && matchesStatus && matchesFacility;
    });
  }, [assets, searchQuery, selectedCategory, selectedStatus, selectedFacility]);

  const assetStats = useMemo(() => {
    return {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      inTransit: assets.filter(a => a.status === 'in_transit').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      avgHealth: assets.length > 0 ? assets.reduce((sum, a) => sum + (a.health_score || 0), 0) / assets.length : 0,
      highRisk: assets.filter(a => (a.risk_score || 0) > 50).length,
    };
  }, [assets]);

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetails(true);
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
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Assets', value: assetStats.total, icon: Package, color: 'primary' },
          { label: 'Available', value: assetStats.available, icon: CheckCircle2, color: 'success' },
          { label: 'In Transit', value: assetStats.inTransit, icon: Package, color: 'warning' },
          { label: 'Maintenance', value: assetStats.maintenance, icon: AlertTriangle, color: 'warning' },
          { label: 'Avg Health', value: `${assetStats.avgHealth.toFixed(1)}%`, icon: Heart, color: 'success' },
          { label: 'High Risk', value: assetStats.highRisk, icon: AlertTriangle, color: 'error' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <stat.icon className={cn(
              'w-5 h-5',
              stat.color === 'primary' && 'text-primary-500',
              stat.color === 'success' && 'text-success-500',
              stat.color === 'warning' && 'text-warning-500',
              stat.color === 'error' && 'text-error-500',
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
              placeholder="Search by ID, name, serial number, or QR code..."
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
              {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedFacility !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="label">Facility</label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="input"
                >
                  <option value="all">All Facilities</option>
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>{fac.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Asset</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Digital Twin</th>
                <th className="table-header-cell">Last Activity</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">No assets found</p>
                    <p className="text-sm text-secondary-400 dark:text-secondary-500">Try adjusting your filters or add a new asset</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="table-row-hover cursor-pointer" onClick={() => handleViewAsset(asset)}>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          {asset.primary_photo_url ? (
                            <img src={asset.primary_photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900 dark:text-white">{asset.asset_number}</div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">{asset.name || 'Unnamed'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-secondary">
                        {categories.find(c => c.id === asset.category_id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', `badge-${getStatusColor(asset.status)}`)}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">
                          {facilities.find(f => f.id === asset.current_facility_id)?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={cn(
                            'text-xs font-semibold',
                            (asset.health_score || 0) >= 80 ? 'text-success-600 dark:text-success-400' :
                            (asset.health_score || 0) >= 50 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'
                          )}>
                            {(asset.health_score || 0).toFixed(0)}%
                          </div>
                          <div className="text-2xs text-secondary-400">Health</div>
                        </div>
                        <div className="text-center">
                          <div className={cn(
                            'text-xs font-semibold',
                            asset.risk_score || 0 <= 25 ? 'text-success-600 dark:text-success-400' :
                            asset.risk_score || 0 <= 50 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'
                          )}>
                            {(asset.risk_score || 0).toFixed(0)}%
                          </div>
                          <div className="text-2xs text-secondary-400">Risk</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-secondary-500 dark:text-secondary-400">
                      {formatRelativeTime(asset.updated_at)}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show menu
                        }}
                        className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-secondary-600"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Details Modal */}
      {showAssetDetails && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    {selectedAsset.primary_photo_url ? (
                      <img src={selectedAsset.primary_photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{selectedAsset.asset_number}</h2>
                    <p className="text-secondary-500 dark:text-secondary-400">{selectedAsset.name || selectedAsset.serial_number || 'Asset'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('badge', `badge-${getStatusColor(selectedAsset.status)}`)}>
                        {selectedAsset.status.replace('_', ' ')}
                      </span>
                      {categories.find(c => c.id === selectedAsset.category_id) && (
                        <span className="badge-secondary">
                          {categories.find(c => c.id === selectedAsset.category_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAssetDetails(false);
                    setSelectedAsset(null);
                  }}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Digital Twin Scores */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4 text-center">
                  <Heart className={cn(
                    'w-6 h-6 mx-auto',
                    (selectedAsset.health_score || 0) >= 80 ? 'text-success-500' :
                    (selectedAsset.health_score || 0) >= 50 ? 'text-warning-500' : 'text-error-500'
                  )} />
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                    {(selectedAsset.health_score || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Health Score</div>
                </div>
                <div className="card p-4 text-center">
                  <Shield className={cn(
                    'w-6 h-6 mx-auto',
                    (selectedAsset.risk_score || 0) <= 25 ? 'text-success-500' :
                    (selectedAsset.risk_score || 0) <= 50 ? 'text-warning-500' : 'text-error-500'
                  )} />
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                    {(selectedAsset.risk_score || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Risk Score</div>
                </div>
                <div className="card p-4 text-center">
                  <Activity className="w-6 h-6 mx-auto text-primary-500" />
                  <div className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                    {(selectedAsset.utilization_rate || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Utilization</div>
                </div>
              </div>

              {/* Asset Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Asset Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Serial Number</span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.serial_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">QR Code</span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.qr_code || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Manufacturer</span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.manufacturer || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Model</span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.model_number || '-'}</span>
                    </div>
                    {selectedAsset.capacity && (
                      <div className="flex justify-between">
                        <span className="text-secondary-500 dark:text-secondary-400">Capacity</span>
                        <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.capacity} {categories.find(c => c.id === selectedAsset.category_id)?.unit_of_measure}</span>
                      </div>
                    )}
                    {selectedAsset.current_fill_percentage !== null && (
                      <div className="flex justify-between">
                        <span className="text-secondary-500 dark:text-secondary-400">Fill Level</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${selectedAsset.current_fill_percentage}%` }}
                            />
                          </div>
                          <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.current_fill_percentage}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Current Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Location</span>
                      <span className="text-secondary-900 dark:text-white font-medium">
                        {facilities.find(f => f.id === selectedAsset.current_facility_id)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Ownership</span>
                      <span className="text-secondary-900 dark:text-white font-medium capitalize">{selectedAsset.ownership_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Lifecycle Stage</span>
                      <span className="text-secondary-900 dark:text-white font-medium capitalize">{selectedAsset.lifecycle_stage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Last Maintenance</span>
                      <span className="text-secondary-900 dark:text-white font-medium">
                        {selectedAsset.last_maintenance_at ? formatDate(selectedAsset.last_maintenance_at) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">Next Maintenance</span>
                      <span className="text-secondary-900 dark:text-white font-medium">
                        {selectedAsset.next_maintenance_date ? formatDate(selectedAsset.next_maintenance_date) : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle Stats */}
              <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-800">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Lifecycle Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="card p-4">
                    <div className="text-2xl font-bold text-secondary-900 dark:text-white">{selectedAsset.total_rental_days || 0}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">Days in Use</div>
                  </div>
                  <div className="card p-4">
                    <div className="text-2xl font-bold text-secondary-900 dark:text-white">{selectedAsset.total_fills_cycles || 0}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">Fill Cycles</div>
                  </div>
                  <div className="card p-4">
                    <div className="text-2xl font-bold text-secondary-900 dark:text-white">{selectedAsset.total_distance_traveled_km?.toFixed(0) || 0} km</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">Distance Traveled</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50">
              <div className="flex gap-2">
                <button className="btn-primary flex-1">
                  <Eye className="w-4 h-4" />
                  View Full History
                </button>
                <button className="btn-secondary">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
