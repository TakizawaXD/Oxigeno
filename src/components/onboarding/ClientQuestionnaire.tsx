import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import {
  Building2,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface ClientData {
  company_name: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  contact_person: string;
  website?: string;
  description: string;
  products: string[];
  target_market: string;
  business_stage: string;
  monthly_revenue?: number;
  employee_count?: number;
}

export function ClientQuestionnaire() {
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientData>({
    company_name: '',
    industry: '',
    address: '',
    phone: '',
    email: user?.email || '',
    contact_person: '',
    website: '',
    description: '',
    products: [],
    target_market: '',
    business_stage: 'growing',
    monthly_revenue: undefined,
    employee_count: undefined,
  });

  const industries = [
    'Salud',
    'Distribución',
    'Manufactura',
    'Retail',
    'Logística',
    'Tecnología',
    'Farmacia',
    'Otro',
  ];

  const products = [
    'Cilindros de Oxígeno',
    'Equipos Médicos',
    'Medicinas',
    'Suministros',
    'Repuestos',
    'Servicios',
  ];

  const targetMarkets = [
    'Hospitales',
    'Clínicas',
    'Farmacias',
    'Laboratorios',
    'Distribuidores',
    'Gobierno',
    'Empresas Privadas',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthly_revenue' || name === 'employee_count' ? parseInt(value) || 0 : value,
    }));
  };

  const handleProductToggle = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product],
    }));
  };

  const handleSubmit = async () => {
    if (!organization) return;

    setLoading(true);
    setError(null);

    try {
      // Guardar información del cliente
      const { data, error: insertError } = await supabase
        .from('client_questionnaires')
        .insert({
          organization_id: organization.id,
          user_id: user?.uid,
          company_name: formData.company_name,
          industry: formData.industry,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          contact_person: formData.contact_person,
          website: formData.website,
          description: formData.description,
          products: formData.products,
          target_market: formData.target_market,
          business_stage: formData.business_stage,
          monthly_revenue: formData.monthly_revenue,
          employee_count: formData.employee_count,
          completed_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar información');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.company_name && formData.industry && formData.address;
  const isStep2Valid = formData.phone && formData.email && formData.contact_person;
  const isStep3Valid = formData.products.length > 0 && formData.target_market && formData.description;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-secondary-900 dark:to-secondary-800 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
            Bienvenido a HealthLogix OS
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Cuéntanos sobre tu negocio para personalizar la plataforma
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold mb-2 transition-all',
                  currentStep >= step
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
                )}
              >
                {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
              </div>
              <span className="text-xs sm:text-sm font-medium text-secondary-600 dark:text-secondary-400">
                {step === 1 ? 'Empresa' : step === 2 ? 'Contacto' : 'Productos'}
              </span>
              {step < 3 && (
                <div
                  className={cn(
                    'hidden sm:block absolute left-1/2 top-6 w-20 h-1 -translate-x-1/2 translate-x-10',
                    currentStep > step ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400" />
              <p className="text-error-700 dark:text-error-300 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Company Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary-600" />
                Información de la Empresa
              </h2>

              <div>
                <label className="label">Nombre de la Empresa *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Ej: Mi Distribuidora"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Industria *</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Seleccionar industria</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Sitio Web (opcional)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Dirección *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Calle, ciudad, país"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Descripción del Negocio</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Cuéntanos sobre tu negocio..."
                  rows={4}
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary-600" />
                Información de Contacto
              </h2>

              <div>
                <label className="label">Nombre del Contacto *</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  placeholder="Nombre completo"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Teléfono *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Número de Empleados</label>
                  <input
                    type="number"
                    name="employee_count"
                    value={formData.employee_count || ''}
                    onChange={handleInputChange}
                    placeholder="Ej: 50"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Ingresos Mensuales Aproximados</label>
                  <input
                    type="number"
                    name="monthly_revenue"
                    value={formData.monthly_revenue || ''}
                    onChange={handleInputChange}
                    placeholder="USD"
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Products & Market */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" />
                Productos y Mercado
              </h2>

              <div>
                <label className="label mb-4 block">¿Qué productos vendes? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map(product => (
                    <button
                      key={product}
                      onClick={() => handleProductToggle(product)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left font-medium',
                        formData.products.includes(product)
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white hover:border-primary-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {formData.products.includes(product) && <CheckCircle2 className="w-5 h-5" />}
                        {product}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Mercado Objetivo *</label>
                <select
                  name="target_market"
                  value={formData.target_market}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Seleccionar mercado</option>
                  {targetMarkets.map(market => (
                    <option key={market} value={market}>
                      {market}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Etapa del Negocio</label>
                <select
                  name="business_stage"
                  value={formData.business_stage}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="startup">Startup</option>
                  <option value="growing">En Crecimiento</option>
                  <option value="established">Establecido</option>
                  <option value="mature">Maduro</option>
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3 sm:gap-4 justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="btn-secondary flex-1 sm:flex-none sm:px-6 disabled:opacity-50"
            >
              Anterior
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
                className="btn-primary flex-1 sm:flex-none sm:px-6 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid || loading}
                className="btn-primary flex-1 sm:flex-none sm:px-6 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Completar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-secondary-600 dark:text-secondary-400">
          <p>Puedes editar esta información más tarde en Configuración</p>
        </div>
      </div>
    </div>
  );
}
