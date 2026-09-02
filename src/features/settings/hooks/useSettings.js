// crm-web/src/features/settings/hooks/useSettings.js

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { settingsApi } from "../services/settingsApi"

/**
 * Static mapping of each settings category to the exact Prisma/Zod field keys
 * that belong to it. Used to construct minimal, category-scoped PUT payloads.
 * Defined at module scope to avoid re-creation on every render.
 */
const CATEGORY_FIELD_MAP = {
  general: [
    "companyName", "companyLogo", "website",
    "timeZone", "currency", "currencySymbol",
    "dateFormat", "timeFormat", "language",
  ],
  company: [
    "registeredBusinessName", "gstTaxNumber",
    "businessAddress", "industryType", "businessHours",
  ],
  crm: [
    "defaultLeadStatusId", "autoAssignmentEnabled", "defaultAssignmentAlgorithm",
    "defaultPipelineId", "defaultOpportunityStageId", "defaultOpportunityWinProb",
    "defaultFollowupTime", "leadNumberFormat", "opportunityNumberFormat", "dealNumberFormat",
  ],
  notification: [
    "reminderTimingMinutes", "enableEmailNotifications", "enableInAppNotifications",
    "enablePushNotifications", "dailySummaryEnabled", "dailySummaryTime",
  ],
  security: [
    "sessionTimeoutMinutes", "maxLoginAttempts", "lockoutDurationMinutes",
    "passwordExpiryDays", "minPasswordLength", "requireUppercase", "requireLowercase",
    "requireNumber", "requireSpecialChar", "preventPasswordReuseCount",
    "requireMfa", "ipWhitelisting",
  ],
  email: [
    "smtpHost", "smtpPort", "smtpUser", "smtpPassword",
    "smtpSenderName", "smtpSenderEmail", "smtpEncryption", "emailSignatureTemplate",
  ],
  branding: [
    "primaryColor", "secondaryColor", "accentColor", "themeMode",
    "loginBackgroundUrl", "customDomain", "faviconUrl", "emailTemplateBranding",
  ],
}

export const useSettings = (companyId = null) => {
  const queryClient = useQueryClient()

  // State management
  const [activeTab, setActiveTab] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({})
  const [initialData, setInitialData] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false)

  // Fetch settings query
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: companyId ? ["system-settings", companyId] : ["system-settings"],
    queryFn: () => settingsApi.getSettings(companyId),
    staleTime: 5 * 60 * 1000,
  })

  // Sync initial data when settings are fetched
  useEffect(() => {
    if (settings) {
      setInitialData(settings)
      setFormData(settings)
      setIsDirty(false)
    }
  }, [settings])

  // Track field mutations to calculate dirty state
  const updateField = useCallback((key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value }
      const hasChanged = JSON.stringify(updated) !== JSON.stringify(initialData)
      setIsDirty(hasChanged)
      return updated
    })
  }, [initialData])

  // Update whole category state
  const updateCategoryData = useCallback((categoryData) => {
    setFormData((prev) => {
      const updated = { ...prev, ...categoryData }
      const hasChanged = JSON.stringify(updated) !== JSON.stringify(initialData)
      setIsDirty(hasChanged)
      return updated
    })
  }, [initialData])

  // Reset local changes back to server state
  const resetLocalChanges = useCallback(() => {
    setFormData(initialData)
    setIsDirty(false)
    toast.success("Unsaved changes discarded")
  }, [initialData])


  // Save Category Mutation

  const saveCategoryMutation = useMutation({
    mutationFn: async (category) => {
      // Extract only the fields that belong to this category.
      const allowedFields = CATEGORY_FIELD_MAP[category] || []
      const payload = allowedFields.reduce((acc, key) => {
        if (key in formData) acc[key] = formData[key]
        return acc
      }, {})
      return await settingsApi.updateCategorySettings(category, payload, companyId)
    },
    onSuccess: (updatedSettings, category) => {
      // 1. Immediately update all settings query cache keys for instant 0ms UI reactivity
      queryClient.setQueryData(["system-settings"], updatedSettings)
      if (companyId) {
        queryClient.setQueryData(["system-settings", companyId], updatedSettings)
      }

      // 2. Invalidate settings, company profile and list queries
      queryClient.invalidateQueries({ queryKey: ["system-settings"] })
      queryClient.invalidateQueries({ queryKey: ["company"] })
      queryClient.invalidateQueries({ queryKey: ["companies"] })

      // 3. Invalidate data queries across all modules so currency/date format changes take effect immediately
      queryClient.invalidateQueries({ queryKey: ["revenue-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-report"] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["kpi"] })

      setInitialData(updatedSettings)
      setFormData(updatedSettings)
      setIsDirty(false)
      toast.success(`${category.toUpperCase()} settings saved successfully!`)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to save settings"
      toast.error(message)
      
      // Auto-scroll to first error element if present
      setTimeout(() => {
        const errorElement = document.querySelector(".Mui-error, [data-error='true']")
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    },
  })

  // Reset Category to System Defaults Mutation
  const resetDefaultsMutation = useMutation({
    mutationFn: async (category) => {
      return await settingsApi.resetCategorySettings(category, companyId)
    },
    onSuccess: (resetSettings, category) => {
      queryClient.setQueryData(["system-settings"], resetSettings)
      if (companyId) {
        queryClient.setQueryData(["system-settings", companyId], resetSettings)
      }

      queryClient.invalidateQueries({ queryKey: ["system-settings"] })
      queryClient.invalidateQueries({ queryKey: ["company"] })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-report"] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })

      setInitialData(resetSettings)
      setFormData(resetSettings)
      setIsDirty(false)
      toast.success(`${category.toUpperCase()} settings reset to defaults!`)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to reset settings"
      toast.error(message)
    },
  })

  // Send Test Email Mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async (recipientEmail) => {
      return await settingsApi.sendTestEmail(recipientEmail, companyId)
    },
    onSuccess: (response) => {
      toast.success(response?.message || "Test email sent successfully!")
      setTestEmailModalOpen(false)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || "Failed to send test email"
      toast.error(message)
    },
  })

  // Warning prompt before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = "You have unsaved setting changes. Are you sure you want to leave?"
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  return {
    settings,
    formData,
    initialData,
    isLoading,
    isError,
    error,
    isDirty,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    testEmailModalOpen,
    setTestEmailModalOpen,
    updateField,
    updateCategoryData,
    resetLocalChanges,
    refetch,

    // Actions
    saveCategory: saveCategoryMutation.mutateAsync,
    isSaving: saveCategoryMutation.isPending,

    resetCategoryDefaults: resetDefaultsMutation.mutateAsync,
    isResetting: resetDefaultsMutation.isPending,

    sendTestEmail: sendTestEmailMutation.mutateAsync,
    isSendingTestEmail: sendTestEmailMutation.isPending,
  }
}
