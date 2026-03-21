import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/use-auth';
import { pocketbase } from '@/shared/api/pocketbase';
import { listArchivedLeftovers, summarizeArchivedLeftovers, type StatsPeriod } from '@/modules/stats/stats-api';

export function useStats(period: StatsPeriod) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const archivedLeftoversQuery = useQuery({
    queryKey: ['stats', 'archived-leftovers', period],
    queryFn: () => listArchivedLeftovers(period),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void pocketbase.collection('leftovers').subscribe('*', () => {
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    return () => {
      void pocketbase.collection('leftovers').unsubscribe('*');
    };
  }, [isAuthenticated, queryClient]);

  return {
    summary: summarizeArchivedLeftovers(archivedLeftoversQuery.data ?? [], period),
    isLoading: archivedLeftoversQuery.isLoading,
    isError: archivedLeftoversQuery.isError,
    error: archivedLeftoversQuery.error,
    refetch: archivedLeftoversQuery.refetch,
  };
}