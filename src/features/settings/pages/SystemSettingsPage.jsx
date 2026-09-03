// crm-web/src/features/settings/pages/SystemSettingsPage.jsx

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers/AuthProvider"
import { companyApi } from "../../company/api/companyApi"
import { useSettings } from "../hooks/useSettings"
import { SettingsLeftNav, CATEGORY_ITEMS } from "../components/SettingsLeftNav"
import { SettingsHeader } from "../components/SettingsHeader"
import { GeneralSettingsForm } from "../components/GeneralSettingsForm"
import { CompanySettingsForm } from "../components/CompanySettingsForm"
import { CrmSettingsForm } from "../components/CrmSettingsForm"
import { NotificationSettingsForm } from "../components/NotificationSettingsForm"
import { SecuritySettingsForm } from "../components/SecuritySettingsForm"
import { EmailSettingsForm } from "../components/EmailSettingsForm"
import { BrandingSettingsForm } from "../components/BrandingSettingsForm"
import { TestEmailModal } from "../components/TestEmailModal"
import ConfirmModal from "../../../shared/components/elements/ConfirmModal"
import SelectField from "../../../shared/components/elements/SelectField"
import { ShieldAlert, Loader2, Building, ShieldOff } from "lucide-react"

export const SystemSettingsPage = () => {
  const { user, hasPermission } = useAuth()
  const userRole = user?.primaryRole || user?.role || "COMPANY_ADMIN"
  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN"
  const isCompanyAdmin = userRole.toUpperCase() === "COMPANY_ADMIN"

  const canViewSettings =
    isSuperAdmin ||
    isCompanyAdmin ||
    hasPermission("view:system_settings") ||
    hasPermission("SYSTEM_SETTINGS", "canView") ||
    Boolean(user?.permissions?.SYSTEM_SETTINGS?.canView)

  const canEditSettings =
    isSuperAdmin ||
    isCompanyAdmin ||
    hasPermission("edit:system_settings") ||
    hasPermission("SYSTEM_SETTINGS", "canEdit") ||
    Boolean(user?.permissions?.SYSTEM_SETTINGS?.canEdit)

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    isSuperAdmin ? null : (user?.companyId || null)
  )

  const { data: companiesRes, isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies-all-options"],
    queryFn: () => companyApi.getCompanies(),
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  })

  const rawCompanies = Array.isArray(companiesRes?.data)
    ? companiesRes.data
    : companiesRes?.data?.companies || (Array.isArray(companiesRes) ? companiesRes : [])

  const companiesList = Array.isArray(rawCompanies) ? rawCompanies : []

  const companyOptions = companiesList.map((comp) => ({
    value: String(comp.id),
    label: comp.name ? `${comp.name}${comp.code ? ` (${comp.code})` : ""}` : `Company #${comp.id}`,
  }))

  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : user?.companyId

  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const {
    formData,
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
    saveCategory,
    isSaving,
    resetCategoryDefaults,
    isResetting,
    sendTestEmail,
    isSendingTestEmail,
  } = useSettings(effectiveCompanyId, {
    enabled: Boolean(effectiveCompanyId),
  })

  const currentCategoryObj = CATEGORY_ITEMS.find((item) => item.id === activeTab) || CATEGORY_ITEMS[0]
  const isRestrictedTab = currentCategoryObj.adminOnly && !canEditSettings

  const handleSave = async () => {
    await saveCategory(activeTab)
  }

  const handleConfirmReset = async () => {
    await resetCategoryDefaults(activeTab)
    setConfirmResetOpen(false)
  }

  if (!canViewSettings) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-none max-w-lg mx-auto my-12 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-[10px] bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto">
          <ShieldOff className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Your current role does not have permission to view or configure System Settings. Contact your administrator if you require access.
          </p>
        </div>
      </div>
    )
  }

  if (isSuperAdmin && !selectedCompanyId) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-none p-12 text-center shadow-xs space-y-5">
          <div className="w-14 h-14 mx-auto rounded-[12px] bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
            <Building className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Select Company to Manage System Settings</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              As a Super Administrator, choose an organization or company tenant to inspect and configure its operational defaults, branding, email server, and security policies.
            </p>
          </div>
          <div className="max-w-sm mx-auto pt-2">
            <SelectField
              id="superadmin-initial-company-select"
              label="Select Company Tenant"
              value=""
              onChange={(val) => setSelectedCompanyId(val ? Number(val) : null)}
              options={companyOptions}
              placeholder="Select a company from the list..."
              isLoading={loadingCompanies}
            />
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 bg-white border border-slate-200 rounded-none p-12 shadow-xs">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading system configurations...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-none max-w-lg mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Failed to Load Settings</h3>
        <p className="text-xs text-rose-600 mt-1">{error?.message || "An error occurred fetching configurations"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      <SettingsHeader
        activeTabTitle={currentCategoryObj.label}
        activeTabCategory={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDirty={isDirty}
        onSave={handleSave}
        onReset={() => setConfirmResetOpen(true)}
        onOpenTestEmail={() => setTestEmailModalOpen(true)}
        isSaving={isSaving}
        isResetting={isResetting}
        canEditSettings={canEditSettings}
        isSuperAdmin={isSuperAdmin}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
        companies={companiesList}
      />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-4">
          <SettingsLeftNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            userRole={userRole}
            canEditSettings={canEditSettings}
          />
        </div>

        <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-none p-5 sm:p-7 shadow-xs">
          {isRestrictedTab ? (
            <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-none space-y-3">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Restricted Administrator Section</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Category <strong>{currentCategoryObj.label}</strong> is restricted strictly to System Administrators. Your current role does not have edit permissions for this section.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "general" && (
                <GeneralSettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
              {activeTab === "company" && (
                <CompanySettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
              {activeTab === "crm" && (
                <CrmSettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
              {activeTab === "notification" && (
                <NotificationSettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
              {activeTab === "security" && (
                <SecuritySettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
              {activeTab === "email" && (
                <EmailSettingsForm
                  formData={formData}
                  updateField={updateField}
                  onOpenTestEmail={() => setTestEmailModalOpen(true)}
                  readOnly={!canEditSettings}
                />
              )}
              {activeTab === "branding" && (
                <BrandingSettingsForm formData={formData} updateField={updateField} readOnly={!canEditSettings} />
              )}
            </>
          )}
        </div>
      </div>

      <TestEmailModal
        isOpen={testEmailModalOpen}
        onClose={() => setTestEmailModalOpen(false)}
        onSendTestEmail={sendTestEmail}
        isSending={isSendingTestEmail}
        userEmail={user?.email}
      />

      <ConfirmModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
        title={`Reset ${currentCategoryObj.label}?`}
        message={`Are you sure you want to reset all settings under '${currentCategoryObj.label}' back to system default values? This action cannot be undone.`}
        confirmText="Reset to Defaults"
        type="error"
        isLoading={isResetting}
      />
    </div>
  )
}

export default SystemSettingsPage




