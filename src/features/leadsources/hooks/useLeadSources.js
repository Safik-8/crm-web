// src/features/leadsources/hooks/useLeadSources.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeadSources,
  createLeadSource,
  updateLeadSource,
  toggleLeadSourceStatus
} from '../services/leadSourceService';
import { toast } from '../../../shared/utils/toast';

export const LEAD_SOURCE_KEYS = {
  all: ['lead-sources'],
  lists: () => [...LEAD_SOURCE_KEYS.all, 'list'],
  list: (params) => [...LEAD_SOURCE_KEYS.lists(), params],
};

export const useLeadSourcesQuery = (params) => {
  return useQuery({
    queryKey: LEAD_SOURCE_KEYS.list(params),
    queryFn: async () => {
      const res = await getLeadSources(params);
      return res;
    },
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
};

export const useCreateLeadSourceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeadSource,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_SOURCE_KEYS.lists() });
      toast.success(res?.message || 'Lead source created successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to create lead source';
      toast.error(msg);
    },
  });
};

export const useUpdateLeadSourceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLeadSource(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_SOURCE_KEYS.lists() });
      toast.success(res?.message || 'Lead source updated successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to update lead source';
      toast.error(msg);
    },
  });
};

export const useToggleLeadSourceStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLeadSourceStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LEAD_SOURCE_KEYS.lists() });
      toast.success(res?.message || 'Lead source status toggled successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to toggle lead source status';
      toast.error(msg);
    },
  });
};
