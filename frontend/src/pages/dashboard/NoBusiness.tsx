import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';

export function NoBusiness() {
  return (
    <EmptyState
      icon={Store}
      title="Cadastre seu negócio"
      description="Você ainda não tem um negócio cadastrado. Crie o seu para começar a aparecer para os clientes."
      action={
        <Link to="/dashboard/business" className="btn-primary">
          Cadastrar negócio
        </Link>
      }
    />
  );
}
