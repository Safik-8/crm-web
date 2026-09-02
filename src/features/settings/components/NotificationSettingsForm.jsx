// crm-web/src/features/settings/components/NotificationSettingsForm.jsx

import React from "react"
import { Bell, Mail, Smartphone, Calendar, Clock } from "lucide-react"

export const NotificationSettingsForm = ({ formData, updateField }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> System Notification & Alert Preferences
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage system notification delivery channels, reminder timings, and daily summary schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reminder Timing */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Default Follow-up & Task Reminder Offset
          </label>
          <select
            value={formData.reminderTimingMinutes || 15}
            onChange={(e) => updateField("reminderTimingMinutes", Number(e.target.value))}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          >
            <option value={5}>5 minutes before event</option>
            <option value={10}>10 minutes before event</option>
            <option value={15}>15 minutes before event (Recommended)</option>
            <option value={30}>30 minutes before event</option>
            <option value={60}>1 hour before event</option>
            <option value={1440}>24 hours before event</option>
          </select>
        </div>

        {/* Daily Summary Schedule Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Daily Summary Email Dispatch Time
          </label>
          <input
            type="time"
            value={formData.dailySummaryTime || "08:00"}
            onChange={(e) => updateField("dailySummaryTime", e.target.value)}
            disabled={!formData.dailySummaryEnabled}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Notification Channel Toggles */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Active Delivery Channels
          </h4>

          {/* Email Notifications */}
          <div className="bg-slate-50/60 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Email Notifications</h5>
                <p className="text-xs text-slate-500 font-medium">Send lead assignments and critical alerts via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableEmailNotifications ?? true}
                onChange={(e) => updateField("enableEmailNotifications", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* In-App Notifications */}
          <div className="bg-slate-50/60 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">In-App Notification Center</h5>
                <p className="text-xs text-slate-500 font-medium">Display real-time bell alerts in upper header bar</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableInAppNotifications ?? true}
                onChange={(e) => updateField("enableInAppNotifications", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Push Notifications (Future) */}
          <div className="bg-slate-50/60 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900">Mobile Push Notifications</h5>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase">FUTURE</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Deliver push notifications to mobile companion app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enablePushNotifications || false}
                onChange={(e) => updateField("enablePushNotifications", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Daily Summary Report Toggle */}
          <div className="bg-slate-50/60 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Daily Digest Summary Report</h5>
                <p className="text-xs text-slate-500 font-medium">Email daily task performance and pending leads summary</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dailySummaryEnabled ?? true}
                onChange={(e) => updateField("dailySummaryEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
