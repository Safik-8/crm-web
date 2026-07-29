// src/features/followups/hooks/useFollowups.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFollowup, getFollowups, getFollowupsByLead,
  getFollowupById, updateFollowup, completeFollowup,
  cancelFollowup, deleteFollowup
} from '../services/followupService';
import { toast } from '../../../shared/utils/toast';

export const FOLLOWUP_KEYS = {
  all:    ['followups'],
  lists:  ()       => [...FOLLOWUP_KEYS.all, 'list'],
  list:   (params) => [...FOLLOWUP_KEYS.lists(), params],
  byLead: (leadId) => [...FOLLOWUP_KEYS.all, 'lead', String(leadId)],
  detail: (id)     => [...FOLLOWUP_KEYS.all, 'detail', String(id)],
};

export const useFollowupsQuery        = (p = {})  => useQuery({ queryKey: FOLLOWUP_KEYS.list(p),      queryFn: () => getFollowups(p),       staleTime: 30_000 });
export const useFollowupsByLeadQuery  = (leadId)  => useQuery({ queryKey: FOLLOWUP_KEYS.byLead(leadId), queryFn: () => getFollowupsByLead(leadId), enabled: !!leadId, staleTime: 30_000 });
export const useFollowupQuery         = (id)      => useQuery({ queryKey: FOLLOWUP_KEYS.detail(id),    queryFn: () => getFollowupById(id),   enabled: !!id });

export const useCreateFollowupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFollowup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FOLLOWUP_KEYS.all });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Follow-up scheduled successfully');
    },
    onError: (err) => toast.error(err?.message || 'Failed to schedule follow-up'),
  });
};

export const useUpdateFollowupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateFollowup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FOLLOWUP_KEYS.all });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Follow-up updated successfully');
    },
    onError: (err) => toast.error(err?.message || 'Failed to update follow-up'),
  });
};

export const useCompleteFollowupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => completeFollowup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FOLLOWUP_KEYS.all });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Follow-up marked as completed');
    },
    onError: (err) => toast.error(err?.message || 'Failed to complete follow-up'),
  });
};

export const useCancelFollowupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => cancelFollowup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FOLLOWUP_KEYS.all });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Follow-up cancelled');
    },
    onError: (err) => toast.error(err?.message || 'Failed to cancel follow-up'),
  });
};

export const useDeleteFollowupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteFollowup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FOLLOWUP_KEYS.all });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Follow-up deleted');
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete follow-up'),
  });
};
