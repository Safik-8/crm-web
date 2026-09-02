import { formatCurrency as universalFormatCurrency, formatDate as universalFormatDate } from "../../../shared/utils/formatters";

export const formatCurrency = (value, symbol) => universalFormatCurrency(value, symbol);

export const formatDate = (value, pattern) => universalFormatDate(value, pattern);

export const formatText = (value) => value || '—';

export const getStatusColor = (status) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'INACTIVE') return 'warning';
  return 'default';
};
