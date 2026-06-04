import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Truck,
  Activity,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';

interface QuestionnaireState {
  open: boolean;
  step: number;
  data: {
    companyName: string;
    email: string;
    industry: string;
    businessSize: string;
  };
}

export function HeroPage() {
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireState>({
    open: false,
    step: 1,
    data: {
      companyName: '',
      email: '',
      industry: '',
      businessSize: '',
    },
  });

  const handleQuestionnaireChange = (field: string, value: string) => {
    setQuestionnaire(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  const handleNextStep = () => {
    if (questionnaire.step < 3) {
      setQuestionnaire(prev => ({
        ...prev,
        step: prev.step + 1,
      }));
    }
  };

  const handleSubmitQuestionnaire = async () => {
    // Redirigir a signup con información prefillada
    navigate('/signup', { state: questionnaire.data });
  };

  const stats = [
    { number: '500+', label: 'Empresas Confiando', icon: Users },
    { number: '50K+', label: 'Transacciones Diarias', icon: TrendingUp },
    { number: '99.9%', label: 'Uptime Garantizado', icon: Activity },
  ];

  const features = [
    {
      icon: Package,
      title: 'Gestión de Activos',
      description: 'Seguimiento en tiempo real de todos tus recursos y equipos',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Truck,
      title: 'Logística Optimizada',
      description: 'Rutas inteligentes y entregas eficientes',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: BarChart3,
      title: 'Análisis Avanzado',
      description: 'Informes detallados y predicciones inteligentes',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Seguridad Máxima',
      description: 'Encriptación de datos y compliance total',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Zap,
      title: 'Velocidad Extrema',
      description: 'Performance optimizado para máxima eficiencia',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Trabajo en equipo fluido y comunicación integrada',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const recommendations = [
    {
      number: 1,
      title: 'Auditoría y Logging',
      description: 'Registro completo de todas las acciones',
      impact: 'Compliance',
      icon: Activity,
    },
    {
      number: 2,
      title: 'Encriptación de Datos',
      description: 'Protección total de información sensible',
      impact: 'Seguridad',
      icon: Shield,
    },
    {
      number: 3,
      title: 'Autenticación SSO',
      description: 'Login único con OAuth 2.0',
      impact: 'Seguridad',
      icon: Users,
    },
    {
      number: 4,
      title: 'Rate Limiting',
      description: 'Protección contra ataques DDoS',
      impact: 'Estabilidad',
      icon: AlertTriangle,
    },
    {
      number: 5,
      title: 'Backup Automático',
      description: 'Disaster recovery y continuidad',
      impact: 'Resiliencia',
      icon: Package,
    },
    {
      number: 6,
      title: 'Monitoreo APM',
      description: 'Alertas en tiempo real y análisis',
      impact: 'Operaciones',
      icon: TrendingUp,
    },
    {
      number: 7,
      title: 'Testing Exhaustivo',
      description: 'Coverage ≥80% en todas las funciones',
      impact: 'Confiabilidad',
      icon: CheckCircle2,
    },
    {
      number: 8,
      title: 'Caché Inteligente',
      description: 'Redis para performance 100x',
      impact: 'Performance',
      icon: Zap,
    },
    {
      number: 9,
      title: 'API Security',
      description: 'Validación y protección avanzada',
      impact: 'Protección',
      icon: Shield,
    },
    {
      number: 10,
      title: 'Compliance Docs',
      description: 'GDPR, HIPAA y normativas locales',
      impact: 'Legal',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold">
              HL
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white">HealthLogix OS</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition">
              Características
            </a>
            <button
              onClick={() => navigate('/recommendations')}
              className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition"
            >
              Recomendaciones
            </button>
            <a href="#" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition">
              Recursos
            </a>
          </div>

          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
          >
            Comenzar
          </button>
        </div>
      </nav>

      {/* Hero Section with Background */}
      <div className="relative min-h-screen pt-16 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-secondary-900/90 to-transparent" />

        {/* Background image pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(45deg, transparent 48%, rgba(255,255,255,.05) 49%, rgba(255,255,255,.05) 51%, transparent 52%)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Logística que
                  <span className="block bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
                    puedes confiar
                  </span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-gray-200 max-w-lg leading-relaxed">
                Gestión completa de activos, órdenes y logística. Una plataforma integrada diseñada para empresas que quieren crecer.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => setQuestionnaire({ ...questionnaire, open: true })}
                  className="px-8 py-3.5 rounded-lg bg-white hover:bg-gray-50 text-primary-700 font-semibold transition flex items-center justify-center gap-2 group"
                >
                  Contáctanos
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 rounded-lg border-2 border-white/30 hover:border-white/60 text-white font-semibold transition"
                >
                  Ir al Panel
                </button>
              </div>
            </div>

            {/* Right side - Stats Cards */}
            <div className="space-y-6 animate-fade-in-delay">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="card p-6 backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/40 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center group-hover:scale-110 transition">
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{stat.number}</div>
                      <div className="text-gray-300 text-sm">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu negocio en una sola plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="card p-8 h-full hover:shadow-xl transition duration-300">
                  <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br mb-6 flex items-center justify-center group-hover:scale-110 transition', feature.color)}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section id="recommendations" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              10 Recomendaciones para Producción
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Garantiza seguridad, performance y compliance con estas recomendaciones críticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, i) => (
              <div key={i} className="card p-6 hover:shadow-lg transition group cursor-pointer border-l-4 border-l-primary-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
                    {rec.number}
                  </div>
                  <rec.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{rec.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">{rec.description}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                  {rec.impact}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">¿Listo para escalar?</h3>
                <p className="text-primary-100">Implementa estas recomendaciones y lleva tu negocio al siguiente nivel</p>
              </div>
              <div className="flex gap-3 whitespace-nowrap">
                <button
                  onClick={() => navigate('/recommendations')}
                  className="px-6 py-2.5 rounded-lg bg-white/20 border border-white/40 hover:bg-white/30 text-white font-semibold transition"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => setQuestionnaire({ ...questionnaire, open: true })}
                  className="px-6 py-2.5 rounded-lg bg-white text-primary-700 font-semibold hover:bg-gray-50 transition"
                >
                  Comenzar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
            Únete a cientos de empresas exitosas
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 mb-8">
            Transforma tu logística y gestión de activos hoy mismo
          </p>
          <button
            onClick={() => setQuestionnaire({ ...questionnaire, open: true })}
            className="px-8 py-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition inline-flex items-center gap-2 group"
          >
            Solicitar Demo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>

      {/* Questionnaire Modal */}
      {questionnaire.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full p-8 space-y-6 animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setQuestionnaire({ ...questionnaire, open: false })}
              className="absolute top-4 right-4 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Cuéntanos sobre ti</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">Paso {questionnaire.step} de 3</p>
            </div>

            {/* Step 1 */}
            {questionnaire.step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={questionnaire.data.companyName}
                    onChange={e => handleQuestionnaireChange('companyName', e.target.value)}
                    placeholder="Tu empresa"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Industria</label>
                  <select
                    value={questionnaire.data.industry}
                    onChange={e => handleQuestionnaireChange('industry', e.target.value)}
                    className="input"
                  >
                    <option value="">Seleccionar industria</option>
                    <option value="health">Salud</option>
                    <option value="logistics">Logística</option>
                    <option value="manufacturing">Manufactura</option>
                    <option value="retail">Retail</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {questionnaire.step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={questionnaire.data.email}
                    onChange={e => handleQuestionnaireChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tamaño de la Empresa</label>
                  <select
                    value={questionnaire.data.businessSize}
                    onChange={e => handleQuestionnaireChange('businessSize', e.target.value)}
                    className="input"
                  >
                    <option value="">Seleccionar tamaño</option>
                    <option value="startup">Startup (1-10)</option>
                    <option value="small">Pequeña (11-50)</option>
                    <option value="medium">Mediana (51-200)</option>
                    <option value="large">Grande (200+)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {questionnaire.step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">Resumen:</h3>
                  <div className="space-y-1 text-sm text-secondary-700 dark:text-secondary-300">
                    <p>Empresa: {questionnaire.data.companyName}</p>
                    <p>Industria: {questionnaire.data.industry}</p>
                    <p>Email: {questionnaire.data.email}</p>
                    <p>Tamaño: {questionnaire.data.businessSize}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {questionnaire.step > 1 && (
                <button
                  onClick={() => setQuestionnaire(prev => ({ ...prev, step: prev.step - 1 }))}
                  className="flex-1 btn-secondary"
                >
                  Anterior
                </button>
              )}
              {questionnaire.step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 btn-primary"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuestionnaire}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
