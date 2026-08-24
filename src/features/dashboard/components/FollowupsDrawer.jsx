// crm-web/src/features/dashboard/components/FollowupsDrawer.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Calendar, AlertTriangle, CheckCircle, Phone, X,
  ChevronRight, ArrowUpRight, User, MoreVertical, Edit, Trash2, ShieldAlert
} from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import CompleteFollowupModal from '../../followups/components/CompleteFollowupModal';
import FollowupForm from '../../followups/components/FollowupForm';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import {
  useFollowupsQuery,
  useCancelFollowupMutation,
  useDeleteFollowupMutation,
} from '../../followups/hooks/useFollowups';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  CALL:     '📞',
  MEETING:  '🤝',
  DEMO:     '🖥️',
  WHATSAPP: '💬',
  EMAIL:    '✉️',
  VISIT:    '🏢',
};

const FollowupsDrawer = ({ isOpen, onClose, initialFilter = 'today' }) => {
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [completingFollowup, setCompletingFollowup] = useState(null);
  const [editingFollowup, setEditingFollowup]       = useState(null);
  const [confirmState, setConfirmState]             = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: null,
    target: null,
  });

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const canEdit   = hasPermission('FOLLOWUP', 'canEdit') || hasPermission('create:followup');
  const canDelete = hasPermission('FOLLOWUP', 'canDelete');

  const { data: res, isLoading, refetch } = useFollowupsQuery({ limit: 100 });
  const cancelMutation = useCancelFollowupMutation();
  const deleteMutation = useDeleteFollowupMutation();

  const allFollowups = res?.data?.followups || res?.followups || res?.data || [];

  useEffect(() => {
    if (initialFilter) {
      setActiveTab(initialFilter);
    }
  }, [initialFilter, isOpen]);

  // Categorize followups
  const categorized = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todayItems    = [];
    const upcomingItems = [];
    const overdueItems  = [];

    allFollowups.forEach((f) => {
      if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return;

      const sched = new Date(f.scheduledAt);

      if (f.status === 'MISSED' || (f.status === 'PENDING' && sched < startOfToday)) {
        overdueItems.push(f);
      } else if (sched >= startOfToday && sched <= endOfToday) {
        todayItems.push(f);
      } else if (sched > endOfToday) {
        upcomingItems.push(f);
      }
    });

    return {
      today: todayItems,
      upcoming: upcomingItems,
      overdue: overdueItems,
    };
  }, [allFollowups]);

  const activeList = categorized[activeTab] || [];

  const handleCancelRequest = (followup) => {
    setConfirmState({
      isOpen: true,
      title: 'Cancel Follow-up',
      message: `Are you sure you want to cancel this scheduled ${followup.followupType} follow-up?`,
      confirmText: 'Yes, Cancel',
      action: 'CANCEL',
      target: followup,
    });
  };

  const handleDeleteRequest = (followup) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Follow-up',
      message: `Are you sure you want to permanently delete this follow-up record?`,
      confirmText: 'Yes, Delete',
      action: 'DELETE',
      target: followup,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState.target) return;
    const id = confirmState.target.id;
    if (confirmState.action === 'CANCEL') {
      cancelMutation.mutate(id, {
        onSuccess: () => setConfirmState({ isOpen: false, target: null }),
      });
    } else if (confirmState.action === 'DELETE') {
      deleteMutation.mutate(id, {
        onSuccess: () => setConfirmState({ isOpen: false, target: null }),
      });
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Follow-up Activities"
        subtitle="Manage and execute scheduled client follow-ups"
        width={{ xs: '100%', sm: 520, md: 580 }}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={13} />
              <span>Today</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'today' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {categorized.today.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-sky-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar size={13} />
              <span>Upcoming</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'upcoming' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {categorized.upcoming.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Overdue</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                categorized.overdue.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {categorized.overdue.length}
              </span>
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoading && (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse h-24" />
                ))}
              </div>
            )}

            {!isLoading && activeList.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <CheckCircle size={26} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {activeTab === 'today' && 'No follow-ups due today!'}
                  {activeTab === 'upcoming' && 'No upcoming follow-ups scheduled.'}
                  {activeTab === 'overdue' && 'Great job! No overdue follow-ups.'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {activeTab === 'today'
                    ? 'All set for today. Schedule new follow-ups from the dashboard or leads page.'
                    : 'Scheduled activities will appear here in chronological order.'}
                </p>
              </div>
            )}

            {!isLoading && activeList.map((f) => {
              const dt = new Date(f.scheduledAt);
              const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              const lead = f.lead;
              const assignedRep = f.assignedTo || lead?.assignedTo;
              const assignedRole = assignedRep?.userRoles?.[0]?.role?.name;

              return (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-xs p-4 transition-all duration-150 flex flex-col gap-3 group"
                >
                  {/* Row Top: Lead info & Activity badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-100">
                        {TYPE_ICONS[f.followupType] || '📅'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/leads?detailId=${f.leadId}`);
                            }}
                            className="text-xs font-bold text-slate-800 hover:text-orange-600 transition-colors truncate flex items-center gap-1 cursor-pointer"
                          >
                            <span>{lead?.name || `Lead #${f.leadId}`}</span>
                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {f.followupType}
                          </span>
                        </div>
                        {lead?.mobile && (
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone size={10} /> {lead.mobile}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Clock size={11} className="text-orange-500" />
                        {dateStr}, {timeStr}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Representative Badge */}
                  {assignedRep && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50/80 border border-slate-200/70 px-2.5 py-1 rounded-xl w-fit">
                      <User size={11} className="text-orange-500 shrink-0" />
                      <span className="text-slate-400 font-medium">Assigned:</span>
                      <span className="font-bold text-slate-800">{assignedRep.name}</span>
                      {assignedRole && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase border shrink-0 ${
                            assignedRole === 'BDE'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : assignedRole === 'ISE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {assignedRole}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes if any */}
                  {f.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/80 line-clamp-2">
                      {f.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/leads?detailId=${f.leadId}`);
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      View Lead Details <ChevronRight size={12} />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setEditingFollowup(f)}
                            sx={{
                              fontSize: '11px',
                              height: '28px',
                              padding: '2px 10px',
                              borderRadius: '8px',
                            }}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setCompletingFollowup(f)}
                            startIcon={<CheckCircle size={12} />}
                            sx={{
                              backgroundColor: '#10B981',
                              fontSize: '11px',
                              height: '28px',
                              padding: '2px 12px',
                              borderRadius: '8px',
                              '&:hover': { backgroundColor: '#059669' },
                            }}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>

      {/* Complete Followup Modal */}
      {completingFollowup && (
        <CompleteFollowupModal
          followup={completingFollowup}
          onClose={() => setCompletingFollowup(null)}
          onSuccess={() => {
            setCompletingFollowup(null);
            refetch();
          }}
        />
      )}

      {/* Edit / Reschedule Modal */}
      {editingFollowup && (
        <FollowupForm
          leadId={editingFollowup.leadId}
          lead={editingFollowup.lead}
          followup={editingFollowup}
          onClose={() => setEditingFollowup(null)}
          onSuccess={() => {
            setEditingFollowup(null);
            refetch();
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ isOpen: false, target: null })}
        isLoading={cancelMutation.isPending || deleteMutation.isPending}
      />
    </>
  );
};

export default FollowupsDrawer;
