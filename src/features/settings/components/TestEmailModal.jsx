// crm-web/src/features/settings/components/TestEmailModal.jsx

import React, { useState } from "react"
import { Send, X, Loader2 } from "lucide-react"

export const TestEmailModal = ({ isOpen, onClose, onSendTestEmail, isSending, userEmail }) => {
  const [recipient, setRecipient] = useState(userEmail || "")

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!recipient.trim()) return
    onSendTestEmail(recipient.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900">Test SMTP Configuration</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Enter a recipient email address to send a test message using your configured SMTP settings.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !recipient.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#E06202] disabled:opacity-50 transition-all shadow-xs cursor-pointer shadow-orange-100"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Test Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
