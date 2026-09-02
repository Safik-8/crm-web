// crm-web/src/features/settings/components/SettingsHeader.jsx

import React from "react"
import { Search, Save, RotateCcw, Send, AlertCircle, CheckCircle2, Sliders } from "lucide-react"

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
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
      {/* Title & Status */}
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shrink-0">
          <Sliders className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{activeTabTitle}</h1>
            {isDirty ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3 h-3" /> Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> All Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure system options and operational parameters for {activeTabTitle.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Action Controls & Search */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Live Category Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:flex-none">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Test Email Button (only for Email Settings tab) */}
        {activeTabCategory === "email" && (
          <button
            type="button"
            onClick={onOpenTestEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Test SMTP
          </button>
        )}

        {/* Reset Category Defaults */}
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting || isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} /> Reset
        </button>

        {/* Save Category Changes */}
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isDirty && !isSaving
              ? "bg-primary hover:bg-[#E06202] text-white cursor-pointer shadow-orange-100"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
