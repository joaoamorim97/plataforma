import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nContext';

export function LoginPage() {
  const { signIn, resetPassword, usingDemoAuth } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Bem-vindo de volta!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return toast.info('Informe seu e-mail para recuperar a senha.');
    try {
      await resetPassword(email);
      toast.success('Enviamos um link de recuperação para seu e-mail.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível recuperar a senha.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white px-4 py-8">
      <Link to="/" className="btn-ghost w-fit">
        <ArrowLeft className="h-4 w-4" /> {t('action.back')}
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <MapPin className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('login.email')}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="voce@email.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('login.password')}</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="button" onClick={handleReset} className="text-sm font-medium text-brand-600 hover:underline">
            {t('login.forgot')}
          </button>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Spinner className="h-4 w-4" />}
            {t('action.login')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            {t('action.register')}
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
