import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeads,
  getLeadById,
  getLeadFormData,
  createLead,
  updateLead,
  deleteLead,
  deleteAllLeads,
  importLeadsPreview,
  importLeadsCommit,
  restoreLead,
  getLeadTimeline,
  getLeadNotes,
  createLeadNote,
  updateLeadNote,
  deleteLeadNote,
  assignLeads,
  getLeadCommunicationLogs,
  createLeadCommunicationLog,
  deleteLeadCommunicationLog
} from '../services/leadService';
import { userProfileService } from '../../userprofile/services/userProfileService';
import { useAuth } from '../../../app/providers/AuthProvider';

export const LEAD_KEYS = {
  all: ['leads'],
  lists: () => [...LEAD_KEYS.all, 'list'],
  list: (params, companyId) => [...LEAD_KEYS.lists(), companyId || 'global', params],
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
  const { user } = useAuth();
  return useQuery({
    queryKey: LEAD_KEYS.list(params, user?.companyId),
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
export const useLeadQuery = (id, initialData) => {
  return useQuery({
    queryKey: LEAD_KEYS.detail(id),
    queryFn: async () => {
      const res = await getLeadById(id);
      return res;
    },
    enabled: !!id,
    staleTime: 60000,
    placeholderData: initialData ? (prev) => prev || { data: { lead: initialData } } : undefined,
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

export const useDeleteAllLeadsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllLeads,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      toast.success('All leads deleted successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to delete all leads';
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
 * Hook to handle bulk import preview mutation.
 */
export const useImportPreviewMutation = () => {
  return useMutation({
    mutationFn: importLeadsPreview,
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to generate import preview';
        toast.error(msg);
      }
    }
  });
};

/**
 * Hook to retrieve a lead's chronological activity timeline.
 */
export const useLeadTimelineQuery = (leadId, params = {}) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.detail(leadId), 'timeline', params],
    queryFn: () => getLeadTimeline(leadId, params),
    enabled: !!leadId,
    staleTime: 0,
  });
};

/**
 * Hook to handle bulk import commit mutation.
 */
export const useImportCommitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importLeadsCommit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to commit bulk import';
        toast.error(msg);
      }
    }
  });
};

/**
 * Hook to retrieve notes list for a specific lead.
 */
export const useLeadNotesQuery = (leadId, params = {}) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.detail(leadId), 'notes', params],
    queryFn: () => getLeadNotes(leadId, params),
    enabled: !!leadId,
    staleTime: 0,
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
      queryClient.invalidateQueries({
        queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'timeline'] });
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
      queryClient.invalidateQueries({
        queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'timeline'] });
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
      queryClient.invalidateQueries({
        queryKey: [...LEAD_KEYS.detail(variables.leadId), 'notes'],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'timeline'] });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.detail(variables.leadId) });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to delete note';
      toast.error(msg);
    },
  });
};

/**
 * Hook to fetch user settings/preferences.
 */
export const useUserPreferencesQuery = () => {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => userProfileService.getUserPreferences()
  });
};

/**
 * Hook to update user sessionPreferences.
 */
export const useUpdateUserPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionPreferences) => userProfileService.updateUserPreferences(sessionPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to update preferences';
      toast.error(msg);
    }
  });
};

/**
 * Hook to assign one or more leads to a team and/or user.
 */
export const useAssignLeadsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignLeads,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEAD_KEYS.details() });
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to assign leads';
      toast.error(msg);
    }
  });
};

/**
 * Hook to retrieve communication logs for a specific lead.
 */
export const useLeadCommunicationLogsQuery = (leadId, params = {}) => {
  return useQuery({
    queryKey: [...LEAD_KEYS.detail(leadId), 'communication-logs', params],
    queryFn: () => getLeadCommunicationLogs(leadId, params),
    enabled: !!leadId,
    staleTime: 0,
  });
};

/**
 * Hook to log a new communication interaction.
 */
export const useCreateCommunicationLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }) => createLeadCommunicationLog(leadId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'communication-logs'] });
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'timeline'] });
      toast.success('Communication logged successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to log communication';
      toast.error(msg);
    }
  });
};

/**
 * Hook to soft-delete a communication log.
 */
export const useDeleteCommunicationLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, logId }) => deleteLeadCommunicationLog(leadId, logId),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'communication-logs'] });
      queryClient.invalidateQueries({ queryKey: [...LEAD_KEYS.detail(variables.leadId), 'timeline'] });
      toast.success('Communication log deleted successfully');
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to delete communication log';
      toast.error(msg);
    }
  });
};

