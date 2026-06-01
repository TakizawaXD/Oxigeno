import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await signUp(email, password, fullName, organizationName);
      navigate('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50/20 dark:from-secondary-950 dark:via-secondary-900 dark:to-primary-950/20 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-semibold text-secondary-900 dark:text-white">HealthLogix OS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Create your organization</h2>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              Get started with your free account today
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
                <label htmlFor="orgName" className="label">Organization name</label>
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
                    placeholder="Your Hospital or Company"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="label">Full name</label>
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
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label">Email address</label>
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
                <label htmlFor="password" className="label">Password</label>
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
                    placeholder="Create a password"
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
                <label htmlFor="confirmPassword" className="label">Confirm password</label>
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
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-secondary-600 dark:text-secondary-400">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full btn-primary py-3",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="spinner-sm border-white/30" style={{ borderTopColor: 'white' }} />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <Link
            to="/login"
            className="w-full btn-ghost py-2.5 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
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
            <span className="text-xl font-semibold">HealthLogix OS</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Complete Healthcare<br />Logistics Platform
            </h1>
            <p className="text-lg text-primary-100 leading-relaxed">
              Manage oxygen cylinders, medical equipment, assets, orders, deliveries,
              fleet, and operations with AI-powered intelligence.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Asset Management', desc: 'Track any asset type with digital twin' },
              { title: 'Order & Delivery', desc: 'Complete order lifecycle management' },
              { title: 'AI Operations', desc: 'Predictive intelligence and automation' },
              { title: 'Real-time Tracking', desc: 'Live fleet and telemetry monitoring' },
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
          Start free, scale as you grow
        </div>
      </div>
    </div>
  );
}
