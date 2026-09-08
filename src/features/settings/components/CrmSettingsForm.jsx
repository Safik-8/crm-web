// crm-web/src/features/settings/components/CrmSettingsForm.jsx

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Database, GitBranch, Shuffle, Target, Hash, Clock, Layers } from "lucide-react"
import SelectField from "../../../shared/components/elements/SelectField"
import Toggle from "../../../shared/components/elements/Toggle"
import { getLeadStatuses } from "../../leadstatuses/services/leadStatusService"
import { getPipelines } from "../../pipelines/services/pipelineService"
import { getOpportunityStages } from "../../opportunities/services/opportunityService"

const ALGORITHM_OPTIONS = [
  { value: "ROUND_ROBIN", label: "Round Robin (Equal Sequential Distribution)" },
  { value: "LOAD_BALANCED", label: "Load Balanced (Based on Active Lead Capacity)" },
]

export const CrmSettingsForm = ({ formData, updateField, readOnly = false }) => {
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

  const rawLeadStatuses =
    leadStatusesData?.data?.statuses ||
    leadStatusesData?.statuses ||
    (Array.isArray(leadStatusesData?.data) ? leadStatusesData.data : []) ||
    []

  const rawPipelines =
    pipelinesData?.data?.pipelines ||
    pipelinesData?.pipelines ||
    (Array.isArray(pipelinesData?.data) ? pipelinesData.data : []) ||
    []

  const rawOpportunityStages =
    oppStagesData?.data?.stages ||
    oppStagesData?.stages ||
    (Array.isArray(oppStagesData?.data) ? oppStagesData.data : []) ||
    []

  const leadStatusOptions = [
    { value: "", label: "(Default: System Default - \"New\")" },
    ...rawLeadStatuses.map((st) => ({
      value: String(st.id),
      label: `${st.name} ${st.code ? `(${st.code})` : ""}`,
    })),
  ]

  const pipelineOptions = [
    { value: "", label: "(Default: First Active Pipeline)" },
    ...rawPipelines.map((p) => ({
      value: String(p.id),
      label: `${p.name} ${p.code ? `(${p.code})` : ""}`,
    })),
  ]

  const oppStageOptions = [
    { value: "", label: "(Default: Initial Qualification Stage)" },
    ...rawOpportunityStages.map((stage) => ({
      value: String(stage.id),
      label: `${stage.name} ${stage.code ? `(${stage.code})` : ""}`,
    })),
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> CRM Operational Defaults
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Configure initial states, auto-assignment rules, pipeline defaults, and ID numbering conventions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Default Lead Status Selector */}
        <div>
          <SelectField
            label="Default Initial Lead Status"
            disabled={readOnly}
            value={formData.defaultLeadStatusId ? String(formData.defaultLeadStatusId) : ""}
            onChange={(val) => updateField("defaultLeadStatusId", val ? Number(val) : null)}
            options={leadStatusOptions}
            isLoading={loadingStatuses}
            placeholder="Select Lead Status"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
            Newly created or imported leads will automatically be initialized with this status.
          </span>
        </div>

        {/* Default Pipeline Selector */}
        <div>
          <SelectField
            label="Default Sales Pipeline"
            disabled={readOnly}
            value={formData.defaultPipelineId ? String(formData.defaultPipelineId) : ""}
            onChange={(val) => updateField("defaultPipelineId", val ? Number(val) : null)}
            options={pipelineOptions}
            isLoading={loadingPipelines}
            placeholder="Select Pipeline"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
            Default pipeline selected when creating new deals and tracking pipeline board stages.
          </span>
        </div>

        {/* Default Opportunity Stage Selector */}
        <div>
          <SelectField
            label="Default Opportunity Stage"
            disabled={readOnly}
            value={formData.defaultOpportunityStageId ? String(formData.defaultOpportunityStageId) : ""}
            onChange={(val) => updateField("defaultOpportunityStageId", val ? Number(val) : null)}
            options={oppStageOptions}
            isLoading={loadingOppStages}
            placeholder="Select Opportunity Stage"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
            Initial stage applied when qualified leads convert into new opportunities.
          </span>
        </div>

        {/* Default Follow-up Time */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Default Follow-up Schedule Time
          </label>
          <input
            type="time"
            disabled={readOnly}
            value={formData.defaultFollowupTime || "09:00"}
            onChange={(e) => updateField("defaultFollowupTime", e.target.value)}
            className="w-full px-3.5 h-[38px] text-[13px] font-medium bg-white hover:bg-slate-50/50 border border-slate-200 rounded-[10px] text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
            Default time assigned when scheduling daily customer calls and task reminders.
          </span>
        </div>

        {/* Auto Assignment Toggle Card */}
        <div className="md:col-span-2 bg-slate-50/70 border border-slate-200 p-4 sm:p-5 rounded-none flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-orange-100 text-orange-600 border border-orange-200 shrink-0">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-slate-900">Automated Lead Assignment Engine</h4>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Automatically distribute newly imported or created leads among active sales agents.
              </p>
            </div>
          </div>
          <Toggle
            checked={formData.autoAssignmentEnabled || false}
            disabled={readOnly}
            onChange={(checked) => updateField("autoAssignmentEnabled", checked)}
            id="auto-assignment-toggle"
          />
        </div>

        {/* Auto Assignment Algorithm */}
        {formData.autoAssignmentEnabled && (
          <div className="md:col-span-2">
            <SelectField
              label="Assignment Algorithm"
              disabled={readOnly}
              value={formData.defaultAssignmentAlgorithm || "ROUND_ROBIN"}
              onChange={(val) => updateField("defaultAssignmentAlgorithm", val)}
              options={ALGORITHM_OPTIONS}
              placeholder="Select Algorithm"
            />
          </div>
        )}

        {/* Default Opportunity Win Probability */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-[12px] font-semibold text-slate-700 tracking-tight flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" /> Default Opportunity Win Probability
            </span>
            <span className="text-orange-600 font-mono font-bold text-sm">{formData.defaultOpportunityWinProb || 50}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={readOnly}
            value={formData.defaultOpportunityWinProb || 50}
            onChange={(e) => updateField("defaultOpportunityWinProb", Number(e.target.value))}
            className="w-full accent-primary bg-slate-200 h-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Number Formats Section */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 mt-2 space-y-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-primary" /> Custom Record Number Formats
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lead Format */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Lead ID Format</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.leadNumberFormat || "LD-{YYYY}-{0000}"}
                onChange={(e) => updateField("leadNumberFormat", e.target.value)}
                className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 font-medium block">Preview: LD-2026-0001</span>
            </div>

            {/* Opportunity Format */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Opportunity ID Format</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.opportunityNumberFormat || "OPP-{YYYY}-{0000}"}
                onChange={(e) => updateField("opportunityNumberFormat", e.target.value)}
                className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 font-medium block">Preview: OPP-2026-0001</span>
            </div>

            {/* Deal Format */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-2 shadow-2xs">
              <label className="block text-[12px] font-semibold text-slate-700">Deal ID Format</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.dealNumberFormat || "DEAL-{YYYY}-{0000}"}
                onChange={(e) => updateField("dealNumberFormat", e.target.value)}
                className="w-full px-3 h-[36px] text-[12px] font-mono font-semibold bg-white border border-slate-200 rounded-[8px] text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 font-medium block">Preview: DEAL-2026-0001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




