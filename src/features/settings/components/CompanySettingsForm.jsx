// crm-web/src/features/settings/components/CompanySettingsForm.jsx

import React from "react"
import { Building, Receipt, MapPin, Briefcase, Clock } from "lucide-react"
import SelectField from "../../../shared/components/elements/SelectField"

const DAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

const INDUSTRY_OPTIONS = [
  { value: "Education / EdTech", label: "Education / EdTech" },
  { value: "Information Technology / SaaS", label: "Information Technology / SaaS" },
  { value: "Real Estate & Construction", label: "Real Estate & Construction" },
  { value: "Financial Services & Banking", label: "Financial Services & Banking" },
  { value: "Healthcare & Pharmaceuticals", label: "Healthcare & Pharmaceuticals" },
  { value: "Manufacturing & Logistics", label: "Manufacturing & Logistics" },
  { value: "Retail & E-Commerce", label: "Retail & E-Commerce" },
  { value: "Consulting & Professional Services", label: "Consulting & Professional Services" },
]

export const CompanySettingsForm = ({ formData, updateField, readOnly = false }) => {
  const businessHours = formData.businessHours || {
    monday: { open: "09:00", close: "18:00", active: true },
    tuesday: { open: "09:00", close: "18:00", active: true },
    wednesday: { open: "09:00", close: "18:00", active: true },
    thursday: { open: "09:00", close: "18:00", active: true },
    friday: { open: "09:00", close: "18:00", active: true },
    saturday: { open: "09:00", close: "14:00", active: false },
    sunday: { open: "00:00", close: "00:00", active: false },
  }

  const handleHourChange = (day, field, value) => {
    if (readOnly) return
    const updated = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [field]: value,
      },
    }
    updateField("businessHours", updated)
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" /> Official Business & Tax Details
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Provide legal business identity information used for invoice headers, customer quotes, and compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Registered Business Name */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
            Registered Legal Business Name
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.registeredBusinessName || ""}
            onChange={(e) => updateField("registeredBusinessName", e.target.value)}
            placeholder="e.g. Acme Technologies Pvt Ltd"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* GST / Tax Identification Number */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-400" /> GST / Tax ID / CIN Number
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.gstTaxNumber || ""}
            onChange={(e) => updateField("gstTaxNumber", e.target.value)}
            placeholder="e.g. 22AAAAA0000A1Z5 / EIN-123456"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* Industry Type using shared SelectField */}
        <div className="md:col-span-2">
          <SelectField
            label="Primary Industry Sector"
            disabled={readOnly}
            value={formData.industryType || "Education / EdTech"}
            onChange={(val) => updateField("industryType", val)}
            options={INDUSTRY_OPTIONS}
            placeholder="Select Industry"
          />
        </div>

        {/* Business Address */}
        <div className="md:col-span-2">
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Registered Headquarters Address
          </label>
          <textarea
            rows={3}
            disabled={readOnly}
            value={formData.businessAddress || ""}
            onChange={(e) => updateField("businessAddress", e.target.value)}
            placeholder="Suite 100, Innovation Tower, City, Zip Code, Country"
            className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none shadow-2xs leading-relaxed disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Business Hours Matrix */}
      <div className="border-t border-slate-100 pt-5 mt-6">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" /> Operating Business Hours & Working Schedule
        </h4>

        <div className="bg-white border border-slate-200 rounded-none divide-y divide-slate-100 overflow-hidden shadow-xs">
          {DAYS.map((dayObj) => {
            const dayKey = dayObj.id
            const config = businessHours[dayKey] || { open: "09:00", close: "18:00", active: false }
            return (
              <div key={dayKey} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-4 gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    id={`day-${dayKey}`}
                    disabled={readOnly}
                    checked={config.active || false}
                    onChange={(e) => handleHourChange(dayKey, "active", e.target.checked)}
                    className="w-4 h-4 rounded-[4px] text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <label htmlFor={`day-${dayKey}`} className={`text-[13px] font-semibold text-slate-800 ${readOnly ? 'cursor-not-allowed text-slate-500' : 'cursor-pointer'}`}>
                    {dayObj.label}
                  </label>
                </div>

                {config.active ? (
                  <div className="flex items-center gap-2.5">
                    <input
                      type="time"
                      disabled={readOnly}
                      value={config.open || "09:00"}
                      onChange={(e) => handleHourChange(dayKey, "open", e.target.value)}
                      className="px-3 h-[34px] text-[12px] font-medium bg-white border border-slate-200 rounded-[8px] text-slate-800 focus:border-orange-500 focus:outline-none shadow-2xs disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-slate-400 font-medium">to</span>
                    <input
                      type="time"
                      disabled={readOnly}
                      value={config.close || "18:00"}
                      onChange={(e) => handleHourChange(dayKey, "close", e.target.value)}
                      className="px-3 h-[34px] text-[12px] font-medium bg-white border border-slate-200 rounded-[8px] text-slate-800 focus:border-orange-500 focus:outline-none shadow-2xs disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">Closed / Non-operational</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}




