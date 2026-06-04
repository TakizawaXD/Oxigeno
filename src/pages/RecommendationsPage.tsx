import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  ChevronDown,
  Activity,
  Shield,
  Users,
  AlertTriangle,
  Package,
  TrendingUp,
  CheckCircle2,
  Zap,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  fullDescription: string;
  impact: 'Crítica' | 'Alta' | 'Media';
  category: string;
  estimatedDays: string;
  icon: any;
  benefits: string[];
  implementation: string;
  color: string;
}

export function RecommendationsPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const recommendations: Recommendation[] = [
    {
      id: 1,
      title: 'Auditoría y Logging Completo',
      description: 'Registro de todas las acciones de usuarios y cambios de datos',
      fullDescription:
        'Implementa un sistema completo de auditoría que registre cada acción realizada en el sistema. Esto es crítico para cumplimiento regulatorio, investigación de incidentes y análisis de comportamiento de usuarios.',
      impact: 'Crítica',
      category: 'Compliance',
      estimatedDays: '3-4 días',
      icon: Activity,
      benefits: [
        'Cumplimiento HIPAA/GDPR',
        'Rastreo completo de cambios',
        'Investigación de incidentes',
        'Auditorías externas facilitadas',
      ],
      implementation: `
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH ROW EXECUTE audit_function();
      `,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 2,
      title: 'Encriptación de Datos Sensibles',
      description: 'Protección de información médica y financiera en reposo y tránsito',
      fullDescription:
        'Implementa encriptación end-to-end para todos los datos sensibles. Esto incluye datos médicos, financieros y personales de clientes. Usa Supabase Vault o encryption a nivel de aplicación.',
      impact: 'Crítica',
      category: 'Seguridad',
      estimatedDays: '2-3 días',
      icon: Lock,
      benefits: [
        'Cumplimiento HIPAA',
        'Protección de privacidad',
        'Confianza del cliente',
        'Cumplimiento normativo',
      ],
      implementation: `
// Usar Supabase Vault
const { data, error } = await supabase.rpc(
  'pgsodium.crypto_secretbox_encrypt',
  { plaintext: data, key: secret_key }
);

// O encriptar a nivel de aplicación
import crypto from 'crypto';
const encrypted = crypto.createCipher('aes-256-cbc', key);
      `,
      color: 'from-red-500 to-red-600',
    },
    {
      id: 3,
      title: 'Autenticación SSO (OAuth 2.0)',
      description: 'Login único con Google, Microsoft o Auth0',
      fullDescription:
        'Implementa Single Sign-On para reducir la gestión de credenciales y mejorar la seguridad. Integra con proveedores como Google Workspace, Microsoft Entra o Auth0.',
      impact: 'Alta',
      category: 'Seguridad',
      estimatedDays: '2-3 días',
      icon: Users,
      benefits: [
        'Mayor seguridad',
        'Gestión centralizada',
        'Mejor experiencia de usuario',
        'Cumplimiento normativo',
      ],
      implementation: `
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/auth/callback',
  },
})
      `,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 4,
      title: 'Rate Limiting y DDoS Protection',
      description: 'Protección contra ataques y abuso de API',
      fullDescription:
        'Implementa rate limiting en todos los endpoints y protección DDoS. Usa Cloudflare, API Gateway con rate limits o Redis counters.',
      impact: 'Alta',
      category: 'Estabilidad',
      estimatedDays: '1-2 días',
      icon: AlertTriangle,
      benefits: [
        'Disponibilidad garantizada',
        'Protección contra bots',
        'Estabilidad del servicio',
        'Prevención de abuso',
      ],
      implementation: `
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(100, '60 s'),
})

const { success } = await ratelimit.limit(userId)
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 })
}
      `,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 5,
      title: 'Backup Automático y Disaster Recovery',
      description: 'Estrategia de respaldo con RTO/RPO definidos',
      fullDescription:
        'Implementa backups diarios con réplica en región secundaria. Define Recovery Time Objective (RTO) y Recovery Point Objective (RPO). Supabase ya automatiza esto, pero debes configurarlo correctamente.',
      impact: 'Alta',
      category: 'Resiliencia',
      estimatedDays: '1-2 días',
      icon: Package,
      benefits: [
        'Recuperación ante desastres',
        'Continuidad de negocio',
        'Cumplimiento normativo',
        'Tranquilidad del cliente',
      ],
      implementation: `
// Configurar en Supabase:
- Backups diarios: HABILITADO
- Retención: 30 días
- Réplica automática: Habilitada
- Región secundaria: us-west-2
- RTO: < 4 horas
- RPO: < 24 horas
      `,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 6,
      title: 'Monitoreo, Alertas y APM',
      description: 'Monitoreo en tiempo real y análisis de performance',
      fullDescription:
        'Implementa Application Performance Monitoring (APM) con DataDog, New Relic o Sentry. Configura alertas para errores críticos, performance degraded, y anomalías.',
      impact: 'Media',
      category: 'Operaciones',
      estimatedDays: '2-3 días',
      icon: TrendingUp,
      benefits: [
        'Detección temprana de problemas',
        'SLA garantizado',
        'Análisis de causas raíz',
        'Optimización continua',
      ],
      implementation: `
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
      `,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      id: 7,
      title: 'Testing Exhaustivo (Unit, Integration, E2E)',
      description: 'Cobertura ≥80% con automatización en CI/CD',
      fullDescription:
        'Implementa suite de tests completa: unit tests, integration tests, y end-to-end tests. Automatiza en CI/CD pipeline para cada commit.',
      impact: 'Media',
      category: 'Confiabilidad',
      estimatedDays: '5-7 días',
      icon: CheckCircle2,
      benefits: [
        'Confiabilidad del código',
        'Detección temprana de bugs',
        'Refactoring seguro',
        'Documentación viva',
      ],
      implementation: `
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Assets', () => {
  it('should fetch assets for organization', async () => {
    const { data } = await fetchAssets(orgId)
    expect(data).toHaveLength(10)
    expect(data[0]).toHaveProperty('health_score')
  })
})
      `,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      id: 8,
      title: 'Caché Inteligente (Redis)',
      description: 'Reducir latencia con cache para datos frecuentes',
      fullDescription:
        'Implementa Redis para cachear datos frecuentes. Reduce latencia 10-100x y disminuye carga en la base de datos. Usa Redis Cloud o Upstash.',
      impact: 'Media',
      category: 'Performance',
      estimatedDays: '2-3 días',
      icon: Zap,
      benefits: [
        'Performance 10-100x más rápido',
        'Menor carga en BD',
        'Mejor UX',
        'Escalabilidad',
      ],
      implementation: `
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['assets', orgId],
  queryFn: fetchAssets,
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
})
      `,
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 9,
      title: 'API Rate Limiting y GraphQL Security',
      description: 'Validación de entrada y prevención de attacks',
      fullDescription:
        'Implementa validación robusta de entrada, prevención de inyección SQL, CSRF protection, y GraphQL-specific security measures como persisted queries.',
      impact: 'Media',
      category: 'Protección',
      estimatedDays: '2-3 días',
      icon: Shield,
      benefits: [
        'Protección contra inyección',
        'Prevención de abuso',
        'Validación automática',
        'Type safety',
      ],
      implementation: `
import { z } from 'zod'

const assetSchema = z.object({
  asset_number: z.string().min(3).max(50),
  status: z.enum(['available', 'maintenance', 'retired']),
  health_score: z.number().min(0).max(100),
})

const validated = assetSchema.parse(data)
      `,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 10,
      title: 'Documentación de Compliance',
      description: 'GDPR, HIPAA y normativas locales',
      fullDescription:
        'Documenta políticas de seguridad, privacidad y compliance. Prepara Data Processing Agreements (DPA), incident response plans, y security training.',
      impact: 'Media',
      category: 'Legal',
      estimatedDays: '3-5 días',
      icon: CheckCircle2,
      benefits: [
        'Claridad legal',
        'Confianza del cliente',
        'Auditorías exitosas',
        'Protección de negocio',
      ],
      implementation: `
Checklist de Compliance:
✅ Política de Privacidad (GDPR/HIPAA compatible)
✅ Términos de Servicio
✅ Data Processing Agreements (DPA)
✅ Incident Response Plan
✅ Security Training for Employees
✅ Regular Security Audits
✅ Encryption Standards Documentation
✅ Access Control Policies
      `,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/hero')}
            className="text-xl font-bold text-secondary-900 dark:text-white"
          >
            HealthLogix OS
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
          >
            Comenzar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
            10 Recomendaciones para Producción
          </h1>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Garantiza seguridad, performance y compliance con estas recomendaciones críticas. Tiempo total estimado: 20-25 días.
          </p>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="card overflow-hidden border-l-4" style={{ borderLeftColor: rec.color.split(' ')[1] }}>
              <button
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                className="w-full p-6 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', `bg-gradient-to-br ${rec.color}`)}>
                    <rec.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{rec.title}</h3>
                      <span className={cn('text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap', {
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': rec.impact === 'Crítica',
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400': rec.impact === 'Alta',
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': rec.impact === 'Media',
                      })}>
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-secondary-600 dark:text-secondary-400 line-clamp-2">{rec.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ChevronDown className={cn('w-5 h-5 text-secondary-400 transition', expandedId === rec.id && 'rotate-180')} />
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === rec.id && (
                <div className="px-6 pb-6 border-t border-secondary-200 dark:border-secondary-800 space-y-6">
                  <p className="text-secondary-700 dark:text-secondary-300">{rec.fullDescription}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Beneficios:</h4>
                      <ul className="space-y-1">
                        {rec.benefits.map((benefit, i) => (
                          <li key={i} className="text-sm text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-2">Tiempo Estimado:</div>
                      <div className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">{rec.estimatedDays}</div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                        {rec.category}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Ejemplo de Implementación:</h4>
                    <pre className="bg-secondary-100 dark:bg-secondary-800 p-4 rounded-lg overflow-x-auto text-xs text-secondary-700 dark:text-secondary-300">
                      <code>{rec.implementation}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="mt-16 p-8 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700">
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">Resumen de Priorización</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-900 dark:text-white">Prioridad</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-900 dark:text-white">Recomendación</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-900 dark:text-white">Impacto</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-900 dark:text-white">Días</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec, i) => (
                  <tr key={rec.id} className="border-b border-secondary-100 dark:border-secondary-700 last:border-0">
                    <td className="py-3 px-4 text-secondary-600 dark:text-secondary-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-secondary-900 dark:text-white">{rec.title}</td>
                    <td className="py-3 px-4">{rec.impact}</td>
                    <td className="py-3 px-4 text-secondary-600 dark:text-secondary-400">{rec.estimatedDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">¿Listo para implementar?</h3>
              <p className="text-primary-100">Contáctanos para una consultoría gratuita sobre cómo implementar estas recomendaciones</p>
            </div>
            <button
              onClick={() => navigate('/hero')}
              className="px-8 py-3 rounded-lg bg-white text-primary-700 font-semibold hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap"
            >
              Solicitar Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
