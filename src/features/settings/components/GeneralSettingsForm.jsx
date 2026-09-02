// crm-web/src/features/settings/components/GeneralSettingsForm.jsx

import React from "react"
import { Building2, Globe, Clock, DollarSign, Calendar, Languages } from "lucide-react"

const isValidHttpUrl = (str) => {
  if (!str || str.trim() === "") return true
  try {
    const url = new URL(str.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const GeneralSettingsForm = ({ formData, updateField }) => {
  const isWebsiteValid = isValidHttpUrl(formData.website)
  const isLogoValid = isValidHttpUrl(formData.companyLogo)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Basic System Information
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure default company parameters, timezones, and regional formatting options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name</label>
          <input
            type="text"
            value={formData.companyName || ""}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Website</label>
          <div className="relative">
            <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={formData.website || ""}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://www.example.com"
              className={`w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                !isWebsiteValid
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
              }`}
            />
          </div>
          {!isWebsiteValid && (
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>

        {/* Company Logo URL */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Logo URL</label>
          <input
            type="text"
            value={formData.companyLogo || ""}
            onChange={(e) => updateField("companyLogo", e.target.value)}
            placeholder="https://cdn.example.com/logo.png"
            className={`w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              !isLogoValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isLogoValid ? (
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid image URL starting with http:// or https://
            </span>
          ) : formData.companyLogo ? (
            <div className="mt-2.5 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Logo Preview:</span>
              <img
                src={formData.companyLogo}
                alt="Logo Preview"
                className="h-8 max-w-[120px] object-contain rounded border border-slate-200 bg-slate-50 p-1"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          ) : null}
        </div>

        {/* Time Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Time Zone
          </label>
          <select
            value={formData.timeZone || "Asia/Kolkata"}
            onChange={(e) => updateField("timeZone", e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30) (Default)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
            <option value="Europe/London">Europe/London (GMT - UTC+00:00)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST - UTC+10:00)</option>
          </select>
        </div>

        {/* Currency & Symbol */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Currency
            </label>
            <select
              value={formData.currency || "INR"}
              onChange={(e) => {
                const val = e.target.value
                const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$" }
                updateField("currency", val)
                if (symbols[val]) updateField("currencySymbol", symbols[val])
              }}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            >
              <option value="INR">INR (₹) (Default)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Symbol</label>
            <input
              type="text"
              value={formData.currencySymbol || "₹"}
              onChange={(e) => updateField("currencySymbol", e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date Format
          </label>
          <select
            value={formData.dateFormat || "DD/MM/YYYY"}
            onChange={(e) => updateField("dateFormat", e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (India/UK - e.g. 27/08/2026) (Default)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 - e.g. 2026-08-27)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US - e.g. 08/27/2026)</option>
            <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 27-Aug-2026)</option>
          </select>
        </div>

        {/* System Language */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-slate-500" /> Primary Language
          </label>
          <select
            value={formData.language || "en"}
            onChange={(e) => updateField("language", e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value="en">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="es">Spanish (Español)</option>
            <option value="fr">French (Français)</option>
            <option value="de">German (Deutsch)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
