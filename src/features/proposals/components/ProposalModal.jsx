import React, { useState, useEffect } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import { apiClient } from '../../../lib/api/api';
import {
  Building,
  Award,
  DollarSign,
  Tag,
  Percent,
  Calendar,
  FileText,
  Edit3,
  FileCheck,
  Receipt,
  Layers
} from 'lucide-react';

export default function ProposalModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  opportunityId = null,
}) {
  const [opportunities, setOpportunities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOppId, setSelectedOppId] = useState(opportunityId || '');
  const [productId, setProductId] = useState('');
  const [basePrice, setBasePrice] = useState('');

  // Discount states
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState('0');

  const [validTill, setValidTill] = useState('');
  const [terms, setTerms] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [error, setError] = useState('');

  // Auto-calculated discount amount & final amount
  const numericBase = Number(basePrice) || 0;
  const numericDiscountVal = Number(discountValue) || 0;

  const discountAmount = discountType === 'percent'
    ? (numericBase * numericDiscountVal) / 100
    : numericDiscountVal;

  const finalAmount = Math.max(0, numericBase - discountAmount);

  // Load Opportunities & Courses on mount
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        apiClient('/opportunities?status=OPEN').then(res => res.data || res || []),
        apiClient('/courses?status=ACTIVE').then(res => res.data?.courses || res.courses || res.data || res || [])
      ])
        .then(([opps, crs]) => {
          setOpportunities(opps);
          setCourses(crs);

          // Pre-fill product and price from linked opportunity if creating a new proposal
          if (!initialData && opportunityId) {
            const opp = opps.find(o => o.id === Number(opportunityId));
            if (opp) {
              if (opp.productId) setProductId(opp.productId.toString());
              if (opp.expectedRevenue) {
                setBasePrice(Number(opp.expectedRevenue).toString());
              }
            }
          }
        })
        .catch(err => console.error('Failed to load form options:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, opportunityId, initialData]);

  // Set initial data for edits/revisions
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedOppId(initialData.opportunityId || '');
        setProductId(initialData.productId || '');

        // Convert decimal values safely to plain numeric strings
        const bp = initialData.basePrice ? Number(initialData.basePrice).toString() : '';
        const ds = initialData.discount ? Number(initialData.discount).toString() : '0';

        setBasePrice(bp);
        setDiscountType('flat'); // Default to flat representation
        setDiscountValue(ds);
        setTerms(initialData.terms || '');
        setVersionNotes('');
        setError('');
        if (initialData.validTill) {
          setValidTill(new Date(initialData.validTill).toISOString().split('T')[0]);
        }
      } else {
        setSelectedOppId(opportunityId || '');
        setProductId('');
        setBasePrice('');
        setDiscountType('flat');
        setDiscountValue('0');
        setValidTill('');
        setTerms('');
        setVersionNotes('');
        setError('');
      }
    }
  }, [isOpen, initialData, opportunityId]);

  // Auto-fill course price when course changes
  const handleCourseChange = (cid) => {
    setProductId(cid);
    if (!cid) return;
    const selectedCourse = courses.find(c => c.id === Number(cid));
    if (selectedCourse && (selectedCourse.price || selectedCourse.price === 0)) {
      setBasePrice(Number(selectedCourse.price).toString());
    }
  };

  const handleOppChange = (oppIdVal) => {
    setSelectedOppId(oppIdVal);
    const opp = opportunities.find(o => o.id === Number(oppIdVal));
    if (opp) {
      if (opp.productId) setProductId(opp.productId.toString());
      if (opp.expectedRevenue) {
        setBasePrice(Number(opp.expectedRevenue).toString());
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedOppId) {
      setError('Please select an opportunity');
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      setError('Base price must be greater than zero');
      return;
    }
    if (numericDiscountVal < 0) {
      setError('Discount value cannot be negative');
      return;
    }
    if (discountType === 'percent' && numericDiscountVal > 100) {
      setError('Discount percentage cannot exceed 100%');
      return;
    }
    if (discountType === 'flat' && numericDiscountVal > numericBase) {
      setError('Discount amount cannot exceed base price');
      return;
    }
    if (!validTill) {
      setError('Validity date is required');
      return;
    }

    const payload = {
      opportunityId: Number(selectedOppId),
      productId: productId ? Number(productId) : null,
      basePrice: Number(basePrice),
      discount: Number(discountAmount.toFixed(2)), // Always submit calculated flat discount to DB
      validTill: new Date(validTill).toISOString(),
      terms,
      versionNotes: initialData ? versionNotes || `Revised version` : undefined
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      // Caught to reset loading state (error toast is handled by parent page)
    } finally {
      setIsSubmitting(false);
    }
  };

  const oppsOptions = opportunities.map(opp => ({
    id: opp.id.toString(),
    name: `${opp.opportunityName} (${opp.lead?.name || 'No Lead'})`
  }));

  const courseOptions = courses.map(course => ({
    id: course.id.toString(),
    name: `${course.name} - ₹${Number(course.price).toLocaleString()}`
  }));

  const discountTypeOptions = [
    { id: 'flat', name: 'Flat Amount (₹)' },
    { id: 'percent', name: 'Percentage (%)' }
  ];

  const getCustomFooter = () => {
    return (
      <div className="flex w-full items-center justify-end gap-2">
        <Button
          variant="text"
          onClick={onClose}
          disabled={isSubmitting}
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
          variant="contained"
          color="primary"
          type="submit"
          form="proposal-form"
          isLoading={isSubmitting}
          startIcon={<FileCheck size={15} />}
        >
          {initialData ? 'Save Revision' : 'Create Proposal'}
        </Button>
      </div>
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Revise Proposal (Current V${initialData.currentVersion})` : 'Generate Proposal'}
      subtitle={initialData ? 'Update commercial parameters and create a new version revision.' : 'Generate a premium commercial proposal for your prospect.'}
      icon={Receipt}
      showFooter={true}
      customFooter={getCustomFooter()}
      width={{ xs: '100%', sm: 480, md: 540 }}
    >
      <form id="proposal-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-100 flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Section 1: Scope */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
            Engagement Scope
          </h3>

          {opportunityId || initialData ? (
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3">
              <Building className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked Opportunity</span>
                <span className="text-sm font-semibold text-slate-700">
                  {opportunities.find(o => o.id === Number(selectedOppId))?.opportunityName || 'Active Opportunity'}
                </span>
              </div>
            </div>
          ) : (
            <SelectField
              id="proposal-opp"
              label="Linked Opportunity"
              placeholder="Select Opportunity..."
              required
              value={selectedOppId}
              onChange={handleOppChange}
              options={oppsOptions}
              isLoading={loading}
              startIcon={Building}
              searchable={true}
            />
          )}

          <SelectField
            id="proposal-product"
            label="Product / Course"
            placeholder="Select Product (Optional)..."
            allowEmptyOption
            value={productId}
            onChange={handleCourseChange}
            options={courseOptions}
            isLoading={loading}
            startIcon={Award}
            searchable={true}
          />
        </div>

        {/* Section 2: Pricing Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
            Pricing Details
          </h3>

          <TextField
            id="proposal-base-price"
            label="Base Price (₹) *"
            type="number"
            value={basePrice}
            onChange={(val) => {
              if (val !== '' && Number(val) < 0) return;
              setBasePrice(val);
            }}
            placeholder="e.g. 50000"
            required
            startIcon={DollarSign}
            inputProps={{ min: 0 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              id="proposal-discount-type"
              label="Discount Type"
              placeholder="Select Type..."
              value={discountType}
              onChange={(val) => {
                setDiscountType(val);
                setDiscountValue('0');
              }}
              options={discountTypeOptions}
              startIcon={Layers}
            />

            <TextField
              id="proposal-discount-value"
              label={discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
              type="number"
              value={discountValue}
              onChange={(val) => {
                if (val !== '' && Number(val) < 0) return;
                setDiscountValue(val);
              }}
              placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 5000'}
              startIcon={discountType === 'percent' ? Percent : Tag}
              inputProps={{ min: 0 }}
            />
          </div>

          {discountType === 'percent' && numericDiscountVal > 0 && (
            <div className="text-xs text-slate-500 italic pl-1 flex items-center gap-1.5">
              <Tag size={12} className="text-slate-400" />
              Equivalent flat discount: ₹{discountAmount.toLocaleString()}
            </div>
          )}

          {/* Calculated Pricing Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Base Price:</span>
              <span className="font-semibold text-slate-700">₹{numericBase.toLocaleString()}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Applied Discount:</span>
                <span className="font-semibold text-rose-600">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="border-t border-slate-200/80 my-2 pt-2.5 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">Calculated Final Amount:</span>
              <span className="text-xl font-black text-slate-900 font-display">₹{finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Validity & Conditions */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-4">
            Validity & Conditions
          </h3>

          <TextField
            id="proposal-validity"
            label="Valid Till *"
            type="date"
            value={validTill}
            onChange={(val) => setValidTill(val)}
            required
            startIcon={Calendar}
          />

          <TextField
            id="proposal-terms"
            label="Terms & Conditions"
            placeholder="Enter proposal terms and payment conditions..."
            multiline
            rows={3}
            value={terms}
            onChange={(val) => setTerms(val)}
            startIcon={FileText}
          />

          {initialData && (
            <TextField
              id="proposal-version-notes"
              label="Version Revision Notes"
              placeholder="Describe what changed in this version..."
              multiline
              rows={2}
              value={versionNotes}
              onChange={(val) => setVersionNotes(val)}
              startIcon={Edit3}
            />
          )}
        </div>
      </form>
    </Drawer>
  );
}

