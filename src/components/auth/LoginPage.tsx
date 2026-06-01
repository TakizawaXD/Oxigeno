import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/translations';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50/20 dark:from-secondary-950 dark:via-secondary-900 dark:to-primary-950/20 flex relative">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary-100/80 hover:bg-secondary-200 dark:bg-secondary-800/80 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-xl font-semibold text-sm transition-colors shadow-sm border border-secondary-250 dark:border-secondary-700/50"
          title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
        >
          <span>{language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}</span>
        </button>
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold">{t.app.name}</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight whitespace-pre-line">
              {language === 'es' ? 'Sistema Operativo de\nLogística Sanitaria' : 'Healthcare Logistics\nOperating System'}
            </h1>
            <p className="text-lg text-primary-100 leading-relaxed">
              {t.auth.platformDesc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t.auth.assetsTracked, value: '10M+' },
              { label: t.auth.dailyDeliveries, value: '50K+' },
              { label: t.auth.activeUsers, value: '25K+' },
              { label: t.auth.uptime, value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-primary-200">
          {t.auth.trustedWorldwide}
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-semibold text-secondary-900 dark:text-white">{t.app.name}</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t.auth.welcomeBack}</h2>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              {t.auth.signInToContinue}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">{t.auth.email}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">{t.auth.password}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-secondary-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder={language === 'es' ? 'Ingresa tu contraseña' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">{t.auth.rememberMe}</span>
                </label>
                <a href="#" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  {t.auth.forgotPassword}
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full btn-primary py-3 flex items-center justify-center gap-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="spinner-sm border-white/30" style={{ borderTopColor: 'white' }} />
              ) : (
                <>
                  {t.auth.signIn}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200 dark:border-secondary-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-secondary-50 dark:bg-secondary-950 text-secondary-500">{t.auth.newToHealthLogix}</span>
            </div>
          </div>

          <Link
            to="/signup"
            className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            {t.auth.createOrganization}
          </Link>
        </div>
      </div>
    </div>
  );
}
