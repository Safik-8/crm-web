import React from 'react';
import { Target } from 'lucide-react';
import { DynamicFormSlideover } from '../../../shared/components/elements/DynamicFormSlideover';
import { useAuth } from '../../../app/providers/AuthProvider';

export const CreateOpportunitySlideover = ({
  isOpen,
  onClose,
  initialValues = {},
  onSubmit,
  isLoading = false,
  stages = [],
  courses = [],
  leads = [],
}) => {
  const { user } = useAuth();
  const isManagerOrAdmin = (user?.rank && user.rank >= 60) || ['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'].includes(user?.role);

  // Deduplicate and format course options cleanly
  const courseOptions = React.useMemo(() => {
    const seenNames = new Set();
    const result = [];
    courses.forEach((c) => {
      if (!c.id) return;
      const rawName = (c.name || '').trim();
      const categoryLabel = c.category?.name ? ` (${c.category.name})` : '';
      const label = `${rawName}${categoryLabel}`;
      
      // Avoid raw duplicate name entries (e.g. duplicate "Other")
      const uniqueKey = `${rawName.toLowerCase()}_${c.category?.id || ''}`;
      if (!seenNames.has(uniqueKey)) {
        seenNames.add(uniqueKey);
        result.push({ value: c.id, label, rawName: rawName.toLowerCase() });
      }
    });
    return result;
  }, [courses]);

  // Compute prefilled initialValues when a lead is passed via initialValues prop
  const computedInitialValues = React.useMemo(() => {
    const base = { ...initialValues };
    if (base.leadId) {
      const selectedLead = leads.find((l) => Number(l.id) === Number(base.leadId));
      if (selectedLead) {
        if (!base.opportunityName && selectedLead.name) {
          base.opportunityName = `${selectedLead.name} Deal`;
        }
        if (!base.expectedRevenue && selectedLead.budget) {
          base.expectedRevenue = Number(selectedLead.budget);
        }
        if (!base.productId) {
          if (selectedLead.courseId) {
            base.productId = Number(selectedLead.courseId);
          } else if (selectedLead.course?.id) {
            base.productId = Number(selectedLead.course.id);
          } else if (selectedLead.interestedFor || selectedLead.courseName) {
            const leadCourseStr = (selectedLead.interestedFor || selectedLead.courseName || '').trim().toLowerCase();
            const matched = courseOptions.find((opt) => opt.rawName === leadCourseStr);
            if (matched) {
              base.productId = Number(matched.value);
            }
          }
        }
        if (!base.stageId && stages.length > 0) {
          if (selectedLead.stageId && stages.some((s) => Number(s.id) === Number(selectedLead.stageId))) {
            base.stageId = Number(selectedLead.stageId);
          } else {
            base.stageId = Number(stages[0].id);
          }
        }
      }
    }
    return base;
  }, [initialValues, leads, stages, courseOptions]);

  const handleLeadChange = (selectedLeadId, onChangeCallback) => {
    onChangeCallback('leadId', selectedLeadId);
    const selectedLead = leads.find((l) => Number(l.id) === Number(selectedLeadId));
    if (selectedLead) {
      if (selectedLead.name) {
        onChangeCallback('opportunityName', `${selectedLead.name} Deal`);
      }
      if (selectedLead.budget) {
        onChangeCallback('expectedRevenue', Number(selectedLead.budget));
      }
      // Resilient Custom Course Matching
      if (selectedLead.courseId) {
        onChangeCallback('productId', Number(selectedLead.courseId));
      } else if (selectedLead.course?.id) {
        onChangeCallback('productId', Number(selectedLead.course.id));
      } else if (selectedLead.interestedFor || selectedLead.courseName) {
        const leadCourseStr = (selectedLead.interestedFor || selectedLead.courseName || '').trim().toLowerCase();
        const matched = courseOptions.find((opt) => opt.rawName === leadCourseStr);
        if (matched) {
          onChangeCallback('productId', Number(matched.value));
        }
      }

      // Stage Pre-Selection
      if (selectedLead.stageId && stages.some((s) => Number(s.id) === Number(selectedLead.stageId))) {
        onChangeCallback('stageId', Number(selectedLead.stageId));
      } else if (stages && stages.length > 0) {
        onChangeCallback('stageId', Number(stages[0].id));
      }
    }
  };

  const isLeadFixed = Boolean(initialValues?.leadId);

  // Filter leads: Must be QUALIFIED, not CONVERTED, without an active OPEN opportunity, and in user's company
  const qualifiedLeads = React.useMemo(() => {
    const list = leads.filter((l) => {
      // Multi-Tenant Safety Check: Must belong to current logged in company
      if (user?.companyId && l.companyId && Number(l.companyId) !== Number(user.companyId)) {
        return false;
      }

      // If a lead is pre-selected, always include it
      if (initialValues?.leadId && Number(l.id) === Number(initialValues.leadId)) return true;

      // Must be QUALIFIED (status === 'QUALIFIED' or isQualified flag)
      const isQualified = l.qualification?.status === 'QUALIFIED' || l.isQualified === true;
      if (!isQualified) return false;

      // Must not already be converted
      if (l.status?.code === 'CONVERTED' || l.status?.name === 'CONVERTED' || l.isConverted) return false;

      // Must not already have an OPEN opportunity
      const hasOpenOpp = Array.isArray(l.opportunities) && l.opportunities.some((o) => o.status === 'OPEN');
      if (hasOpenOpp) return false;

      return true;
    });

    // Fallback item if preselected lead is not present in fetched list yet
    if (initialValues?.leadId && !list.some((l) => Number(l.id) === Number(initialValues.leadId))) {
      list.unshift({
        id: Number(initialValues.leadId),
        name: computedInitialValues.opportunityName?.replace(' Deal', '') || `Lead #${initialValues.leadId}`,
        qualification: { score: 100 },
      });
    }

    return list;
  }, [leads, initialValues?.leadId, computedInitialValues.opportunityName]);

  // Field configuration: Select Lead at the very top (1st field), followed by auto-filled deal fields
  const fields = [
    {
      key: 'leadId',
      name: 'leadId',
      label: 'Select Lead (Qualified Only)',
      type: 'searchable-select',
      required: true,
      disabled: isLeadFixed,
      placeholder: qualifiedLeads.length > 0 
        ? 'Search qualified lead by Name, Mobile, or ID...' 
        : 'No qualified leads available (Qualify a lead first in Lead Management)',
      options: qualifiedLeads.map((l) => ({
        value: l.id,
        label: `[#${l.id}] ${l.name || 'Unnamed Lead'}${l.mobile ? ` - ${l.mobile}` : ''} (Qualified • Score: ${l.qualification?.score ?? 0}%)`,
      })),
      onCustomChange: handleLeadChange,
    },
    {
      key: 'opportunityName',
      name: 'opportunityName',
      label: 'Opportunity Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Acme Corp Enterprise Deal (Auto-fills on Lead selection)',
    },
    {
      key: 'expectedRevenue',
      name: 'expectedRevenue',
      label: 'Expected Revenue (₹)',
      type: 'number',
      required: true,
      placeholder: 'e.g. 50000 (Auto-fills from Lead budget)',
    },
    {
      key: 'productId',
      name: 'productId',
      label: 'Course / Product',
      type: 'select',
      placeholder: 'Select Course / Product (Auto-fills if specified on Lead)',
      options: courseOptions,
    },
    {
      key: 'stageId',
      name: 'stageId',
      label: 'Pipeline Stage',
      type: 'select',
      required: false,
      placeholder: 'Select Stage (Defaults to Qualification)',
      options: stages.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      key: 'closingDate',
      name: 'closingDate',
      label: 'Target Closing Date',
      type: 'date',
      required: true,
    },
    {
      key: 'probabilityPercentage',
      name: 'probabilityPercentage',
      label: 'Probability % (0-100)',
      type: 'number',
      placeholder: 'Leave blank for stage default',
    },
    {
      key: 'notes',
      name: 'notes',
      label: 'Internal Notes',
      type: 'textarea',
      placeholder: 'Add any specific deal requirements or notes...',
    },
  ];

  // Client-side form validation for inline field error highlights
  const validateForm = (formData) => {
    const errs = {};
    if (!formData.leadId) {
      errs.leadId = 'Select Lead is required.';
    }
    if (!formData.opportunityName || !String(formData.opportunityName).trim()) {
      errs.opportunityName = 'Opportunity Name is required.';
    } else if (String(formData.opportunityName).trim().length < 3) {
      errs.opportunityName = 'Opportunity Name must be at least 3 characters.';
    }
    const rev = formData.expectedRevenue;
    if (rev === undefined || rev === null || rev === '') {
      errs.expectedRevenue = 'Expected Revenue is required.';
    } else if (Number(rev) <= 0 || isNaN(Number(rev))) {
      errs.expectedRevenue = 'Expected revenue must be greater than 0.';
    }
    if (!formData.closingDate) {
      errs.closingDate = 'Target Closing Date is required.';
    }
    if (
      formData.probabilityPercentage !== undefined &&
      formData.probabilityPercentage !== null &&
      formData.probabilityPercentage !== ''
    ) {
      const prob = Number(formData.probabilityPercentage);
      if (isNaN(prob) || prob < 0 || prob > 100) {
        errs.probabilityPercentage = 'Probability must be between 0 and 100%.';
      }
    }
    return errs;
  };

  const handleSubmit = (formData) => {
    const payload = {
      ...formData,
      leadId: Number(formData.leadId),
      stageId: formData.stageId ? Number(formData.stageId) : (stages[0]?.id || 1),
      expectedRevenue: Number(formData.expectedRevenue),
      probabilityPercentage: formData.probabilityPercentage
        ? Number(formData.probabilityPercentage)
        : undefined,
      productId: formData.productId ? Number(formData.productId) : null,
    };
    return onSubmit(payload);
  };

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Opportunity"
      subtitle="Track potential sales deals for qualified leads"
      icon={Target}
      fields={fields}
      initialValues={computedInitialValues}
      validate={validateForm}
      onSubmit={handleSubmit}
      submitText="Create Opportunity"
      isLoading={isLoading}
    />
  );
};
