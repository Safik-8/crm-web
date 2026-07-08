import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../api/roleApi';

export const useRoles = (companyId = '') => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  const params = {
    page,
    limit: 100, // Roles are small lists generally
    search: debouncedSearch,
    status,
    companyId
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleApi.getRoles(params),
    staleTime: 2 * 60 * 1000,
  });

  const rolesList = Array.isArray(data?.data?.roles) ? data.data.roles : [];
  const paginationInfo = data?.data?.pagination || {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1
  };

  let loadingState = 'success';
  if (isLoading) {
    loadingState = 'loading';
  } else if (isError) {
    loadingState = 'error';
  } else if (rolesList.length === 0) {
    loadingState = 'empty';
  }

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return {
    roles: rolesList,
    pagination: paginationInfo,
    loadingState,
    errorMessage: error?.message || '',
    search,
    status,
    handleSearchChange,
    handleStatusChange,
    setPage,
    refetch
  };
};

export const useRole = (id) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleApi.getRole(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleData) => roleApi.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roleApi.updateRole(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param) => {
      if (typeof param === 'object' && param !== null) {
        return roleApi.deleteRole(param.id, param.reassignRoleId);
      }
      return roleApi.deleteRole(param);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
};

export const useToggleRoleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => roleApi.toggleRoleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
};
