import { useQuery } from '@tanstack/react-query';
import { getDeals, getDealsStats, getDealById } from '../services/dealService';

export const DEAL_KEYS = {
  all    : ['deals'],
  lists  : () => [...DEAL_KEYS.all, 'list'],
  list   : (p) => [...DEAL_KEYS.lists(), p],
  stats  : (p) => [...DEAL_KEYS.all, 'stats', p],
  details: () => [...DEAL_KEYS.all, 'detail'],
  detail : (id) => [...DEAL_KEYS.details(), id],
};

export const useDealsQuery = (params = {}) =>
  useQuery({
    queryKey : DEAL_KEYS.list(params),
    queryFn  : async () => {
      const res     = await getDeals(params);
      const raw     = res?.data || res;
      const items   = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
      const pagination = res?.pagination || raw?.pagination || { total: items.length, page: 1, limit: 20, totalPages: 1 };
      return { items, pagination };
    },
    placeholderData : (prev) => prev,
    staleTime       : 10000,
  });

export const useDealsStatsQuery = (params = {}) =>
  useQuery({
    queryKey : DEAL_KEYS.stats(params),
    queryFn  : async () => {
      const res = await getDealsStats(params);
      return res?.data || res || { total: 0, won: 0, lost: 0, cancelled: 0, wonRevenue: 0 };
    },
    staleTime: 15000,
  });

export const useDealDetailQuery = (id) =>
  useQuery({
    queryKey : DEAL_KEYS.detail(id),
    queryFn  : async () => {
      const res = await getDealById(id);
      return res?.data || null;
    },
    enabled  : !!id,
  });
