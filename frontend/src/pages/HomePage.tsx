import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Sparkles, LayoutDashboard, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { FullSpinner } from '@/components/ui/Feedback';

/**
 * Página de entrada. A plataforma deixou de ser uma vitrine pública de descoberta;
 * agora é uma ferramenta de gestão. Usuários autenticados são direcionados para a
 * sua área (admin ou painel do dono); visitantes veem o acesso.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && profile) {
      if (profile.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (profile.role === 'BUSINESS_OWNER') navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, profile, loading, navigate]);

  if (loading) return <FullSpinner label={t('common.loading')} />;

  return (
    <div className="mx-auto max-w-3xl">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="relative z-10">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {t('home.badge')}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Gerencie seus negócios em um só lugar.
          </h1>
          <p className="mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Agenda, profissionais, serviços, estoque e página pública para seus clientes agendarem.
          </p>

          {isAuthenticated ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {profile?.role === 'ADMIN' && (
                <Link to="/admin" className="btn inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">
                  <ShieldCheck className="h-4 w-4" /> Painel do administrador
                </Link>
              )}
              <Link to="/dashboard" className="btn inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/25">
                <LayoutDashboard className="h-4 w-4" /> {t('nav.panel')}
              </Link>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="btn inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">
                <LogIn className="h-4 w-4" /> {t('action.login')}
              </Link>
              <Link to="/register" className="btn inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/25">
                <UserPlus className="h-4 w-4" /> {t('action.register')}
              </Link>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-white/5" />
        <MapPin className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 text-white/20" />
      </section>
    </div>
  );
}
