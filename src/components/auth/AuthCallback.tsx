import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase maneja automáticamente el callback
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // Verificar si el usuario tiene perfil completo
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', data.session.user.id)
            .single();

          if (!profile || !profile.profile_completed) {
            // Redirigir a completar perfil
            navigate('/profile-completion');
          } else {
            // Redirigir al dashboard
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-secondary-600 dark:text-secondary-400">Conectando...</p>
      </div>
    </div>
  );
}
