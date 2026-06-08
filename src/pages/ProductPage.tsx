import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Package,
  Truck,
  BarChart3,
  Shield,
  Zap,
  Users,
  Clock,
  AlertCircle,
  DollarSign,
  Star,
  Quote,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wind,
  Gauge,
  MapPin,
} from 'lucide-react';

const CAROUSEL_IMAGES = [
  {
    src: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
    alt: 'Equipo médico de oxígeno en hospital',
    caption: 'Gases medicinales en cada punto de atención',
  },
  {
    src: 'https://images.pexels.com/photos/3786157/pexels-photo-3786157.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
    alt: 'Personal médico con cilindros de oxígeno',
    caption: 'Control total del inventario de cilindros',
  },
  {
    src: 'https://images.pexels.com/photos/6129049/pexels-photo-6129049.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
    alt: 'Distribución logística de suministros médicos',
    caption: 'Distribución sin interrupciones',
  },
  {
    src: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
    alt: 'Laboratorio de análisis clínicos',
    caption: 'Trazabilidad y cumplimiento regulatorio',
  },
  {
    src: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
    alt: 'Centro de distribución farmacéutica',
    caption: 'Cobertura nacional de suministros',
  },
];

export function ProductPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 250);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide === CAROUSEL_IMAGES.length - 1 ? 0 : currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? CAROUSEL_IMAGES.length - 1 : currentSlide - 1);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const testimonials = [
    {
      name: 'Dr. Juan Martínez',
      role: 'CEO, Hospital Central',
      text: 'Oxisan redujo nuestras operaciones en 40% y ahorramos $100K en el primer año.',
      avatar: '🏥',
      stars: 5,
    },
    {
      name: 'María López',
      role: 'Directora, Clínica San Juan',
      text: 'Las facturas automáticas nos ahorran 90% del tiempo. Es increíblemente simple.',
      avatar: '💼',
      stars: 5,
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Gerente, MediDist S.A.',
      text: 'Precisión de entregas 99.9%. Nuestros clientes están mucho más felices.',
      avatar: '🚚',
      stars: 5,
    },
  ];

  const features = [
    {
      icon: Wind,
      title: 'Gestión de Cilindros',
      description: 'Seguimiento en tiempo real de cada cilindro: ubicación, presión y estado de conservación',
      color: 'from-sky-500 to-sky-600',
    },
    {
      icon: Truck,
      title: 'Logística Optimizada',
      description: 'Rutas inteligentes y entregas eficientes para hospitales, clínicas y centros de distribución',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: BarChart3,
      title: 'Análisis Avanzado',
      description: 'Reportes detallados y predicciones inteligentes de consumo para optimizar operaciones',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Seguridad y Cumplimiento',
      description: 'Encriptación de datos y compliance total con INVIMA, HIPAA y regulaciones sanitarias',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Gauge,
      title: 'Monitoreo de Presión',
      description: 'Alertas automáticas de nivel crítico de gases medicinales antes de que sea emergencia',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Trabajo en equipo fluido entre operadores, conductores y administradores',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const benefits = [
    { icon: Activity, title: 'Aumento de Eficiencia', description: '40% menos tiempo en logística', stat: '+40%' },
    { icon: Clock, title: 'Reducción de Tiempos', description: 'Entregas 30% más rápidas', stat: '-30%' },
    { icon: AlertCircle, title: 'Menos Errores', description: '99.9% precisión en entregas', stat: '99.9%' },
    { icon: DollarSign, title: 'ROI Comprobado', description: 'Retorno en 3-6 meses', stat: '3-6m' },
  ];

  const useCases = [
    { title: 'Hospitales', description: 'Gestión de equipos médicos, farmacias y material quirúrgico', icon: Activity },
    { title: 'Clínicas Privadas', description: 'Control de inventario y facturas de servicios', icon: Package },
    { title: 'Laboratorios', description: 'Trazabilidad de muestras y equipos especializados', icon: BarChart3 },
    { title: 'Distribuidoras', description: 'Gestión de flota y rutas de entrega optimizadas', icon: Truck },
  ];

  const pricingPlans = [
    {
      name: 'Startup', price: '$99', period: '/mes', description: 'Para pequeñas clínicas',
      features: ['Hasta 5 usuarios', 'Gestión de 100 activos', 'Soporte por email', 'Backups diarios', 'Facturas básicas'],
      cta: 'Comenzar Gratis',
    },
    {
      name: 'Profesional', price: '$299', period: '/mes', description: 'Para medianas empresas', popular: true,
      features: ['Hasta 25 usuarios', 'Activos ilimitados', 'Soporte prioritario 24/7', 'Análisis avanzado', 'Facturas profesionales con PDF', 'API access', 'Integraciones'],
      cta: 'Elegir Plan',
    },
    {
      name: 'Enterprise', price: 'Personalizado', period: '', description: 'Para grandes organizaciones',
      features: ['Usuarios ilimitados', 'Activos ilimitados', 'Soporte dedicado', 'Análisis IA avanzado', 'Integraciones personalizadas', 'On-premise option', 'SLA garantizado 99.9%'],
      cta: 'Contactar Ventas',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              OX
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white tracking-tight">Oxisan</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium">Características</a>
            <a href="#pricing" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium">Precios</a>
            <a href="#testimonials" className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition font-medium">Clientes</a>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:block text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition text-sm font-medium">
              Iniciar Sesión
            </button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition shadow-md shadow-sky-600/25">
              Comenzar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO WITH CAROUSEL ── */}
      <section className="relative min-h-screen pt-24 overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <div className="space-y-8">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-sm font-semibold mb-4">
                  Solución #1 en Logística de Gases Medicinales
                </span>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-secondary-900 dark:text-white leading-tight tracking-tight">
                  Logística de Oxígeno
                  <span className="block bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                    Simplificada
                  </span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-lg">
                La plataforma integral para gestionar cilindros, rutas de entrega y cumplimiento regulatorio. Ahorra tiempo, dinero y vidas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 group"
                >
                  Prueba Gratis 14 Días
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="px-8 py-4 rounded-xl border-2 border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-600 font-bold transition"
                >
                  Ver Demo
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                {[
                  { number: '500+', label: 'Empresas' },
                  { number: '50K+', label: 'Entregas/mes' },
                  { number: '99.9%', label: 'Uptime' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl sm:text-3xl font-black text-sky-600">{stat.number}</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Image Carousel */}
            <div className="relative">
              {/* Glow effect behind carousel */}
              <div className="absolute -inset-4 bg-gradient-to-br from-sky-400/20 to-cyan-400/20 rounded-3xl blur-2xl" />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-sky-900/20 border border-white/20">
                {/* Main image */}
                <div className="relative aspect-[4/3] bg-secondary-900">
                  {CAROUSEL_IMAGES.map((img, i) => (
                    <div
                      key={i}
                      className={cn(
                        'absolute inset-0 transition-opacity duration-700 ease-in-out',
                        i === currentSlide ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ))}

                  {/* Gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Caption */}
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 p-6 transition-all duration-500',
                      isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                    )}
                  >
                    <p className="text-white text-lg font-semibold drop-shadow-lg">
                      {CAROUSEL_IMAGES[currentSlide].caption}
                    </p>
                  </div>

                  {/* Prev / Next buttons */}
                  <button
                    onClick={prevSlide}
                    aria-label="Anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 text-white hover:bg-white/40 transition flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    aria-label="Siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 text-white hover:bg-white/40 transition flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {CAROUSEL_IMAGES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        aria-label={`Imagen ${i + 1}`}
                        className={cn(
                          'rounded-full transition-all duration-300',
                          i === currentSlide
                            ? 'w-6 h-2 bg-sky-400'
                            : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 card px-5 py-3 rounded-xl shadow-lg border border-sky-100 dark:border-sky-900/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-secondary-900 dark:text-white">Cobertura Nacional</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">Rastreo en tiempo real</p>
                </div>
              </div>

              {/* Floating stat */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 card px-5 py-3 rounded-xl shadow-lg border border-green-100 dark:border-green-900/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-secondary-900 dark:text-white">99.9% Precisión</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">Entregas a tiempo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" className="fill-white dark:fill-secondary-800" />
          </svg>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-sm font-semibold mb-4">
              Plataforma Completa
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-secondary-900 dark:text-white mb-4">
              Características Poderosas
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar gases medicinales en una sola plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br mb-6 flex items-center justify-center group-hover:scale-110 transition', feature.color)}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY STRIP ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-secondary-900 dark:text-white mb-3">
              Operaciones en Acción
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">
              Así se ve la logística de gases medicinales con Oxisan
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CAROUSEL_IMAGES.map((img, i) => (
              <div
                key={i}
                className={cn(
                  'relative rounded-xl overflow-hidden group cursor-pointer transition-all duration-300',
                  i === 0 ? 'col-span-2 row-span-2' : '',
                  'hover:shadow-xl hover:-translate-y-1'
                )}
                onClick={() => goToSlide(i)}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={cn(
                    'w-full object-cover transition-transform duration-500 group-hover:scale-110',
                    i === 0 ? 'h-full min-h-[280px]' : 'h-40'
                  )}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute bottom-2 left-3 right-3 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Para Quién Es</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">Soluciones adaptadas a tu industria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((use, i) => (
              <div key={i} className="card p-6 hover:shadow-lg transition rounded-2xl">
                <use.icon className="w-10 h-10 text-sky-600 mb-4" />
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{use.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{use.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Beneficios Comprobados</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">Resultados medibles para tu negocio</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-lg transition rounded-2xl">
                <benefit.icon className="w-12 h-12 text-sky-600 mx-auto mb-4" />
                <div className="text-3xl sm:text-4xl font-black text-sky-600 mb-2">{benefit.stat}</div>
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">{benefit.title}</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Planes Simples y Transparentes</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">Elige el plan perfecto para tu empresa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={cn(
                  'group relative rounded-2xl overflow-hidden transition-all duration-300',
                  plan.popular ? 'lg:scale-105' : ''
                )}
                onMouseEnter={() => setHoveredCard(i + 10)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                )}

                <div className={cn(
                  'card p-8 flex flex-col relative z-10 h-full rounded-2xl',
                  plan.popular ? 'border-2 border-sky-600 shadow-2xl' : 'border border-secondary-200 dark:border-secondary-700'
                )}>
                  {plan.popular && (
                    <div className="mb-4 inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-xs font-bold w-fit">
                      <Star className="w-3 h-3 inline mr-1 fill-current" />
                      MÁS POPULAR
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-6">{plan.description}</p>

                  <div className="mb-8">
                    <div className="text-4xl sm:text-5xl font-black text-sky-600 mb-1">{plan.price}</div>
                    <div className="text-secondary-600 dark:text-secondary-400 text-sm">{plan.period}</div>
                  </div>

                  <button
                    onClick={() => navigate('/signup')}
                    className={cn(
                      'w-full py-3 px-4 rounded-lg font-bold transition mb-8 flex items-center justify-center gap-2 group/btn',
                      plan.popular
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-lg'
                        : 'border-2 border-sky-600 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20'
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                  </button>

                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm text-secondary-700 dark:text-secondary-300">
                        <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">Empresas líderes confían en Oxisan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="card p-8 rounded-2xl hover:shadow-xl transition duration-300 flex flex-col"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-sky-300 mb-4" />

                <p className="text-secondary-700 dark:text-secondary-300 mb-6 flex-1 text-lg italic">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 50%), radial-gradient(circle at 70% 50%, white 0%, transparent 50%)' }} />
            <div className="relative p-12 sm:p-16 text-center text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                ¿Listo para revolucionar tu logística?
              </h2>
              <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto">
                Únete a las 500+ empresas que ya confían en Oxisan. Implementación en menos de 1 día. Sin tarjeta requerida.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-xl bg-white text-sky-700 font-black hover:bg-gray-50 transition shadow-xl inline-flex items-center justify-center gap-2 group"
                >
                  Comienza Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="px-8 py-4 rounded-xl border-2 border-white/50 hover:border-white text-white font-bold transition inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Ver Demo
                </button>
              </div>
              <p className="text-sky-200 text-sm mt-6">
                Sin tarjeta de crédito &nbsp;·&nbsp; Acceso inmediato &nbsp;·&nbsp; Soporte 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-secondary-900 dark:bg-black text-secondary-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  OX
                </div>
                <span className="font-bold text-white">Oxisan</span>
              </div>
              <p className="text-sm">La solución completa para logística de gases medicinales</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Precios</a></li>
                <li><a href="#" className="hover:text-white transition">Seguridad</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition">Términos</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-secondary-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Oxisan. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
