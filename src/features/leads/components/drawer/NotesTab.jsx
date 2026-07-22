// src/features/leads/components/drawer/NotesTab.jsx

import React, { useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Send, Pin, Pencil, Trash2 } from 'lucide-react';
import Button from '../../../../shared/components/elements/Button';
import {
  useLeadNotesQuery,
  useCreateLeadNoteMutation,
  useUpdateLeadNoteMutation,
  useDeleteLeadNoteMutation
} from '../../hooks/useLeads';

/**
 * NotesTab — Interactive markdown note creation, formatting, pinning, editing, and history log.
 *
 * @param {Object} props
 * @param {number} props.leadId - ID of the target lead
 */
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
          const lineStart = start - currentLine.length;
          newText = text.substring(0, lineStart) + '\n' + text.substring(start);
          selectionIndex = lineStart + 1;
        } else {
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

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
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

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanContent = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-2 my-0.5">
            <span className="text-orange-500 font-bold">•</span>
            <span className="flex-1 text-slate-600 leading-normal">{parseInlineStyles(cleanContent)}</span>
          </div>
        );
      }

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

export default NotesTab;
