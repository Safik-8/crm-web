// src/features/leadstatuses/hooks/useLeadStatuses.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeadStatuses,
  createLeadStatus,
  updateLeadStatus,
  toggleLeadStatus,
  deleteLeadStatus,
  reorderLeadStatuses
} from '../services/leadStatusService';
import { toast } from '../../../shared/utils/toast';

export const LEAD_STATUS_KEYS = {
  all: ['lead-statuses'],
  lists: () => [...LEAD_STATUS_KEYS.all, 'list'],
  list: (params) => [...LEAD_STATUS_KEYS.lists(), params],
};

export const useLeadStatusesQuery = (params) => {
  return useQuery({
    queryKey: LEAD_STATUS_KEYS.list(params),
    queryFn: async () => {
      const res = await getLeadStatuses(params);
      return res?.data?.statuses || [];
    },
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
};

export const useCreateLeadStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeadStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_STATUS_KEYS.lists() });
      toast.success(res?.message || 'Lead status created successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      const msg = error?.statusCode === 400 && Array.isArray(error.details)
        ? error.details.map(d => d.message).join(' · ')
        : error?.message || 'Failed to create lead status';
      toast.error(msg);
    },
  });
};

export const useUpdateLeadStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLeadStatus(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_STATUS_KEYS.lists() });
      toast.success(res?.message || 'Lead status updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      const msg = error?.statusCode === 400 && Array.isArray(error.details)
        ? error.details.map(d => d.message).join(' · ')
        : error?.message || 'Failed to update lead status';
      toast.error(msg);
    },
  });
};

export const useToggleLeadStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLeadStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_STATUS_KEYS.lists() });
      toast.success(res?.message || 'Lead status status toggled successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      const msg = error?.statusCode === 400 && Array.isArray(error.details)
        ? error.details.map(d => d.message).join(' · ')
        : error?.message || 'Failed to toggle lead status status';
      toast.error(msg);
    },
  });
};

export const useDeleteLeadStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeadStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_STATUS_KEYS.lists() });
      toast.success(res?.message || 'Lead status deleted successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      const msg = error?.statusCode === 400 && Array.isArray(error.details)
        ? error.details.map(d => d.message).join(' · ')
        : error?.message || 'Failed to delete lead status';
      toast.error(msg);
    },
  });
};

export const useReorderLeadStatusesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderLeadStatuses,
    onMutate: async (newOrderItems) => {
      // Cancel active queries
      await queryClient.cancelQueries({ queryKey: LEAD_STATUS_KEYS.lists() });

      // Save snapshots for rollback
      const queries = queryClient.getQueriesData({ queryKey: LEAD_STATUS_KEYS.lists() });

      // Optimistic update
      queryClient.setQueriesData({ queryKey: LEAD_STATUS_KEYS.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        const mapped = old.map((status) => {
          const match = newOrderItems.find((i) => i.id === status.id);
          if (match) {
            return { ...status, sequenceOrder: match.sequenceOrder };
          }
          return status;
        });
        mapped.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        return mapped;
      });

      return { queries };
    },
    onError: (err, newOrder, context) => {
      // Rollback using snapshotted queries
      if (context?.queries) {
        context.queries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (err?.statusCode === 403) return;
      const msg = err?.statusCode === 400 && Array.isArray(err.details)
        ? err.details.map(d => d.message).join(' · ')
        : err?.message || 'Failed to reorder statuses';
      toast.error(msg);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_STATUS_KEYS.lists() });
      toast.success(res?.message || 'Lead statuses reordered successfully');
    },
  });
};
