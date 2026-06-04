import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/translations';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User, ArrowLeft, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export function SignupPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setLocalError(language === 'es' ? 'Debe aceptar los términos y condiciones' : 'You must accept the terms and conditions');
      return;
    }
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError(t.auth.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      setLocalError(t.auth.passwordLengthError);
      return;
    }

    try {
      await signUp(email, password, fullName, organizationName);
      navigate('/profile-completion');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleGoogleSignUp = async () => {
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
      console.error('Google sign up error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const displayError = localError || error;

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

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-semibold text-secondary-900 dark:text-white">{t.app.name}</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t.auth.createOrgTitle}</h2>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              {t.auth.getStartedFree}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <p className="text-sm text-error-600 dark:text-error-400">{displayError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="orgName" className="label">{t.auth.organizationName}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-secondary-400" />
                  </div>
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="input pl-10"
                    placeholder={language === 'es' ? 'Tu Hospital o Empresa' : 'Your Hospital or Company'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="label">{t.auth.fullName}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-secondary-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input pl-10"
                    placeholder={language === 'es' ? 'Juan Pérez' : 'John Smith'}
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder={language === 'es' ? 'Crea una contraseña' : 'Create a password'}
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

              <div>
                <label htmlFor="confirmPassword" className="label">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-secondary-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder={language === 'es' ? 'Confirma tu contraseña' : 'Confirm your password'}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t.auth.agreeTerms}{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">{t.auth.termsOfService}</a>
                  {' '}{t.auth.and}{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">{t.auth.privacyPolicy}</a>
                </label>
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
                  {t.auth.createAccount}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
                  {language === 'es' ? 'Registrarse con Google' : 'Sign up with Google'}
                </>
              )}
            </button>
          </form>

          <Link
            to="/login"
            className="w-full btn-ghost py-2.5 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.auth.backToSignIn}
          </Link>
        </div>
      </div>

      {/* Right side - Branding */}
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
            <h1 className="text-4xl font-bold leading-tight">
              {t.auth.completePlatform}
            </h1>
            <p className="text-lg text-primary-100 leading-relaxed">
              {t.auth.completePlatformDesc}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: t.navigation.assets, desc: t.auth.assetMgmtDesc },
              { title: t.navigation.orders, desc: t.auth.orderDeliveryDesc },
              { title: t.navigation.ai, desc: t.auth.aiOperationsDesc },
              { title: language === 'es' ? 'Seguimiento en Tiempo Real' : 'Real-time Tracking', desc: t.auth.realTimeTrackingDesc },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-medium">{feature.title}</div>
                  <div className="text-sm text-primary-200">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-primary-200">
          {t.auth.startFreeScale}
        </div>
      </div>
    </div>
  );
}
