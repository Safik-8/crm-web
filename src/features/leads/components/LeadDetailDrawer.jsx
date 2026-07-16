import React, { useEffect, useState } from 'react';
import { X, Phone, Calendar, BookOpen, Tag, User, Mail, DollarSign, MapPin, FileText, Compass, Award, Activity, ShieldAlert, History, MessageSquare, ClipboardList, UserCheck } from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';
import {
  useLeadQuery,
  useLeadNotesQuery,
  useCreateLeadNoteMutation,
  useDeleteLeadNoteMutation,
  useLeadTimelineQuery
} from '../hooks/useLeads';

const NotesTab = ({ leadId }) => {
  const { data: notesRes, isLoading } = useLeadNotesQuery(leadId);
  const createNoteMutation = useCreateLeadNoteMutation();
  const deleteNoteMutation = useDeleteLeadNoteMutation();
  const [newNote, setNewNote] = useState('');

  const notes = notesRes?.data?.notes || notesRes?.notes || notesRes || [];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    createNoteMutation.mutate({ leadId, data: { note: newNote } }, {
      onSuccess: () => setNewNote('')
    });
  };

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400">Loading notes...</div>;

  return (
    <div className="space-y-4 flex flex-col h-full">
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a detailed note..."
          className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={createNoteMutation.isPending}
          className="px-3 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl disabled:opacity-50 transition-colors shrink-0"
        >
          Add Note
        </button>
      </form>
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] custom-scrollbar pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-6">No notes added yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs relative group">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-700">{n.createdBy?.name || 'User'}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 leading-normal whitespace-pre-wrap">{n.note}</p>
              <button
                onClick={() => deleteNoteMutation.mutate({ leadId, noteId: n.id })}
                className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:underline transition-opacity"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TimelineTab = ({ leadId }) => {
  const { data: timelineRes, isLoading } = useLeadTimelineQuery(leadId);
  const timeline = timelineRes?.data?.timeline || timelineRes?.timeline || timelineRes || [];

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>;

  const getActionLabel = (action, oldValue, newValue) => {
    switch (action) {
      case 'CREATE': return 'created the lead';
      case 'UPDATE': return 'updated lead details';
      case 'DELETE': return 'soft-deleted the lead';
      case 'RESTORE': return 'restored the lead';
      case 'STAGE_CHANGE': return 'moved lead stage';
      case 'NOTE_ADD': return 'added a note';
      case 'NOTE_DELETE': return 'deleted a note';
      default: return `performed ${action}`;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-3 max-h-[260px] custom-scrollbar text-xs pr-1">
      {timeline.length === 0 ? (
        <p className="text-xs text-center text-slate-400 py-6">No history logs found.</p>
      ) : (
        timeline.map((log) => (
          <div key={log.id} className="flex gap-3 items-start border-l-2 border-slate-100 pl-3 ml-2 relative">
            <div className="w-2 h-2 rounded-full bg-slate-300 absolute -left-[5px] top-1.5" />
            <div className="flex-1">
              <p className="text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-800">{log.performedBy?.name || 'System'}</span>{' '}
                {getActionLabel(log.action, log.oldValue, log.newValue)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {new Date(log.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const LeadDetailDrawer = ({ lead: initialLead, stageName, onClose }) => {
  const [activeTab, setActiveTab] = useState('comments');
  const { data: leadRes } = useLeadQuery(initialLead?.id);
  const lead = leadRes?.data?.lead || leadRes?.lead || initialLead;

  if (!lead) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const date = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : lead.date
    ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const locationStr = [lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—';

  const details = [
    { icon: Phone,      label: 'Mobile',       value: lead.mobile || '—' },
    { icon: Phone,      label: 'Alt Contact',  value: lead.alternateMobile || '—' },
    { icon: Mail,       label: 'Email',        value: lead.email || '—' },
    { icon: Calendar,   label: 'Created Date', value: date },
    { icon: Compass,    label: 'Lead Source',  value: lead.source?.name || '—' },
    { icon: Award,      label: 'Interested In', value: lead.course?.name || lead.interestedFor || lead.interested_for || '—' },
    { icon: DollarSign, label: 'Budget',       value: lead.budget !== null && lead.budget !== undefined ? `₹${lead.budget.toLocaleString('en-IN')}` : '—' },
    { icon: MapPin,     label: 'Location',     value: locationStr },
  ];

  // Stage name lookup
  const currentStageName = stageName || lead.stage?.name || '—';

  // Priority color config
  const priorityColors = {
    HIGH: 'text-red-700 bg-red-50 border-red-200',
    MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
    LOW: 'text-green-700 bg-green-50 border-green-200'
  };

  const priorityStyle = priorityColors[lead.priority] || priorityColors.MEDIUM;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-sm sm:max-w-3xl h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-250 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-[18px] sm:text-[20px] font-bold font-heading text-zinc-900 truncate tracking-tight">
                {lead.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Stage Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                  <Tag size={10} />
                  {currentStageName}
                </span>

                {/* Status Badge */}
                {lead.status && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: lead.status.displayColor + '18',
                      color: lead.status.displayColor,
                      borderColor: lead.status.displayColor + '40'
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead.status.displayColor }} />
                    {lead.status.name}
                  </span>
                )}

                {/* Priority Badge */}
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityStyle}`}>
                  <ShieldAlert size={10} />
                  {lead.priority || 'MEDIUM'}
                </span>

                {/* Assigned User */}
                {lead.assignedTo?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                    <User size={10} />
                    Owner: {lead.assignedTo.name}
                  </span>
                )}

                {/* Created By User */}
                {lead.createdBy?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                    <UserCheck size={10} />
                    Creator: {lead.createdBy.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Scrollable Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100">
            {/* Info Grid */}
            <div className="px-6 py-5">
              <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Lead Parameters</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-zinc-50 rounded-2xl px-4 py-3 border border-zinc-100/80">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                      <Icon size={10} /> {label}
                    </dt>
                    <dd className="text-[13px] font-semibold text-zinc-800 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Quick Notes Section */}
            {lead.notes && (
              <div className="px-6 py-5 bg-orange-50/20">
                <h3 className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <FileText size={12} className="text-orange-500" /> Lead Summary / Notes
                </h3>
                <p className="text-[13px] text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Tabbed Activity / Note / Timeline Section */}
            <div className="px-6 py-5 flex flex-col min-h-[380px]">
              {/* Tab Header Selector */}
              <div className="flex border-b border-slate-100 mb-4 gap-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === 'comments' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <MessageSquare size={13} />
                  Comments
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === 'notes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <ClipboardList size={13} />
                  Notes History
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === 'timeline' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <History size={13} />
                  Timeline Log
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeTab === 'comments' && (
                  <div className="h-full overflow-y-auto pr-1">
                    <CommentThread leadId={lead.id} />
                  </div>
                )}
                {activeTab === 'notes' && <NotesTab leadId={lead.id} />}
                {activeTab === 'timeline' && <TimelineTab leadId={lead.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
