import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/use-auth';
import { listArchivedLeftovers, restoreLeftover } from '@/modules/dashboard/leftover-api';

export function useHistory() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['history'],
    queryFn: listArchivedLeftovers,
    enabled: isAuthenticated,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreLeftover(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    restore: (id: string) => restoreMutation.mutate(id),
    restoringId: restoreMutation.variables ?? null,
  };
}
