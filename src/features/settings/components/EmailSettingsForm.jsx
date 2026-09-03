// crm-web/src/features/settings/components/EmailSettingsForm.jsx

import React from "react"
import { Mail, Server, Lock, User, Send, FileText } from "lucide-react"
import SelectField from "../../../shared/components/elements/SelectField"
import Button from "../../../shared/components/elements/Button"

const ENCRYPTION_OPTIONS = [
  { value: "STARTTLS", label: "STARTTLS (Port 587)" },
  { value: "SSL_TLS", label: "SSL / TLS (Port 465)" },
  { value: "NONE", label: "None / Plaintext (Port 25)" },
]

export const EmailSettingsForm = ({ formData, updateField, onOpenTestEmail, readOnly = false }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> SMTP Outgoing Mail Server Configuration
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Configure outgoing SMTP parameters for automated lead notifications, digests, and email dispatches.
          </p>
        </div>

        {!readOnly && (
          <Button
            onClick={onOpenTestEmail}
            variant="outlined"
            size="small"
            startIcon={<Send size={14} />}
            sx={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              color: '#C2410C',
              borderColor: '#FED7AA',
              backgroundColor: '#FFF7ED',
              '&:hover': {
                borderColor: '#FDBA74',
                backgroundColor: '#FFEDD5',
              }
            }}
          >
            Test Connection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* SMTP Host */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" /> SMTP Server Host
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.smtpHost || ""}
            onChange={(e) => updateField("smtpHost", e.target.value)}
            placeholder="e.g. smtp.gmail.com or smtp.mailgun.org"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* SMTP Port & Encryption */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
              Port
            </label>
            <input
              type="number"
              disabled={readOnly}
              value={formData.smtpPort || 587}
              onChange={(e) => updateField("smtpPort", Number(e.target.value))}
              placeholder="587"
              className="w-full px-3 h-[38px] text-[13px] font-medium text-center bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="col-span-2">
            <SelectField
              label="Encryption"
              disabled={readOnly}
              value={formData.smtpEncryption || "STARTTLS"}
              onChange={(val) => updateField("smtpEncryption", val)}
              options={ENCRYPTION_OPTIONS}
              placeholder="Select Encryption"
            />
          </div>
        </div>

        {/* SMTP Username */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> SMTP Username / Account
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.smtpUser || ""}
            onChange={(e) => updateField("smtpUser", e.target.value)}
            placeholder="apikey or user@example.com"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* SMTP Password */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" /> SMTP Password / App Secret
          </label>
          <input
            type="password"
            disabled={readOnly}
            value={formData.smtpPassword || (formData.hasSmtpPassword ? "********" : "")}
            onChange={(e) => updateField("smtpPassword", e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 h-[38px] text-[13px] font-mono font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
            {formData.hasSmtpPassword
              ? "Encrypted password configured. Type a new value only to change it."
              : "Enter secret key or application password"}
          </span>
        </div>

        {/* Sender Display Name */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
            Sender Display Name
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={formData.smtpSenderName || ""}
            onChange={(e) => updateField("smtpSenderName", e.target.value)}
            placeholder="e.g. Acme Sales Team"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* Sender Email Address */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5">
            Sender Email Address
          </label>
          <input
            type="email"
            disabled={readOnly}
            value={formData.smtpSenderEmail || ""}
            onChange={(e) => updateField("smtpSenderEmail", e.target.value)}
            placeholder="no-reply@company.com"
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* Global HTML Email Signature */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5">
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Default Email Signature (HTML / Plaintext)
          </label>
          <textarea
            rows={4}
            disabled={readOnly}
            value={formData.emailSignatureTemplate || formData.emailSignature || ""}
            onChange={(e) => updateField("emailSignatureTemplate", e.target.value)}
            placeholder="--&#10;Acme CRM Support Team&#10;https://www.example.com"
            className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none shadow-2xs leading-relaxed disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}



