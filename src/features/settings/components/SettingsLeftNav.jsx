// crm-web/src/features/settings/components/SettingsLeftNav.jsx

import React from "react"
import {
  Sliders,
  Building,
  Database,
  Bell,
  ShieldCheck,
  Mail,
  Palette,
  Search,
  Lock,
} from "lucide-react"

export const CATEGORY_ITEMS = [
  { id: "general", label: "General Settings", icon: Sliders, desc: "Timezone, Currency, Language", restricted: false },
  { id: "company", label: "Company Details", icon: Building, desc: "Tax ID, Address, Business Hours", restricted: false },
  { id: "crm", label: "CRM Defaults", icon: Database, desc: "Lead statuses, Pipelines, Auto-Assign", restricted: false },
  { id: "notification", label: "Notifications", icon: Bell, desc: "Reminder times, Channels, Summaries", restricted: false },
  { id: "security", label: "Security Policy", icon: ShieldCheck, desc: "Password rules, Timeout, IP Whitelist", restricted: false, adminOnly: true },
  { id: "email", label: "Email (SMTP)", icon: Mail, desc: "SMTP Host, Credentials, Signatures", restricted: false, adminOnly: true },
  { id: "branding", label: "Branding & Theme", icon: Palette, desc: "Colors, Dark/Light Mode, Favicon", restricted: false },
]

export const SettingsLeftNav = ({
  activeTab,
  onTabChange,
  searchQuery,
  userRole = "COMPANY_ADMIN",
  canEditSettings = true,
}) => {
  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN"
  const isCompanyAdmin = userRole.toUpperCase() === "COMPANY_ADMIN"

  const filteredCategories = CATEGORY_ITEMS.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    )
  })

  return (
    <nav className="w-full flex flex-col gap-1.5 p-2 bg-white border border-slate-200/80 rounded-xl shadow-xs">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Settings Categories ({filteredCategories.length})
      </div>

      {filteredCategories.length === 0 ? (
        <div className="px-4 py-6 text-center text-slate-500 text-xs">
          No categories match "{searchQuery}"
        </div>
      ) : (
        filteredCategories.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const isRestricted = item.adminOnly && !canEditSettings

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-orange-50 text-orange-700 font-bold border border-orange-200/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors shrink-0 ${
                  isActive
                    ? "bg-orange-100 text-orange-600"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate leading-tight">{item.label}</span>
                  {item.adminOnly && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase ${
                        isActive
                          ? "bg-orange-200/70 text-orange-800"
                          : "bg-amber-50 text-amber-700 border border-amber-200/70"
                      }`}
                    >
                      ADMIN
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? "text-orange-600/80 font-medium" : "text-slate-400"
                  }`}
                >
                  {item.desc}
                </p>
              </div>

              {isRestricted && (
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              )}
            </button>
          )
        })
      )}
    </nav>
  )
}
