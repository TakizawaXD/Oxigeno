import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { db, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from '../lib/firebase';
import {
  Brain,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Package,
  MapPin,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface Recommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  impact_score: number;
  confidence_score: number;
  savings: string;
  status: 'new' | 'viewed' | 'actioned' | 'dismissed';
}

export function AIPage() {
  const { organization } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'predictions' | 'insights'>('recommendations');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);

  // Dynamic States for predictions/insights calculated from other DB collections if needed
  const [dbStats, setDbStats] = useState({
    assetsCount: 0,
    maintenanceCount: 0,
    ordersCount: 0,
    deliveredCount: 0,
  });

  const fetchRecommendations = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const snapshot = await getDocs(query(
        collection(db, 'ai_recommendations'),
        where('organization_id', '==', organization.id)
      ));
      const data = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Recommendation[];
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbStats = async () => {
    if (!organization) return;
    try {
      const [assetsSnap, ordersSnap] = await Promise.all([
        getDocs(query(collection(db, 'assets'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'orders'), where('organization_id', '==', organization.id))),
      ]);
      const assets = assetsSnap.docs.map((doc: any) => doc.data());
      const orders = ordersSnap.docs.map((doc: any) => doc.data());

      setDbStats({
        assetsCount: assets.length,
        maintenanceCount: assets.filter((a: any) => a.status === 'maintenance').length,
        ordersCount: orders.length,
        deliveredCount: orders.filter((o: any) => o.status === 'delivered').length,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (organization) {
      fetchRecommendations();
      fetchDbStats();
    }
  }, [organization]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'ai_recommendations', id), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
      fetchRecommendations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ai_recommendations', id));
      fetchRecommendations();
    } catch (err) {
      console.error('Error deleting recommendation:', err);
    }
  };

  const handleSimulateScan = async () => {
    if (!organization) return;
    setIsScanning(true);
    try {
      // Create three realistic recommendation entries in Firestore
      const recs = [
        {
          organization_id: organization.id,
          recommendation_type: 'inventory_optimization',
          title: 'Optimización de Distribución de Cilindros',
          description: 'Reubicar 50 cilindros de oxígeno del Almacén Central al Depósito Sur para reducir el tiempo de entrega promedio en 18 minutos.',
          impact_score: 9.2,
          confidence_score: 94,
          savings: '$12,400/mes',
          status: 'new',
          created_at: serverTimestamp(),
        },
        {
          organization_id: organization.id,
          recommendation_type: 'route_optimization',
          title: 'Consolidación de Rutas de Entrega',
          description: 'Las rutas de entrega de hoy presentan solapamiento en zonas hospitalarias del norte. Combinar cargas ahorrará 15km de combustible.',
          impact_score: 8.5,
          confidence_score: 89,
          savings: '$3,150/mes',
          status: 'new',
          created_at: serverTimestamp(),
        },
        {
          organization_id: organization.id,
          recommendation_type: 'maintenance_prediction',
          title: 'Alerta de Mantenimiento Preventivo',
          description: '3 cilindros de alto uso muestran anomalías de presión en telemetría. Programar inspección técnica para prevenir fallos mecánicos.',
          impact_score: 9.5,
          confidence_score: 97,
          savings: 'Prevención de fugas',
          status: 'new',
          created_at: serverTimestamp(),
        }
      ];

      for (const rec of recs) {
        await addDoc(collection(db, 'ai_recommendations'), rec);
      }
      
      await fetchRecommendations();
    } catch (err) {
      console.error('Error simulating scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedFilter === 'all') return true;
    return rec.status === selectedFilter;
  });

  const getRecommendationColor = (type: string) => {
    const colors: Record<string, string> = {
      inventory_optimization: 'primary',
      route_optimization: 'accent',
      maintenance_prediction: 'warning',
      demand_forecast: 'primary',
      cost_reduction: 'success',
    };
    return colors[type] || 'secondary';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centro de Operaciones IA</h1>
              <p className="text-primary-100 mt-1">Análisis inteligente e insights automáticos para optimizar su logística</p>
            </div>
          </div>
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="btn bg-white hover:bg-secondary-50 text-primary-600 font-bold shadow-md border-0 self-start sm:self-center"
          >
            <Sparkles className={cn('w-4 h-4 mr-1.5', isScanning && 'animate-spin')} />
            {isScanning ? 'Escaneando...' : 'Escanear con IA'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl w-fit">
        {[
          { id: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
          { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
          { id: 'insights', label: 'Insights Operativos', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
              selectedTab === tab.id
                ? 'bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white shadow-sm'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'recommendations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'new', label: 'Nuevas' },
              { id: 'viewed', label: 'Vistas' },
              { id: 'actioned', label: 'Aplicadas' },
              { id: 'dismissed', label: 'Descartadas' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={cn(
                  'btn-sm font-semibold rounded-lg border transition-all',
                  selectedFilter === filter.id
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-secondary-500">Cargando análisis de IA...</div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="card p-12 text-center border border-dashed border-secondary-200 dark:border-secondary-800">
              <Lightbulb className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-2" />
              <p className="font-semibold text-secondary-900 dark:text-white">Sin recomendaciones en esta categoría</p>
              <p className="text-sm text-secondary-400 mt-1">Presione el botón "Escanear con IA" arriba para simular nuevos insights de optimización.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecommendations.map((rec) => {
                const recType = rec.recommendation_type || '';
                const confidence = rec.confidence_score || 80;
                const impactScore = rec.impact_score || 5.0;
                const impact = impactScore >= 8 ? 'Alto' : impactScore >= 5 ? 'Medio' : 'Bajo';
                
                return (
                  <div key={rec.id} className="card p-5 hover:shadow-medium transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            getRecommendationColor(recType) === 'primary' && 'bg-primary-100 dark:bg-primary-900/30',
                            getRecommendationColor(recType) === 'accent' && 'bg-accent-100 dark:bg-accent-900/30',
                            getRecommendationColor(recType) === 'warning' && 'bg-warning-100 dark:bg-warning-900/30',
                            getRecommendationColor(recType) === 'success' && 'bg-success-100 dark:bg-success-900/30',
                          )}>
                            {recType === 'inventory_optimization' && <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                            {recType === 'route_optimization' && <MapPin className="w-5 h-5 text-accent-600 dark:text-accent-400" />}
                            {recType === 'maintenance_prediction' && <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />}
                          </div>
                          <div>
                            <span className={cn('badge uppercase text-[10px]', `badge-${getRecommendationColor(recType)}`)}>
                              {recType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          'text-xs font-semibold',
                          impact === 'Alto' ? 'text-error-600 dark:text-error-400' :
                          impact === 'Medio' ? 'text-warning-600 dark:text-warning-400' : 'text-secondary-500'
                        )}>
                          Impacto {impact}
                        </span>
                      </div>

                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">{rec.title}</h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{rec.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-secondary-100 dark:border-secondary-800 mt-4">
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-sm font-bold text-secondary-900 dark:text-white">{confidence}%</div>
                          <div className="text-[10px] text-secondary-500 dark:text-secondary-400 font-medium">Confianza</div>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-success-600 dark:text-success-400">{rec.savings || 'N/A'}</div>
                          <div className="text-[10px] text-secondary-500 dark:text-secondary-400 font-medium">Ahorro</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {rec.status === 'new' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(rec.id, 'dismissed')}
                              className="btn-sm btn-ghost font-semibold text-secondary-600 hover:text-error-600"
                            >
                              Descartar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(rec.id, 'actioned')}
                              className="btn-sm btn-primary font-semibold"
                            >
                              Aplicar
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          </>
                        )}
                        {rec.status !== 'new' && (
                          <button
                            onClick={() => handleDeleteRecommendation(rec.id)}
                            className="p-1 rounded text-secondary-400 hover:text-error-600"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'predictions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pedidos Estimados', value: `+${Math.min(50, dbStats.ordersCount * 8)}%`, trend: 'up', confidence: 85 },
              { label: 'Inventario Proyectado', value: `${dbStats.assetsCount * 2} m3`, trend: 'up', confidence: 82 },
              { label: 'Uso de Flota Est.', value: dbStats.assetsCount > 0 ? '78%' : '0%', trend: 'up', confidence: 90 },
              { label: 'Pendientes de Mant.', value: `${dbStats.maintenanceCount} activos`, trend: 'stable', confidence: 95 },
            ].map((pred) => (
              <div key={pred.label} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-5 h-5 text-success-500" />
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">{pred.confidence}% confianza</span>
                </div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{pred.value}</div>
                <div className="text-sm text-secondary-500 dark:text-secondary-400 mt-1 font-semibold">{pred.label}</div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Proyección de Demanda - Próximos 7 Días</h3>
            <div className="h-64 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl flex items-center justify-center border border-secondary-200 dark:border-secondary-800">
              <div className="text-center p-6">
                <Sparkles className="w-12 h-12 mx-auto text-primary-500 mb-2" />
                <p className="text-secondary-700 dark:text-secondary-300 font-semibold">Gráfica Dinámica de Predicción</p>
                <p className="text-xs text-secondary-400 mt-1">El motor de IA está procesando el historial de órdenes para proyectar los volúmenes de entrega diarios.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { category: 'Eficiencia', title: 'Entregas exitosas', value: dbStats.deliveredCount > 0 ? '100%' : 'N/A', change: 'En este periodo', positive: true },
              { category: 'Activos', title: 'Cilindros registrados', value: `${dbStats.assetsCount}`, change: 'En el almacén', positive: true },
              { category: 'Prevención', title: 'Inspecciones agendadas', value: `${dbStats.maintenanceCount}`, change: 'Para esta semana', positive: true },
              { category: 'Costos', title: 'Ahorro proyectado', value: dbStats.deliveredCount > 0 ? `$${dbStats.deliveredCount * 125}` : '$0', change: 'Por consolidación', positive: true },
            ].map((insight) => (
              <div key={insight.title} className="card p-5">
                <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-2 font-semibold uppercase">{insight.category}</div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{insight.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span className="text-xs text-success-600 dark:text-success-400 font-semibold">{insight.change}</span>
                </div>
                <div className="text-secondary-500 dark:text-secondary-400 text-xs mt-2 font-medium">{insight.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
