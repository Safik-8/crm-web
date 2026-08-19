// src/features/teams/hooks/useTeams.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { toast } from '../../../shared/utils/toast';

export const TEAM_KEYS = {
  all: ['teams'],
  lists: () => [...TEAM_KEYS.all, 'list'],
  list: (params) => [...TEAM_KEYS.lists(), params],
  details: () => [...TEAM_KEYS.all, 'detail'],
  detail: (id) => [...TEAM_KEYS.details(), id],
  active: () => [...TEAM_KEYS.all, 'active']
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

/**
 * Hook to retrieve active team membership of the logged-in user.
 * Short staleTime ensures immediate update when user is added, removed, or ownership changes.
 */
export const useActiveTeamQuery = () => {
  return useQuery({
    queryKey: TEAM_KEYS.active(),
    queryFn: async () => {
      const response = await teamService.getActiveTeam();
      return response.data?.team || null;
    },
    staleTime: 2000 // 2 seconds for real-time responsiveness
  });
};

export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...TEAM_KEYS.all, 'create'],
    mutationFn: teamService.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
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
    mutationKey: [...TEAM_KEYS.all, 'update'],
    mutationFn: ({ id, data }) => teamService.updateTeam(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
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
    mutationKey: [...TEAM_KEYS.all, 'toggleStatus'],
    mutationFn: ({ id, status }) => teamService.toggleTeamStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: TEAM_KEYS.lists() });
      const previousTeamsPages = queryClient.getQueryData(TEAM_KEYS.lists());

      queryClient.setQueriesData({ queryKey: TEAM_KEYS.lists() }, (old) => {
        if (!old) return old;
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
      if (context?.previousTeamsPages) {
        queryClient.setQueryData(TEAM_KEYS.lists(), context.previousTeamsPages);
      }
      toast.error(err?.message || 'Failed to toggle team status');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
      toast.success('Team status updated successfully');
    }
  });
};

export const useDeleteTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...TEAM_KEYS.all, 'delete'],
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
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
    mutationKey: [...TEAM_KEYS.all, 'removeMember'],
    mutationFn: ({ id, userId }) => teamService.removeTeamMember(id, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
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
    mutationKey: [...TEAM_KEYS.all, 'replaceOwner'],
    mutationFn: ({ id, bdeId }) => teamService.replaceTeamOwner(id, bdeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.active() });
      toast.success('Team owner replaced successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to replace team owner');
    }
  });
};

/**
 * Fetches today's assignment counts for each ISE in the team alongside
 * the branch daily limit. Refreshed when the assign drawer opens.
 */
export const useISEDailyStatsQuery = (teamId, options = {}) => {
  return useQuery({
    queryKey: [...TEAM_KEYS.detail(teamId), 'ise-daily-stats'],
    queryFn: async () => {
      const res = await teamService.getISEDailyStats(teamId);
      return res?.data || res;
    },
    enabled: !!teamId,
    staleTime: 0,
    ...options,
  });
};

/**
 * BDE assigns a lead from their team pool to one of their ISEs.
 * Enforces daily limit server-side; on success invalidates the leads list
 * and the ISE daily stats so the drawer badges refresh immediately.
 */
export const useBdeAssignLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...TEAM_KEYS.all, 'bdeAssign'],
    mutationFn: ({ teamId, leadId, assignedToId, notes }) =>
      teamService.bdeAssignLeadToISE(teamId, { leadId, assignedToId, notes }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({
        queryKey: [...TEAM_KEYS.detail(variables.teamId), 'ise-daily-stats'],
      });
      toast.success('Lead assigned to ISE successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        toast.error(error?.message || 'Failed to assign lead');
      }
    },
  });
};
