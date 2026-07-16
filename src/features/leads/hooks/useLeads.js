import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeads,
  getLeadById,
  getLeadFormData,
  createLead,
  updateLead,
  deleteLead,
  restoreLead,
  getLeadTimeline,
  getLeadNotes,
  createLeadNote,
  updateLeadNote,
  deleteLeadNote
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
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED' && error?.code !== 'DUPLICATE_LEAD_WARNING') {
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
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED' && error?.code !== 'DUPLICATE_LEAD_WARNING') {
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
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED' && error?.code !== 'DUPLICATE_LEAD_WARNING') {
        const msg = error?.message || 'Failed to delete lead';
        toast.error(msg);
      }
    },
  });
};

/**
 * Hook to restore a soft-deleted lead.
 */
export const useRestoreLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreLead,
    onSuccess: (res, leadId) => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(leadId) });
      toast.success('Lead restored successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to restore lead';
        toast.error(msg);
      }
    },
  });
};

/**
 * Hook to retrieve a lead's chronological activity timeline.
 */
export const useLeadTimelineQuery = (leadId) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.detail(leadId), 'timeline'],
    queryFn: () => getLeadTimeline(leadId),
    enabled: !!leadId,
  });
};

/**
 * Hook to retrieve notes list for a specific lead.
 */
export const useLeadNotesQuery = (leadId) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.detail(leadId), 'notes'],
    queryFn: () => getLeadNotes(leadId),
    enabled: !!leadId,
  });
};

/**
 * Hook to add a new note.
 */
export const useCreateLeadNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }) => createLeadNote(leadId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'] });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(variables.leadId) });
      toast.success('Note added successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to add note';
      toast.error(msg);
    },
  });
};

/**
 * Hook to update a note.
 */
export const useUpdateLeadNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, noteId, data }) => updateLeadNote(leadId, noteId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'] });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(variables.leadId) });
      toast.success('Note updated successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to update note';
      toast.error(msg);
    },
  });
};

/**
 * Hook to delete a note.
 */
export const useDeleteLeadNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, noteId }) => deleteLeadNote(leadId, noteId),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'] });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(variables.leadId) });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to delete note';
      toast.error(msg);
    },
  });
};

