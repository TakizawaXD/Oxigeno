import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/translations';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { signIn, isLoading, error, clearError, user, organization } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user && organization) {
      navigate('/dashboard');
    }
  }, [user, organization, navigate]);

  // Cargar credenciales guardadas
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberMe_email');
    const savedPassword = localStorage.getItem('rememberMe_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Guardar credenciales si Remember Me está activado
    if (rememberMe) {
      localStorage.setItem('rememberMe_email', email);
      localStorage.setItem('rememberMe_password', password);
    } else {
      localStorage.removeItem('rememberMe_email');
      localStorage.removeItem('rememberMe_password');
    }

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setGoogleLoading(false);
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
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
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

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3 rounded-xl border-2 border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {language === 'es' ? 'Conectando...' : 'Connecting...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200 dark:border-secondary-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-secondary-50 dark:bg-secondary-950 text-secondary-500">{t.auth.newToOxisan}</span>
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
