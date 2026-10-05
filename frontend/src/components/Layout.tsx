import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Compass, Heart, Home, Map, MapPin, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/map', label: 'Mapa', icon: Map },
  { to: '/favorites', label: 'Favoritos', icon: Heart },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function Layout() {
  const { isAuthenticated, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Desktop / top header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">Perto</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {profile?.role === 'BUSINESS_OWNER' && (
                  <Link to="/dashboard" className="btn-secondary hidden sm:inline-flex">
                    <LayoutDashboard className="h-4 w-4" />
                    Painel
                  </Link>
                )}
                <Link to="/profile" className="hidden items-center gap-2 sm:flex">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {(profile?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </Link>
                <button onClick={handleSignOut} className="btn-ghost hidden sm:inline-flex" aria-label="Sair">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Entrar
                </Link>
                <Link to="/register" className="btn-primary">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur md:hidden pb-safe">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
