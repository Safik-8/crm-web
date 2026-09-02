// crm-web/src/features/settings/components/EmailSettingsForm.jsx

import React from "react"
import { Mail, Server, Lock, User, Send, FileCode } from "lucide-react"

export const EmailSettingsForm = ({ formData, updateField, onOpenTestEmail }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> SMTP Outgoing Mail Server Configuration
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure outgoing SMTP parameters for automated lead notifications, digests, and email dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTestEmail}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" /> Test Connection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SMTP Host */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-500" /> SMTP Server Host
          </label>
          <input
            type="text"
            value={formData.smtpHost || ""}
            onChange={(e) => updateField("smtpHost", e.target.value)}
            placeholder="e.g. smtp.gmail.com or smtp.mailgun.org"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* SMTP Port & Encryption */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">SMTP Port</label>
            <input
              type="number"
              value={formData.smtpPort || 587}
              onChange={(e) => updateField("smtpPort", Number(e.target.value))}
              placeholder="587"
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Encryption</label>
            <select
              value={formData.smtpEncryption || "TLS"}
              onChange={(e) => updateField("smtpEncryption", e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            >
              <option value="TLS">STARTTLS (587)</option>
              <option value="SSL">SSL / TLS (465)</option>
              <option value="NONE">None (25)</option>
            </select>
          </div>
        </div>

        {/* SMTP Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" /> SMTP Username / Account
          </label>
          <input
            type="text"
            value={formData.smtpUser || ""}
            onChange={(e) => updateField("smtpUser", e.target.value)}
            placeholder="apikey or user@example.com"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* SMTP Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> SMTP Password
          </label>
          <input
            type="password"
            value={formData.smtpPassword || (formData.hasSmtpPassword ? "********" : "")}
            onChange={(e) => updateField("smtpPassword", e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2 text-xs font-mono font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            {formData.hasSmtpPassword
              ? "Encrypted password configured. Type a new value only to change it."
              : "Enter password or app secret key"}
          </span>
        </div>

        {/* Sender Display Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sender Display Name</label>
          <input
            type="text"
            value={formData.smtpSenderName || ""}
            onChange={(e) => updateField("smtpSenderName", e.target.value)}
            placeholder="e.g. Acme Sales Team"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Sender Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sender Email Address</label>
          <input
            type="email"
            value={formData.smtpSenderEmail || ""}
            onChange={(e) => updateField("smtpSenderEmail", e.target.value)}
            placeholder="noreply@example.com"
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Email Signature Template Editor */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-primary" /> Default Email Signature Template (HTML)
          </label>
          <textarea
            rows={4}
            value={formData.emailSignatureTemplate || ""}
            onChange={(e) => updateField("emailSignatureTemplate", e.target.value)}
            placeholder="<p>Best regards,<br/><strong>Acme Team</strong></p>"
            className="w-full px-3.5 py-2.5 text-xs font-mono font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

