import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Scissors, Image, Clock, Star, ArrowLeft, Eye, MapPin, CalendarDays, CalendarClock, Users, Boxes } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';

const items = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/dashboard/provider-agenda', label: 'Agenda Profissional', icon: CalendarClock },
  { to: '/dashboard/team', label: 'Equipe e Recursos', icon: Users },
  { to: '/dashboard/inventory', label: 'Estoque', icon: Boxes },
  { to: '/dashboard/business', label: 'Meu negócio', icon: Store },
  { to: '/dashboard/services', label: 'Serviços', icon: Scissors },
  { to: '/dashboard/photos', label: 'Fotos', icon: Image },
  { to: '/dashboard/hours', label: 'Horários', icon: Clock },
  { to: '/dashboard/reviews', label: 'Avaliações', icon: Star },
];

export function DashboardLayout() {
  const { business } = useMyBusiness();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="hidden text-lg font-extrabold text-slate-800 sm:block">Perto</span>
            </Link>
            <span className="hidden text-sm text-slate-400 sm:block">· Painel</span>
          </div>
          <div className="flex items-center gap-2">
            {business && (
              <button onClick={() => navigate(`/business/${business.id}`)} className="btn-secondary">
                <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Ver página pública</span>
              </button>
            )}
            <Link to="/explore" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Sair do painel</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-white'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="w-full min-w-0">
          <nav className="no-scrollbar mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
