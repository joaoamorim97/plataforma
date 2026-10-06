import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store, User, LayoutDashboard, CalendarCheck, Heart } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { profileApi } from '@/lib/services';
import { Spinner } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nContext';
import type { UserRole } from '@/types';

export function ProfilePage() {
  const { profile, email, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? '');
      setRole(profile.role);
    }
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      await profileApi.update({ name, phone, role, email: profile?.email });
      await refreshProfile();
      toast.success(t('profile.updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
          {(name || 'U').charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{name || t('profile.title')}</h1>
          <p className="text-sm text-slate-500">{email || profile?.email}</p>
        </div>
      </div>

      {role === 'BUSINESS_OWNER' && (
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
          <LayoutDashboard className="h-4 w-4" /> {t('profile.goPanel')}
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/bookings')} className="btn-secondary">
          <CalendarCheck className="h-4 w-4" /> {t('profile.myBookings')}
        </button>
        <button onClick={() => navigate('/favorites')} className="btn-secondary">
          <Heart className="h-4 w-4" /> {t('profile.favorites')}
        </button>
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.phone')}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="(11) 99999-9999" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.accountType')}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium ${
                role === 'CUSTOMER' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              <User className="h-4 w-4" /> {t('profile.customer')}
            </button>
            <button
              type="button"
              onClick={() => setRole('BUSINESS_OWNER')}
              className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium ${
                role === 'BUSINESS_OWNER' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Store className="h-4 w-4" /> {t('profile.owner')}
            </button>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />}
          {t('profile.save')}
        </button>
      </div>

      <button onClick={handleSignOut} className="btn-secondary w-full text-red-600">
        <LogOut className="h-4 w-4" /> {t('profile.logout')}
      </button>
    </div>
  );
}
