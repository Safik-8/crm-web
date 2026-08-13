import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, getCustomerById, updateCustomerStatus } from '../services/customerService';
import { toast } from '../../../shared/utils/toast';

export const CUSTOMER_KEYS = {
  all    : ['customers'],
  lists  : () => [...CUSTOMER_KEYS.all, 'list'],
  list   : (p) => [...CUSTOMER_KEYS.lists(), p],
  details: () => [...CUSTOMER_KEYS.all, 'detail'],
  detail : (id) => [...CUSTOMER_KEYS.details(), id],
};

export const useCustomersQuery = (params = {}) =>
  useQuery({
    queryKey : CUSTOMER_KEYS.list(params),
    queryFn  : async () => {
      const res   = await getCustomers(params);
      const raw   = res?.data || res;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
      return {
        items,
        pagination: res?.pagination || raw?.pagination || { total: items.length, page: 1, limit: 20, totalPages: 1 },
      };
    },
    placeholderData : (prev) => prev,
    staleTime       : 10000,
  });

export const useCustomerDetailQuery = (id) =>
  useQuery({
    queryKey : CUSTOMER_KEYS.detail(id),
    queryFn  : async () => {
      const res = await getCustomerById(id);
      return res?.data || null;
    },
    enabled  : !!id,
  });

export const useToggleCustomerStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn : ({ id, status }) => updateCustomerStatus(id, status),
    onSuccess  : (res) => {
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success(res?.message || 'Customer status updated');
    },
    onError    : (err) => toast.error(err?.message || 'Failed to update status'),
  });
};
