// crm-web/src/features/settings/components/CrmSettingsForm.jsx

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Database, GitBranch, Shuffle, Target, Hash, Clock, Tags, Layers } from "lucide-react"
import { getLeadStatuses } from "../../leadstatuses/services/leadStatusService"
import { getPipelines } from "../../pipelines/services/pipelineService"
import { getOpportunityStages } from "../../opportunities/services/opportunityService"

export const CrmSettingsForm = ({ formData, updateField }) => {
  // Fetch available lead statuses
  const { data: leadStatusesData, isLoading: loadingStatuses } = useQuery({
    queryKey: ["lead-statuses-options"],
    queryFn: () => getLeadStatuses({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch available pipelines
  const { data: pipelinesData, isLoading: loadingPipelines } = useQuery({
    queryKey: ["pipelines-options"],
    queryFn: () => getPipelines(),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch available opportunity stages
  const { data: oppStagesData, isLoading: loadingOppStages } = useQuery({
    queryKey: ["opportunity-stages-options"],
    queryFn: () => getOpportunityStages(),
    staleTime: 5 * 60 * 1000,
  })

  const leadStatuses =
    leadStatusesData?.data?.statuses ||
    leadStatusesData?.statuses ||
    (Array.isArray(leadStatusesData?.data) ? leadStatusesData.data : []) ||
    []

  const pipelines =
    pipelinesData?.data?.pipelines ||
    pipelinesData?.pipelines ||
    (Array.isArray(pipelinesData?.data) ? pipelinesData.data : []) ||
    []

  const opportunityStages =
    oppStagesData?.data?.stages ||
    oppStagesData?.stages ||
    (Array.isArray(oppStagesData?.data) ? oppStagesData.data : []) ||
    []

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> CRM Operational Defaults
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure initial states, auto-assignment rules, pipeline defaults, and ID numbering conventions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Default Lead Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Tags className="w-3.5 h-3.5 text-slate-500" /> Default Initial Lead Status
          </label>
          <select
            value={formData.defaultLeadStatusId || ""}
            onChange={(e) => updateField("defaultLeadStatusId", e.target.value ? Number(e.target.value) : null)}
            disabled={loadingStatuses}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all disabled:opacity-50"
          >
            <option value="">(Default: System Default - "New")</option>
            {leadStatuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.code ? `(${st.code})` : ""}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Newly created or imported leads will automatically be initialized with this status.
          </span>
        </div>

        {/* Default Pipeline Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-slate-500" /> Default Sales Pipeline
          </label>
          <select
            value={formData.defaultPipelineId || ""}
            onChange={(e) => updateField("defaultPipelineId", e.target.value ? Number(e.target.value) : null)}
            disabled={loadingPipelines}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all disabled:opacity-50"
          >
            <option value="">(Default: First Active Pipeline)</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ""}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Default pipeline selected when creating new deals and tracking pipeline board stages.
          </span>
        </div>

        {/* Default Opportunity Stage Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" /> Default Opportunity Stage
          </label>
          <select
            value={formData.defaultOpportunityStageId || ""}
            onChange={(e) => updateField("defaultOpportunityStageId", e.target.value ? Number(e.target.value) : null)}
            disabled={loadingOppStages}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all disabled:opacity-50"
          >
            <option value="">(Default: Initial Qualification Stage)</option>
            {opportunityStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name} {stage.code ? `(${stage.code})` : ""}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Initial stage applied when qualified leads convert into new opportunities.
          </span>
        </div>

        {/* Default Follow-up Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Default Daily Follow-up Schedule Time
          </label>
          <input
            type="time"
            value={formData.defaultFollowupTime || "09:00"}
            onChange={(e) => updateField("defaultFollowupTime", e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Auto Assignment Toggle */}
        <div className="md:col-span-2 bg-slate-50/60 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-slate-900">Automated Lead Assignment Engine</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automatically distribute newly imported or created leads among active sales agents.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoAssignmentEnabled || false}
              onChange={(e) => updateField("autoAssignmentEnabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Auto Assignment Algorithm */}
        {formData.autoAssignmentEnabled && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignment Algorithm
            </label>
            <select
              value={formData.defaultAssignmentAlgorithm || "ROUND_ROBIN"}
              onChange={(e) => updateField("defaultAssignmentAlgorithm", e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            >
              <option value="ROUND_ROBIN">Round Robin (Equal Sequential Distribution)</option>
              <option value="LOAD_BALANCED">Load Balanced (Based on Active Lead Capacity)</option>
            </select>
          </div>
        )}

        {/* Default Opportunity Win Probability */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-500" /> Default Opportunity Win Probability
            </span>
            <span className="text-orange-600 font-mono font-bold">{formData.defaultOpportunityWinProb || 50}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={formData.defaultOpportunityWinProb || 50}
            onChange={(e) => updateField("defaultOpportunityWinProb", Number(e.target.value))}
            className="w-full accent-primary bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Number Formats Section */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 mt-3 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-primary" /> Custom Record Number Formats
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lead Format */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Lead ID Format</label>
              <input
                type="text"
                value={formData.leadNumberFormat || "LD-{YYYY}-{0000}"}
                onChange={(e) => updateField("leadNumberFormat", e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-400 font-medium block">Preview: LD-2026-0001</span>
            </div>

            {/* Opportunity Format */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Opportunity ID Format</label>
              <input
                type="text"
                value={formData.opportunityNumberFormat || "OPP-{YYYY}-{0000}"}
                onChange={(e) => updateField("opportunityNumberFormat", e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-400 font-medium block">Preview: OPP-2026-0001</span>
            </div>

            {/* Deal Format */}
            <div className="bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Deal ID Format</label>
              <input
                type="text"
                value={formData.dealNumberFormat || "DEAL-{YYYY}-{0000}"}
                onChange={(e) => updateField("dealNumberFormat", e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-400 font-medium block">Preview: DEAL-2026-0001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
