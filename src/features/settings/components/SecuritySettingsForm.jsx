// crm-web/src/features/settings/components/SecuritySettingsForm.jsx

import React, { useState } from "react"
import { ShieldCheck, Lock, Clock, AlertTriangle, Plus, Trash2, ShieldAlert } from "lucide-react"

export const SecuritySettingsForm = ({ formData, updateField }) => {
  const [newIp, setNewIp] = useState("")

  const ipList = Array.isArray(formData.ipWhitelisting) ? formData.ipWhitelisting : []

  const handleAddIp = () => {
    if (!newIp.trim()) return
    const updated = [...ipList, newIp.trim()]
    updateField("ipWhitelisting", updated)
    setNewIp("")
  }

  const handleRemoveIp = (index) => {
    const updated = ipList.filter((_, i) => i !== index)
    updateField("ipWhitelisting", updated)
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Security & Account Authentication Policy
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Define session timeouts, brute-force protection, password complexity rules, and IP access restrictions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Session Timeout */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Idle Session Timeout (Minutes)
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            value={formData.sessionTimeoutMinutes || 60}
            onChange={(e) => updateField("sessionTimeoutMinutes", Number(e.target.value))}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Auto logs out inactive users after set duration</span>
        </div>

        {/* Password Expiry Days */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> Password Expiration Period (Days)
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={formData.passwordExpiryDays || 90}
            onChange={(e) => updateField("passwordExpiryDays", Number(e.target.value))}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Set 0 to disable password expiration</span>
        </div>

        {/* Max Login Attempts */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Max Failed Login Attempts
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={formData.maxLoginAttempts || 5}
            onChange={(e) => updateField("maxLoginAttempts", Number(e.target.value))}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Lockout Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Account Lockout Duration (Minutes)
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={formData.lockoutDurationMinutes || 15}
            onChange={(e) => updateField("lockoutDurationMinutes", Number(e.target.value))}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Password Complexity Checklist */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Password Complexity Policy
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.requireUppercase ?? true}
                onChange={(e) => updateField("requireUppercase", e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-orange-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.requireLowercase ?? true}
                onChange={(e) => updateField("requireLowercase", e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-orange-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.requireNumber ?? true}
                onChange={(e) => updateField("requireNumber", e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-orange-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.requireSpecialChar ?? true}
                onChange={(e) => updateField("requireSpecialChar", e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-orange-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">Symbols (@#$)</span>
            </label>
          </div>
        </div>

        {/* IP Whitelisting Table */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Allowed IP Whitelist (Optional)
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Empty list allows access from any IP</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
              className="flex-1 px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
            <button
              type="button"
              onClick={handleAddIp}
              className="px-4 py-2 bg-primary hover:bg-[#E06202] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add IP
            </button>
          </div>

          {ipList.length > 0 && (
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {ipList.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2 text-xs font-mono font-semibold text-slate-700 hover:bg-slate-50">
                  <span>{ip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
