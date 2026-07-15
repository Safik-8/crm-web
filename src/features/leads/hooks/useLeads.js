import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeads,
  getLeadById,
  getLeadFormData,
  createLead,
  updateLead,
  deleteLead
} from '../services/leadService';
import { toast } from '../../../shared/utils/toast';

export const LEAD_KEYS = {
  all: ['leads'],
  lists: () => [...LEAD_KEYS.all, 'list'],
  list: (params) => [...LEAD_KEYS.lists(), params],
  details: () => [...LEAD_KEYS.all, 'detail'],
  detail: (id) => [...LEAD_KEYS.details(), id],
  formData: () => [...LEAD_KEYS.all, 'formData'],
};

/**
 * Hook to retrieve leads list using TanStack Query.
 * Supports query filter keys caching.
 * 
 * @param {object} params - query options (filters, page, limit, search, sort)
 */
export const useLeadsQuery = (params) => {
  return useQuery({
    queryKey: LEAD_KEYS.list(params),
    queryFn: async () => {
      const res = await getLeads(params);
      return res;
    },
    placeholderData: (prev) => prev, // smooth pagination transitions
    staleTime: 5000,
  });
};

/**
 * Hook to retrieve single lead details.
 * 
 * @param {number|string} id
 */
export const useLeadQuery = (id) => {
  return useQuery({
    queryKey: LEAD_KEYS.detail(id),
    queryFn: async () => {
      const res = await getLeadById(id);
      return res;
    },
    enabled: !!id,
  });
};

/**
 * Hook to load dropdown form options once and cache it.
 */
export const useLeadFormDataQuery = (params = {}) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.formData(), params],
    queryFn: () => getLeadFormData(params),
    staleTime: 60000, // 60s cache
  });
};

/**
 * Hook to handle Lead Creation mutation.
 */
export const useCreateLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      toast.success('Lead created successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to create lead';
        toast.error(msg);
      }
    },
  });
};

/**
 * Hook to handle Lead Update mutation.
 */
export const useUpdateLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLead(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(variables.id) });
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to update lead';
        toast.error(msg);
      }
    },
  });
};

/**
 * Hook to handle Lead Deletion mutation.
 */
export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      toast.success('Lead deleted successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to delete lead';
        toast.error(msg);
      }
    },
  });
};
