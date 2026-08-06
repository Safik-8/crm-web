// src/features/opportunities/hooks/useOpportunities.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  closeOpportunity,
} from '../services/opportunityService';
import { toast } from '../../../shared/utils/toast';

export const OPPORTUNITY_KEYS = {
  all: ['opportunities'],
  lists: () => [...OPPORTUNITY_KEYS.all, 'list'],
  list: (params) => [...OPPORTUNITY_KEYS.lists(), params],
  details: () => [...OPPORTUNITY_KEYS.all, 'detail'],
  detail: (id) => [...OPPORTUNITY_KEYS.details(), id],
};

/**
 * Hook to fetch paginated list of opportunities
 */
export const useOpportunitiesQuery = (params = {}) => {
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.list(params),
    queryFn: async () => {
      const res = await getOpportunities(params);
      const rawData = res?.data || res;
      const items = Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(res?.items)
        ? res.items
        : [];
      return {
        items,
        pagination: rawData?.pagination || res?.pagination || { total: items.length, page: 1, limit: 100, totalPages: 1 },
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
};

/**
 * Hook to fetch a single opportunity by ID
 */
export const useOpportunityDetailQuery = (id) => {
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.detail(id),
    queryFn: async () => {
      const res = await getOpportunityById(id);
      return res?.data || null;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new Opportunity
 */
export const useCreateOpportunityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOpportunity,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(res?.message || 'Opportunity created successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403 || error?.status === 403) return;
      let msg = '';
      if (Array.isArray(error?.details) && error.details.length > 0) {
        msg = error.details.map((d) => d.message || d.msg || d).join(' · ');
      }
      if (!msg && typeof error?.message === 'string' && error.message.trim()) {
        msg = error.message;
      }
      if (!msg) {
        msg = 'Failed to process request';
      }
      toast.error(msg);
    },
  });
};

/**
 * Hook to update an existing Opportunity
 */
export const useUpdateOpportunityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateOpportunity(id, data),
    onSuccess: (res, variables) => {
      const updatedData = res?.data?.opportunity || res?.data || res?.opportunity || res;

      // INSTANTLY update detail cache so stepper & metrics re-render at 0ms delay!
      if (updatedData) {
        queryClient.setQueryData(OPPORTUNITY_KEYS.detail(variables.id), (old) => {
          if (!old) return updatedData;
          return {
            ...old,
            ...updatedData,
            stage: updatedData.stage || old.stage,
            stageHistory: updatedData.stageHistory || old.stageHistory,
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.detail(variables.id) });
      toast.success(res?.message || 'Opportunity updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      let msg = '';
      if (Array.isArray(error?.details) && error.details.length > 0) {
        msg = error.details.map((d) => d.message || d.msg || d).join(' · ');
      }
      if (!msg && typeof error?.message === 'string' && error.message.trim()) {
        msg = error.message;
      }
      if (!msg && typeof error?.data?.message === 'string') {
        msg = error.data.message;
      }
      if (!msg) {
        msg = 'Failed to update opportunity';
      }
      toast.error(msg);
    },
  });
};

/**
 * Hook to close an Opportunity (WON / LOST / CANCELLED)
 */
export const useCloseOpportunityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => closeOpportunity(id, data),
    onSuccess: (res, variables) => {
      const updatedData = res?.data?.opportunity || res?.data || res?.opportunity || res;

      // INSTANT 0ms cache update for detail view
      if (updatedData) {
        queryClient.setQueryData(OPPORTUNITY_KEYS.detail(variables.id), (old) => {
          if (!old) return updatedData;
          return {
            ...old,
            ...updatedData,
            status: updatedData.status || old.status,
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.detail(variables.id) });
      toast.success(res?.message || 'Opportunity outcome updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode === 403) return;
      const msg =
        error?.statusCode === 400 && Array.isArray(error.details)
          ? error.details.map((d) => d.message).join(' · ')
          : error?.message || 'Failed to close opportunity';
      toast.error(msg);
    },
  });
};
