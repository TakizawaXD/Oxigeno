import { useState } from 'react';
import { cn } from '../lib/utils';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Truck,
  MapPin,
  Calendar,
  Gauge,
  Activity,
  Brain,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  BarChart3,
  PieChart,
} from 'lucide-react';

export function AIPage() {
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'predictions' | 'insights'>('recommendations');

  const recommendations = [
    {
      id: '1',
      type: 'inventory_optimization',
      title: 'Optimize Oxygen Cylinder Distribution',
      description: 'Relocate 50 cylinders from Warehouse A to Warehouse B to reduce average delivery time by 15 minutes for Hospital Alpha.',
      impact: 'High',
      confidence: 92,
      savings: '$12,400/month',
      status: 'new',
    },
    {
      id: '2',
      type: 'route_optimization',
      title: 'Route Consolidation Opportunity',
      description: 'Routes R-127 and R-129 have overlapping areas. Combining them could save 23km daily.',
      impact: 'Medium',
      confidence: 87,
      savings: '$3,200/month',
      status: 'viewed',
    },
    {
      id: '3',
      type: 'maintenance_prediction',
      title: 'Preventive Maintenance Alert',
      description: '12 assets show early signs of wear. Schedule maintenance within 2 weeks to avoid failures.',
      impact: 'High',
      confidence: 95,
      savings: '$8,100 (estimated avoidance cost)',
      status: 'new',
    },
    {
      id: '4',
      type: 'demand_forecast',
      title: 'Demand Surge Expected',
      description: 'Based on historical patterns, expect 18% increase in oxygen demand next week at Metro Hospital.',
      impact: 'High',
      confidence: 88,
      savings: 'Stockout prevention',
      status: 'actioned',
    },
    {
      id: '5',
      type: 'cost_reduction',
      title: 'Fuel Efficiency Improvement',
      description: 'Vehicle V-102 is consuming 15% more fuel than average. Recommend inspection.',
      impact: 'Low',
      confidence: 91,
      savings: '$450/month',
      status: 'dismissed',
    },
  ];

  const predictions = [
    { label: 'Next Week Orders', value: '+18%', trend: 'up', confidence: 85 },
    { label: 'Inventory Needed', value: '2,847 units', trend: 'up', confidence: 82 },
    { label: 'Fleet Utilization', value: '82%', trend: 'up', confidence: 90 },
    { label: 'Maintenance Due', value: '24 assets', trend: 'stable', confidence: 95 },
  ];

  const insights = [
    {
      category: 'Performance',
      title: 'Delivery Efficiency Up',
      value: '+12%',
      change: '+3.2% this month',
      positive: true,
    },
    {
      category: 'Assets',
      title: 'Asset Health Score',
      value: '94.2%',
      change: '+1.8% this month',
      positive: true,
    },
    {
      category: 'Risk',
      title: 'Risk Events Prevented',
      value: '47',
      change: 'This month',
      positive: true,
    },
    {
      category: 'Costs',
      title: 'Operational Cost Savings',
      value: '$48,200',
      change: 'This quarter',
      positive: true,
    },
  ];

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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Operations Center</h1>
            <p className="text-primary-100 mt-1">Intelligent insights for operational excellence</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl w-fit">
        {[
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'predictions', label: 'Predictions', icon: TrendingUp },
          { id: 'insights', label: 'Insights', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'new', 'viewed', 'actioned', 'dismissed'].map((status) => (
              <button
                key={status}
                className={cn(
                  'btn-sm',
                  status === 'all' ? 'btn-primary' : 'btn-ghost'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="card p-5 hover:shadow-medium transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      getRecommendationColor(rec.type) === 'primary' && 'bg-primary-100 dark:bg-primary-900/30',
                      getRecommendationColor(rec.type) === 'accent' && 'bg-accent-100 dark:bg-accent-900/30',
                      getRecommendationColor(rec.type) === 'warning' && 'bg-warning-100 dark:bg-warning-900/30',
                      getRecommendationColor(rec.type) === 'success' && 'bg-success-100 dark:bg-success-900/30',
                    )}>
                      {rec.type === 'inventory_optimization' && <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                      {rec.type === 'route_optimization' && <MapPin className="w-5 h-5 text-accent-600 dark:text-accent-400" />}
                      {rec.type === 'maintenance_prediction' && <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />}
                      {rec.type === 'demand_forecast' && <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                      {rec.type === 'cost_reduction' && <Gauge className="w-5 h-5 text-success-600 dark:text-success-400" />}
                    </div>
                    <div>
                      <span className={cn('badge', `badge-${getRecommendationColor(rec.type)}`)}>
                        {rec.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    rec.impact === 'High' ? 'text-error-600 dark:text-error-400' :
                    rec.impact === 'Medium' ? 'text-warning-600 dark:text-warning-400' : 'text-secondary-500'
                  )}>
                    {rec.impact} Impact
                  </span>
                </div>

                <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">{rec.title}</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{rec.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-100 dark:border-secondary-800">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-secondary-900 dark:text-white">{rec.confidence}%</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-success-600 dark:text-success-400">{rec.savings}</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">Savings</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-sm btn-ghost">Dismiss</button>
                    <button className="btn-sm btn-primary">
                      Apply
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'predictions' && (
        <div className="space-y-6">
          {/* Prediction Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {predictions.map((pred) => (
              <div key={pred.label} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className={cn(
                    'w-5 h-5',
                    pred.trend === 'up' ? 'text-success-500' :
                    pred.trend === 'down' ? 'text-error-500' : 'text-secondary-400'
                  )} />
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">{pred.confidence}% confidence</span>
                </div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{pred.value}</div>
                <div className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{pred.label}</div>
              </div>
            ))}
          </div>

          {/* Detailed Predictions */}
          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Demand Forecast - Next 7 Days</h3>
            <div className="h-64 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
                <p className="mt-2 text-secondary-500 dark:text-secondary-400">Demand forecast visualization</p>
                <p className="text-xs text-secondary-400 dark:text-secondary-500">Chart would display predicted order volumes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="space-y-6">
          {/* Insight Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight) => (
              <div key={insight.title} className="card p-5">
                <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{insight.category}</div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{insight.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  {insight.positive ? (
                    <TrendingUp className="w-4 h-4 text-success-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error-500" />
                  )}
                  <span className={cn(
                    'text-sm',
                    insight.positive ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                  )}>
                    {insight.change}
                  </span>
                </div>
                <div className="text-secondary-500 dark:text-secondary-400 text-sm mt-1">{insight.title}</div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Asset Utilization Trends</h3>
              <div className="space-y-4">
                {[
                  { name: 'Oxygen Cylinders', value: 78, trend: '+5%' },
                  { name: 'Medical Equipment', value: 82, trend: '+3%' },
                  { name: 'Transport Assets', value: 65, trend: '-2%' },
                  { name: 'Storage Containers', value: 91, trend: '+1%' },
                ].map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-700 dark:text-secondary-300">{item.name}</span>
                      <span className="font-medium text-secondary-900 dark:text-white">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Operational Health</h3>
              <div className="space-y-4">
                {[
                  { name: 'Delivery Success Rate', value: 98.4, good: true },
                  { name: 'SLA Compliance', value: 96.2, good: true },
                  { name: 'Asset Availability', value: 87.5, good: true },
                  { name: 'Maintenance Adherence', value: 94.1, good: true },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-white">{item.value}%</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">{item.name}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
