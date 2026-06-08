import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Activity,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Wind,
  Gauge,
  MapPin,
  Truck,
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    image:
      'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1',
    headline: 'Oxígeno Médico',
    subheadline: 'donde se necesita',
    description:
      'Gestionamos la cadena logística de gases medicinales con precisión y confiabilidad absolutas.',
    cta: 'Ver soluciones',
    badge: '🫁 Gases Medicinales',
  },
  {
    id: 2,
    image:
      'https://images.pexels.com/photos/3786157/pexels-photo-3786157.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1',
    headline: 'Logística Crítica',
    subheadline: 'en tiempo real',
    description:
      'Control total de inventarios, rutas y entregas de cilindros de oxígeno para hospitales y clínicas.',
    cta: 'Conoce la plataforma',
    badge: '🏥 Sector Salud',
  },
  {
    id: 3,
    image:
      'https://images.pexels.com/photos/6129049/pexels-photo-6129049.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1',
    headline: 'Distribución',
    subheadline: 'sin interrupciones',
    description:
      'Rastreo en vivo de cilindros, presión de gases y estado de entrega desde una sola plataforma.',
    cta: 'Solicitar demo',
    badge: '🚚 Distribución',
  },
  {
    id: 4,
    image:
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1',
    headline: 'Cumplimiento',
    subheadline: 'regulatorio total',
    description:
      'Trazabilidad completa y auditorías automáticas que cumplen con normativas INVIMA y estándares ISO.',
    cta: 'Comenzar gratis',
    badge: '✅ Certificado',
  },
];

const STATS = [
  { number: '500+', label: 'Empresas', icon: Users },
  { number: '99.9%', label: 'Uptime', icon: Activity },
  { number: '50K+', label: 'Entregas/mes', icon: TrendingUp },
];

const FEATURES = [
  {
    icon: Wind,
    title: 'Gestión de Cilindros',
    description: 'Seguimiento en tiempo real de cada cilindro: ubicación, presión y estado.',
    color: 'from-sky-500 to-sky-600',
  },
  {
    icon: Truck,
    title: 'Logística Optimizada',
    description: 'Rutas inteligentes y entregas eficientes para hospitales y clínicas.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Gauge,
    title: 'Monitoreo de Presión',
    description: 'Alertas automáticas de nivel crítico de gases medicinales.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Análisis Avanzado',
    description: 'Reportes detallados y predicciones de consumo con inteligencia artificial.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Trazabilidad Total',
    description: 'Cumplimiento normativo y auditorías automáticas en todo el ciclo.',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: MapPin,
    title: 'Cobertura Nacional',
    description: 'Red de distribución con control centralizado desde cualquier dispositivo.',
    color: 'from-teal-500 to-teal-600',
  },
];

interface QuestionnaireState {
  open: boolean;
  step: number;
  data: { companyName: string; email: string; industry: string; businessSize: string };
}

export function HeroPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireState>({
    open: false,
    step: 1,
    data: { companyName: '', email: '', industry: '', businessSize: '' },
  });

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(index);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning]
  );

  const prev = useCallback(() => {
    goTo(current === 0 ? SLIDES.length - 1 : current - 1);
  }, [current, goTo]);

  const next = useCallback(() => {
    goTo(current === SLIDES.length - 1 ? 0 : current + 1);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  const handleQuestionnaireChange = (field: string, value: string) =>
    setQuestionnaire(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900 overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              OX
            </div>
            <div>
              <span className="text-xl font-bold text-secondary-900 dark:text-white tracking-tight">
                Oxisan
              </span>
              <span className="hidden sm:inline text-xs text-secondary-500 dark:text-secondary-400 ml-2">
                Logística de Gases Medicinales
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#características" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium">
              Características
            </a>
            <a href="#soluciones" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium">
              Soluciones
            </a>
            <button
              onClick={() => navigate('/recommendations')}
              className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium"
            >
              Recursos
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition text-sm font-medium"
            >
              Ingresar
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition shadow-md shadow-sky-600/30"
            >
              Comenzar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO CAROUSEL ── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              i === current ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={s.image}
              alt={s.headline}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full pt-16">
            <div
              className={cn(
                'max-w-2xl transition-all duration-500',
                isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              )}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold mb-6">
                {slide.badge}
              </span>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
                {slide.headline}
                <span className="block bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  {slide.subheadline}
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-xl leading-relaxed">
                {slide.description}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition shadow-xl shadow-sky-500/40 flex items-center gap-2 group"
                >
                  {slide.cta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => setQuestionnaire(q => ({ ...q, open: true }))}
                  className="px-8 py-4 rounded-xl border-2 border-white/40 hover:border-white/70 text-white font-bold transition backdrop-blur-sm"
                >
                  Hablar con ventas
                </button>
              </div>

              <div className="mt-14 flex flex-wrap gap-8">
                {STATS.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white leading-none">{stat.number}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prev / Next */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/30 transition flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/30 transition flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'transition-all duration-300 rounded-full',
                i === current ? 'w-8 h-2.5 bg-sky-400' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              )}
            />
          ))}
        </div>

        <div className="absolute bottom-8 right-8 z-20 text-white/50 text-sm font-mono hidden sm:block">
          {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="características" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-sm font-semibold mb-4">
              Plataforma Completa
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-secondary-900 dark:text-white mb-4">
              Todo lo que necesitas para{' '}
              <span className="text-sky-600">gases medicinales</span>
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Desde el cilindro en el almacén hasta la cama del paciente. Control total en una
              plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl bg-gradient-to-br mb-6 flex items-center justify-center group-hover:scale-110 transition',
                    feature.color
                  )}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section id="soluciones" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 p-12 sm:p-16 text-center text-white">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <Activity className="w-14 h-14 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                Únete a los líderes en logística de oxígeno
              </h2>
              <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto">
                Implementación en menos de 1 día. Sin costos ocultos. Soporte 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-xl bg-white text-sky-700 font-black hover:bg-gray-50 transition shadow-xl flex items-center justify-center gap-2 group"
                >
                  Comenzar gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => setQuestionnaire(q => ({ ...q, open: true }))}
                  className="px-8 py-4 rounded-xl border-2 border-white/50 hover:border-white text-white font-bold transition"
                >
                  Solicitar demo
                </button>
              </div>
              <p className="text-sky-200 text-sm mt-6">
                ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ 14 días gratis &nbsp;·&nbsp; ✓ Cancela cuando quieras
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT MODAL ── */}
      {questionnaire.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-8 rounded-2xl space-y-6 relative animate-scale-in shadow-2xl">
            <button
              onClick={() => setQuestionnaire(q => ({ ...q, open: false, step: 1 }))}
              className="absolute top-4 right-4 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition"
            >
              <X className="w-5 h-5 text-secondary-500" />
            </button>

            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold mb-4">
                OX
              </div>
              <h2 className="text-2xl font-black text-secondary-900 dark:text-white">
                Cuéntanos sobre tu empresa
              </h2>
              <div className="flex items-center gap-1.5 mt-3">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      n <= questionnaire.step
                        ? 'bg-sky-500'
                        : 'bg-secondary-200 dark:bg-secondary-700'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                Paso {questionnaire.step} de 3
              </p>
            </div>

            {questionnaire.step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={questionnaire.data.companyName}
                    onChange={e => handleQuestionnaireChange('companyName', e.target.value)}
                    placeholder="Distribuidora Médica S.A."
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
                    <option value="">Seleccionar</option>
                    <option value="hospital">Hospital / Clínica</option>
                    <option value="distributor">Distribuidor de gases</option>
                    <option value="pharmacy">Farmacia</option>
                    <option value="laboratory">Laboratorio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
            )}

            {questionnaire.step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Email corporativo</label>
                  <input
                    type="email"
                    value={questionnaire.data.email}
                    onChange={e => handleQuestionnaireChange('email', e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tamaño de la empresa</label>
                  <select
                    value={questionnaire.data.businessSize}
                    onChange={e => handleQuestionnaireChange('businessSize', e.target.value)}
                    className="input"
                  >
                    <option value="">Seleccionar</option>
                    <option value="startup">1 – 10 empleados</option>
                    <option value="small">11 – 50 empleados</option>
                    <option value="medium">51 – 200 empleados</option>
                    <option value="large">200+ empleados</option>
                  </select>
                </div>
              </div>
            )}

            {questionnaire.step === 3 && (
              <div className="p-5 bg-sky-50 dark:bg-sky-900/20 rounded-xl space-y-3">
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3">Resumen</h3>
                {[
                  ['Empresa', questionnaire.data.companyName],
                  ['Industria', questionnaire.data.industry],
                  ['Email', questionnaire.data.email],
                  ['Tamaño', questionnaire.data.businessSize],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-secondary-500 dark:text-secondary-400">{label}</span>
                    <span className="font-semibold text-secondary-900 dark:text-white">{val || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {questionnaire.step > 1 && (
                <button
                  onClick={() => setQuestionnaire(q => ({ ...q, step: q.step - 1 }))}
                  className="flex-1 btn-secondary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}
              {questionnaire.step < 3 ? (
                <button
                  onClick={() => setQuestionnaire(q => ({ ...q, step: q.step + 1 }))}
                  className="flex-1 btn-primary flex items-center justify-center gap-1"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/signup', { state: questionnaire.data })}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Ir al registro
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
