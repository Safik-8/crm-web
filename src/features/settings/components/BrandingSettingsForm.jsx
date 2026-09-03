// crm-web/src/features/settings/components/BrandingSettingsForm.jsx

import React from "react"
import { Palette, SunMoon, Image, Globe, Sparkles } from "lucide-react"
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

const isValidDomain = (str) => {
  if (!str || str.trim() === "") return true
  return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(str.trim())
}

const THEME_OPTIONS = [
  { value: "LIGHT", label: "Clean Light Mode (Default)" },
  { value: "DARK", label: "Dark Mode Theme" },
  { value: "SYSTEM", label: "Sync with OS System Preference" },
]

export const BrandingSettingsForm = ({ formData, updateField, readOnly = false }) => {
  const isFaviconValid = isValidHttpUrl(formData.faviconUrl)
  const isLoginBgValid = isValidHttpUrl(formData.loginBackgroundUrl)
  const isCustomDomainValid = isValidDomain(formData.customDomain)

  const handleColorChange = (key, value) => {
    if (readOnly) return
    updateField(key, value)
    if (key === "primaryColor") {
      document.documentElement.style.setProperty("--color-primary", value)
    } else if (key === "accentColor") {
      document.documentElement.style.setProperty("--color-accent", value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Branding & Visual Customization
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Customize CRM theme colors, login screen graphics, favicons, and email template styles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Brand Theme Color Pickers */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Enterprise Brand Color Palette
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Color */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Primary Brand Accent</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  disabled={readOnly}
                  value={formData.primaryColor || "#ea580c"}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-9 h-9 rounded-[8px] border border-slate-200 bg-white cursor-pointer p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.primaryColor || "#ea580c"}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Secondary UI Tint</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  disabled={readOnly}
                  value={formData.secondaryColor || "#0284c7"}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-9 h-9 rounded-[8px] border border-slate-200 bg-white cursor-pointer p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.secondaryColor || "#0284c7"}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Highlight / Alert Accent</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  disabled={readOnly}
                  value={formData.accentColor || "#f59e0b"}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-9 h-9 rounded-[8px] border border-slate-200 bg-white cursor-pointer p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.accentColor || "#f59e0b"}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Mode using shared SelectField */}
        <div>
          <SelectField
            label="Default Application Interface Theme"
            disabled={readOnly}
            value={formData.themeMode || "LIGHT"}
            onChange={(val) => updateField("themeMode", val)}
            options={THEME_OPTIONS}
            placeholder="Select Theme"
          />
        </div>

        {/* Custom Domain */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" /> Custom Domain CNAME Routing
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.customDomain || ""}
            onChange={(e) => updateField("customDomain", e.target.value)}
            placeholder="crm.mycompany.com"
            className={`w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              !isCustomDomainValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isCustomDomainValid && (
            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid domain format (e.g. crm.mycompany.com)
            </span>
          )}
        </div>

        {/* Favicon URL */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-slate-400" /> Browser Favicon Image URL (.ico / .png)
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.faviconUrl || ""}
            onChange={(e) => updateField("faviconUrl", e.target.value)}
            placeholder="https://cdn.example.com/favicon.png"
            className={`w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              !isFaviconValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isFaviconValid && (
            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>

        {/* Login Background Image URL */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-slate-400" /> Login Screen Background Graphic URL
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.loginBackgroundUrl || ""}
            onChange={(e) => updateField("loginBackgroundUrl", e.target.value)}
            placeholder="https://cdn.example.com/login-bg.jpg"
            className={`w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              !isLoginBgValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isLoginBgValid && (
            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>
      </div>
    </div>
  )
}




