import { Link, Outlet, useNavigate } from 'react-router-dom';
import { MapPin, LogOut, LayoutDashboard, ShieldCheck, CalendarCheck, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Layout() {
  const { isAuthenticated, profile, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = profile?.role === 'ADMIN';
  const isOwner = profile?.role === 'BUSINESS_OWNER';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">Perto</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="btn-secondary hidden sm:inline-flex">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                {isOwner && (
                  <Link to="/dashboard" className="btn-secondary hidden sm:inline-flex">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('nav.panel')}
                  </Link>
                )}
                <Link to="/bookings" className="btn-ghost hidden sm:inline-flex" title={t('profile.myBookings')}>
                  <CalendarCheck className="h-4 w-4" />
                </Link>
                <Link to="/profile" className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {(profile?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </Link>
                <button onClick={handleSignOut} className="btn-ghost hidden sm:inline-flex" aria-label={t('action.logout')}>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  {t('action.login')}
                </Link>
                <Link to="/register" className="btn-primary">
                  {t('action.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
        <Outlet />
      </main>

      {/* Navegação inferior mínima no mobile para usuários autenticados */}
      {isAuthenticated && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur sm:hidden pb-safe">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {isAdmin && (
              <MobileLink to="/admin" icon={ShieldCheck} label="Admin" />
            )}
            {isOwner && (
              <MobileLink to="/dashboard" icon={LayoutDashboard} label={t('nav.panel')} />
            )}
            <MobileLink to="/bookings" icon={CalendarCheck} label={t('nav.bookings')} />
            <MobileLink to="/profile" icon={User} label={t('nav.profile')} />
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileLink({ to, icon: Icon, label }: { to: string; icon: typeof User; label: string }) {
  return (
    <Link to={to} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500">
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
