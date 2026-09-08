// crm-web/src/features/settings/components/NotificationSettingsForm.jsx

import React from "react"
import { Bell, Mail, Smartphone, Calendar, Clock } from "lucide-react"
import SelectField from "../../../shared/components/elements/SelectField"
import Toggle from "../../../shared/components/elements/Toggle"

const REMINDER_OFFSET_OPTIONS = [
  { value: "5", label: "5 minutes before event" },
  { value: "10", label: "10 minutes before event" },
  { value: "15", label: "15 minutes before event (Recommended)" },
  { value: "30", label: "30 minutes before event" },
  { value: "60", label: "1 hour before event" },
  { value: "1440", label: "24 hours before event" },
]

export const NotificationSettingsForm = ({ formData, updateField, readOnly = false }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> System Notification & Alert Preferences
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Manage system notification delivery channels, reminder timings, and daily summary schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Reminder Timing using shared SelectField */}
        <div>
          <SelectField
            label="Follow-up & Task Reminder Offset"
            disabled={readOnly}
            value={formData.reminderTimingMinutes ? String(formData.reminderTimingMinutes) : "15"}
            onChange={(val) => updateField("reminderTimingMinutes", Number(val))}
            options={REMINDER_OFFSET_OPTIONS}
            placeholder="Select Reminder Offset"
          />
        </div>

        {/* Daily Summary Schedule Time */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Daily Summary Email Dispatch Time
          </label>
          <input
            type="time"
            value={formData.dailySummaryTime || "08:00"}
            onChange={(e) => updateField("dailySummaryTime", e.target.value)}
            disabled={readOnly || !formData.dailySummaryEnabled}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs"
          />
        </div>

        {/* Notification Channel Toggles */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 mb-3">
            Active Notification Delivery Channels
          </h4>

          {/* Email Notifications */}
          <div className="bg-white hover:bg-slate-50/40 border border-slate-200 p-4 rounded-none flex items-center justify-between shadow-2xs transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-orange-50 text-orange-600 border border-orange-100/80 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[13px] font-bold text-slate-900">Email Notifications</h5>
                <p className="text-xs text-slate-500 font-normal">Send lead assignments and critical alerts via email</p>
              </div>
            </div>
            <Toggle
              checked={formData.enableEmailNotifications ?? true}
              disabled={readOnly}
              onChange={(checked) => updateField("enableEmailNotifications", checked)}
              id="enable-email-toggle"
            />
          </div>

          {/* In-App Notifications */}
          <div className="bg-white hover:bg-slate-50/40 border border-slate-200 p-4 rounded-none flex items-center justify-between shadow-2xs transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-orange-50 text-orange-600 border border-orange-100/80 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[13px] font-bold text-slate-900">In-App Notification Center</h5>
                <p className="text-xs text-slate-500 font-normal">Display real-time bell alerts in upper header bar</p>
              </div>
            </div>
            <Toggle
              checked={formData.enableInAppNotifications ?? true}
              disabled={readOnly}
              onChange={(checked) => updateField("enableInAppNotifications", checked)}
              id="enable-inapp-toggle"
            />
          </div>

          {/* Push Notifications (Future) */}
          <div className="bg-white hover:bg-slate-50/40 border border-slate-200 p-4 rounded-none flex items-center justify-between shadow-2xs transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-slate-100 text-slate-500 border border-slate-200/80 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-[13px] font-bold text-slate-900">Mobile Push Notifications</h5>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-[4px] border border-slate-200 font-bold uppercase tracking-wider">
                    COMING SOON
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">Deliver push notifications to mobile companion app</p>
              </div>
            </div>
            <Toggle
              checked={formData.enablePushNotifications || false}
              disabled={readOnly}
              onChange={(checked) => updateField("enablePushNotifications", checked)}
              id="enable-push-toggle"
            />
          </div>

          {/* Daily Summary Report Toggle */}
          <div className="bg-white hover:bg-slate-50/40 border border-slate-200 p-4 rounded-none flex items-center justify-between shadow-2xs transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-orange-50 text-orange-600 border border-orange-100/80 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[13px] font-bold text-slate-900">Daily Digest Summary Report</h5>
                <p className="text-xs text-slate-500 font-normal">Email daily task performance and pending leads summary</p>
              </div>
            </div>
            <Toggle
              checked={formData.dailySummaryEnabled ?? true}
              disabled={readOnly}
              onChange={(checked) => updateField("dailySummaryEnabled", checked)}
              id="daily-summary-toggle"
            />
          </div>
        </div>
      </div>
    </div>
  )
}




