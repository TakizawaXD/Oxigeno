import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import {
  User,
  Building2,
  Briefcase,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader,
  ChevronRight,
} from 'lucide-react';

interface ProfileFormData {
  full_name: string;
  company_name: string;
  industry: string;
  phone: string;
  position: string;
  company_size: string;
}

export function ProfileCompletionForm() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    company_name: '',
    industry: '',
    phone: '',
    position: '',
    company_size: '',
  });

  const industries = [
    'Salud',
    'Logística',
    'Manufactura',
    'Retail',
    'Tecnología',
    'Farmacia',
    'Distribución',
    'Otro',
  ];

  const positions = [
    'CEO/Founder',
    'Gerente General',
    'Director de Operaciones',
    'Gerente de Logística',
    'Administrador',
    'Otro',
  ];

  const companySizes = [
    '1-10 personas',
    '11-50 personas',
    '51-200 personas',
    '200-500 personas',
    '500+ personas',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Guardar perfil en Supabase
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.full_name,
          company_name: formData.company_name,
          industry: formData.industry,
          phone: formData.phone,
          position: formData.position,
          company_size: formData.company_size,
          auth_provider: user.user_metadata?.provider || 'email',
          profile_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.full_name.trim().length > 0;
  const isStep2Valid =
    formData.company_name.trim().length > 0 &&
    formData.industry &&
    formData.company_size;
  const isStep3Valid = formData.position && formData.phone.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-secondary-900 dark:to-secondary-800 p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
            Completa tu Perfil
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Necesitamos algunos datos para personalizar tu experiencia
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
              <span className="text-xs sm:text-sm font-medium text-secondary-600 dark:text-secondary-400 text-center">
                {step === 1 ? 'Personal' : step === 2 ? 'Empresa' : 'Contacto'}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
              <p className="text-error-700 dark:text-error-300 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-primary-600" />
                  Información Personal
                </h2>
              </div>

              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Posición en la Empresa *</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Seleccionar posición</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Company Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  Información de la Empresa
                </h2>
              </div>

              <div>
                <label className="label">Nombre de la Empresa *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Mi Empresa S.A."
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
                  <label className="label">Tamaño de Empresa *</label>
                  <select
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Seleccionar tamaño</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-primary-600" />
                  Información de Contacto
                </h2>
              </div>

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

              {/* Summary */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">
                  Resumen de Información
                </h3>
                <div className="space-y-2 text-sm text-secondary-700 dark:text-secondary-300">
                  <p>
                    <span className="font-medium">Nombre:</span> {formData.full_name}
                  </p>
                  <p>
                    <span className="font-medium">Posición:</span> {formData.position}
                  </p>
                  <p>
                    <span className="font-medium">Empresa:</span> {formData.company_name}
                  </p>
                  <p>
                    <span className="font-medium">Industria:</span> {formData.industry}
                  </p>
                  <p>
                    <span className="font-medium">Tamaño:</span> {formData.company_size}
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span> {formData.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3 sm:gap-4 justify-between">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="px-6 py-3 rounded-lg border-2 border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 text-secondary-900 dark:text-white font-medium transition"
              >
                Anterior
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid || loading}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {currentStep === 3 && (
            <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 text-center mt-4">
              Puedes editar esta información después en tu perfil
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
