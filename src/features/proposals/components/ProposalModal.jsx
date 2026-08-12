import React, { useState, useEffect } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import { apiClient } from '../../../lib/api/api';

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
        })
        .catch(err => console.error('Failed to load form options:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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
  const handleCourseChange = (e) => {
    const cid = e.target.value;
    setProductId(cid);
    const selectedCourse = courses.find(c => c.id === Number(cid));
    if (selectedCourse && selectedCourse.price) {
      setBasePrice(Number(selectedCourse.price).toString());
    }
  };

  const handleOppChange = (e) => {
    const oppIdVal = e.target.value;
    setSelectedOppId(oppIdVal);
    const opp = opportunities.find(o => o.id === Number(oppIdVal));
    if (opp) {
      if (opp.productId) setProductId(opp.productId.toString());
      if (opp.expectedRevenue) {
        setBasePrice(Number(opp.expectedRevenue).toString());
      }
    }
  };

  const handleSubmit = (e) => {
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

    onSubmit(payload);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Revise Proposal (Current V${initialData.currentVersion})` : 'Generate Proposal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-20">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {opportunityId || initialData ? (
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Linked Opportunity
            </label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-700">
              {opportunities.find(o => o.id === Number(selectedOppId))?.opportunityName || 'Active Opportunity'}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Linked Opportunity *
            </label>
            <select
              value={selectedOppId}
              onChange={handleOppChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            >
              <option value="">-- Select Opportunity --</option>
              {opportunities.map(opp => (
                <option key={opp.id} value={opp.id}>
                  {opp.opportunityName} ({opp.lead?.name || 'No Lead'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Product / Course
          </label>
          <select
            value={productId}
            onChange={handleCourseChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">-- Select Product (Optional) --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} - ₹{course.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <TextField
            label="Base Price (₹) *"
            type="number"
            value={basePrice}
            onChange={(val) => {
              if (val !== '' && Number(val) < 0) return;
              setBasePrice(val);
            }}
            placeholder="e.g. 50000"
            required
            inputProps={{ min: 0 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                setDiscountValue('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="flat">Flat Amount (₹)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </div>

          <TextField
            label={discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
            type="number"
            value={discountValue}
            onChange={(val) => {
              if (val !== '' && Number(val) < 0) return;
              setDiscountValue(val);
            }}
            placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 5000'}
            inputProps={{ min: 0 }}
          />
        </div>

        {discountType === 'percent' && numericDiscountVal > 0 && (
          <div className="text-xs text-slate-500 italic">
            Equivalent flat discount: ₹{discountAmount.toLocaleString()}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600">Calculated Final Amount:</span>
          <span className="text-lg font-bold text-slate-900">₹{finalAmount.toLocaleString()}</span>
        </div>

        <TextField
          label="Valid Till *"
          type="date"
          value={validTill}
          onChange={(val) => setValidTill(val)}
          required
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Enter proposal terms and payment conditions..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {initialData && (
          <TextField
            label="Version Revision Notes"
            value={versionNotes}
            onChange={(val) => setVersionNotes(val)}
            placeholder="Describe what changed in this version..."
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outlined" color="primary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit" loading={loading}>
            {initialData ? 'Save Revision' : 'Create Proposal'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
