// crm-web/src/features/settings/components/TestEmailModal.jsx

import React, { useState } from "react"
import { Send, X, Mail } from "lucide-react"
import Button from "../../../shared/components/elements/Button"

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
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-none shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-orange-50 text-orange-600 border border-orange-100/80 shrink-0">
              <Send className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Test SMTP Configuration</h3>
              <p className="text-[11px] text-slate-500 font-normal">Verify live mail delivery credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-[8px] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Enter a recipient email address to send a live test message and verify connectivity with your configured SMTP server.
          </p>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Recipient Email Address
            </label>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSending}
              variant="outlined"
              size="small"
              sx={{
                height: '38px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                color: '#334155',
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || !recipient.trim()}
              isLoading={isSending}
              variant="contained"
              size="small"
              startIcon={<Send size={14} />}
              sx={{
                height: '38px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                backgroundColor: '#F86F03',
                '&:hover': {
                  backgroundColor: '#E05E00',
                }
              }}
            >
              {isSending ? "Dispatching..." : "Send Test Email"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}




