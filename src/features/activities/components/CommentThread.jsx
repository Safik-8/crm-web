import { useState, useEffect, useRef } from 'react';
import { getLeadComments, addLeadComment } from '../../leads/services/leadService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const CommentThread = ({ leadId }) => {
  const { hasPermission, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef(null);
  const canComment = hasPermission(PERMISSIONS.CREATE_ACTIVITY);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    getLeadComments(leadId)
      .then(res => setComments(res?.data?.comments || res?.data || []))
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setPosting(true);
    try {
      const res = await addLeadComment(leadId, msg);
      const newComment = res?.data?.comment || { id: Date.now(), comment: msg, createdAt: new Date(), user: { name: user?.name || 'You' } };
      setComments(prev => [...prev, newComment]);
      setText('');
    } catch (err) {
      toast.error(err?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <MessageSquare size={14} className="text-primary" /> Activity & Comments
      </h3>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">
            No comments yet. Be the first to add a note!
          </div>
        ) : (
          comments.map((c, i) => (
            <div key={c.id ?? i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(c.user?.name || c.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-800">{c.user?.name || c.userName || 'User'}</span>
                  <span className="text-[10px] text-slate-400">{formatTime(c.createdAt || c.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{c.comment}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canComment && (
        <div className="pt-3 border-t border-slate-100 mt-3 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Add a comment..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <button onClick={handleSend} disabled={posting || !text.trim()}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentThread;
