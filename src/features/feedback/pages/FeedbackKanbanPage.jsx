import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bug, RefreshCw, AlertTriangle, ExternalLink, Calendar, 
  User, Clock, Image as ImageIcon, CheckCircle2, 
  Trash2, MoreVertical, Search, Code, FlaskConical,
  Eye, Building2
} from 'lucide-react';
import PageHeader from '../../../shared/components/modules/PageHeader';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { feedbackService } from '../services/feedbackService';
import FeedbackDetailDrawer, { STAGES_CONFIG } from '../components/FeedbackDetailDrawer';
import { toast } from '../../../shared/utils/toast';

const PRIORITY_OPTIONS = [
  { id: 'ALL', name: 'All Priorities' },
  { id: 'NORMAL', name: 'Normal Priority' },
  { id: 'HIGH', name: 'High Priority' },
  { id: 'URGENT', name: 'Urgent / Blocker' }
];

const PRIORITY_BADGES = {
  NORMAL: { label: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  HIGH: { label: 'High', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  URGENT: { label: 'Urgent', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const FeedbackKanbanPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Detail drawer state
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active card 3-dot menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Dragging state
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Close card action menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchFeedbacks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await feedbackService.getFeedbacks();
      const list = res?.data?.feedbacks || res?.feedbacks || [];
      setFeedbacks(Array.isArray(list) ? list : []);
      if (isRefresh) toast.success('Feedback board refreshed');
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Handle status update
  const handleStatusChange = async (feedbackId, newStatus) => {
    // Optimistic UI update
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
    );

    if (selectedFeedback && selectedFeedback.id === feedbackId) {
      setSelectedFeedback((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await feedbackService.updateFeedbackStatus(feedbackId, newStatus);
      const stageObj = STAGES_CONFIG.find((s) => s.id === newStatus);
      toast.success(`Moved to ${stageObj?.label || newStatus}`);
    } catch {
      toast.error('Failed to update status');
      fetchFeedbacks();
    }
  };

  // Open delete confirmation modal
  const promptDelete = (feedbackId, e) => {
    if (e) e.stopPropagation();
    setActiveMenuId(null);
    setDeleteTargetId(feedbackId);
  };

  // Perform delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await feedbackService.deleteFeedback(deleteTargetId);
      setFeedbacks((prev) => prev.filter((f) => f.id !== deleteTargetId));
      if (selectedFeedback?.id === deleteTargetId) {
        setIsDrawerOpen(false);
        setSelectedFeedback(null);
      }
      setDeleteTargetId(null);
      toast.success('Bug report deleted successfully');
    } catch {
      toast.error('Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', String(id));
    setDraggedCardId(id);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const idStr = e.dataTransfer.getData('text/plain');
    const id = Number(idStr);
    if (!id) return;

    const currentCard = feedbacks.find((f) => f.id === id);
    const currentStatus = currentCard?.status === 'WORKING' ? 'IN_PROGRESS' : currentCard?.status;
    if (currentCard && currentStatus !== targetStatus) {
      handleStatusChange(id, targetStatus);
    }
    setDraggedCardId(null);
  };

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        !searchTerm.trim() ||
        f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.pageUrl?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = priorityFilter === 'ALL' || f.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [feedbacks, searchTerm, priorityFilter]);

  // Group by stage (mapping legacy 'WORKING' to 'IN_PROGRESS')
  const columns = useMemo(() => {
    const map = {};
    STAGES_CONFIG.forEach((stage) => {
      map[stage.id] = [];
    });

    filteredFeedbacks.forEach((f) => {
      const statusKey = f.status === 'WORKING' ? 'IN_PROGRESS' : (f.status || 'NEW');
      if (map[statusKey]) {
        map[statusKey].push(f);
      } else if (map.NEW) {
        map.NEW.push(f);
      }
    });
    return map;
  }, [filteredFeedbacks]);

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans space-y-4">
      {/* ── Standard PageHeader identical to other CRM pages ── */}
      <PageHeader
        title="Bug & Issue Tracking Board"
        description="Monitor, investigate, and resolve user-reported bugs and platform feedback."
        icon={Bug}
        iconClassName="bg-orange-50 text-orange-600 rounded-lg"
        actions={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 justify-start sm:justify-end">
            {/* Search Input */}
            <div className="w-full sm:w-60">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search bugs, users, URL..."
              />
            </div>

            {/* Priority Filter */}
            <div className="w-full sm:w-44">
              <SelectField
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={PRIORITY_OPTIONS}
                placeholder="Filter Priority"
                searchable={false}
              />
            </div>

            {/* Refresh Board Button */}
            <Button
              variant="outlined"
              size="medium"
              isLoading={refreshing}
              startIcon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
              onClick={() => fetchFeedbacks(true)}
              sx={{
                height: '38px',
                borderColor: '#E2E8F0',
                color: '#475569',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '0 16px',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                }
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Kanban Board Workspace ── */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <div className="flex items-stretch gap-4 h-full min-w-max pb-3">
          {STAGES_CONFIG.map((stage) => {
            const stageCards = columns[stage.id] || [];
            const isDropActive = dragOverStage === stage.id;
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.id}
                className="flex flex-col w-[290px] sm:w-[310px] md:w-[325px] flex-shrink-0 h-full"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-1 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Stage Dot */}
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: stage.color,
                        boxShadow: `0 0 0 3px ${stage.color}25`
                      }}
                    />
                    <h3 className="font-bold text-[13px] text-slate-800 font-heading truncate tracking-tight">
                      {stage.label}
                    </h3>
                  </div>

                  {/* Count badge */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[22px] text-center border ${stage.badgeClass}`}
                  >
                    {stageCards.length}
                  </span>
                </div>

                {/* Droppable Stage Container */}
                <div
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`flex-1 min-h-0 flex flex-col rounded-lg transition-all duration-150 overflow-hidden relative p-2.5 ${
                    isDropActive
                      ? 'bg-orange-50/80 ring-2 ring-orange-300/60'
                      : 'bg-slate-100/70 border border-slate-200'
                  }`}
                >
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                    {loading ? (
                      <div className="space-y-2.5 p-1">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-28 bg-white rounded-lg border border-slate-200 p-3.5 animate-pulse" />
                        ))}
                      </div>
                    ) : stageCards.length === 0 ? (
                      <div className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4 text-center my-auto">
                        <StageIcon size={20} className="text-slate-300 mb-1" />
                        <p className="text-xs font-semibold text-slate-400">No tickets in this stage</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag cards here to update</p>
                      </div>
                    ) : (
                      stageCards.map((card) => {
                        const priorityConfig = PRIORITY_BADGES[card.priority] || PRIORITY_BADGES.NORMAL;
                        const roleName = card.user?.primaryRole || card.user?.userRoles?.[0]?.role?.name || 'Member';
                        const companyName = card.company?.name || card.user?.company?.name || 'StackCode Technologies';
                        const branchName = card.branch?.name || card.user?.branch?.name;
                        const isMenuOpen = activeMenuId === card.id;

                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, card.id)}
                            onClick={() => {
                              setSelectedFeedback(card);
                              setIsDrawerOpen(true);
                            }}
                            className={`bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-pointer group relative flex flex-col gap-2.5 ${
                              draggedCardId === card.id 
                                ? 'opacity-40 border-primary' 
                                : ''
                            }`}
                          >
                            {/* Card Top: Priority, Screenshot tag & 3-dot Action Menu */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${priorityConfig.bg}`}>
                                  {card.priority === 'URGENT' && <AlertTriangle size={10} className="text-rose-600" />}
                                  {priorityConfig.label}
                                </span>

                                {card.attachmentUrl && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60" title="Has Screenshot">
                                    <ImageIcon size={11} /> Screenshot
                                  </span>
                                )}
                              </div>

                              {/* Card Action Menu for Super Admin */}
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId((prev) => (prev === card.id ? null : card.id));
                                  }}
                                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setSelectedFeedback(card);
                                        setIsDrawerOpen(true);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                                    >
                                      <Eye size={13} className="text-slate-400" /> View Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => promptDelete(card.id, e)}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left cursor-pointer"
                                    >
                                      <Trash2 size={13} /> Delete Bug
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-slate-900 text-[13px] leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {card.title}
                            </h4>

                            {/* Description preview */}
                            <p className="text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed">
                              {card.description}
                            </p>

                            {/* Card Footer: Page URL, Reporter, Company & Branch */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-400">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {card.pageUrl ? (
                                    <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-[120px]" title={card.pageUrl}>
                                      {card.pageUrl}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">General</span>
                                  )}
                                </div>

                                {/* Reporter Info */}
                                <div 
                                  className="flex items-center gap-1.5 shrink-0" 
                                  title={`${card.user?.name} (${roleName})`}
                                >
                                  <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
                                    {card.user?.name?.charAt(0) || 'U'}
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-700 truncate max-w-[85px]">
                                    {card.user?.name?.split(' ')[0]}
                                  </span>
                                </div>
                              </div>

                              {/* Company & Branch row */}
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 truncate pt-1 border-t border-slate-50">
                                <Building2 size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate font-semibold text-slate-600" title={companyName}>
                                  {companyName}
                                </span>
                                {branchName && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate text-slate-500" title={branchName}>
                                      {branchName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Slide-over Detail Drawer ── */}
      <FeedbackDetailDrawer
        feedback={selectedFeedback}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedFeedback(null);
        }}
        onStatusChange={handleStatusChange}
        onDelete={promptDelete}
      />

      {/* ── Standard Delete Confirmation Dialog for Super Admin ── */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Bug Report"
        message="Are you sure you want to permanently delete this bug report? This will remove all attached screenshots and data."
        warningMessage="This action cannot be undone. Super Admin privilege is required."
        onConfirm={handleConfirmDelete}
        confirmText="Delete Report"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FeedbackKanbanPage;
