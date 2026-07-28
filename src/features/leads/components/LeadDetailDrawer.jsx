// src/features/leads/components/LeadDetailDrawer.jsx

import React, { useEffect, useState } from 'react';
import {
  useLeadQuery,
  useLeadNotesQuery,
  useCreateLeadNoteMutation,
  useUpdateLeadNoteMutation,
  useDeleteLeadNoteMutation,
  useLeadTimelineQuery
} from '../hooks/useLeads';

const NotesTab = ({ leadId }) => {
  const { data: notesRes, isLoading } = useLeadNotesQuery(leadId);
  const createNoteMutation = useCreateLeadNoteMutation();
  const updateNoteMutation = useUpdateLeadNoteMutation();
  const deleteNoteMutation = useDeleteLeadNoteMutation();
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [pinnedNoteIds, setPinnedNoteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`pinned_notes_${leadId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const notes = notesRes?.data?.notes || notesRes?.notes || notesRes || [];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    createNoteMutation.mutate({ leadId, data: { note: newNote } }, {
      onSuccess: () => setNewNote('')
    });
  };

  const handleStartEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleSaveEdit = (noteId) => {
    if (!editingText.trim()) return;
    updateNoteMutation.mutate({ leadId, noteId, data: { note: editingText } }, {
      onSuccess: () => {
        setEditingNoteId(null);
        setEditingText('');
      }
    });
  };

  const togglePinNote = (noteId) => {
    setPinnedNoteIds((prev) => {
      const isPinned = prev.includes(noteId);
      const next = isPinned ? prev.filter((id) => id !== noteId) : [...prev, noteId];
      localStorage.setItem(`pinned_notes_${leadId}`, JSON.stringify(next));
      return next;
    });
  };

  const insertFormat = (formatType, isEdit = false) => {
    const textarea = document.getElementById(isEdit ? 'edit-note-textarea' : 'new-note-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = isEdit ? editingText : newNote;
    
    let formatted = '';
    let cursorOffset = 0;

    if (formatType === 'bold') {
      const selectedText = text.substring(start, end);
      formatted = `**${selectedText || 'bold text'}**`;
      cursorOffset = selectedText ? formatted.length : 11;
    } else if (formatType === 'italic') {
      const selectedText = text.substring(start, end);
      formatted = `*${selectedText || 'italic text'}*`;
      cursorOffset = selectedText ? formatted.length : 13;
    } else if (formatType === 'bullet') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}- `;
      cursorOffset = formatted.length;
    } else if (formatType === 'number') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}1. `;
      cursorOffset = formatted.length;
    } else if (formatType === 'h1') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}# `;
      cursorOffset = formatted.length;
    } else if (formatType === 'h2') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}## `;
      cursorOffset = formatted.length;
    }

    const newText = text.substring(0, start) + formatted + text.substring(end);
    
    if (isEdit) {
      setEditingText(newText);
    } else {
      setNewNote(newText);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const handleKeyDown = (e, isEdit = false) => {
    if (e.key === 'Enter') {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const text = isEdit ? editingText : newNote;
      
      const beforeCursor = text.substring(0, start);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      let prefix = '';
      if (currentLine.startsWith('- ')) {
        prefix = '- ';
      } else if (currentLine.startsWith('* ')) {
        prefix = '* ';
      } else {
        const match = currentLine.match(/^(\d+)\.\s+/);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          prefix = `${nextNum}. `;
        }
      }
      
      if (prefix) {
        e.preventDefault();
        let newText;
        let selectionIndex;
        
        if (currentLine === prefix) {
          // Erase prefix to end the list
          const lineStart = start - currentLine.length;
          newText = text.substring(0, lineStart) + '\n' + text.substring(start);
          selectionIndex = lineStart + 1;
        } else {
          // Auto-continue list
          const insertion = `\n${prefix}`;
          newText = text.substring(0, start) + insertion + text.substring(start);
          selectionIndex = start + insertion.length;
        }
        
        if (isEdit) {
          setEditingText(newText);
        } else {
          setNewNote(newText);
        }
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(selectionIndex, selectionIndex);
        }, 10);
      }
    }
  };

  const parseItalics = (text) => {
    if (typeof text !== 'string') return [text];
    const italicRegex = /\*(.*?)\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <em key={`i-${match.index}`} className="italic text-slate-700 font-medium">
          {match[1]}
        </em>
      );
      lastIndex = italicRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const parseInlineStyles = (line) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...parseItalics(line.substring(lastIndex, match.index)));
      }
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-800">
          {parseItalics(match[1])}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < line.length) {
      parts.push(...parseItalics(line.substring(lastIndex)));
    }
    
    return parts.length > 0 ? parts : line;
  };

  // Safe and clean custom markdown renderer
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Parse headings first
      if (line.trim().startsWith('# ')) {
        const cleanContent = line.trim().substring(2);
        return (
          <h4 key={idx} className="text-base font-black text-slate-800 my-1.5">
            {parseInlineStyles(cleanContent)}
          </h4>
        );
      }
      if (line.trim().startsWith('## ')) {
        const cleanContent = line.trim().substring(3);
        return (
          <h5 key={idx} className="text-sm font-extrabold text-slate-700 my-1">
            {parseInlineStyles(cleanContent)}
          </h5>
        );
      }

      // Unordered list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanContent = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-2 my-0.5">
            <span className="text-orange-500 font-bold">•</span>
            <span className="flex-1 text-slate-600 leading-normal">{parseInlineStyles(cleanContent)}</span>
          </div>
        );
      }

      // Ordered list
      const olMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        const num = olMatch[1];
        const cleanContent = olMatch[2];
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-2 my-0.5">
            <span className="text-orange-500 font-semibold">{num}.</span>
            <span className="flex-1 text-slate-600 leading-normal">{parseInlineStyles(cleanContent)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-slate-600 leading-normal min-h-[1.1em]">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  // Sort notes to float pinned ones to the top, maintaining secondary date order
  const sortedNotes = [...notes].sort((a, b) => {
    const aPinned = pinnedNoteIds.includes(a.id);
    const bPinned = pinnedNoteIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400">Loading notes...</div>;

  return (
    <div className="space-y-4 flex flex-col h-full">
      <form onSubmit={handleAddNote} className="flex flex-col gap-1.5 border border-slate-200 rounded-2xl p-2 bg-white focus-within:border-orange-500 transition-colors">
        {/* Formatting Toolbar */}
        <div className="flex gap-1 border-b border-slate-100 pb-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => insertFormat('bold', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Bold"
          >
            <Bold size={13} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('italic', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Italic"
          >
            <Italic size={13} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('h1', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Heading 1"
          >
            <Heading1 size={13} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('h2', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Heading 2"
          >
            <Heading2 size={13} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('bullet', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Bullet List"
          >
            <List size={13} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('number', false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={13} className="stroke-[2.5]" />
          </button>
        </div>
        <textarea
          id="new-note-textarea"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, false)}
          placeholder="Add a detailed note with formatting..."
          className="w-full text-xs px-1 py-1 focus:outline-none resize-none h-16 bg-transparent text-slate-700 placeholder-slate-400"
        />
        <div className="flex justify-end pt-0.5">
          <Button
            type="submit"
            variant="contained"
            size="small"
            isLoading={createNoteMutation.isPending}
            startIcon={<Send size={11} />}
            sx={{ height: '28px', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
          >
            Send
          </Button>
        </div>
      </form>
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] custom-scrollbar pr-1">
        {sortedNotes.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-6">No notes added yet.</p>
        ) : (
          sortedNotes.map((n) => {
            const isPinned = pinnedNoteIds.includes(n.id);
            return (
              <div key={n.id} className={`border p-3 text-xs relative group animate-in fade-in duration-200 rounded-xl transition-all duration-200 ${isPinned ? 'bg-amber-50/40 border-amber-200/80 shadow-[0_2px_8px_rgba(245,158,11,0.04)]' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">{n.createdBy?.name || 'User'}</span>
                    {isPinned && <Pin size={10} className="fill-amber-500 text-amber-500 stroke-[2.5]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:opacity-0 transition-opacity duration-150">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {editingNoteId === n.id ? (
                  <div className="mt-1 space-y-2 border border-slate-200 rounded-xl p-2 bg-white focus-within:border-orange-500 transition-colors">
                    {/* Edit Toolbar */}
                    <div className="flex gap-1 border-b border-slate-100 pb-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => insertFormat('bold', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Bold"
                      >
                        <Bold size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('italic', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Italic"
                      >
                        <Italic size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('h1', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Heading 1"
                      >
                        <Heading1 size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('h2', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Heading 2"
                      >
                        <Heading2 size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('bullet', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Bullet List"
                      >
                        <List size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('number', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                    <textarea
                      id="edit-note-textarea"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      className="w-full text-xs p-1 focus:outline-none resize-none h-16 bg-transparent text-slate-700"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        onClick={handleCancelEdit}
                        variant="outlined"
                        size="small"
                        sx={{ height: '28px', color: '#64748b', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' } }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(n.id)}
                        variant="contained"
                        size="small"
                        isLoading={updateNoteMutation.isPending}
                        sx={{ height: '28px', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pr-20 space-y-0.5 break-words">
                      {renderFormattedText(n.note)}
                    </div>
                    <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all duration-150">
                      <button
                        onClick={() => togglePinNote(n.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        title={isPinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin size={12} className={isPinned ? "fill-amber-500 text-amber-500" : ""} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(n)}
                        className="p-1 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Edit Note"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteNoteMutation.mutate({ leadId, noteId: n.id })}
                        disabled={deleteNoteMutation.isPending}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete Note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const TimelineTab = ({ leadId }) => {
  const { data: timelineRes, isLoading } = useLeadTimelineQuery(leadId);
  const timeline = timelineRes?.data?.timeline || timelineRes?.timeline || timelineRes || [];

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>;

  const getTimelineIconConfig = (action) => {
    switch (action) {
      case 'CREATE': return { color: 'bg-emerald-500', ring: 'ring-emerald-50' };
      case 'DELETE': return { color: 'bg-red-500', ring: 'ring-red-50' };
      case 'RESTORE': return { color: 'bg-teal-500', ring: 'ring-teal-50' };
      case 'STAGE_CHANGE': return { color: 'bg-blue-500', ring: 'ring-blue-50' };
      case 'UPDATE': return { color: 'bg-indigo-500', ring: 'ring-indigo-50' };
      case 'NOTE_ADD': return { color: 'bg-amber-500', ring: 'ring-amber-50' };
      case 'NOTE_UPDATE': return { color: 'bg-amber-600', ring: 'ring-amber-50' };
      case 'NOTE_DELETE': return { color: 'bg-rose-500', ring: 'ring-rose-50' };
      default: return { color: 'bg-slate-400', ring: 'ring-slate-50' };
    }
  };

  const getActionLabel = (action, oldValue, newValue) => {
    switch (action) {
      case 'CREATE': return 'created the lead';
      case 'UPDATE': {
        try {
          const oldObj = JSON.parse(oldValue || '{}');
          const newObj = JSON.parse(newValue || '{}');
          const changes = [];
          if (newObj.statusId !== oldObj.statusId || (newObj.status && oldObj.status && newObj.status.name !== oldObj.status.name)) {
            changes.push(`changed status to "${newObj.status?.name || 'Unknown'}"`);
          }
          if (newObj.assignedToId !== oldObj.assignedToId || (newObj.assignedTo && oldObj.assignedTo && newObj.assignedTo.name !== oldObj.assignedTo.name)) {
            changes.push(`reassigned lead to ${newObj.assignedTo?.name || 'nobody'}`);
          }
          if (newObj.teamId !== oldObj.teamId || (newObj.team && oldObj.team && newObj.team.name !== oldObj.team.name)) {
            changes.push(`assigned lead to team "${newObj.team?.name || 'none'}"`);
          }
          if (newObj.stageId !== oldObj.stageId || (newObj.stage && oldObj.stage && newObj.stage.name !== oldObj.stage.name)) {
            changes.push(`moved stage to "${newObj.stage?.name || 'Unknown'}"`);
          }
          if (changes.length > 0) {
            return changes.join(' and ');
          }
        } catch (e) {
          // fallback
        }
        return 'updated lead details';
      }
      case 'DELETE': return 'soft-deleted the lead';
      case 'RESTORE': return 'restored the lead';
      case 'STAGE_CHANGE': {
        try {
          const newObj = JSON.parse(newValue || '{}');
          if (newObj.stageId) {
            return 'moved lead stage';
          }
        } catch (e) {}
        return 'moved lead stage';
      }
      case 'NOTE_ADD': {
        try {
          const newObj = JSON.parse(newValue || '{}');
          if (newObj.text) {
            return `added a note: "${newObj.text}"`;
          }
        } catch (e) {}
        return 'added a note';
      }
      case 'NOTE_UPDATE': {
        try {
          const newObj = JSON.parse(newValue || '{}');
          if (newObj.text) {
            return `updated a note to: "${newObj.text}"`;
          }
        } catch (e) {}
        return 'updated a note';
      }
      case 'NOTE_DELETE': return 'deleted a note';
      default: return `performed ${action}`;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] custom-scrollbar text-xs pr-1 py-1">
      {timeline.length === 0 ? (
        <p className="text-xs text-center text-slate-400 py-6">No history logs found.</p>
      ) : (
        timeline.map((log) => {
          const config = getTimelineIconConfig(log.action);
          return (
            <div key={log.id} className="flex gap-4 items-start border-l border-slate-100 pl-4 ml-2.5 relative">
              {/* Timeline Indicator Ring */}
              <span className={`w-2.5 h-2.5 rounded-full ${config.color} border-2 border-white ring-4 ${config.ring} absolute -left-[5px] top-2 transition-all duration-300`} />
              
              <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-2xl transition-all duration-200">
                <p className="text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-800">{log.performedBy?.name || 'System'}</span>{' '}
                  {getActionLabel(log.action, log.oldValue, log.newValue)}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                  {new Date(log.createdAt).toLocaleString('en-IN', {
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
          );
        })
      )}
    </div>
  );
};

  X, Phone, Calendar, Compass, Tag, User, Mail, DollarSign,
  MapPin, Award, ShieldAlert, History, MessageSquare,
  ClipboardList, UserCheck, GitBranch
} from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';
import { useLeadQuery } from '../hooks/useLeads';

// Extracted Sub-Tabs (Sprint 4 Refactoring)
import NotesTab from './drawer/NotesTab';
import TimelineTab from './drawer/TimelineTab';
import StageHistoryTab from './drawer/StageHistoryTab';

/**
 * LeadDetailDrawer — Slide-over drawer component displaying comprehensive lead metadata,
 * assigned user/branch scope, notes, activities, timeline logs, and stage history.
 *
 * @param {Object} props
 * @param {Object} props.lead - Initial lead data object
 * @param {string} [props.stageName] - Optional display name of the current stage
 * @param {Function} props.onClose - Callback invoked when drawer is closed
 */
const LeadDetailDrawer = ({ lead: initialLead, stageName, onClose }) => {
  const [activeTab, setActiveTab] = useState('comments');
  const { data: leadRes } = useLeadQuery(initialLead?.id);
  const lead = leadRes?.data?.lead || leadRes?.lead || initialLead;

  if (!lead) return null;

  // Prevent body scroll while drawer is open
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

  const contactDetails = [
    { icon: Phone,      label: 'Mobile',            value: lead.mobile || '—' },
    { icon: Phone,      label: 'Alt Contact',       value: lead.alternateMobile || '—' },
    { icon: Mail,       label: 'Email',            value: lead.email || '—' },
    { icon: Calendar,   label: 'Created Date',      value: date },
    { icon: MapPin,     label: 'Location',          value: locationStr, colSpan: 'sm:col-span-2 md:col-span-2 lg:col-span-2' },
  ];

  const interestDetails = [
    { icon: Compass,    label: 'Source',            value: lead.source?.name || '—' },
    { icon: Award,      label: 'Interested Course', value: lead.course?.name || lead.interestedFor || lead.interested_for || '—' },
    { icon: DollarSign, label: 'Budget',            value: lead.budget !== null && lead.budget !== undefined ? `₹${lead.budget.toLocaleString('en-IN')}` : '—' },
    { icon: ShieldAlert,label: 'Priority',          value: lead.priority || 'MEDIUM' },
  ];

  const assignmentDetails = [
    { icon: User,       label: 'Assigned User',     value: lead.assignedTo?.name || 'Unassigned' },
    { icon: UserCheck,  label: 'Reporting Manager',  value: lead.reportingManager?.name || '—' },
    { icon: Tag,        label: 'Assigned Team',     value: lead.assignedTeam?.name || '—' },
    { icon: MapPin,     label: 'Branch',            value: lead.branch?.name || '—' },
  ];

  const effectiveStageName = stageName || lead.stage?.name || '—';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Content Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap pr-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {lead.name}
              </h2>
              {/* Stage Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/60 text-orange-600 rounded-full text-xs font-bold">
                <Tag size={12} />
                {effectiveStageName}
              </span>
              {/* Status Pill */}
              {lead.status?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {lead.status.name}
                </span>
              )}
              {/* Priority Pill */}
              {lead.priority && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-lg text-[11px] font-bold">
                  <ShieldAlert size={11} />
                  {lead.priority}
                </span>
              )}
              {/* Owner / Creator Info */}
              {lead.assignedTo?.name && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <User size={11} /> Owner: {lead.assignedTo.name}
                </span>
              )}
              {lead.createdBy?.name && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <User size={11} /> Creator: {lead.createdBy.name}
                </span>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Lead Primary Details Section */}
            <div className="px-6 py-5 border-b border-slate-100 space-y-6">
              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {contactDetails.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className={`bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1 ${item.colSpan || ''}`}>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <IconComponent size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Course & Budget Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {interestDetails.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <IconComponent size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Assignment & Scope Details */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-2.5">
                  <User size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignment & Scope</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {assignmentDetails.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <IconComponent size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Summary */}
              {lead.notes && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                    <ClipboardList size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Summary / Notes</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed font-medium">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>

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
                <button
                  onClick={() => setActiveTab('stage-history')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === 'stage-history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <GitBranch size={13} />
                  Stage History
                </button>
              </div>

              <div className="flex-1 min-h-[300px] flex flex-col">
                {activeTab === 'comments' && (
                  <div className="h-full flex-1 flex flex-col pr-1">
                    <CommentThread leadId={lead.id} />
                  </div>
                )}
                {activeTab === 'notes' && <NotesTab leadId={lead.id} />}
                {activeTab === 'timeline' && <TimelineTab leadId={lead.id} />}
                {activeTab === 'stage-history' && <StageHistoryTab leadId={lead.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
