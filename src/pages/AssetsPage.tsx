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
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../lib/translations';
import { useTerminology } from '../lib/terminology';
import { formatRelativeTime, getStatusColor, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { SkeletonStats, SkeletonTable } from '../components/ui/Skeleton';
import { compressImage } from '../lib/imageCompression';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Activity,
  X,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Heart,
  Shield,
  Upload,
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
  const { language } = useTranslation();
  const { t: term, businessType } = useTerminology();
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
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // If categories are empty, mock them based on terminology for an immediate out-of-the-box experience
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return term.categories.map((name, index) => ({
      id: `mock-cat-${index}`,
      name,
      description: `Categoría de ${name}`,
      unit_of_measure: businessType === 'medical_oxygen' ? 'L' : 'u',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }, [categories, term.categories, businessType]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Compress the image to base64 with a max size of 600px and 0.6 quality
      const compressedBase64 = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.6,
        outputType: 'base64'
      }) as string;

      setEditingAsset(prev => ({
        ...(prev || {}),
        primary_photo_url: compressedBase64
      }));
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error al comprimir la imagen.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !editingAsset?.asset_number || !editingAsset?.category_id) {
      alert('Por favor, completa los campos requeridos (Número de Activo y Categoría).');
      return;
    }

    try {
      const assetData = {
        ...editingAsset,
        organization_id: organization.id,
        updated_at: serverTimestamp(),
      };

      if (editingAsset.id) {
        // Update
        const assetRef = doc(db, 'assets', editingAsset.id);
        await updateDoc(assetRef, assetData);
      } else {
        // Create
        assetData.created_at = serverTimestamp();
        await addDoc(collection(db, 'assets'), assetData);
      }

      setShowAddEditModal(false);
      setEditingAsset(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Error al guardar el activo.');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este activo?')) return;
    try {
      await deleteDoc(doc(db, 'assets', assetId));
      setShowAssetDetails(false);
      setSelectedAsset(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Error al eliminar el activo.');
    }
  };

  const canModifyPhoto = (createdAt: any) => {
    if (!createdAt) return true;
    let date: Date;
    if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt.toDate) {
      date = createdAt.toDate();
    } else {
      date = new Date(createdAt);
    }
    const diffInMinutes = (Date.now() - date.getTime()) / (1000 * 60);
    return diffInMinutes < 10;
  };

  const handleUploadEvidencePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;

    setUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.6,
        outputType: 'base64'
      }) as string;

      const newPhoto = {
        id: Math.random().toString(36).substring(2, 9),
        url: compressedBase64,
        created_at: new Date().toISOString()
      };

      const updatedPhotos = [...(selectedAsset.photos || []), newPhoto];
      
      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, { photos: updatedPhotos });
      
      // Update local state
      setSelectedAsset(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, photos: updatedPhotos } : a));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteEvidencePhoto = async (photoId: string) => {
    if (!selectedAsset) return;
    const photo = (selectedAsset.photos as any[])?.find(p => p.id === photoId);
    if (!photo) return;

    if (!canModifyPhoto(photo.created_at)) {
      alert('Esta foto ha quedado registrada de forma permanente y ya no se puede eliminar.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta foto de evidencia?')) return;

    try {
      const updatedPhotos = (selectedAsset.photos as any[]).filter(p => p.id !== photoId);
      
      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, { photos: updatedPhotos });

      // Update local state
      setSelectedAsset(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, photos: updatedPhotos } : a));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error al eliminar la foto.');
    }
  };

  const handleReplaceEvidencePhoto = async (photoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;

    const photo = (selectedAsset.photos as any[])?.find(p => p.id === photoId);
    if (!photo) return;

    if (!canModifyPhoto(photo.created_at)) {
      alert('Esta foto ha quedado registrada de forma permanente y ya no se puede editar.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.6,
        outputType: 'base64'
      }) as string;

      const updatedPhotos = (selectedAsset.photos as any[]).map(p => {
        if (p.id === photoId) {
          return {
            ...p,
            url: compressedBase64,
            updated_at: new Date().toISOString()
          };
        }
        return p;
      });

      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, { photos: updatedPhotos });

      // Update local state
      setSelectedAsset(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, photos: updatedPhotos } : a));
    } catch (error) {
      console.error('Error replacing photo:', error);
      alert('Error al reemplazar la foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

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
      <div className="space-y-6 animate-fade-in p-6">
        <SkeletonStats />
        <div className="card p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 h-10 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
            <div className="h-5 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: language === 'es' ? `Total de ${term.assets}` : `Total ${term.assets}`, value: assetStats.total, icon: Package, color: 'primary' },
          { label: term.statusLabels.available, value: assetStats.available, icon: CheckCircle2, color: 'success' },
          { label: term.statusLabels.in_transit, value: assetStats.inTransit, icon: Package, color: 'warning' },
          { label: term.statusLabels.maintenance, value: assetStats.maintenance, icon: AlertTriangle, color: 'warning' },
          { label: language === 'es' ? 'Salud Promedio' : 'Avg Health', value: `${assetStats.avgHealth.toFixed(1)}%`, icon: Heart, color: 'success' },
          { label: language === 'es' ? 'Riesgo Alto' : 'High Risk', value: assetStats.highRisk, icon: AlertTriangle, color: 'error' },
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
              placeholder={term.placeholderSearch}
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
            <button
              onClick={() => {
                setEditingAsset({
                  status: 'available',
                  health_score: 100,
                  risk_score: 0,
                  utilization_rate: 0,
                  ownership_type: 'owned',
                  lifecycle_stage: 'active',
                });
                setShowAddEditModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              {language === 'es' ? `Agregar ${term.assetSingular}` : `Add ${term.assetSingular}`}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">{language === 'es' ? 'Categoría' : 'Category'}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="all">{language === 'es' ? 'Todas las categorías' : 'All Categories'}</option>
                  {displayCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{language === 'es' ? 'Estado' : 'Status'}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">{language === 'es' ? 'Todos los estados' : 'All Statuses'}</option>
                  {Object.entries(term.statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{language === 'es' ? 'Instalación' : 'Facility'}</label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="input"
                >
                  <option value="all">{language === 'es' ? 'Todas las instalaciones' : 'All Facilities'}</option>
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
                <th className="table-header-cell">{term.assetSingular}</th>
                <th className="table-header-cell">{language === 'es' ? 'Categoría' : 'Category'}</th>
                <th className="table-header-cell">{language === 'es' ? 'Estado' : 'Status'}</th>
                <th className="table-header-cell">{language === 'es' ? 'Ubicación' : 'Location'}</th>
                <th className="table-header-cell">{language === 'es' ? 'Gemelo Digital' : 'Digital Twin'}</th>
                <th className="table-header-cell">{language === 'es' ? 'Última Actividad' : 'Last Activity'}</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-2 text-secondary-500 dark:text-secondary-400">
                      {language === 'es' ? `No se encontraron ${term.assets.toLowerCase()}` : `No ${term.assets.toLowerCase()} found`}
                    </p>
                    <p className="text-sm text-secondary-400 dark:text-secondary-500">
                      {language === 'es' ? `Intenta ajustar los filtros o agrega un nuevo ${term.assetSingular.toLowerCase()}` : `Try adjusting your filters or add a new ${term.assetSingular.toLowerCase()}`}
                    </p>
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
                        {displayCategories.find(c => c.id === asset.category_id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', `badge-${getStatusColor(asset.status)}`)}>
                        {term.statusLabels[asset.status as keyof typeof term.statusLabels] || asset.status.replace('_', ' ')}
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
                        {term.statusLabels[selectedAsset.status as keyof typeof term.statusLabels] || selectedAsset.status.replace('_', ' ')}
                      </span>
                      {displayCategories.find(c => c.id === selectedAsset.category_id) && (
                        <span className="badge-secondary">
                          {displayCategories.find(c => c.id === selectedAsset.category_id)?.name}
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
                  <h3 className="font-semibold text-secondary-900 dark:text-white">
                    {language === 'es' ? `Información de ${term.assetSingular}` : `Asset Information`}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">
                        {language === 'es' ? 'Número de Serie' : 'Serial Number'}
                      </span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.serial_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">
                        {language === 'es' ? 'Código QR' : 'QR Code'}
                      </span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.qr_code || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">
                        {language === 'es' ? 'Fabricante' : 'Manufacturer'}
                      </span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.manufacturer || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500 dark:text-secondary-400">
                        {language === 'es' ? 'Modelo' : 'Model'}
                      </span>
                      <span className="text-secondary-900 dark:text-white font-medium">{selectedAsset.model_number || '-'}</span>
                    </div>
                    {selectedAsset.capacity && (
                      <div className="flex justify-between">
                        <span className="text-secondary-500 dark:text-secondary-400">
                          {language === 'es' ? 'Capacidad' : 'Capacity'}
                        </span>
                        <span className="text-secondary-900 dark:text-white font-medium">
                          {selectedAsset.capacity} {displayCategories.find(c => c.id === selectedAsset.category_id)?.unit_of_measure}
                        </span>
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

              {/* Evidencia Fotográfica (Historial de Fotos) con Bloqueo de 10 min */}
              <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-800">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary-500" />
                      Evidencia Fotográfica de Cilindros / Activos
                    </h3>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      Registro de estado físico. Las fotos se bloquean permanentemente tras 10 minutos de subirse.
                    </p>
                  </div>
                  <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    Añadir Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadEvidencePhoto}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                {uploadingPhoto && (
                  <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg flex items-center justify-center gap-2 mb-4 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Comprimiendo y guardando evidencia...</span>
                  </div>
                )}

                {(!selectedAsset.photos || selectedAsset.photos.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-secondary-300 dark:border-secondary-700 rounded-xl">
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">No hay fotos de evidencia registradas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(selectedAsset.photos as any[]).map((photo) => {
                      const modifiable = canModifyPhoto(photo.created_at);
                      return (
                        <div key={photo.id} className="card p-3 flex flex-col gap-3 relative border border-secondary-200 dark:border-secondary-800">
                          {/* Image Preview */}
                          <div className="w-full h-36 bg-secondary-100 dark:bg-secondary-800 rounded-lg overflow-hidden border border-secondary-200 dark:border-secondary-700">
                            <img src={photo.url} alt="Evidencia" className="w-full h-full object-cover" />
                          </div>

                          {/* Info & Actions */}
                          <div className="flex flex-col flex-1 justify-between gap-2">
                            <div className="text-2xs text-secondary-500 dark:text-secondary-400">
                              Subida el: {new Date(photo.created_at).toLocaleString('es-ES')}
                            </div>

                            {modifiable ? (
                              <div className="flex gap-2 mt-1">
                                <label className="btn-secondary text-2xs flex-1 text-center justify-center cursor-pointer py-1.5 px-2">
                                  Reemplazar
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleReplaceEvidencePhoto(photo.id, e)}
                                    disabled={uploadingPhoto}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvidencePhoto(photo.id)}
                                  className="btn-secondary text-2xs text-error-600 hover:bg-error-50 dark:hover:bg-error-950/20 py-1.5 px-2"
                                >
                                  Eliminar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-2xs font-semibold text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-800 p-2 rounded-md justify-center">
                                <span>🔒 Registro Permanente</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50">
              <div className="flex gap-2">
                <button className="btn-primary flex-1">
                  <Eye className="w-4 h-4" />
                  View Full History
                </button>
                <button
                  onClick={() => {
                    setEditingAsset(selectedAsset);
                    setShowAssetDetails(false);
                    setShowAddEditModal(true);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  className="btn-secondary hover:bg-error-50 dark:hover:bg-error-950/20 hover:text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add / Edit Asset Modal */}
      {showAddEditModal && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
                {editingAsset.id ? `${language === 'es' ? 'Editar' : 'Edit'} ${term.assetSingular}` : `${language === 'es' ? 'Nuevo' : 'New'} ${term.assetSingular}`}
              </h2>
              <button
                onClick={() => {
                  setShowAddEditModal(false);
                  setEditingAsset(null);
                }}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveAsset} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              {/* Photo Upload System with compression */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  {language === 'es' ? `Foto del ${term.assetSingular}` : `Photo of the ${term.assetSingular}`}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center overflow-hidden border border-secondary-200 dark:border-secondary-700">
                    {editingAsset.primary_photo_url ? (
                      <img src={editingAsset.primary_photo_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-secondary-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="btn-secondary w-fit cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploadingPhoto ? 'Comprimiendo...' : 'Subir Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-2xs text-secondary-500 mt-1">
                      Las fotos se comprimen en tu navegador para no gastar espacio en la base de datos (resolución optimizada).
                    </p>
                  </div>
                </div>
              </div>

              {/* Asset Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {language === 'es' ? `Número de ${term.assetSingular}` : `${term.assetSingular} Number`} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CYL-1002"
                    value={editingAsset.asset_number || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, asset_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">
                    {language === 'es' ? 'Nombre descriptivo' : 'Friendly Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tanque Oxígeno O2 - 10L"
                    value={editingAsset.name || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">
                    {language === 'es' ? 'Categoría' : 'Category'} *
                  </label>
                  <select
                    required
                    value={editingAsset.category_id || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, category_id: e.target.value })}
                    className="input"
                  >
                    <option value="">
                      {language === 'es' ? 'Selecciona una categoría' : 'Select a category'}
                    </option>
                    {displayCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ubicación / Instalación</label>
                  <select
                    value={editingAsset.current_facility_id || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, current_facility_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Ninguna</option>
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Número de Serie</label>
                  <input
                    type="text"
                    value={editingAsset.serial_number || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, serial_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Código QR</label>
                  <input
                    type="text"
                    value={editingAsset.qr_code || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, qr_code: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Estado de Activo</label>
                  <select
                    value={editingAsset.status || 'available'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value })}
                    className="input"
                  >
                    <option value="available">Disponible</option>
                    <option value="reserved">Reservado</option>
                    <option value="in_transit">En tránsito</option>
                    <option value="delivered">Entregado</option>
                    <option value="in_use">En uso</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="damaged">Dañado</option>
                    <option value="lost">Perdido</option>
                    <option value="retired">Retirado</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fabricante</label>
                  <input
                    type="text"
                    value={editingAsset.manufacturer || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, manufacturer: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <input
                    type="text"
                    value={editingAsset.model_number || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, model_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Capacidad (litros / kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingAsset.capacity || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, capacity: parseFloat(e.target.value) || undefined })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Nivel de Llenado (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAsset.current_fill_percentage !== undefined ? editingAsset.current_fill_percentage : ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, current_fill_percentage: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Salud del Activo (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAsset.health_score !== undefined ? editingAsset.health_score : 100}
                    onChange={(e) => setEditingAsset({ ...editingAsset, health_score: parseInt(e.target.value) || 100 })}
                    className="input"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEditModal(false);
                    setEditingAsset(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="btn-primary flex-1"
                >
                  {editingAsset.id ? 'Guardar Cambios' : 'Crear Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
