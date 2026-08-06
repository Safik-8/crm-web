// src/features/opportunities/components/OpportunityDetailDrawer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Drawer from '../../../shared/components/elements/Drawer';
import {
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
  Maximize2,
} from 'lucide-react';
import { useOpportunityDetailQuery } from '../hooks/useOpportunities';

/**
 * Clean, Formal Loading Skeleton
 */
const OpportunityDrawerSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {/* Stage & Action Row Skeleton */}
    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-5 w-24 bg-slate-200 rounded-md" />
        <div className="h-5 w-16 bg-slate-200 rounded-md" />
      </div>
      <div className="h-7 w-24 bg-slate-200 rounded-lg" />
    </div>

    {/* Metrics Grid Skeleton */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-20 bg-slate-200 rounded" />
        </div>
      ))}
    </div>

    {/* Details Box Skeleton */}
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
      <div className="h-4 w-28 bg-slate-200 rounded pb-2 border-b border-slate-100" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const OpportunityDetailDrawer = ({
  opportunityId,
  isOpen,
  onClose,
  onCloseOpportunityClick,
  onLeadClick,
}) => {
  const navigate = useNavigate();
  const { data: opportunity, isLoading } = useOpportunityDetailQuery(opportunityId);

  if (!isOpen) return null;

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

  const drawerTitle = opportunity?.opportunityName || 'Opportunity Details';

  // Compact, informative subtitle header
  const drawerSubtitle = opportunity
    ? `ID: #${opportunityId} · Lead: ${opportunity.lead?.name || 'N/A'} · Owner: ${opportunity.owner?.name || 'Unassigned'}`
    : `ID: #${opportunityId}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={drawerTitle}
      subtitle={drawerSubtitle}
    >
      {/* Loading State */}
      {isLoading ? (
        <OpportunityDrawerSkeleton />
      ) : !opportunity ? (
        <div className="py-12 text-center text-slate-400 text-sm">Opportunity details not found.</div>
      ) : (
        <div className="space-y-4 text-slate-800">
          {/* Formal Stage & Status Row */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Stage Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: `${opportunity.stage?.colorCode || '#6366f1'}15`,
                  color: opportunity.stage?.colorCode || '#6366f1',
                  border: `1px solid ${opportunity.stage?.colorCode || '#6366f1'}30`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: opportunity.stage?.colorCode || '#6366f1' }}
                />
                {opportunity.stage?.name || 'Qualification'}
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                  opportunity.status === 'WON'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : opportunity.status === 'LOST'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {opportunity.status === 'WON' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : opportunity.status === 'LOST' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {opportunity.status}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/opportunities/${opportunityId}`);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Open Dedicated Full Page View"
              >
                <span>Full Page View</span>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {opportunity.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={() => onCloseOpportunityClick && onCloseOpportunityClick(opportunity)}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Close Deal
                </button>
              )}
            </div>
          </div>

          {/* Key Metrics Row (3-Column Clean Cards) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Expected Rev</span>
              </div>
              <span className="font-bold text-slate-900 text-sm block truncate">
                {formatCurrency(opportunity.expectedRevenue)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Probability</span>
              </div>
              <span className="font-bold text-slate-900 text-sm block">
                {opportunity.probabilityPercentage || 10}%
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">Target Date</span>
              </div>
              <span className="font-bold text-slate-900 text-xs block pt-0.5 truncate">
                {formatDate(opportunity.closingDate)}
              </span>
            </div>
          </div>

          {/* Basic Details Section */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3.5">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Basic Details
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Related Lead (Interactive Clickable Link) */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Related Lead</span>
                <a
                  href={`/leads?search=${encodeURIComponent(opportunity.lead?.name || '')}`}
                  onClick={(e) => {
                    if (opportunity.lead?.id) {
                      e.preventDefault();
                      if (onLeadClick) {
                        onLeadClick(opportunity.lead.id, opportunity.lead);
                      } else {
                        window.location.href = `/leads?search=${encodeURIComponent(opportunity.lead.name)}`;
                      }
                    }
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 text-sm group cursor-pointer"
                >
                  <span>{opportunity.lead?.name || 'N/A'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </a>
                {opportunity.lead?.mobile && (
                  <span className="text-slate-500 text-xs block mt-0.5">
                    {opportunity.lead.mobile}
                  </span>
                )}
              </div>

              {/* Assigned Owner */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Assigned Owner</span>
                <span className="font-semibold text-slate-800 block text-sm">
                  {opportunity.owner?.name || 'Unassigned'}
                </span>
                {opportunity.owner?.email && (
                  <span className="text-slate-500 text-xs block mt-0.5 truncate">
                    {opportunity.owner.email}
                  </span>
                )}
              </div>

              {/* Product / Course */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Product / Course</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate">{opportunity.product?.name || 'General Course'}</span>
                </span>
              </div>

              {/* Created Date */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Created Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(opportunity.createdAt)}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {opportunity.notes && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-medium block mb-1">Internal Notes</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-normal leading-relaxed">
                  {opportunity.notes}
                </p>
              </div>
            )}
          </div>

          {/* Proposals History Section */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Proposals History
              </h4>
              <span className="text-xs font-medium text-slate-500">
                {opportunity.proposals?.length || 0} Proposals
              </span>
            </div>

            {!opportunity.proposals || opportunity.proposals.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">No proposals generated yet.</p>
            ) : (
              <div className="space-y-2">
                {opportunity.proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {prop.proposalNumber} (V{prop.currentVersion})
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Created: {formatDate(prop.createdAt)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(prop.finalAmount)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold uppercase">
                        {prop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Activity & Stage History Timeline */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Activity & History Timeline
              </h4>
              <span className="text-xs font-medium text-slate-500">
                {1 + (opportunity.stageHistory?.length || 0)} Events
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
              {/* Deal Status Event (If WON / LOST / CANCELLED) */}
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
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-900 block">
                      Opportunity Closed as {opportunity.status}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDate(opportunity.updatedAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Stage Transition History */}
              {opportunity.stageHistory && opportunity.stageHistory.length > 0 && (
                opportunity.stageHistory.map((hist) => (
                  <div key={hist.id} className="relative">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-indigo-600">
                      <TrendingUp className="w-3 h-3" />
                    </span>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{hist.previousStage?.name || 'Previous Stage'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-indigo-600">{hist.newStage?.name || 'New Stage'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Changed by {hist.changedBy?.name || 'System'} · {formatDate(hist.changedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Opportunity Creation Event */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-indigo-600">
                  <Activity className="w-3 h-3" />
                </span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900 block">
                    Opportunity Created
                  </span>
                  <span className="text-slate-600 text-xs block mt-0.5">
                    Initial Expected Revenue: {formatCurrency(opportunity.expectedRevenue)}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Created by {opportunity.owner?.name || 'System'} · {formatDate(opportunity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
