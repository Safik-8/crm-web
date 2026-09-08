// crm-web/src/shared/hooks/useFormatters.js

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../app/providers/AuthProvider"
import { settingsApi } from "../../features/settings/services/settingsApi"
import {
  formatCurrency as baseFormatCurrency,
  formatCurrencyShort as baseFormatCurrencyShort,
  formatDate as baseFormatDate,
  formatDateTime as baseFormatDateTime,
  DEFAULT_FORMAT_CONFIG,
} from "../utils/formatters"

/**
 * useFormatters Hook
 * Automatically retrieves active company settings (currency, symbol, date format, timezone)
 * and provides pre-bound formatting functions.
 */
export const useFormatters = (companyId = null) => {
  const { user } = useAuth()
  const targetCompanyId = companyId || user?.companyId

  const { data: settings } = useQuery({
    queryKey: targetCompanyId ? ["system-settings", targetCompanyId] : ["system-settings"],
    queryFn: () => settingsApi.getSettings(targetCompanyId),
    enabled: Boolean(targetCompanyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const currencySymbol = settings?.currencySymbol || DEFAULT_FORMAT_CONFIG.currencySymbol
  const currency = settings?.currency || DEFAULT_FORMAT_CONFIG.currency
  const dateFormat = settings?.dateFormat || DEFAULT_FORMAT_CONFIG.dateFormat
  const timeZone = settings?.timeZone || DEFAULT_FORMAT_CONFIG.timeZone
  const timeFormat = settings?.timeFormat || DEFAULT_FORMAT_CONFIG.timeFormat

  const formatCurrency = (val, customSymbol = null) => {
    return baseFormatCurrency(val, customSymbol || currencySymbol)
  }

  const formatCurrencyShort = (val, customSymbol = null) => {
    return baseFormatCurrencyShort(val, customSymbol || currencySymbol)
  }

  const formatDate = (val, customFormat = null) => {
    return baseFormatDate(val, customFormat || dateFormat)
  }

  const formatDateTime = (val, customFormat = null) => {
    return baseFormatDateTime(val, customFormat || dateFormat, timeZone, timeFormat)
  }

  return {
    currencySymbol,
    currency,
    dateFormat,
    timeZone,
    timeFormat,
    formatCurrency,
    formatCurrencyShort,
    formatDate,
    formatDateTime,
    settings,
  }
}
