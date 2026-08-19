// crm-web/src/features/revenueReport/hooks/useRevenueReport.js

import { useQuery } from '@tanstack/react-query';
import { revenueReportService } from '../services/revenueReportService';

export const REVENUE_QUERY_KEYS = {
  summary: (filters) => ['revenueReport', 'summary', filters],
  monthly: (filters) => ['revenueReport', 'monthly', filters],
  quarterly: (filters) => ['revenueReport', 'quarterly', filters],
  product: (filters) => ['revenueReport', 'product', filters],
  team: (filters) => ['revenueReport', 'team', filters],
  branch: (filters) => ['revenueReport', 'branch', filters],
  trend: (filters) => ['revenueReport', 'trend', filters]
};

export const useRevenueSummary = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.summary(filters),
    queryFn: () => revenueReportService.getSummary(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useMonthlyRevenue = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.monthly(filters),
    queryFn: () => revenueReportService.getMonthly(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useQuarterlyRevenue = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.quarterly(filters),
    queryFn: () => revenueReportService.getQuarterly(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useProductRevenue = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.product(filters),
    queryFn: () => revenueReportService.getProduct(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useTeamRevenue = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.team(filters),
    queryFn: () => revenueReportService.getTeam(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useBranchRevenue = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.branch(filters),
    queryFn: () => revenueReportService.getBranch(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};

export const useRevenueTrend = (filters = {}) => {
  return useQuery({
    queryKey: REVENUE_QUERY_KEYS.trend(filters),
    queryFn: () => revenueReportService.getTrend(filters),
    staleTime: 60 * 1000,
    keepPreviousData: true
  });
};
