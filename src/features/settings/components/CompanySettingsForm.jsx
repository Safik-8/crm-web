// crm-web/src/features/settings/components/CompanySettingsForm.jsx

import React from "react"
import { Building, Receipt, MapPin, Briefcase, Clock } from "lucide-react"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export const CompanySettingsForm = ({ formData, updateField }) => {
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
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Provide legal business identity information used for invoice headers, customer quotes, and compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Registered Business Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Registered Legal Business Name
          </label>
          <input
            type="text"
            value={formData.registeredBusinessName || ""}
            onChange={(e) => updateField("registeredBusinessName", e.target.value)}
            placeholder="e.g. Acme Technologies Pvt Ltd"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* GST / Tax Identification Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-slate-500" /> GST / Tax ID / CIN Number
          </label>
          <input
            type="text"
            value={formData.gstTaxNumber || ""}
            onChange={(e) => updateField("gstTaxNumber", e.target.value)}
            placeholder="e.g. 22AAAAA0000A1Z5 / EIN-123456"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Industry Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Industry Type
          </label>
          <select
            value={formData.industryType || "Education / EdTech"}
            onChange={(e) => updateField("industryType", e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value="Education / EdTech">Education / EdTech</option>
            <option value="Information Technology / SaaS">Information Technology / SaaS</option>
            <option value="Real Estate & Construction">Real Estate & Construction</option>
            <option value="Financial Services & Banking">Financial Services & Banking</option>
            <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
            <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
            <option value="Retail & E-Commerce">Retail & E-Commerce</option>
            <option value="Consulting & Professional Services">Consulting & Professional Services</option>
          </select>
        </div>

        {/* Business Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" /> Registered Business Address
          </label>
          <textarea
            rows={3}
            value={formData.businessAddress || ""}
            onChange={(e) => updateField("businessAddress", e.target.value)}
            placeholder="Suite 100, Innovation Tower, City, Zip Code, Country"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none"
          />
        </div>
      </div>

      {/* Business Hours Matrix */}
      <div className="border-t border-slate-100 pt-5 mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" /> Business Hours & Working Days
        </h4>

        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {DAYS.map((day) => {
            const config = businessHours[day] || { open: "09:00", close: "18:00", active: false }
            return (
              <div key={day} className="flex items-center justify-between p-3.5 gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-[130px]">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={config.active || false}
                    onChange={(e) => handleHourChange(day, "active", e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-orange-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor={`day-${day}`} className="text-xs font-semibold text-slate-800 capitalize cursor-pointer">
                    {day}
                  </label>
                </div>

                {config.active ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={config.open || "09:00"}
                      onChange={(e) => handleHourChange(day, "open", e.target.value)}
                      className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium">to</span>
                    <input
                      type="time"
                      value={config.close || "18:00"}
                      onChange={(e) => handleHourChange(day, "close", e.target.value)}
                      className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic px-3">Closed / Off Day</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
