import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star, Scissors, Image, Clock, Eye, CalendarDays, CalendarClock, Users, Boxes,
  DollarSign, AlertTriangle, Armchair,
} from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { dashboardApi } from '@/lib/services';
import { FullSpinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { CATEGORY_LABELS } from '@/types';
import { formatPrice } from '@/lib/format';

export function DashboardOverview() {
  const { business, isLoading } = useMyBusiness();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', business?.id],
    queryFn: () => dashboardApi.stats(business!.id),
    enabled: Boolean(business),
  });

  if (isLoading) return <FullSpinner label="Carregando painel..." />;
  if (!business) return <NoBusiness />;

  const kpis = [
    { label: 'Receita estimada', value: formatPrice(stats?.estimatedRevenue ?? 0), icon: DollarSign, to: '/dashboard/agenda', accent: 'text-emerald-600' },
    { label: 'Agendamentos', value: stats?.totalAppointments ?? 0, icon: CalendarDays, to: '/dashboard/agenda', accent: 'text-brand-600' },
    { label: 'Próximos', value: stats?.upcomingAppointments ?? 0, icon: CalendarClock, to: '/dashboard/agenda', accent: 'text-brand-600' },
    { label: 'Profissionais', value: stats?.providers ?? 0, icon: Users, to: '/dashboard/team', accent: 'text-slate-800' },
    { label: 'Recursos', value: stats?.resources ?? 0, icon: Armchair, to: '/dashboard/team', accent: 'text-slate-800' },
    { label: 'Catálogo', value: stats?.catalogServices ?? business.services.length, icon: Scissors, to: '/dashboard/services', accent: 'text-slate-800' },
    { label: 'Itens em estoque', value: stats?.inventoryItems ?? 0, icon: Boxes, to: '/dashboard/inventory', accent: 'text-blue-600' },
    { label: 'Avaliação', value: (stats?.rating ?? business.rating).toFixed(1), icon: Star, to: '/dashboard/reviews', accent: 'text-amber-500' },
  ];

  const lowStock = stats?.lowStockItems ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{business.name}</h1>
          <p className="text-sm text-slate-500">
            {CATEGORY_LABELS[business.category]} · {business.active ? 'Ativo' : 'Inativo'}
          </p>
        </div>
        <Link to={`/business/${business.id}`} className="btn-secondary">
          <Eye className="h-4 w-4" /> Ver página pública
        </Link>
      </div>

      {lowStock > 0 && (
        <Link to="/dashboard/inventory" className="flex items-center gap-3 rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {lowStock} {lowStock === 1 ? 'item está' : 'itens estão'} com estoque baixo. Toque para repor.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((s) => (
          <Link key={s.label} to={s.to} className="card p-5 transition hover:shadow-card-hover">
            <s.icon className={`h-5 w-5 ${s.accent}`} />
            <p className={`mt-3 text-2xl font-black ${s.accent}`}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink to="/dashboard/agenda" icon={CalendarDays} title="Agenda" desc="Agendar e ver a grade do dia" />
        <QuickLink to="/dashboard/provider-agenda" icon={CalendarClock} title="Agenda profissional" desc="Compromissos por profissional" />
        <QuickLink to="/dashboard/team" icon={Users} title="Equipe e recursos" desc="Profissionais e recursos" />
        <QuickLink to="/dashboard/inventory" icon={Boxes} title="Estoque" desc="Insumos e revenda" />
        <QuickLink to="/dashboard/services" icon={Scissors} title="Serviços" desc="Preços e durações" />
        <QuickLink to="/dashboard/photos" icon={Image} title="Fotos" desc="Capa e galeria" />
        <QuickLink to="/dashboard/hours" icon={Clock} title="Horários" desc="Dias e horários de funcionamento" />
        <QuickLink to="/dashboard/business" icon={Eye} title="Dados do negócio" desc="Endereço, contato, localização" />
      </section>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: typeof Eye; title: string; desc: string }) {
  return (
    <Link to={to} className="card flex items-center gap-4 p-4 transition hover:shadow-card-hover">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
