import React, { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOff, Mail, Calendar, MessageSquare, Trash2, Send, Clock, RotateCw, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../../../../shared/components/elements/Button';
import { SearchableSelect } from '../../../../shared/components/elements/SearchableSelect';
import {
  useLeadCommunicationLogsQuery,
  useCreateCommunicationLogMutation,
  useDeleteCommunicationLogMutation
} from '../../hooks/useLeads';

/**
 * CommunicationsTab — Logs and displays communication history (Calls, Emails, Meetings, WhatsApp).
 *
 * @param {Object} props
 * @param {number} props.leadId - ID of the target lead
 */
const CommunicationsTab = ({ leadId }) => {
  const { data: logsRes, isLoading, refetch } = useLeadCommunicationLogsQuery(leadId);
  const createLogMutation = useCreateCommunicationLogMutation();
  const deleteLogMutation = useDeleteCommunicationLogMutation();

  const [type, setType] = useState('CALL');
  const [callOutcome, setCallOutcome] = useState('RECEIVED'); // 'RECEIVED' | 'NOT_RECEIVED'
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(() => {
    // Current local ISO string format for datetime-local input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const logs = logsRes?.data?.logs || logsRes?.logs || logsRes || [];

  const handleLogCommunication = (e) => {
    e.preventDefault();
    if (!type || !date) return;

    createLogMutation.mutate({
      leadId,
      data: {
        communicationType: type,
        ...(type === 'CALL' && { callOutcome }),
        summary: summary.trim(),
        interactionDate: new Date(date).toISOString()
      }
    }, {
      onSuccess: () => {
        setSummary('');
        setCallOutcome('RECEIVED');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setDate(now.toISOString().slice(0, 16));
      }
    });
  };

  const getLogTypeConfig = (logType) => {
    switch (logType?.toUpperCase()) {
      case 'CALL':
        return { icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-100', pill: 'bg-blue-100/60 text-blue-800' };
      case 'EMAIL':
        return { icon: Mail, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', pill: 'bg-indigo-100/60 text-indigo-800' };
      case 'MEETING':
        return { icon: Calendar, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', pill: 'bg-emerald-100/60 text-emerald-800' };
      case 'WHATSAPP':
        return { icon: MessageSquare, color: 'text-green-600 bg-green-50 border-green-100', pill: 'bg-green-100/60 text-green-800' };
      default:
        return { icon: Phone, color: 'text-slate-600 bg-slate-50 border-slate-100', pill: 'bg-slate-100 text-slate-800' };
    }
  };

  const channelOptions = [
    { id: 'CALL', name: 'Call' },
    { id: 'EMAIL', name: 'Email' },
    { id: 'MEETING', name: 'Meeting' },
    { id: 'WHATSAPP', name: 'WhatsApp' }
  ];

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Log Interaction Form */}
      <form onSubmit={handleLogCommunication} className="border border-slate-200 rounded-2xl p-3 bg-white space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Type Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Channel</span>
            <SearchableSelect
              options={channelOptions}
              value={type}
              onChange={(val) => setType(val)}
              placeholder="Select Channel"
              searchable={false}
            />
          </div>

          {/* Date Time picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Date & Time</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full text-[13px] px-3.5 py-2.5 border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] text-slate-700 font-medium transition-all"
            />
          </div>
        </div>

        {/* Call Outcome Selector (Only for CALL channel) */}
        {type === 'CALL' && (
          <div className="flex flex-col gap-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70 animate-in fade-in duration-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider pl-0.5">Call Outcome</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCallOutcome('RECEIVED')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  callOutcome === 'RECEIVED'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-200'
                }`}
              >
                <PhoneIncoming size={13} className={callOutcome === 'RECEIVED' ? 'text-white' : 'text-emerald-600'} />
                <span>Call Received</span>
              </button>

              <button
                type="button"
                onClick={() => setCallOutcome('NOT_RECEIVED')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  callOutcome === 'NOT_RECEIVED'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50/50 hover:text-rose-700 hover:border-rose-200'
                }`}
              >
                <PhoneOff size={13} className={callOutcome === 'NOT_RECEIVED' ? 'text-white' : 'text-rose-500'} />
                <span>Not Received</span>
              </button>
            </div>
          </div>
        )}

        {/* Summary Input */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Interaction Summary</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Add brief details of the conversation..."
            className="w-full text-[13px] px-3.5 py-2.5 border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] text-slate-700 font-medium transition-all resize-none h-16 placeholder-slate-400"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="contained"
            size="small"
            isLoading={createLogMutation.isPending}
            startIcon={<Send size={11} />}
            sx={{ height: '28px', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
          >
            Log Interaction
          </Button>
        </div>
      </form>

      {/* Communications list */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mt-2 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Interaction History</span>
        <button 
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:opacity-50"
          title="Refresh logs"
        >
          <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RotateCw size={18} className="animate-spin text-orange-500" />
            <span className="font-semibold text-slate-500">Loading interactions...</span>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-6">No communication logs recorded yet.</p>
        ) : (
          logs.map((log) => {
            const config = getLogTypeConfig(log.communicationType);
            const Icon = config.icon;
            const isCall = log.communicationType?.toUpperCase() === 'CALL';

            return (
              <div key={log.id} className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-3 text-xs rounded-xl flex gap-3 relative group animate-in fade-in duration-200">
                <div className={`p-2 rounded-lg border h-8 w-8 shrink-0 flex items-center justify-center ${config.color}`}>
                  <Icon size={14} className="stroke-[2.5]" />
                </div>

                <div className="flex-1 space-y-1 pr-8">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800">{log.createdBy?.name || 'User'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${config.pill}`}>
                      {log.communicationType}
                    </span>

                    {/* Call Classification & Outcome Badges */}
                    {isCall && log.callNature && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide border ${
                        log.callNature === 'COLD_CALL'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {log.callNature === 'COLD_CALL' ? '❄️ Cold Call' : '🔄 Follow-up Call'}
                      </span>
                    )}

                    {isCall && log.callOutcome && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide border ${
                        log.callOutcome === 'RECEIVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.callOutcome === 'RECEIVED' ? '✓ Received' : '✕ Not Received'}
                      </span>
                    )}
                  </div>
                  
                  {log.summary ? (
                    <p className="text-slate-600 leading-normal font-medium">{log.summary}</p>
                  ) : (
                    <p className="text-slate-400 italic">No summary details provided.</p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold pt-0.5">
                    <Clock size={10} />
                    <span>
                      {new Date(log.interactionDate).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>

                {/* Soft Delete Action Button */}
                <button
                  onClick={() => deleteLogMutation.mutate({ leadId, logId: log.id })}
                  disabled={deleteLogMutation.isPending}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-50"
                  title="Delete Log"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunicationsTab;
