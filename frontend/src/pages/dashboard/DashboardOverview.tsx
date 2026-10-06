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
import { useI18n } from '@/i18n/I18nContext';
import { formatPrice } from '@/lib/format';

export function DashboardOverview() {
  const { business, isLoading } = useMyBusiness();
  const { t } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', business?.id],
    queryFn: () => dashboardApi.stats(business!.id),
    enabled: Boolean(business),
  });

  if (isLoading) return <FullSpinner label={t('common.loading')} />;
  if (!business) return <NoBusiness />;

  const kpis = [
    { label: t('dash.revenue'), value: formatPrice(stats?.estimatedRevenue ?? 0), icon: DollarSign, to: '/dashboard/agenda', accent: 'text-emerald-600' },
    { label: t('dash.appointments'), value: stats?.totalAppointments ?? 0, icon: CalendarDays, to: '/dashboard/agenda', accent: 'text-brand-600' },
    { label: t('dash.upcoming'), value: stats?.upcomingAppointments ?? 0, icon: CalendarClock, to: '/dashboard/agenda', accent: 'text-brand-600' },
    { label: t('dash.providers'), value: stats?.providers ?? 0, icon: Users, to: '/dashboard/team', accent: 'text-slate-800' },
    { label: t('dash.resources'), value: stats?.resources ?? 0, icon: Armchair, to: '/dashboard/team', accent: 'text-slate-800' },
    { label: t('dash.catalog'), value: stats?.catalogServices ?? business.services.length, icon: Scissors, to: '/dashboard/services', accent: 'text-slate-800' },
    { label: t('dash.inventoryItems'), value: stats?.inventoryItems ?? 0, icon: Boxes, to: '/dashboard/inventory', accent: 'text-blue-600' },
    { label: t('dash.rating'), value: (stats?.rating ?? business.rating).toFixed(1), icon: Star, to: '/dashboard/reviews', accent: 'text-amber-500' },
  ];

  const lowStock = stats?.lowStockItems ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{business.name}</h1>
          <p className="text-sm text-slate-500">
            {t(business.category === 'BARBER' ? 'cat.barbers' : 'cat.hairdressers')} · {business.active ? t('dash.active') : t('dash.inactive')}
          </p>
        </div>
        <Link to={`/business/${business.id}`} className="btn-secondary">
          <Eye className="h-4 w-4" /> {t('dash.viewPublic')}
        </Link>
      </div>

      {lowStock > 0 && (
        <Link to="/dashboard/inventory" className="flex items-center gap-3 rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {lowStock} {lowStock === 1 ? t('dash.lowStockItem') : t('dash.lowStockItems2')} {t('dash.lowStockAlert')}
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
        <QuickLink to="/dashboard/agenda" icon={CalendarDays} title={t('dash.agenda')} desc={t('dash.ql.agendaDesc')} />
        <QuickLink to="/dashboard/provider-agenda" icon={CalendarClock} title={t('dash.providerAgenda')} desc={t('dash.ql.providerAgendaDesc')} />
        <QuickLink to="/dashboard/team" icon={Users} title={t('dash.team')} desc={t('dash.ql.teamDesc')} />
        <QuickLink to="/dashboard/inventory" icon={Boxes} title={t('dash.inventory')} desc={t('dash.ql.inventoryDesc')} />
        <QuickLink to="/dashboard/services" icon={Scissors} title={t('dash.services')} desc={t('dash.ql.servicesDesc')} />
        <QuickLink to="/dashboard/photos" icon={Image} title={t('dash.photos')} desc={t('dash.ql.photosDesc')} />
        <QuickLink to="/dashboard/hours" icon={Clock} title={t('dash.hours')} desc={t('dash.ql.hoursDesc')} />
        <QuickLink to="/dashboard/business" icon={Eye} title={t('dash.myBusiness')} desc={t('dash.ql.businessDesc')} />
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
