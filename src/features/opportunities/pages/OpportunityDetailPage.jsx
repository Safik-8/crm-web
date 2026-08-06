// src/features/opportunities/pages/OpportunityDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ExternalLink,
  History,
  Activity,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  useOpportunityDetailQuery,
  useUpdateOpportunityMutation,
  useCloseOpportunityMutation,
} from '../hooks/useOpportunities';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';

const DEFAULT_STAGES = [
  { id: 1, name: 'Qualification', colorCode: '#ea580c', defaultProbabilityPct: 10 },
  { id: 2, name: 'Needs Analysis', colorCode: '#f97316', defaultProbabilityPct: 25 },
  { id: 3, name: 'Proposal', colorCode: '#fb923c', defaultProbabilityPct: 50 },
  { id: 4, name: 'Negotiation', colorCode: '#f59e0b', defaultProbabilityPct: 75 },
  { id: 5, name: 'Final Review', colorCode: '#10b981', defaultProbabilityPct: 90 },
];

export const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const opportunityId = Number(id);

  const { data: opportunity, isLoading, isError } = useOpportunityDetailQuery(opportunityId);
  const updateMutation = useUpdateOpportunityMutation();
  const closeMutation = useCloseOpportunityMutation();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('WON');
  const [closeRemarks, setCloseRemarks] = useState('');
  const [stageToMove, setStageToMove] = useState(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [optimisticStageId, setOptimisticStageId] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleStageClick = (st) => {
    if (!opportunity || opportunity.status !== 'OPEN') return;
    const activeId = optimisticStageId || opportunity.stageId || opportunity.stage?.id || 1;
    if (st.id === activeId) return;

    setStageToMove(st);
    setIsMoveModalOpen(true);
  };

  const handleConfirmStageMove = async () => {
    if (!stageToMove || !opportunity || opportunity.status !== 'OPEN') return;
    const targetStage = stageToMove;
    setOptimisticStageId(targetStage.id); // INSTANT 0ms visual update!
    setIsMoveModalOpen(false);
    setStageToMove(null);

    try {
      await updateMutation.mutateAsync({
        id: opportunityId,
        data: { stageId: targetStage.id },
      });
    } catch (err) {
      setOptimisticStageId(null);
    }
  };

  const handleConfirmClose = async () => {
    if (!opportunity || opportunity.status !== 'OPEN') return;
    try {
      await closeMutation.mutateAsync({
        id: opportunityId,
        data: { outcome: selectedOutcome, remarks: closeRemarks },
      });
      setIsCloseModalOpen(false);
      setCloseRemarks('');
    } catch (err) {
      // Handled by query mutation toast
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-md" />
        <div className="h-20 bg-white border border-slate-200 rounded-md p-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !opportunity) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Opportunity Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested opportunity record does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Opportunities
        </Link>
      </div>
    );
  }

  const currentStageId = optimisticStageId || opportunity.stageId || opportunity.stage?.id || 1;
  const expectedRevNum = Number(opportunity.expectedRevenue || 0);
  const probNum = Number(opportunity.probabilityPercentage || 10);
  const weightedRev = Math.round((expectedRevNum * probNum) / 100);

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── Enterprise Sharp-Cornered Record Header Compartment ─────────────────────────────── */}
        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Back Button & Record Title */}
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={() => navigate('/opportunities')}
                className="mt-1 p-2 rounded-md text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
                title="Back to Opportunities"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {opportunity.opportunityName}
                  </h1>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${
                      opportunity.status === 'WON'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : opportunity.status === 'LOST'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-orange-100 text-orange-800 border border-orange-300'
                    }`}
                  >
                    {opportunity.status === 'WON' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : opportunity.status === 'LOST' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                    )}
                    {opportunity.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>Record ID: <strong className="text-slate-700 font-semibold">#{opportunity.id}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Lead: <strong className="text-slate-800 font-semibold">{opportunity.lead?.name || 'N/A'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Owner: <strong className="text-slate-800 font-semibold">{opportunity.owner?.name || 'Unassigned'}</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Primary Action Buttons */}
            <div className="flex items-center gap-3">
              {opportunity.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Close Deal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 1. Pipeline Stage Stepper Banner (Sharp-Cornered Style) ──────────────── */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-orange-50 text-orange-600 rounded-sm border border-orange-100">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sales Pipeline Progress
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Current Stage: <strong className="text-orange-600 font-extrabold">{opportunity.stage?.name || 'Qualification'}</strong> ({probNum}% Win Probability)
            </span>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-5 gap-2.5">
            {DEFAULT_STAGES.map((st) => {
              const isActive = currentStageId === st.id;
              const isPast = currentStageId > st.id;

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={opportunity.status !== 'OPEN' || updateMutation.isPending}
                  onClick={() => handleStageClick(st)}
                  className={`p-3.5 rounded-md border text-left transition-all text-xs cursor-pointer relative flex flex-col justify-between ${
                    updateMutation.isPending ? 'opacity-60 cursor-wait' : ''
                  } ${
                    isActive
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-200'
                      : isPast
                      ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs truncate">{st.name}</span>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-ping" />
                    ) : null}
                  </div>
                  <span className={`text-[11px] font-medium block ${isActive ? 'text-orange-100' : 'text-slate-400'}`}>
                    {st.defaultProbabilityPct}% Prob.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Key Financial & Velocity Metrics Grid (4 Sharp Metric Tiles) ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Expected Revenue</span>
              <span className="text-2xl font-extrabold text-slate-900 block truncate">
                {formatCurrency(opportunity.expectedRevenue)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Win Probability</span>
              <span className="text-2xl font-extrabold text-slate-900 block">{probNum}%</span>
              <span className="text-[11px] text-slate-400 font-medium block">
                Weighted: {formatCurrency(weightedRev)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Target Closing Date</span>
              <span className="text-base font-bold text-slate-900 block pt-1">
                {formatDate(opportunity.closingDate)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Assigned Representative</span>
              <span className="text-base font-bold text-slate-900 block truncate">
                {opportunity.owner?.name || 'Unassigned'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── 3. Enterprise Workspace Grid (70% Left / 30% Right) ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Content Column (70% Width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Basic & Commercial Details */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" /> Basic & Commercial Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Opportunity Name</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {opportunity.opportunityName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Related Lead Profile</span>
                  <Link
                    to={`/leads?detailId=${opportunity.lead?.id || ''}`}
                    state={{ openLeadId: opportunity.lead?.id }}
                    className="font-bold text-orange-600 hover:text-orange-800 hover:underline inline-flex items-center gap-1.5 text-sm group"
                  >
                    <span>{opportunity.lead?.name || 'N/A'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  {opportunity.lead?.mobile && (
                    <span className="text-slate-500 block text-xs mt-0.5">
                      Mobile: {opportunity.lead.mobile}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Product / Course</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span>{opportunity.product?.name || 'General Course'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Created Date</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {formatDate(opportunity.createdAt)}
                  </span>
                </div>
              </div>

              {opportunity.notes && (
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-medium block mb-1">Internal Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200 text-sm leading-relaxed">
                    {opportunity.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Proposals & Quotation History */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" /> Commercial Proposals & Quotes
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-orange-50 text-orange-700 rounded-sm border border-orange-200">
                  {opportunity.proposals?.length || 0} Proposals
                </span>
              </div>

              {!opportunity.proposals || opportunity.proposals.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No commercial proposals generated for this opportunity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {opportunity.proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-4 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-sm block">
                          {prop.proposalNumber} (V{prop.currentVersion})
                        </span>
                        <span className="text-slate-400 block">
                          Valid Till: {formatDate(prop.validTill)} · Created: {formatDate(prop.createdAt)}
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {formatCurrency(prop.finalAmount)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                          {prop.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Activity & Stage History Timeline (Fixed max-height & custom scrollbar) */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-600" /> Activity & Stage History Timeline
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-orange-50 text-orange-700 rounded-sm border border-orange-200">
                  {1 + (opportunity.stageHistory?.length || 0)} Events
                </span>
              </div>

              {/* Scrollable Timeline Container */}
              <div className="max-h-[340px] overflow-y-auto pr-3 relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                {/* Closed Event */}
                {opportunity.status !== 'OPEN' && (
                  <div className="relative">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                        opportunity.status === 'WON'
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-rose-500 text-rose-600'
                      }`}
                    >
                      {opportunity.status === 'WON' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                      <span className="font-bold text-slate-900 block text-sm">
                        Opportunity Closed as {opportunity.status}
                      </span>
                      <span className="text-slate-400 text-xs block mt-0.5">
                        Closed Date: {formatDate(opportunity.updatedAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stage Transitions */}
                {opportunity.stageHistory && opportunity.stageHistory.length > 0 && (
                  opportunity.stageHistory.map((hist) => (
                    <div key={hist.id} className="relative">
                      <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center text-orange-600">
                        <TrendingUp className="w-3 h-3" />
                      </span>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                          <span>{hist.previousStage?.name || 'Previous Stage'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-orange-600">{hist.newStage?.name || 'New Stage'}</span>
                        </div>
                        <span className="text-slate-400 text-[11px] block">
                          Changed by {hist.changedBy?.name || 'System'} · {formatDate(hist.changedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Creation Event */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center text-orange-600">
                    <Activity className="w-3 h-3" />
                  </span>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                    <span className="font-bold text-slate-900 block text-sm">
                      Opportunity Created
                    </span>
                    <span className="text-slate-600 text-xs block mt-0.5">
                      Initial Expected Revenue: {formatCurrency(opportunity.expectedRevenue)}
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Created by {opportunity.owner?.name || 'System'} · {formatDate(opportunity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (30% Width - Sticky) */}
          <div className="space-y-6">
            {/* Linked Lead Info Card */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" /> Linked Lead Profile
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Lead Name</span>
                  <span className="font-bold text-slate-900 text-base block mt-0.5">
                    {opportunity.lead?.name || 'N/A'}
                  </span>
                </div>

                {opportunity.lead?.mobile && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{opportunity.lead.mobile}</span>
                  </div>
                )}

                {opportunity.lead?.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{opportunity.lead.email}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to={`/leads?detailId=${opportunity.lead?.id || ''}`}
                    state={{ openLeadId: opportunity.lead?.id }}
                    className="w-full py-2.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>View Lead Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sales Owner & Metadata Card */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" /> Record Assignment
              </h3>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 font-medium block">Sales Representative</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {opportunity.owner?.name || 'Unassigned'}
                  </span>
                  <span className="text-slate-500 block text-[11px] truncate">
                    {opportunity.owner?.email || ''}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                  <div>Created: {formatDate(opportunity.createdAt)}</div>
                  <div>Last Updated: {formatDate(opportunity.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close Deal Outcome Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Close Opportunity Outcome
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Select final outcome for {opportunity.opportunityName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={closeMutation.isPending}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Outcome Selection Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Final Deal Outcome</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOutcome('WON')}
                  className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                    selectedOutcome === 'WON'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CLOSED WON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOutcome('LOST')}
                  className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                    selectedOutcome === 'LOST'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>CLOSED LOST</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOutcome('CANCELLED')}
                  className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                    selectedOutcome === 'CANCELLED'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm ring-2 ring-slate-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>CANCELLED</span>
                </button>
              </div>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Closing Remarks / Notes</label>
              <textarea
                rows={3}
                value={closeRemarks}
                onChange={(e) => setCloseRemarks(e.target.value)}
                placeholder="Enter closure details (e.g. Contract signed for ₹25,000 package or competitor selected)..."
                className="w-full p-2.5 rounded-md border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={closeMutation.isPending}
                onClick={() => setIsCloseModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closeMutation.isPending}
                onClick={handleConfirmClose}
                className={`px-4 py-2 text-xs font-bold text-white rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60 ${
                  selectedOutcome === 'WON'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : selectedOutcome === 'LOST'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {closeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Closing Deal...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm Outcome</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Confirmation Modal */}
      {isMoveModalOpen && stageToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Confirm Stage Transition
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Update sales pipeline stage
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to move <strong className="text-slate-900 font-bold">{opportunity.opportunityName}</strong> from{' '}
                <span className="font-bold text-slate-800">{opportunity.stage?.name || 'Qualification'}</span> to{' '}
                <span className="font-bold text-orange-600">{stageToMove.name}</span>?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Probability:</span>
                  <span className="font-bold text-slate-700">{probNum}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">New Stage Probability:</span>
                  <span className="font-bold text-orange-600">{stageToMove.defaultProbabilityPct}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => {
                  setIsMoveModalOpen(false);
                  setStageToMove(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={handleConfirmStageMove}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Moving Stage...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confirm Move</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDetailPage;
