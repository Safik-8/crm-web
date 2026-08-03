import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLeadComments, addLeadComment } from '../../leads/services/leadService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { Send, Loader2, MessageSquare, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

const CommentThread = ({ leadId }) => {
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef(null);
  
  const canComment =
    hasPermission(PERMISSIONS.CREATE_ACTIVITY) ||
    hasPermission('LEAD', 'canEdit') ||
    hasPermission('LEAD', 'canCreate') ||
    hasPermission('PIPELINE', 'canEdit') ||
    user?.primaryRole === 'SUPER_ADMIN' ||
    user?.primaryRole === 'COMPANY_ADMIN' ||
    (user?.primaryRoleRank >= 40);

  const fetchComments = () => {
    if (!leadId) return;
    setLoading(true);
    getLeadComments(leadId)
      .then(res => setComments(res?.data?.comments || res?.data || []))
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComments();
  }, [leadId]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setPosting(true);
    try {
      const res = await addLeadComment(leadId, msg);
      const newComment = res?.data?.comment || { id: Date.now(), comment: msg, createdAt: new Date(), user: { id: user?.id, name: user?.name || 'You' } };
      setComments(prev => [...prev, newComment]);
      setText('');
      
      // Invalidate timeline so new comments reflect in the timeline logs tab immediately
      queryClient.invalidateQueries({ queryKey: ['leads', 'detail', leadId, 'timeline'] });

      // Scroll to bottom only when sending a new comment
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
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
    <div className="flex flex-col h-full min-h-[280px]">    
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" /> Activity & Comments
        </div>
        <button 
          onClick={fetchComments}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:opacity-50"
          title="Refresh comments"
        >
          <RotateCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </h3>

      {/* Comments list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {loading && comments.length === 0 ? (
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
            No comments yet. Be the first to add a comment!
          </div>
        ) : (
          comments.map((c, i) => {
            const isOwn = c.userId === user?.id || c.createdById === user?.id || c.user?.id === user?.id;
            
            if (isOwn) {
              return (
                <div key={c.id ?? i} className="flex gap-3 items-start flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                    {(c.user?.name || c.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-baseline gap-2 justify-end flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold">{formatTime(c.createdAt || c.created_at)}</span>
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                        {c.user?.name || c.userName || 'User'}
                        <span className="text-[9px] text-orange-500 font-bold bg-orange-100/60 px-1.5 py-0.5 rounded-md leading-none border border-orange-200/50">You</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-orange-50/50 border border-orange-100/50 p-3 rounded-2xl rounded-tr-none inline-block text-left max-w-[85%] shadow-2xs">
                      {c.comment}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={c.id ?? i} className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                  {(c.user?.name || c.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{c.user?.name || c.userName || 'User'}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{formatTime(c.createdAt || c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50/70 border border-slate-100 p-3 rounded-2xl rounded-tl-none inline-block max-w-[85%] shadow-2xs">
                    {c.comment}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — Sticky Pinned to Bottom */}
      {canComment && (
        <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 mt-auto flex gap-2 z-10">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Add a comment..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <button onClick={handleSend} disabled={posting || !text.trim()}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors cursor-pointer">
            {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentThread;
