// crm-web/src/features/settings/pages/SystemSettingsPage.jsx

import React, { useState } from "react"
import { useAuth } from "../../../app/providers/AuthProvider"
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
import { ShieldAlert, Loader2 } from "lucide-react"

export const SystemSettingsPage = () => {
  const { user, hasPermission } = useAuth()
  const userRole = user?.primaryRole || user?.role || "COMPANY_ADMIN"
  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN"
  const isCompanyAdmin = userRole.toUpperCase() === "COMPANY_ADMIN"
  const canEditSettings = isSuperAdmin || isCompanyAdmin || hasPermission("edit:system_settings") || Boolean(user?.permissions?.SYSTEM_SETTINGS?.canEdit)

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
    updateCategoryData,
    resetLocalChanges,
    saveCategory,
    isSaving,
    resetCategoryDefaults,
    isResetting,
    sendTestEmail,
    isSendingTestEmail,
  } = useSettings()

  const currentCategoryObj = CATEGORY_ITEMS.find((item) => item.id === activeTab) || CATEGORY_ITEMS[0]
  const isRestrictedTab = currentCategoryObj.adminOnly && !canEditSettings

  const handleSave = async () => {
    await saveCategory(activeTab)
  }

  const handleConfirmReset = async () => {
    await resetCategoryDefaults(activeTab)
    setConfirmResetOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 bg-white border border-slate-200/80 rounded-2xl p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading system configurations...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Failed to Load Settings</h3>
        <p className="text-xs text-rose-600 mt-1">{error?.message || "An error occurred fetching configurations"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
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
      />

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1">
          <SettingsLeftNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            userRole={userRole}
            canEditSettings={canEditSettings}
          />
        </div>

        {/* Right Category Form Container */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-xl p-5 sm:p-7 shadow-xs">
          {isRestrictedTab ? (
            <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Restricted Administrator Section</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Category <strong>{currentCategoryObj.label}</strong> is restricted strictly to System Administrators. Your current role does not have edit permissions for this section.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "general" && (
                <GeneralSettingsForm formData={formData} updateField={updateField} />
              )}
              {activeTab === "company" && (
                <CompanySettingsForm formData={formData} updateField={updateField} />
              )}
              {activeTab === "crm" && (
                <CrmSettingsForm formData={formData} updateField={updateField} />
              )}
              {activeTab === "notification" && (
                <NotificationSettingsForm formData={formData} updateField={updateField} />
              )}
              {activeTab === "security" && (
                <SecuritySettingsForm formData={formData} updateField={updateField} />
              )}
              {activeTab === "email" && (
                <EmailSettingsForm
                  formData={formData}
                  updateField={updateField}
                  onOpenTestEmail={() => setTestEmailModalOpen(true)}
                />
              )}
              {activeTab === "branding" && (
                <BrandingSettingsForm formData={formData} updateField={updateField} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={testEmailModalOpen}
        onClose={() => setTestEmailModalOpen(false)}
        onSendTestEmail={sendTestEmail}
        isSending={isSendingTestEmail}
        userEmail={user?.email}
      />

      {/* Confirm Reset Category Defaults Modal */}
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

