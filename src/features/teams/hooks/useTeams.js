// src/features/teams/hooks/useTeams.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { toast } from '../../../shared/utils/toast';

export const TEAM_KEYS = {
  all: ['teams'],
  lists: () => [...TEAM_KEYS.all, 'list'],
  list: (params) => [...TEAM_KEYS.lists(), params],
  details: () => [...TEAM_KEYS.all, 'detail'],
  detail: (id) => [...TEAM_KEYS.details(), id]
};

export const useTeamsQuery = (params) => {
  return useQuery({
    queryKey: TEAM_KEYS.list(params),
    queryFn: async () => {
      const response = await teamService.getTeams(params);
      return response.data || { teams: [], pagination: {} };
    },
    placeholderData: (prev) => prev,
    staleTime: 5000
  });
};

export const useTeamQuery = (id) => {
  return useQuery({
    queryKey: TEAM_KEYS.detail(id),
    queryFn: async () => {
      const response = await teamService.getTeamById(id);
      return response.data?.team || null;
    },
    enabled: !!id
  });
};

export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      toast.success('Team created successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to create team';
        toast.error(msg);
      }
    }
  });
};

export const useUpdateTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => teamService.updateTeam(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      toast.success('Team details updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to update team details';
        toast.error(msg);
      }
    }
  });
};

export const useToggleTeamStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => teamService.toggleTeamStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TEAM_KEYS.lists() });

      // Snapshot previous value
      const previousTeamsPages = queryClient.getQueryData(TEAM_KEYS.lists());

      // Optimistically update the status in lists cache
      queryClient.setQueriesData({ queryKey: TEAM_KEYS.lists() }, (old) => {
        if (!old) return old;
        
        // Handle paginated structure (e.g. { data: { teams: [...] } } or { teams: [...] })
        const updateTeamsList = (teams) => 
          teams.map((t) => (t.id === id ? { ...t, status } : t));

        if (Array.isArray(old.teams)) {
          return {
            ...old,
            teams: updateTeamsList(old.teams)
          };
        }
        return old;
      });

      return { previousTeamsPages };
    },
    onError: (err, variables, context) => {
      // Rollback to snapshot
      if (context?.previousTeamsPages) {
        queryClient.setQueryData(TEAM_KEYS.lists(), context.previousTeamsPages);
      }
      toast.error(err?.message || 'Failed to toggle team status');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      toast.success('Team status updated successfully');
    }
  });
};

export const useDeleteTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete team');
    }
  });
};

export const useRemoveTeamMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => teamService.removeTeamMember(id, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      toast.success('Team member removed successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to remove team member');
    }
  });
};

export const useReplaceTeamOwnerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bdeId }) => teamService.replaceTeamOwner(id, bdeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      toast.success('Team owner replaced successfully');
    },
    onError: (error) => {
      // Don't toast here if the controller handles it, but let's toast a fallback
      toast.error(error?.message || 'Failed to replace team owner');
    }
  });
};

