// crm-web/src/features/settings/components/SecuritySettingsForm.jsx

import React, { useState } from "react"
import { ShieldCheck, Lock, Clock, AlertTriangle, Plus, Trash2, ShieldAlert } from "lucide-react"
import Button from "../../../shared/components/elements/Button"
import Checkbox from "../../../shared/components/elements/Checkbox"

export const SecuritySettingsForm = ({ formData, updateField, readOnly = false }) => {
  const [newIp, setNewIp] = useState("")

  const ipList = Array.isArray(formData.ipWhitelisting) ? formData.ipWhitelisting : []

  const handleAddIp = () => {
    if (readOnly || !newIp.trim()) return
    const updated = [...ipList, newIp.trim()]
    updateField("ipWhitelisting", updated)
    setNewIp("")
  }

  const handleRemoveIp = (index) => {
    if (readOnly) return
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
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Define session timeouts, brute-force protection, password complexity rules, and IP access restrictions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Session Timeout */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Idle Session Timeout (Minutes)
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            disabled={readOnly}
            value={formData.sessionTimeoutMinutes || 60}
            onChange={(e) => updateField("sessionTimeoutMinutes", Number(e.target.value))}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Auto logs out inactive users after set duration</span>
        </div>

        {/* Password Expiry Days */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" /> Password Expiration Period (Days)
          </label>
          <input
            type="number"
            min={0}
            max={365}
            disabled={readOnly}
            value={formData.passwordExpiryDays || 90}
            onChange={(e) => updateField("passwordExpiryDays", Number(e.target.value))}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Set 0 to disable password expiration</span>
        </div>

        {/* Max Login Attempts */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Max Failed Login Attempts
          </label>
          <input
            type="number"
            min={1}
            max={20}
            disabled={readOnly}
            value={formData.maxLoginAttempts || 5}
            onChange={(e) => updateField("maxLoginAttempts", Number(e.target.value))}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Consecutive invalid attempts before account lockout</span>
        </div>

        {/* Lockout Duration */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Account Lockout Duration (Minutes)
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            disabled={readOnly}
            value={formData.lockoutDurationMinutes || 15}
            onChange={(e) => updateField("lockoutDurationMinutes", Number(e.target.value))}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Temporary lockout duration for suspicious logins</span>
        </div>

        {/* Password Complexity Checklist */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            Password Complexity Enforcement Policy
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className={`flex items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-[8px] transition-colors shadow-2xs ${readOnly ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50/70 cursor-pointer'}`}>
              <Checkbox
                checked={formData.requireUppercase ?? true}
                disabled={readOnly}
                onChange={(checked) => updateField("requireUppercase", checked)}
              />
              <span className="text-[12px] font-semibold text-slate-800">Uppercase (A-Z)</span>
            </label>

            <label className={`flex items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-[8px] transition-colors shadow-2xs ${readOnly ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50/70 cursor-pointer'}`}>
              <Checkbox
                checked={formData.requireLowercase ?? true}
                disabled={readOnly}
                onChange={(checked) => updateField("requireLowercase", checked)}
              />
              <span className="text-[12px] font-semibold text-slate-800">Lowercase (a-z)</span>
            </label>

            <label className={`flex items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-[8px] transition-colors shadow-2xs ${readOnly ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50/70 cursor-pointer'}`}>
              <Checkbox
                checked={formData.requireNumber ?? true}
                disabled={readOnly}
                onChange={(checked) => updateField("requireNumber", checked)}
              />
              <span className="text-[12px] font-semibold text-slate-800">Numbers (0-9)</span>
            </label>

            <label className={`flex items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-[8px] transition-colors shadow-2xs ${readOnly ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50/70 cursor-pointer'}`}>
              <Checkbox
                checked={formData.requireSpecialChar ?? true}
                disabled={readOnly}
                onChange={(checked) => updateField("requireSpecialChar", checked)}
              />
              <span className="text-[12px] font-semibold text-slate-800">Symbols (@#$)</span>
            </label>
          </div>
        </div>

        {/* IP Whitelisting Table */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Allowed IP Whitelist (Optional)
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Empty list allows access from any IP</span>
          </div>

          {!readOnly && (
            <div className="flex gap-2.5">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
                className="flex-1 px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs"
              />
              <Button
                onClick={handleAddIp}
                variant="contained"
                size="small"
                startIcon={<Plus size={14} />}
                sx={{
                  height: '38px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  backgroundColor: '#F86F03',
                  '&:hover': {
                    backgroundColor: '#E05E00',
                  }
                }}
              >
                Add IP
              </Button>
            </div>
          )}

          {ipList.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-none divide-y divide-slate-100 max-h-48 overflow-y-auto shadow-2xs">
              {ipList.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-700 hover:bg-slate-50/70">
                  <span>{ip}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-[6px] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            readOnly && (
              <p className="text-xs text-slate-400 italic">No IP whitelisting restrictions defined</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}




