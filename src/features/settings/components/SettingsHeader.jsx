// crm-web/src/features/settings/components/SettingsHeader.jsx

import React from "react"
import { Search, Save, RotateCcw, Send, AlertCircle, CheckCircle2, Sliders, Lock, Building } from "lucide-react"
import Button from "../../../shared/components/elements/Button"
import SelectField from "../../../shared/components/elements/SelectField"

export const SettingsHeader = ({
  activeTabTitle,
  activeTabCategory,
  searchQuery,
  onSearchChange,
  isDirty,
  onSave,
  onReset,
  onOpenTestEmail,
  isSaving,
  isResetting,
  canEditSettings = true,
  isSuperAdmin = false,
  selectedCompanyId = null,
  onCompanyChange = () => {},
  companies = [],
}) => {
  const companyOptions = companies.map((comp) => ({
    value: String(comp.id),
    label: comp.name ? `${comp.name}${comp.code ? ` (${comp.code})` : ""}` : `Company #${comp.id}`,
  }))

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:px-6 sm:py-4 bg-white border border-slate-200 rounded-none shadow-xs">
      {/* Title & Status */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-orange-50 text-orange-600 border border-orange-100/80 shrink-0">
          <Sliders className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{activeTabTitle}</h1>
            {canEditSettings ? (
              isDirty ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> All Saved
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-500" /> Read-Only Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Configure system options and operational parameters for {activeTabTitle.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Controls: Company Selector (Super Admin) + Search + Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Super Admin Company Selector */}
        {isSuperAdmin && (
          <div className="w-full sm:w-56">
            <SelectField
              id="header-company-select"
              value={selectedCompanyId ? String(selectedCompanyId) : ""}
              onChange={(val) => onCompanyChange(val ? Number(val) : null)}
              options={companyOptions}
              placeholder="Switch Company..."
              allowEmptyOption={false}
              startIcon={Building}
            />
          </div>
        )}

        {/* Live Category Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 h-[38px] text-xs font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs"
          />
        </div>

        {/* Test Email Button (only for Email Settings tab and when user can edit) */}
        {activeTabCategory === "email" && canEditSettings && (
          <Button
            onClick={onOpenTestEmail}
            variant="outlined"
            size="small"
            startIcon={<Send size={14} />}
            sx={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              color: '#C2410C',
              borderColor: '#FED7AA',
              backgroundColor: '#FFF7ED',
              '&:hover': {
                borderColor: '#FDBA74',
                backgroundColor: '#FFEDD5',
              }
            }}
          >
            Test SMTP
          </Button>
        )}

        {/* Reset Category Defaults (Hidden if user cannot edit) */}
        {canEditSettings && (
          <Button
            onClick={onReset}
            disabled={isResetting || isSaving}
            isLoading={isResetting}
            variant="outlined"
            size="small"
            startIcon={<RotateCcw size={14} />}
            sx={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              color: '#334155',
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              '&:hover': {
                borderColor: '#CBD5E1',
                backgroundColor: '#F8FAFC',
              }
            }}
          >
            Reset
          </Button>
        )}

        {/* Save Category Changes (Hidden if user cannot edit) */}
        {canEditSettings && (
          <Button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            variant="contained"
            size="small"
            startIcon={<Save size={14} />}
            sx={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'none',
              backgroundColor: isDirty && !isSaving ? '#F86F03' : '#F1F5F9',
              color: isDirty && !isSaving ? '#FFFFFF' : '#94A3B8',
              borderColor: isDirty && !isSaving ? 'transparent' : '#E2E8F0',
              boxShadow: isDirty && !isSaving ? '0 1px 2px 0 rgba(248, 111, 3, 0.25)' : 'none',
              '&:hover': {
                backgroundColor: isDirty && !isSaving ? '#E05E00' : '#F1F5F9',
              }
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  )
}





