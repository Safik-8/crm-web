import React, { useState } from 'react';
import { 
  Bug, AlertTriangle, ExternalLink, Calendar, 
  User, Building2, Trash2, Maximize2, X, CheckCircle2, Clock,
  Search, Code, FlaskConical, CheckCircle
} from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';

export const STAGES_CONFIG = [
  {
    id: 'NEW',
    label: 'Triage / New',
    color: '#3B82F6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: '#3B82F6',
    icon: Bug,
    description: 'Awaiting triage & reproduction'
  },
  {
    id: 'INVESTIGATING',
    label: 'Under Research',
    color: '#8B5CF6',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotColor: '#8B5CF6',
    icon: Search,
    description: 'Root cause analysis & inspection'
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    color: '#F59E0B',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotColor: '#F59E0B',
    icon: Code,
    description: 'Actively being fixed & developed'
  },
  {
    id: 'TESTING',
    label: 'QA & Testing',
    color: '#06B6D4',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    dotColor: '#06B6D4',
    icon: FlaskConical,
    description: 'Deployed for testing & verification'
  },
  {
    id: 'COMPLETED',
    label: 'Resolved & Closed',
    color: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: '#10B981',
    icon: CheckCircle2,
    description: 'Fix verified and shipped'
  }
];

const PRIORITY_BADGES = {
  NORMAL: { label: 'Normal Priority', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  HIGH: { label: 'High Priority', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  URGENT: { label: 'Urgent / Blocker', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const FeedbackDetailDrawer = ({ feedback, isOpen, onClose, onStatusChange, onDelete }) => {
  const [enlargedImage, setEnlargedImage] = useState(false);

  if (!feedback) return null;

  // Normalize legacy status 'WORKING' to 'IN_PROGRESS'
  const currentStatus = feedback.status === 'WORKING' ? 'IN_PROGRESS' : (feedback.status || 'NEW');

  const priorityStyle = PRIORITY_BADGES[feedback.priority] || PRIORITY_BADGES.NORMAL;

  const formattedDate = new Date(feedback.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const customFooter = (
    <div className="w-full flex items-center justify-between gap-3">
      <Button
        variant="outlined"
        danger
        size="small"
        startIcon={<Trash2 size={14} />}
        onClick={() => onDelete(feedback.id)}
      >
        Delete Bug Report
      </Button>

      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Bug & Feedback Details"
        subtitle={`Reported on ${formattedDate}`}
        icon={Bug}
        width={{ xs: '100%', sm: 540, md: 620 }}
        showFooter={true}
        customFooter={customFooter}
      >
        <div className="space-y-5 text-xs">
          {/* Priority & Status Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold ${priorityStyle.bg}`}>
                <AlertTriangle size={13} /> {priorityStyle.label}
              </span>
            </div>

            <div className="w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Lifecycle Stage</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {STAGES_CONFIG.map((s) => {
                  const isActive = currentStatus === s.id;
                  const StageIcon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onStatusChange(feedback.id, s.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={s.description}
                    >
                      <StageIcon size={14} className={`mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate max-w-full">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Summary</span>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{feedback.title}</h2>
          </div>

          {/* Description */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Description</span>
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-wrap font-sans text-xs">
              {feedback.description}
            </div>
          </div>

          {/* Screenshot Preview */}
          {feedback.attachmentUrl && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Attached Screenshot</span>
              <div 
                onClick={() => setEnlargedImage(true)}
                className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-100 cursor-zoom-in max-h-64 flex items-center justify-center p-2 hover:border-slate-300 transition-colors"
              >
                <img 
                  src={feedback.attachmentUrl} 
                  alt="Bug screenshot" 
                  className="max-h-60 object-contain rounded shadow-2xs" 
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                  <Maximize2 size={16} /> Click to Enlarge
                </div>
              </div>
            </div>
          )}

          {/* Reporter & Context Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Reporter Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted By</span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary border border-orange-200 flex items-center justify-center font-bold text-xs">
                  {feedback.user?.name?.charAt(0) || <User size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate leading-tight">{feedback.user?.name || 'Unknown User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{feedback.user?.email || 'No email'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Role:</span>
                <span className="font-bold text-slate-700">
                  {feedback.user?.primaryRole || feedback.user?.userRoles?.[0]?.role?.name || 'Member'}
                </span>
              </div>
              
              {/* Company (Must for every user) */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" /> Company:
                </span>
                <span className="font-bold text-slate-700 truncate max-w-[150px]" title={feedback.company?.name || feedback.user?.company?.name || 'StackCode Technologies'}>
                  {feedback.company?.name || feedback.user?.company?.name || 'StackCode Technologies'}
                </span>
              </div>

              {/* Branch (Show if exists) */}
              {(feedback.branch?.name || feedback.user?.branch?.name) && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} className="text-slate-400" /> Branch:
                  </span>
                  <span className="font-bold text-slate-700 truncate max-w-[150px]" title={feedback.branch?.name || feedback.user?.branch?.name}>
                    {feedback.branch?.name || feedback.user?.branch?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Submission Metadata Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submission Info</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                <span>{formattedDate}</span>
              </div>

              {feedback.pageUrl && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reported From URL</span>
                  <a
                    href={feedback.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline truncate max-w-full"
                  >
                    <span className="truncate">{feedback.pageUrl}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Lightbox Image Preview Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEnlargedImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img 
              src={feedback.attachmentUrl} 
              alt="Enlarged screenshot" 
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl" 
            />
            <button
              onClick={() => setEnlargedImage(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackDetailDrawer;
