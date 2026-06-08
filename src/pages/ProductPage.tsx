import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  Smartphone,
  Cloud,
  Lock,
  TrendingUp,
  MapPin,
  FileText,
  Smartphone as Mobile,
  DollarSign,
  Star,
  Quote,
  Play,
  Sparkles,
} from 'lucide-react';

export function ProductPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const testimonials = [
    {
      name: 'Dr. Juan Martínez',
      role: 'CEO, Hospital Central',
      text: 'HealthLogix redujo nuestras operaciones en 40% y ahorramos $100K en el primer año.',
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
      icon: Package,
      title: 'Gestión de Activos',
      description: 'Seguimiento en tiempo real de todos tus recursos médicos y equipos con historial completo',
      color: 'from-blue-500 to-blue-600',
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
      description: 'Reportes detallados y predicciones inteligentes para optimizar operaciones',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Seguridad Máxima',
      description: 'Encriptación de datos y compliance total con HIPAA y regulaciones sanitarias',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Zap,
      title: 'Velocidad Extrema',
      description: 'Performance optimizado para máxima eficiencia en emergencias',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Trabajo en equipo fluido entre operadores, gerentes y administradores',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Aumento de Eficiencia',
      description: '40% menos tiempo en logística',
      stat: '+40%',
    },
    {
      icon: Clock,
      title: 'Reducción de Tiempos',
      description: 'Entregas 30% más rápidas',
      stat: '-30%',
    },
    {
      icon: AlertCircle,
      title: 'Menos Errores',
      description: '99.9% precisión en entregas',
      stat: '99.9%',
    },
    {
      icon: DollarSign,
      title: 'ROI Comprobado',
      description: 'Retorno en 3-6 meses',
      stat: '3-6m',
    },
  ];

  const useCases = [
    {
      title: 'Hospitales',
      description: 'Gestión de equipos médicos, farmacias y material quirúrgico',
      icon: Activity,
    },
    {
      title: 'Clínicas Privadas',
      description: 'Control de inventario y facturas de servicios',
      icon: Package,
    },
    {
      title: 'Laboratorios',
      description: 'Trazabilidad de muestras y equipos especializados',
      icon: BarChart3,
    },
    {
      title: 'Distribuidoras',
      description: 'Gestión de flota y rutas de entrega optimizadas',
      icon: Truck,
    },
  ];

  const pricingPlans = [
    {
      name: 'Startup',
      price: '$99',
      period: '/mes',
      description: 'Para pequeñas clínicas',
      features: [
        'Hasta 5 usuarios',
        'Gestión de 100 activos',
        'Soporte por email',
        'Backups diarios',
        'Facturas básicas',
      ],
      cta: 'Comenzar Gratis',
    },
    {
      name: 'Profesional',
      price: '$299',
      period: '/mes',
      description: 'Para medianas empresas',
      popular: true,
      features: [
        'Hasta 25 usuarios',
        'Activos ilimitados',
        'Soporte prioritario 24/7',
        'Análisis avanzado',
        'Facturas profesionales con PDF',
        'API access',
        'Integraciones',
      ],
      cta: 'Elegir Plan',
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes organizaciones',
      features: [
        'Usuarios ilimitados',
        'Activos ilimitados',
        'Soporte dedicado',
        'Análisis IA avanzado',
        'Integraciones personalizadas',
        'On-premise option',
        'SLA garantizado 99.9%',
      ],
      cta: 'Contactar Ventas',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold">
              HL
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white">HealthLogix OS</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
            >
              Comenzar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative min-h-screen pt-32 pb-20 bg-gradient-to-b from-primary-50 to-white dark:from-secondary-900 dark:to-secondary-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.3), transparent 50%)',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium mb-4">
                  🚀 Solución #1 en Logística Sanitaria
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-secondary-900 dark:text-white leading-tight">
                  Logística Sanitaria
                  <span className="block bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">
                    Simplificada
                  </span>
                </h1>
              </div>

              <p className="text-xl text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-lg">
                La plataforma integral que revoluciona la gestión de activos, órdenes y logística para empresas sanitarias. Ahorra tiempo, dinero y vidas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition flex items-center justify-center gap-2 group"
                >
                  Prueba Gratis 14 Días
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="px-8 py-4 rounded-lg border-2 border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 font-semibold transition"
                >
                  Ver Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-secondary-200 dark:border-secondary-700">
                {[
                  { number: '500+', label: 'Empresas' },
                  { number: '50K+', label: 'Usuarios' },
                  { number: '99.9%', label: 'Uptime' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-primary-600">{stat.number}</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative h-96 lg:h-full hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-cyan-400/20 rounded-3xl blur-3xl" />
              <div className="relative h-full rounded-3xl bg-gradient-to-br from-primary-600 to-cyan-600 p-8 text-white flex flex-col items-center justify-center">
                <Activity className="w-24 h-24 mb-4 opacity-80" />
                <p className="text-center text-lg font-semibold">Sistema en Tiempo Real</p>
                <p className="text-center text-primary-100 text-sm mt-2">Gestión completa de logística sanitaria</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Características Poderosas
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Todo lo que necesitas en una sola plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="card p-8 h-full hover:shadow-xl transition duration-300">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br mb-6 flex items-center justify-center group-hover:scale-110 transition ${feature.color}`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Para Quién Es
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Soluciones adaptadas a tu industria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((use, i) => (
              <div key={i} className="card p-6 hover:shadow-lg transition">
                <use.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {use.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                  {use.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Beneficios Comprobados
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Resultados medibles para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-lg transition">
                <benefit.icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {benefit.stat}
                </div>
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Planes Simple y Transparente
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Elige el plan perfecto para tu empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-300 ${
                  plan.popular ? 'lg:scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredCard(i + 10)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                )}

                <div className={`card p-8 flex flex-col relative z-10 h-full ${
                  plan.popular ? 'border-2 border-primary-600 shadow-2xl' : 'border-2 border-secondary-200 dark:border-secondary-700'
                }`}>
                  {plan.popular && (
                    <div className="mb-4 inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary-600 to-cyan-600 text-white text-xs font-bold w-fit">
                      <Star className="w-3 h-3 inline mr-1 fill-current" />
                      MÁS POPULAR
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-8">
                    <div className="text-5xl font-bold text-primary-600 mb-1">
                      {plan.price}
                    </div>
                    <div className="text-secondary-600 dark:text-secondary-400 text-sm">
                      {plan.period}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/signup')}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition mb-8 flex items-center justify-center gap-2 group/btn ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-700 hover:to-cyan-700 text-white shadow-lg'
                        : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                  </button>

                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm text-secondary-700 dark:text-secondary-300">
                        <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
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

      {/* Testimonios */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Empresas líderes confían en HealthLogix OS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="card p-8 rounded-2xl hover:shadow-xl transition duration-300 flex flex-col"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(testimonial.stars)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-warning-400 text-warning-400" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-primary-300 mb-4" />

                <p className="text-secondary-700 dark:text-secondary-300 mb-6 flex-1 text-lg italic">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-cyan-600 to-primary-600 opacity-100" />
            <div className="relative p-12 sm:p-16 text-center text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl font-bold mb-4">
                ¿Listo para Revolucionar tu Logística?
              </h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                Únete a las 500+ empresas que ya confían en HealthLogix OS.
                Implementación en menos de 1 hora. Sin tarjeta requerida.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-lg bg-white text-primary-700 font-bold hover:bg-gray-50 transition inline-flex items-center justify-center gap-2 group"
                >
                  Comienza Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="px-8 py-4 rounded-lg border-2 border-white text-white font-bold hover:bg-white/10 transition inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Ver Demo
                </button>
              </div>
              <p className="text-primary-100 text-sm mt-6">
                ✓ Sin tarjeta de crédito • ✓ Acceso inmediato • ✓ Soporte 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 dark:bg-black text-secondary-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  HL
                </div>
                <span className="font-bold text-white">HealthLogix OS</span>
              </div>
              <p className="text-sm">La solución completa para logística sanitaria</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Características</a></li>
                <li><a href="#" className="hover:text-white transition">Precios</a></li>
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
            <p>&copy; 2024 HealthLogix OS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
