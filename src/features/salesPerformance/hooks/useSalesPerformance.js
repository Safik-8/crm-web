// crm-web/src/features/salesPerformance/hooks/useSalesPerformance.js

import { useQuery } from '@tanstack/react-query';
import { salesPerformanceService } from '../services/salesPerformanceService';

export function useBDEPerformance(params = {}, options = {}) {
  return useQuery({
    queryKey: ['salesPerformance', 'bde', params],
    queryFn: async () => {
      const response = await salesPerformanceService.getBDEPerformance(params);
      return response.data || {};
    },
    staleTime: 0,
    ...options
  });
}

export function useISEPerformance(params = {}, options = {}) {
  return useQuery({
    queryKey: ['salesPerformance', 'ise', params],
    queryFn: async () => {
      const response = await salesPerformanceService.getISEPerformance(params);
      return response.data || {};
    },
    staleTime: 0,
    ...options
  });
}

export function useTeamPerformance(params = {}, options = {}) {
  return useQuery({
    queryKey: ['salesPerformance', 'team', params],
    queryFn: async () => {
      const response = await salesPerformanceService.getTeamPerformance(params);
      return response.data || {};
    },
    staleTime: 0,
    ...options
  });
}

export function useBranchPerformance(params = {}, options = {}) {
  return useQuery({
    queryKey: ['salesPerformance', 'branch', params],
    queryFn: async () => {
      const response = await salesPerformanceService.getBranchPerformance(params);
      return response.data || {};
    },
    staleTime: 0,
    ...options
  });
}

export function usePerformanceRankings(params = {}, options = {}) {
  return useQuery({
    queryKey: ['salesPerformance', 'rankings', params],
    queryFn: async () => {
      const response = await salesPerformanceService.getPerformanceRankings(params);
      return response.data || {};
    },
    staleTime: 0,
    ...options
  });
}
