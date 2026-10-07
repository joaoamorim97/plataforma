import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Lock, User, ArrowLeft, Search, Store, Check } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nContext';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const { signUp, usingDemoAuth } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      toast.success('Conta criada com sucesso!');
      navigate(role === 'BUSINESS_OWNER' ? '/dashboard/business' : '/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white px-4 py-8">
      <Link to="/" className="btn-ghost w-fit">
        <ArrowLeft className="h-4 w-4" /> {t('action.back')}
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <MapPin className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('register.subtitle')}</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <RoleCard
            active={role === 'CUSTOMER'}
            onClick={() => setRole('CUSTOMER')}
            icon={<Search className="h-5 w-5" />}
            title={t('register.asCustomer')}
          />
          <RoleCard
            active={role === 'BUSINESS_OWNER'}
            onClick={() => setRole('BUSINESS_OWNER')}
            icon={<Store className="h-5 w-5" />}
            title={t('register.asOwner')}
          />
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <Field icon={<User className="h-4 w-4" />} label={t('common.name')}>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input pl-10"
              placeholder={t('common.name')}
            />
          </Field>
          <Field icon={<Mail className="h-4 w-4" />} label={t('login.email')}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="voce@email.com"
            />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />} label={t('login.password')}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              placeholder={t('register.passwordHint')}
            />
          </Field>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Spinner className="h-4 w-4" />}
            {t('action.register')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            {t('action.login')}
          </Link>
        </p>

        {usingDemoAuth && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
            {t('login.demoNotice')}
          </p>
        )}
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-4 text-left transition ${
        active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
      <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </span>
      <span className="block text-sm font-semibold text-slate-800">{title}</span>
    </button>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
