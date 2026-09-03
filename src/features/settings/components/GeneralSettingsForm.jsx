// crm-web/src/features/settings/components/GeneralSettingsForm.jsx

import React from "react"
import { Building2, Globe, Clock, DollarSign, Calendar, Languages, Image } from "lucide-react"
import SelectField from "../../../shared/components/elements/SelectField"

const isValidHttpUrl = (str) => {
  if (!str || str.trim() === "") return true
  try {
    const url = new URL(str.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST - UTC+05:30) (Default)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New_York (EST - UTC-05:00)" },
  { value: "Europe/London", label: "Europe/London (GMT - UTC+00:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST - UTC+04:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST - UTC+10:00)" },
]

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹) (Default)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "CAD", label: "CAD (C$)" },
]

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (India/UK - e.g. 27/08/2026) (Default)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO 8601 - e.g. 2026-08-27)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US - e.g. 08/27/2026)" },
  { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY (e.g. 27-Aug-2026)" },
]

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
]

export const GeneralSettingsForm = ({ formData, updateField, readOnly = false }) => {
  const isWebsiteValid = isValidHttpUrl(formData.website)
  const isLogoValid = isValidHttpUrl(formData.companyLogo)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Basic System Information
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Configure default company parameters, timezones, and regional formatting options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Company Name */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
            Company Name
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.companyName || ""}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" /> Official Website
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={readOnly}
              value={formData.website || ""}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://www.example.com"
              className={`w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                !isWebsiteValid
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
              }`}
            />
          </div>
          {!isWebsiteValid && (
            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>

        {/* Company Logo URL */}
        <div className="md:col-span-2">
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-slate-400" /> Company Logo URL
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              disabled={readOnly}
              value={formData.companyLogo || ""}
              onChange={(e) => updateField("companyLogo", e.target.value)}
              placeholder="https://cdn.example.com/logo.png"
              className={`flex-1 w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                !isLogoValid
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
              }`}
            />
            {formData.companyLogo && isLogoValid && (
              <div className="h-[38px] px-3 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[8px] shrink-0 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Preview:</span>
                <img
                  src={formData.companyLogo}
                  alt="Logo Preview"
                  className="h-6 max-w-[100px] object-contain"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
          </div>
          {!isLogoValid && (
            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid image URL starting with http:// or https://
            </span>
          )}
        </div>

        {/* Time Zone using shared SelectField */}
        <div>
          <SelectField
            label="Time Zone"
            disabled={readOnly}
            value={formData.timeZone || "Asia/Kolkata"}
            onChange={(val) => updateField("timeZone", val)}
            options={TIMEZONE_OPTIONS}
            placeholder="Select Timezone"
          />
        </div>

        {/* Currency & Symbol */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <SelectField
              label="Currency"
              disabled={readOnly}
              value={formData.currency || "INR"}
              onChange={(val) => {
                const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$" }
                updateField("currency", val)
                if (symbols[val]) updateField("currencySymbol", symbols[val])
              }}
              options={CURRENCY_OPTIONS}
              placeholder="Select Currency"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
              Symbol
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.currencySymbol || "₹"}
              onChange={(e) => updateField("currencySymbol", e.target.value)}
              className="w-full px-3 h-[38px] text-[13px] font-semibold text-center bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Date Format using shared SelectField */}
        <div>
          <SelectField
            label="Date Format"
            disabled={readOnly}
            value={formData.dateFormat || "DD/MM/YYYY"}
            onChange={(val) => updateField("dateFormat", val)}
            options={DATE_FORMAT_OPTIONS}
            placeholder="Select Date Format"
          />
        </div>

        {/* System Language using shared SelectField */}
        <div>
          <SelectField
            label="Primary Language"
            disabled={readOnly}
            value={formData.language || "en"}
            onChange={(val) => updateField("language", val)}
            options={LANGUAGE_OPTIONS}
            placeholder="Select Language"
          />
        </div>
      </div>
    </div>
  )
}




