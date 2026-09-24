import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Bug, AlertTriangle, Upload, Image as ImageIcon, Trash2, Loader2, Send } from 'lucide-react';
import { feedbackService } from '../services/feedbackService';
import { toast } from '../../../shared/utils/toast';
import Button from '../../../shared/components/elements/Button';

const FeedbackModal = ({ isOpen, onClose }) => {
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL'); // 'NORMAL' | 'HIGH' | 'URGENT'
  const [pageUrl, setPageUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill with current page when modal opens, but user can freely edit or clear it
  useEffect(() => {
    if (isOpen) {
      setPageUrl(location.pathname + location.search);
    }
  }, [isOpen, location]);

  // Listen for clipboard paste (Ctrl+V) to easily attach screenshots
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setAttachmentUrl(event.target.result);
              toast.success('Screenshot pasted from clipboard!');
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a brief title');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        title: title.trim(),
        description: description.trim() || title.trim(),
        category: 'BUG',
        priority,
        pageUrl: pageUrl.trim() || null,
        attachmentUrl,
      });

      toast.success('Thank you! Your bug report has been submitted.');
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('NORMAL');
      setAttachmentUrl(null);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100/80 flex items-center justify-center text-primary">
              <Bug size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Report Bug / Feedback</h2>
              <p className="text-[11px] text-slate-500 font-medium">Found an issue or have a suggestion? Let us know!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-medium">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Summary / Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Save button in lead edit drawer doesn't respond"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium placeholder:text-slate-400"
              maxLength={150}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'NORMAL', label: 'Normal', color: 'border-slate-200 text-slate-700 active:bg-slate-50' },
                { key: 'HIGH', label: 'High Priority', color: 'border-amber-300 bg-amber-50/70 text-amber-800' },
                { key: 'URGENT', label: 'Urgent / Blocker', color: 'border-red-300 bg-red-50/80 text-red-800' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                    priority === p.key
                      ? `${p.color} ring-2 ring-primary/20 shadow-2xs`
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, what you expected, or any steps to reproduce..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Screenshot / Attachment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600">
                Screenshot <span className="text-slate-400 font-normal">(Optional — or paste with Ctrl+V)</span>
              </label>
              {attachmentUrl && (
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>

            {attachmentUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-h-36 flex items-center justify-center p-1">
                <img src={attachmentUrl} alt="Attached screenshot" className="max-h-32 object-contain rounded-lg" />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-orange-50/20 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} className="text-slate-400 mb-1" />
                <span className="text-[11px] font-semibold text-slate-600">Click to upload screenshot</span>
                <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB (or press Ctrl+V to paste)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Page / Feature URL (Optional & Editable) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Page / Feature URL <span className="text-slate-400 font-normal">(Optional — edit or enter any URL)</span>
            </label>
            <input
              type="text"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="e.g. /leads, /pipelines, or any custom URL"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono placeholder:text-slate-400 placeholder:font-sans"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onClose}
              disabled={submitting}
              sx={{
                borderColor: '#E2E8F0',
                color: '#475569',
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
              variant="contained"
              color="primary"
              size="small"
              isLoading={submitting}
              startIcon={<Send size={13} />}
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
