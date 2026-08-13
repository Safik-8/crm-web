import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { X, Pencil, User, Phone, Mail, DollarSign, MapPin, FileText, Compass, Award, Activity, UserCheck, Building, GitMerge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUpdateLeadMutation, useLeadFormDataQuery } from '../hooks/useLeads';
import { useAuth } from '../../../app/providers/AuthProvider';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import { getPipelines } from '../../pipelines/services/pipelineService';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Drawer from '../../../shared/components/elements/Drawer';

export const LeadEditModal = ({ lead, assignableUsers = [], onClose, onUpdated }) => {
  const { user: currentUser } = useAuth();
  const updateLeadMutation = useUpdateLeadMutation();

  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = currentUser?.primaryRole === 'COMPANY_ADMIN' || (currentUser?.primaryRoleRank >= 80 && !currentUser?.branchId);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');

  const [values, setValues] = useState({
    name: '',
    mobile: '',
    email: '',
    alternateMobile: '',
    sourceId: '',
    courseId: '',
    statusId: '',
    priority: 'MEDIUM',
    budget: '',
    city: '',
    state: '',
    country: '',
    notes: '',
    assignedToId: '',
    companyId: '',
    branchId: '',
    pipelineId: ''
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Sync values on open/lead change
  useEffect(() => {
    if (lead) {
      const companyVal = lead.company?.id || lead.companyId || '';
      const branchVal = lead.branch?.id || lead.branchId || '';
      const pipelineVal = lead.pipeline?.id || lead.pipelineId || '';

      setSelectedCompanyId(companyVal ? String(companyVal) : '');
      setSelectedBranchId(branchVal ? String(branchVal) : '');
      setSelectedPipelineId(pipelineVal ? String(pipelineVal) : '');

      setValues({
        name: lead.name || '',
        mobile: lead.mobile || '',
        email: lead.email || '',
        alternateMobile: lead.alternateMobile || '',
        sourceId: lead.source?.id || lead.sourceId || '',
        courseId: lead.course?.id || lead.courseId || '',
        statusId: lead.status?.id || lead.statusId || '',
        priority: lead.priority || 'MEDIUM',
        budget: lead.budget !== null && lead.budget !== undefined ? String(lead.budget) : '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        notes: lead.notes || '',
        assignedToId: lead.assignedTo?.id || lead.assignedToId || '',
        companyId: companyVal ? String(companyVal) : '',
        branchId: branchVal ? String(branchVal) : '',
        pipelineId: pipelineVal ? String(pipelineVal) : ''
      });
      setErrors({});
    }
  }, [lead]);

  const targetCompanyId = isSuperAdmin ? selectedCompanyId : currentUser?.companyId;
  const targetBranchId = (isSuperAdmin || isCompanyAdmin) ? selectedBranchId : currentUser?.branchId;

  // 1. Fetch Companies list (for Super Admin only)
  const { data: companiesRes, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: isSuperAdmin && !!lead
  });
  const companiesOptions = (
    Array.isArray(companiesRes)
      ? companiesRes
      : Array.isArray(companiesRes?.data)
      ? companiesRes.data
      : []
  ).map((c) => ({ id: c.id, name: c.name }));

  // 2. Fetch Branches list (for Super Admin & Company Admin)
  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches-form-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && (isSuperAdmin || isCompanyAdmin) && !!lead
  });
  const branchesOptions = (
    Array.isArray(branchesRes)
      ? branchesRes
      : Array.isArray(branchesRes?.data)
      ? branchesRes.data
      : Array.isArray(branchesRes?.data?.branches)
      ? branchesRes.data.branches
      : []
  ).map((b) => ({ id: b.id, name: b.name }));

  // 3. Fetch Pipelines list (for all roles)
  const { data: pipelinesRes, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ['pipelines-form-options', targetCompanyId, targetBranchId],
    queryFn: () => getPipelines({ companyId: targetCompanyId, branchId: targetBranchId }),
    enabled: !!targetCompanyId && !!lead
  });
  const pipelinesOptions = (
    Array.isArray(pipelinesRes)
      ? pipelinesRes
      : Array.isArray(pipelinesRes?.data)
      ? pipelinesRes.data
      : Array.isArray(pipelinesRes?.data?.pipelines)
      ? pipelinesRes.data.pipelines
      : Array.isArray(pipelinesRes?.pipelines)
      ? pipelinesRes.pipelines
      : []
  ).map((p) => ({ id: p.id, name: p.name }));

  // 4. Fetch dropdown options (Sources, Courses, Statuses, Users)
  const { data: formDataRes, isLoading: isLoadingFormData, isError } = useLeadFormDataQuery({
    companyId: targetCompanyId,
    branchId: targetBranchId
  });

  const validate = () => {
    const errs = {};
    const name = values.name.trim();
    const mobile = values.mobile.trim();
    const email = values.email.trim();
    const alternateMobile = values.alternateMobile.trim();
    const budget = values.budget.trim();

    if (isSuperAdmin && !values.companyId) {
      errs.companyId = 'Company selection is required';
    }

    if ((isSuperAdmin || isCompanyAdmin) && !values.branchId) {
      errs.branchId = 'Branch selection is required';
    }

    if (!name) {
      errs.name = 'Lead name is required';
    } else if (name.length > 100) {
      errs.name = 'Name must be 100 characters or less';
    } else if (/\d/.test(name)) {
      errs.name = 'Name must not contain numbers';
    }

    if (!mobile) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile)) {
      errs.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!values.sourceId) {
      errs.sourceId = 'Lead source is required';
    }

    if (!values.courseId) {
      errs.courseId = 'Interested course is required';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Must be a valid email address';
    }

    if (alternateMobile && !/^\d{10}$/.test(alternateMobile)) {
      errs.alternateMobile = 'Alternate mobile must be exactly 10 digits';
    }

    if (budget && isNaN(Number(budget))) {
      errs.budget = 'Budget must be a valid number';
    } else if (budget && Number(budget) < 0) {
      errs.budget = 'Budget cannot be negative';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.Mui-error');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inputEl = firstErrorEl.querySelector('input, textarea, select');
          if (inputEl) inputEl.focus();
        }
      }, 100);
      return false;
    }

    return true;
  };

  const handleFieldChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleSubmit = async (e, override = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: values.name.trim(),
      mobile: values.mobile.trim(),
      sourceId: Number(values.sourceId),
      courseId: values.courseId ? Number(values.courseId) : null,
      statusId: values.statusId ? Number(values.statusId) : null,
      priority: values.priority,
      email: values.email.trim() || null,
      alternateMobile: values.alternateMobile.trim() || null,
      budget: values.budget.trim() ? parseFloat(values.budget) : null,
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      country: values.country.trim() || null,
      notes: values.notes.trim() || null,
      assignedToId: values.assignedToId ? Number(values.assignedToId) : null,
      companyId: targetCompanyId ? Number(targetCompanyId) : null,
      branchId: targetBranchId ? Number(targetBranchId) : null,
      pipelineId: values.pipelineId ? Number(values.pipelineId) : null,
      overrideDuplicate: override
    };

    updateLeadMutation.mutate(
      { id: lead.id, data: payload },
      {
        onSuccess: (res) => {
          if (onUpdated) onUpdated(res?.data?.lead || res?.lead || { ...lead, ...payload });
          setShowDuplicateDialog(false);
          setDuplicateWarning(null);
          onClose();
        },
        onError: (err) => {
          if (err?.code === 'DUPLICATE_LEAD_WARNING') {
            setDuplicateWarning(err.details);
            setShowDuplicateDialog(true);
          }
        }
      }
    );
  };

  const formData = formDataRes?.data || formDataRes || {};
  const sourcesOptions = (formData.sources || []).map((s) => ({ id: s.id, name: s.name }));
  const coursesOptions = (formData.courses || []).map((c) => ({ id: c.id, name: c.name }));
  const statusesOptions = (formData.statuses || []).map((s) => ({ id: s.id, name: s.name }));

  const usersOptions = assignableUsers.length > 0
    ? assignableUsers.map((u) => ({ id: u.id, name: `${u.name}${u.role ? ` (${u.role})` : ''}` }))
    : (formData.users || []).map((u) => ({ id: u.id, name: `${u.name} (${u.role || 'User'})` }));

  const priorityOptions = [
    { id: 'HIGH', name: 'High' },
    { id: 'MEDIUM', name: 'Medium' },
    { id: 'LOW', name: 'Low' }
  ];

  return (
    <Drawer
      isOpen={Boolean(lead)}
      onClose={() => !updateLeadMutation.isPending && onClose()}
      title="Edit Lead Details"
      subtitle={lead?.name ? `Modify details and assignees for ${lead.name}` : 'Modify lead details'}
      width={{ xs: '100%', sm: 540, md: 620 }}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full bg-white">

        {/* Scrollable Form Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">
          {/* Section 0: Scope Assignment (Super Admin & Company Admin Only) */}
          {(isSuperAdmin || isCompanyAdmin) && (
            <div className="space-y-3.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Territory Scope
              </span>

              {isSuperAdmin && (
                <SelectField
                  id="lead-company"
                  label="Company"
                  placeholder="Select Company..."
                  required
                  value={selectedCompanyId}
                  onChange={(val) => {
                    setSelectedCompanyId(val);
                    setSelectedBranchId('');
                    setSelectedPipelineId('');
                    handleFieldChange('companyId', val);
                    handleFieldChange('branchId', '');
                    handleFieldChange('pipelineId', '');
                    handleFieldChange('assignedToId', '');
                  }}
                  options={companiesOptions}
                  isLoading={isLoadingCompanies}
                  errorText={errors.companyId}
                  startIcon={Building}
                  searchable={true}
                />
              )}

              <SelectField
                id="lead-branch"
                label="Branch"
                placeholder="Select Branch..."
                required
                value={selectedBranchId}
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setSelectedPipelineId('');
                  handleFieldChange('branchId', val);
                  handleFieldChange('pipelineId', '');
                  handleFieldChange('assignedToId', '');
                }}
                options={branchesOptions}
                isLoading={isLoadingBranches}
                disabled={!targetCompanyId}
                errorText={errors.branchId}
                startIcon={Building}
                searchable={true}
              />
            </div>
          )}

          {/* Section 1: Contact Details */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
              Contact Details
            </span>
            
            <TextField
              id="lead-name"
              label="Lead Name"
              placeholder="e.g. Rahul Sharma"
              required
              value={values.name}
              onChange={(val) => handleFieldChange('name', val)}
              errorText={errors.name}
              startIcon={User}
            />

            <TextField
              id="lead-mobile"
              label="Mobile Number"
              placeholder="10-digit mobile number"
              required
              value={values.mobile}
              onChange={(val) => handleFieldChange('mobile', val)}
              errorText={errors.mobile}
              startIcon={Phone}
            />

            <TextField
              id="lead-email"
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={values.email}
              onChange={(val) => handleFieldChange('email', val)}
              errorText={errors.email}
              startIcon={Mail}
            />

            <TextField
              id="lead-alt-mobile"
              label="Alternate Contact"
              placeholder="10-digit alternate number"
              value={values.alternateMobile}
              onChange={(val) => handleFieldChange('alternateMobile', val)}
              errorText={errors.alternateMobile}
              startIcon={Phone}
            />
          </div>

          {/* Section 2: Engagement parameters */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
              Engagement & Routing
            </span>

            <SelectField
              id="lead-source"
              label="Lead Source"
              placeholder="Select Source..."
              required
              value={values.sourceId}
              onChange={(val) => handleFieldChange('sourceId', val)}
              options={sourcesOptions}
              errorText={errors.sourceId}
              startIcon={Compass}
              searchable={true}
              isLoading={isLoadingFormData}
              disabled={!targetCompanyId}
            />

            <SelectField
              id="lead-course"
              label="Interested Course/Product"
              placeholder="Select Course..."
              required
              value={values.courseId}
              onChange={(val) => handleFieldChange('courseId', val)}
              options={coursesOptions}
              errorText={errors.courseId}
              startIcon={Award}
              searchable={true}
              isLoading={isLoadingFormData}
              disabled={!targetCompanyId}
            />

            {(() => {
              const isConverted = (lead?.opportunities && lead.opportunities.length > 0) || lead?.isConverted;
              return (
                <div className="space-y-1">
                  <SelectField
                    id="lead-status"
                    label="Status"
                    placeholder="Select Status..."
                    allowEmptyOption={!isConverted}
                    value={isConverted ? 'CONVERTED' : values.statusId}
                    onChange={(val) => !isConverted && handleFieldChange('statusId', val)}
                    options={isConverted ? [{ value: 'CONVERTED', label: '⚡ CONVERTED (Locked to Opportunity)' }] : statusesOptions}
                    errorText={errors.statusId}
                    startIcon={Activity}
                    searchable={!isConverted}
                    isLoading={isLoadingFormData}
                    disabled={!targetCompanyId || isConverted}
                  />
                  {isConverted && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-md font-medium">
                      🔒 Lead is converted to an Opportunity deal. Status is locked to CONVERTED.
                    </p>
                  )}
                </div>
              );
            })()}

            <SelectField
              id="lead-priority"
              label="Priority"
              placeholder="Select Priority..."
              value={values.priority}
              onChange={(val) => handleFieldChange('priority', val)}
              options={priorityOptions}
              errorText={errors.priority}
              searchable={false}
            />

            <TextField
              id="lead-budget"
              label="Budget"
              placeholder="e.g. 50000"
              value={values.budget}
              onChange={(val) => handleFieldChange('budget', val)}
              errorText={errors.budget}
              startIcon={DollarSign}
            />

            <SelectField
              id="lead-pipeline"
              label="Kanban Board / Pipeline"
              placeholder="Select Pipeline (Optional)..."
              allowEmptyOption
              value={selectedPipelineId}
              onChange={(val) => {
                setSelectedPipelineId(val);
                handleFieldChange('pipelineId', val);
              }}
              options={pipelinesOptions}
              isLoading={isLoadingPipelines}
              disabled={!targetCompanyId}
              startIcon={GitMerge}
              searchable={true}
            />

            <SelectField
              id="lead-assignee"
              label="Assign To"
              placeholder="Select Representative..."
              allowEmptyOption
              value={values.assignedToId}
              onChange={(val) => handleFieldChange('assignedToId', val)}
              options={usersOptions}
              errorText={errors.assignedToId}
              startIcon={UserCheck}
              searchable={true}
              isLoading={isLoadingFormData}
              disabled={!targetCompanyId || !targetBranchId}
            />
          </div>

          {/* Section 3: Geographic info */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
              Location Info
            </span>

            <div className="grid grid-cols-3 gap-3">
              <TextField
                id="lead-city"
                label="City"
                placeholder="Delhi"
                value={values.city}
                onChange={(val) => handleFieldChange('city', val)}
                startIcon={MapPin}
              />
              <TextField
                id="lead-state"
                label="State"
                placeholder="Delhi"
                value={values.state}
                onChange={(val) => handleFieldChange('state', val)}
                startIcon={MapPin}
              />
              <TextField
                id="lead-country"
                label="Country"
                placeholder="India"
                value={values.country}
                onChange={(val) => handleFieldChange('country', val)}
                startIcon={MapPin}
              />
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
              Remarks / Notes
            </span>

            <TextField
              id="lead-notes"
              label="Notes"
              placeholder="Enter notes or updates summary..."
              multiline
              rows={4}
              value={values.notes}
              onChange={(val) => handleFieldChange('notes', val)}
              startIcon={FileText}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <Button
            variant="text"
            onClick={onClose}
            disabled={updateLeadMutation.isPending}
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '13px',
              '&:hover': { bgcolor: 'transparent', color: '#0F172A' }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<Pencil size={15} />}
            isLoading={updateLeadMutation.isPending}
            disabled={isError}
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Duplicate Alert Overlay Dialog */}
      {showDuplicateDialog && duplicateWarning && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <Compass className="w-6 h-6 stroke-[2]" />
                <h3 className="font-bold text-lg text-slate-900 font-display">Duplicate Record Found</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                A lead with this contact information already exists in your company registry:
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Lead Name:</span><span className="text-slate-700 font-semibold">{duplicateWarning.existingLead?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Current Owner:</span><span className="text-slate-700 font-semibold">{duplicateWarning.existingLead?.owner}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Lead Status:</span><span className="text-slate-700 font-semibold">{duplicateWarning.existingLead?.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Duplicate Field:</span><span className="text-amber-700 font-semibold uppercase tracking-wider text-[10px]">{duplicateWarning.duplicateField}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateDialog(false);
                    setDuplicateWarning(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>

                {currentUser?.primaryRoleRank >= 60 ? (
                  <button
                    type="button"
                    onClick={() => handleSubmit(null, true)}
                    disabled={updateLeadMutation.isPending}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {updateLeadMutation.isPending ? 'Saving...' : 'Override & Save'}
                  </button>
                ) : (
                  <div className="text-[11px] text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100/50">
                    You do not have permission to override duplicates. Please contact your manager.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default LeadEditModal;
