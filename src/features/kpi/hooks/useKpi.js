// FrontEnd/src/features/kpi/hooks/useKpi.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kpiService } from '../services/kpiService';

export const useKpiDashboard = (tab = 'my', filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['kpiDashboard', tab, filters],
    queryFn: () => kpiService.getDashboard(tab, filters),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useKpiDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ['kpiDetail', id],
    queryFn: () => kpiService.getDetail(id),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateKpiTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetData) => kpiService.createTarget(targetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiDashboard'] });
    },
  });
};

export const useUpdateKpiTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => kpiService.updateTarget(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kpiDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kpiDetail', variables.id] });
    },
  });
};
