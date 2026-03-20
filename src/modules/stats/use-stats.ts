import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/use-auth';
import { pocketbase } from '@/shared/api/pocketbase';
import { listArchivedLeftovers, summarizeArchivedLeftovers, type StatsPeriod } from '@/modules/stats/stats-api';

export function useStats(period: StatsPeriod) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const archivedLeftoversQuery = useQuery({
    queryKey: ['stats', 'archived-leftovers'],
    queryFn: listArchivedLeftovers,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void pocketbase.collection('leftovers').subscribe('*', () => {
      void queryClient.invalidateQueries({ queryKey: ['stats', 'archived-leftovers'] });
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