import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/services';

/** Fetches the first business owned by the current user (MVP: one business per owner). */
export function useMyBusiness() {
  const query = useQuery({
    queryKey: ['my-business'],
    queryFn: () => businessApi.mine(),
  });
  return {
    ...query,
    business: query.data?.[0] ?? null,
  };
}
