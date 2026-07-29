import React, { useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Send, Pin, Pencil, Trash2, Search, RotateCcw, RotateCw } from 'lucide-react';
import Button from '../../../../shared/components/elements/Button';
import { useAuth } from '../../../../app/providers/AuthProvider';
import SearchInput from '../../../../shared/components/elements/SearchInput';
import { SearchableSelect } from '../../../../shared/components/elements/SearchableSelect';
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
  const { user: currentUser } = useAuth();

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch all notes (unfiltered) to extract unique authors
  const { data: allNotesRes } = useLeadNotesQuery(leadId);
  const allNotes = allNotesRes?.data?.notes || allNotesRes?.notes || allNotesRes || [];

  const uniqueAuthors = [];
  const seenIds = new Set();
  allNotes.forEach((n) => {
    if (n.createdBy && !seenIds.has(n.createdBy.id)) {
      seenIds.add(n.createdBy.id);
      uniqueAuthors.push({ id: n.createdBy.id, name: n.createdBy.name });
    }
  });

  const datesSelected = dateFrom && dateTo;
  const { data: notesRes, isLoading, refetch } = useLeadNotesQuery(leadId, {
    search,
    authorId,
    ...(datesSelected ? { dateFrom, dateTo } : {})
  });
  const createNoteMutation = useCreateLeadNoteMutation();
  const updateNoteMutation = useUpdateLeadNoteMutation();
  const deleteNoteMutation = useDeleteLeadNoteMutation();
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const localStorageKey = `pinned_notes_lead_${leadId}`;
  const [pinnedNoteIds, setPinnedNoteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved).map(Number) : [];
    } catch {
      return [];
    }
  });
  const notesList = notesRes?.data?.notes || notesRes?.notes || notesRes || [];

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await createNoteMutation.mutateAsync({ leadId, data: { note: newNote.trim() } });
      setNewNote('');
      refetch();
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleUpdateNote = async (id) => {
    if (!editingText.trim()) return;
    try {
      await updateNoteMutation.mutateAsync({ leadId, noteId: id, data: { note: editingText } });
      setEditingNoteId(null);
      setEditingText('');
      refetch();
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNoteMutation.mutateAsync({ leadId, noteId: id });
      refetch();
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleTogglePin = (n) => {
    const noteIdNum = Number(n.id);
    const isPinned = pinnedNoteIds.includes(noteIdNum);
    let updated;
    if (isPinned) {
      updated = pinnedNoteIds.filter(id => id !== noteIdNum);
    } else {
      updated = [...pinnedNoteIds, noteIdNum];
    }
    setPinnedNoteIds(updated);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    } catch (e) {
      // LocalStorage full or blocked
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setAuthorId('');
    setDateFrom('');
    setDateTo('');
  };

  const insertFormat = (formatType, isEdit = false) => {
    const textareaId = isEdit ? 'edit-note-textarea' : 'new-note-textarea';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = isEdit ? editingText : newNote;
    const selectedText = text.substring(start, end);

    let formatted = '';
    let selectionStartOffset = start;
    let selectionEndOffset = end;

    if (formatType === 'bold') {
      const defaultText = selectedText || 'bold text';
      formatted = `**${defaultText}**`;
      selectionStartOffset = start + 2;
      selectionEndOffset = selectionStartOffset + defaultText.length;
    } else if (formatType === 'italic') {
      const defaultText = selectedText || 'italic text';
      formatted = `*${defaultText}*`;
      selectionStartOffset = start + 1;
      selectionEndOffset = selectionStartOffset + defaultText.length;
    } else if (formatType === 'bullet') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}- `;
      selectionStartOffset = start + formatted.length;
      selectionEndOffset = start + formatted.length;
    } else if (formatType === 'number') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}1. `;
      selectionStartOffset = start + formatted.length;
      selectionEndOffset = start + formatted.length;
    } else if (formatType === 'h1') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}# `;
      selectionStartOffset = start + formatted.length;
      selectionEndOffset = start + formatted.length;
    } else if (formatType === 'h2') {
      const hasNewline = start === 0 || text.charAt(start - 1) === '\n';
      formatted = `${hasNewline ? '' : '\n'}## `;
      selectionStartOffset = start + formatted.length;
      selectionEndOffset = start + formatted.length;
    }

    const newText = text.substring(0, start) + formatted + text.substring(end);
    
    if (isEdit) {
      setEditingText(newText);
    } else {
      setNewNote(newText);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStartOffset, selectionEndOffset);
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

  const parseInlineStyles = (text) => {
    if (typeof text !== 'string') return [text];
    
    const tokens = [];
    let i = 0;
    
    while (i < text.length) {
      // Check for bold (double asterisks)
      if (text.startsWith('**', i)) {
        const closingIndex = text.indexOf('**', i + 2);
        if (closingIndex !== -1) {
          const content = text.substring(i + 2, closingIndex);
          tokens.push(
            <strong key={`b-${i}`} className="font-bold text-slate-800">
              {parseInlineStyles(content)}
            </strong>
          );
          i = closingIndex + 2;
          continue;
        }
      }
      
      // Check for italic (single asterisk)
      if (text.startsWith('*', i)) {
        const closingIndex = text.indexOf('*', i + 1);
        if (closingIndex !== -1) {
          const content = text.substring(i + 1, closingIndex);
          tokens.push(
            <em key={`i-${i}`} className="italic text-slate-700">
              {parseInlineStyles(content)}
            </em>
          );
          i = closingIndex + 1;
          continue;
        }
      }
      
      // Plain text block
      let nextSpecial = text.length;
      const nextStar = text.indexOf('*', i + 1);
      if (nextStar !== -1) nextSpecial = nextStar;
      
      tokens.push(text.substring(i, nextSpecial));
      i = nextSpecial;
    }
    
    return tokens;
  };

  const renderNoteContent = (noteText) => {
    if (!noteText) return null;
    
    const lines = noteText.split('\n');
    return lines.map((line, index) => {
      // 1. Headings
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-sm font-bold text-slate-800 mt-1.5 mb-1">{parseInlineStyles(line.substring(2))}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xs font-bold text-slate-700 mt-1 mb-0.5">{parseInlineStyles(line.substring(3))}</h2>;
      }
      
      // 2. Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <ul key={index} className="list-disc pl-4 space-y-0.5 my-0.5 text-slate-600">
            <li>{parseInlineStyles(line.substring(2))}</li>
          </ul>
        );
      }
      
      // 3. Numbered lists
      const numMatch = line.match(/^(\d+)\.\s+/);
      if (numMatch) {
        return (
          <ol key={index} className="list-decimal pl-4 space-y-0.5 my-0.5 text-slate-600">
            <li value={parseInt(numMatch[1], 10)}>{parseInlineStyles(line.substring(numMatch[0].length))}</li>
          </ol>
        );
      }
      
      // 4. Plain paragraph (non-empty)
      if (line.trim()) {
        return <p key={index} className="my-0.5 text-slate-600 leading-relaxed">{parseInlineStyles(line)}</p>;
      }
      
      // 5. Empty line spacer
      return <div key={index} className="h-1" />;
    });
  };

  // Sort notes so pinned ones are always at the top, then newest first
  const sortedNotes = [...notesList].sort((a, b) => {
    const aPinned = pinnedNoteIds.includes(a.id);
    const bPinned = pinnedNoteIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });


  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Add Note Form & Filters side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch shrink-0">
        <form onSubmit={handleAddNote} className="flex flex-col gap-1.5 border border-slate-200 rounded-2xl p-3 bg-white focus-within:border-orange-500 transition-colors justify-between min-h-[190px]">
          <div>
            <div className="flex gap-1 border-b border-slate-100 pb-1.5 flex-wrap">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('bold', false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Bold"
              >
                <Bold size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('italic', false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Italic"
              >
                <Italic size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('h1', false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Heading 1"
              >
                <Heading1 size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('h2', false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Heading 2"
              >
                <Heading2 size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('bullet', false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Bullet List"
              >
                <List size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
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
              className="w-full text-xs px-1 py-1 focus:outline-none resize-none h-20 bg-transparent text-slate-700 placeholder-slate-400 mt-1"
            />
          </div>
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

        {/* Search & Filter Controls */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-2.5 text-xs justify-between min-h-[190px]">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Filters & Controls</span>
            <button 
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:opacity-50"
              title="Refresh notes list"
            >
              <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
            {/* Keyword Search */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Search Notes</span>
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search notes..."
                className="w-full !min-w-0"
              />
            </div>

            {/* Filter by Author */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Filter by Author</span>
              <SearchableSelect
                options={uniqueAuthors}
                value={authorId}
                onChange={(val) => setAuthorId(val)}
                placeholder="All Authors"
                allowEmptyOption={true}
                searchable={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Date From */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">From Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full text-[12px] px-2.5 py-1.5 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#F86F03] bg-white text-slate-700 font-medium transition-all"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">To Date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full text-[12px] px-2.5 py-1.5 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#F86F03] bg-white text-slate-700 font-medium transition-all"
              />
            </div>
          </div>

          {(search || authorId || dateFrom || dateTo) && (
            <div className="flex justify-end border-t border-slate-200/60 pt-1.5">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-orange-500 transition-colors font-semibold"
              >
                <RotateCcw size={9} />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 custom-scrollbar pr-1">
        {isLoading && notesList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RotateCw size={18} className="animate-spin text-orange-500" />
            <span className="font-semibold text-slate-500">Loading notes...</span>
          </div>
        ) : sortedNotes.length === 0 ? (
          <p className="text-sm text-center text-slate-400 py-6">No notes added yet.</p>
        ) : (
          sortedNotes.map((n) => {
            const isPinned = pinnedNoteIds.includes(n.id);
            const isOwn = n.createdById === currentUser?.id || n.createdBy?.id === currentUser?.id;
            
            let cardBgClass = 'bg-slate-50 border-slate-200';
            if (isPinned) {
              cardBgClass = 'bg-amber-50/80 border-amber-200 shadow-xs';
            } else if (isOwn) {
              cardBgClass = 'bg-orange-50/60 border-orange-200/80 border-l-4 border-l-orange-500 shadow-xs';
            }

            return (
              <div key={n.id} className={`border p-4 text-[13px] relative group animate-in fade-in duration-200 rounded-2xl transition-all duration-200 ${cardBgClass}`}>
                <div className="flex justify-between items-start mb-2 border-b border-slate-200/40 pb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      {n.createdBy?.name || 'User'}
                      {isOwn && (
                        <span className="text-[9px] text-orange-600 font-bold bg-orange-100/80 px-1.5 py-0.5 rounded-md leading-none border border-orange-200/60">You</span>
                      )}
                    </span>
                    {isPinned && <Pin size={10} className="fill-amber-500 text-amber-500 stroke-[2.5]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:opacity-0 transition-opacity duration-150 font-medium">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {editingNoteId === n.id ? (
                  <div className="mt-1 space-y-2 border border-slate-200 rounded-xl p-2 bg-white focus-within:border-orange-500 transition-colors">
                    <div className="flex gap-1 border-b border-slate-100 pb-1.5 flex-wrap">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertFormat('bold', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Bold"
                      >
                        <Bold size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertFormat('italic', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Italic"
                      >
                        <Italic size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertFormat('h1', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Heading 1"
                      >
                        <Heading1 size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertFormat('h2', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Heading 2"
                      >
                        <Heading2 size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertFormat('bullet', true)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Bullet List"
                      >
                        <List size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
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
                      className="w-full text-xs p-1 focus:outline-none resize-none h-16 bg-transparent text-slate-700 placeholder-slate-400"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        variant="outlined"
                        size="xs"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        size="xs"
                        onClick={() => handleUpdateNote(n.id)}
                        isLoading={updateNoteMutation.isPending}
                        sx={{ backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-line">{renderNoteContent(n.note)}</div>
                    
                    {/* Hover Actions Bar */}
                    <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-100 p-0.5 rounded-lg shadow-xs transition-all animate-in fade-in duration-100">
                      <button
                        onClick={() => handleTogglePin(n)}
                        className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        title={isPinned ? "Unpin note" : "Pin note"}
                      >
                        <Pin size={11} className={isPinned ? "fill-amber-500 text-amber-500" : ""} />
                      </button>
                      {isOwn && (
                        <>
                          <button
                            onClick={() => {
                              setEditingNoteId(n.id);
                              setEditingText(n.note);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title="Edit note"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
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
