import { useState, useEffect } from 'react';
import { X, Settings2, Bell, Mail, Smartphone, Check, Loader2, RefreshCw } from 'lucide-react';
import { fetchNotificationConfigs, updateNotificationConfig } from '../services/notificationService';
import { toast } from 'sonner';

const NotificationConfigModal = ({ isOpen, onClose }) => {
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await fetchNotificationConfigs();
      const list = res?.data?.configs ?? res?.configs ?? [];
      setConfigs(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load notification event configurations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnabled = async (config) => {
    const nextState = !config.isEnabled;
    setSavingId(config.id);
    try {
      await updateNotificationConfig(config.id, { isEnabled: nextState });
      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, isEnabled: nextState } : c))
      );
      toast.success(`${config.eventType} ${nextState ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update event config');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleChannel = async (config, channel) => {
    const currentChannels = config.channels || { inApp: true, email: true, push: false };
    const nextChannels = {
      ...currentChannels,
      [channel]: !currentChannels[channel],
    };
    setSavingId(config.id);
    try {
      await updateNotificationConfig(config.id, { channels: nextChannels });
      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, channels: nextChannels } : c))
      );
      toast.success(`${channel} channel updated for ${config.eventType}`);
    } catch (err) {
      toast.error('Failed to update channel rule');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Notification Event Rules
              </h2>
              <p className="text-xs text-slate-500">
                Configure delivery channels and automated alerts for CRM events
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-slate-400 font-medium">Loading event catalogue...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No event configurations found for your company.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {configs.map((config) => {
                const channels = config.channels || { inApp: true, email: true, push: false };
                const isSaving = savingId === config.id;
                return (
                  <div
                    key={config.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 font-heading truncate">
                          {config.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                          {config.moduleName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {config.templateTitle || `Triggered on CRM ${config.moduleName.toLowerCase()} event`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {/* Channel Toggles */}
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(config, 'inApp')}
                          disabled={!config.isEnabled || isSaving}
                          title="In-App Notification"
                          className={[
                            'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors',
                            channels.inApp && config.isEnabled
                              ? 'bg-primary text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-600',
                          ].join(' ')}
                        >
                          <Bell size={11} />
                          In-App
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(config, 'email')}
                          disabled={!config.isEnabled || isSaving}
                          title="Email Alert"
                          className={[
                            'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors',
                            channels.email && config.isEnabled
                              ? 'bg-primary text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-600',
                          ].join(' ')}
                        >
                          <Mail size={11} />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(config, 'push')}
                          disabled={!config.isEnabled || isSaving}
                          title="Push Notification"
                          className={[
                            'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors',
                            channels.push && config.isEnabled
                              ? 'bg-primary text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-600',
                          ].join(' ')}
                        >
                          <Smartphone size={11} />
                          Push
                        </button>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(config)}
                        disabled={isSaving}
                        className={[
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          config.isEnabled ? 'bg-emerald-500' : 'bg-slate-200',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                            config.isEnabled ? 'translate-x-5' : 'translate-x-0',
                          ].join(' ')}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Rules apply company-wide to all event dispatches
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationConfigModal;
