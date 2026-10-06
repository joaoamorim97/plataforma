import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nContext';

export function NoBusiness() {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={Store}
      title={t('dash.registerBusiness')}
      description={t('dash.registerBusinessDesc')}
      action={
        <Link to="/dashboard/business" className="btn-primary">
          {t('dash.registerBusiness')}
        </Link>
      }
    />
  );
}
