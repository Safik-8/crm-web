// crm-web/src/features/dashboard/hooks/useRoleDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

const defaultOptions = {
  staleTime: 0,
  refetchInterval: 5 * 60 * 1000,      // auto-refresh every 5 minutes
  refetchIntervalInBackground: false,   // pauses when tab is hidden
};

export function useDashboardMetrics(params = {}, options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', params],
    queryFn:  async () => { const res = await dashboardService.getMetrics(params); return res?.data ?? {}; },
    ...defaultOptions, ...options,
  });
}

export function useLeadAging(params = {}, options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'lead-aging', params],
    queryFn:  async () => { const res = await dashboardService.getLeadAging(params); return res?.data ?? {}; },
    ...defaultOptions, ...options,
  });
}

export function useKpiTargets(params = {}, options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'kpi-targets', params],
    queryFn:  async () => { const res = await dashboardService.getKpiTargets(params); return res?.data ?? []; },
    ...defaultOptions, ...options,
  });
}

export function useActivityFeed(params = {}, options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'activity-feed', params],
    queryFn:  async () => { const res = await dashboardService.getActivityFeed(params); return res?.data ?? []; },
    ...defaultOptions, ...options,
  });
}

export function useCallQueue(params = {}, options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'call-queue', params],
    queryFn:  async () => { const res = await dashboardService.getCallQueue(params); return res?.data ?? []; },
    ...defaultOptions, ...options,
  });
}
