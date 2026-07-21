// src/features/users/hooks/useUsers.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { toast } from '../../../shared/utils/toast';

export const USER_KEYS = {
  all: ['users'],
  lists: () => [...USER_KEYS.all, 'list'],
  list: (params) => [...USER_KEYS.lists(), params],
  details: () => [...USER_KEYS.all, 'detail'],
  detail: (id) => [...USER_KEYS.details(), id]
};

export const useUsersQuery = (params) => {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => userService.getUsers(params),
    placeholderData: (prev) => prev, // Smooth pagination transition
    staleTime: 5000
  });
};

export const useUserQuery = (id) => {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
      toast.success('User onboarded successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to onboard user';
        toast.error(msg);
      }
    }
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      toast.success('User details updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to update user details';
        toast.error(msg);
      }
    }
  });
};

export const useToggleUserStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nextStatus }) => userService.toggleUserStatus(id, nextStatus),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      toast.success(`User successfully ${variables.nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to toggle status';
        toast.error(msg);
      }
    }
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: userService.resetUserPassword,
    onSuccess: () => {
      toast.success('Temporary password generated successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to reset password';
        toast.error(msg);
      }
    }
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replacementUserId }) => userService.deleteUser(id, replacementUserId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      const msg = res?.message || 'User hard deleted successfully';
      toast.success(msg);
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to delete user';
        toast.error(msg);
      }
    }
  });
};
