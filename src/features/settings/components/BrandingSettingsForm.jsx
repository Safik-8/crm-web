import React from "react"
import { Palette, SunMoon, Image, Globe, Sparkles } from "lucide-react"

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

export const BrandingSettingsForm = ({ formData, updateField }) => {
  const isFaviconValid = isValidHttpUrl(formData.faviconUrl)
  const isLoginBgValid = isValidHttpUrl(formData.loginBackgroundUrl)
  const isCustomDomainValid = isValidDomain(formData.customDomain)

  const handleColorChange = (key, value) => {
    updateField(key, value)
    // Live CSS variable update for instant preview
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
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Customize CRM theme colors, login screen graphics, favicons, and email template styles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Brand Theme Color Pickers */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Brand Color Palette
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Color */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Primary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor || "#ea580c"}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.primaryColor || "#ea580c"}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor || "#0284c7"}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.secondaryColor || "#0284c7"}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor || "#f59e0b"}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.accentColor || "#f59e0b"}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <SunMoon className="w-3.5 h-3.5 text-slate-500" /> Default Application Theme
          </label>
          <select
            value={formData.themeMode || "LIGHT"}
            onChange={(e) => updateField("themeMode", e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value="LIGHT">Clean Light Mode (Default)</option>
            <option value="DARK">Dark Theme</option>
            <option value="SYSTEM">Sync with System Preference</option>
          </select>
        </div>

        {/* Custom Domain */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" /> Custom Domain CNAME
          </label>
          <input
            type="text"
            value={formData.customDomain || ""}
            onChange={(e) => updateField("customDomain", e.target.value)}
            placeholder="crm.mycompany.com"
            className={`w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              !isCustomDomainValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isCustomDomainValid && (
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid domain format (e.g. crm.mycompany.com)
            </span>
          )}
        </div>

        {/* Favicon URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-slate-500" /> Browser Favicon Image URL (.ico / .png)
          </label>
          <input
            type="text"
            value={formData.faviconUrl || ""}
            onChange={(e) => updateField("faviconUrl", e.target.value)}
            placeholder="https://cdn.example.com/favicon.png"
            className={`w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              !isFaviconValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isFaviconValid && (
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>

        {/* Login Background Image URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-slate-500" /> Login Screen Background Graphic URL
          </label>
          <input
            type="text"
            value={formData.loginBackgroundUrl || ""}
            onChange={(e) => updateField("loginBackgroundUrl", e.target.value)}
            placeholder="https://cdn.example.com/login-bg.jpg"
            className={`w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              !isLoginBgValid
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
            }`}
          />
          {!isLoginBgValid && (
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
              Please enter a valid URL starting with http:// or https://
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
