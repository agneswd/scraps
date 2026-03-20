import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateLeftoverStatus, listActiveLeftovers, type LeftoverRecord } from '@/modules/dashboard/leftover-api';
import { pocketbase } from '@/shared/api/pocketbase';
import { useAuth } from '@/modules/auth/use-auth';
import type { LeftoverStatus } from '@/modules/dashboard/expiry-utils';

type UpdateStatusArgs = {
  id: string;
  status: Exclude<LeftoverStatus, 'active'>;
};

export function useLeftovers() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const leftoversQuery = useQuery({
    queryKey: ['leftovers'],
    queryFn: listActiveLeftovers,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void pocketbase.collection('leftovers').subscribe('*', () => {
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
    });

    return () => {
      void pocketbase.collection('leftovers').unsubscribe('*');
    };
  }, [isAuthenticated, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: UpdateStatusArgs) => updateLeftoverStatus(id, status),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['leftovers'] });

      const previousLeftovers = queryClient.getQueryData<LeftoverRecord[]>(['leftovers']);

      queryClient.setQueryData<LeftoverRecord[]>(['leftovers'], (currentLeftovers = []) =>
        currentLeftovers.filter((leftover) => leftover.id !== id),
      );

      return { previousLeftovers };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousLeftovers) {
        return;
      }

      queryClient.setQueryData(['leftovers'], context.previousLeftovers);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
    },
  });

  return {
    leftovers: leftoversQuery.data ?? [],
    isLoading: leftoversQuery.isLoading,
    isError: leftoversQuery.isError,
    error: leftoversQuery.error,
    refetch: leftoversQuery.refetch,
    markConsumed: (id: string) => updateStatusMutation.mutate({ id, status: 'consumed' }),
    markWasted: (id: string) => updateStatusMutation.mutate({ id, status: 'wasted' }),
    updatingId: updateStatusMutation.variables?.id ?? null,
  };
}
