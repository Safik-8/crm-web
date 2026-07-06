// src/features/company/components/CompanyForm.jsx

import React, { useState, useEffect } from 'react';
import { Save, Building, User, Briefcase, Pencil, ExternalLink, Globe, MapPin, Tag, Shield, Activity, CheckCircle2, Mail, Server, Lock } from 'lucide-react';
import { useCreateCompany, useUpdateCompany } from '../hooks/useCompanies';
import { toast, enhancedToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../app/providers/AuthProvider';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import DynamicFormFields from '../../../shared/components/elements/DynamicFormFields';
import TextField from '../../../shared/components/elements/TextField';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * CompanyForm Component
 * Slide-over drawer form to onboard/edit companies.
 * Renders as a full-page settings dashboard in inlineMode.
 * 
 * Styled completely using Tailwind CSS for clean layout structure and visual consistency.
 */
const CompanyForm = ({ isOpen, onClose, company, onSuccess, inlineMode = false }) => {
  const isEdit = !!company;
  const { user, hasPermission } = useAuth();
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();

  // State to control edit drawer visibility when in inline mode
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const initialValues = {
    name: company?.name || '',
    code: company?.code || '',
    logo: company?.logo || '',
    industry: company?.industry || '',
    website: company?.website || '',
    address: company?.address || '',
    status: company?.status || 'ACTIVE',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  };

  useEffect(() => {
    if (inlineMode || isOpen) {
      setValues(initialValues);
      setErrors({});
      setBusy(false);
      setIsDrawerOpen(false);
    }
  }, [isOpen, inlineMode, company]);

  const handleFieldChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleEditClick = () => {
    setIsDrawerOpen(true);
  };

  const handleFormValidate = () => {
    let errs = {};
    fields.forEach((field) => {
      const val = values[field.key];
      if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
        errs[field.key] = `${field.label} is required.`;
      }
      if (field.validate && val) {
        const fieldErr = field.validate(val);
        if (fieldErr) errs[field.key] = fieldErr;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (formValues) => {
    const loadingToastId = enhancedToast.saveProgress('Company');
    try {
      if (isEdit) {
        // Edit company details (code and admin details are locked)
        await updateCompanyMutation.mutateAsync({
          id: company.id,
          data: {
            name: formValues.name,
            logo: formValues.logo,
            industry: formValues.industry,
            website: formValues.website,
            address: formValues.address,
            status: formValues.status
          }
        });
      } else {
        // Create new company and assign primary company admin
        await createCompanyMutation.mutateAsync({
          name: formValues.name,
          code: formValues.code,
          logo: formValues.logo,
          industry: formValues.industry,
          website: formValues.website,
          address: formValues.address,
          status: formValues.status,
          adminName: formValues.adminName,
          adminEmail: formValues.adminEmail,
          adminPassword: formValues.adminPassword
        });
      }

      toast.dismiss(loadingToastId);
      enhancedToast.operationSuccess(
        isEdit ? 'Updated' : 'Created',
        'Company'
      );
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.dismiss(loadingToastId);

      if (error && (error.statusCode === 409 || error.status === 409)) {
        const errorDetail = error.details?.field || 'code';
        if (errorDetail === 'email') {
          toast.error('Email Already Registered', {
            description: 'The primary company admin email is already in use.',
          });
          throw { adminEmail: 'A user with this email address already exists.' };
        } else {
          toast.error('Code Already Exists', {
            description: 'The company entity code is already in use.',
          });
          throw { code: 'This company entity code is already registered.' };
        }
      } else {
        enhancedToast.operationError(
          isEdit ? 'update' : 'create',
          'company',
          error?.message
        );
        throw error;
      }
    }
  };

  const validateEntityCode = (val) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
      return 'Code can only contain letters, numbers, hyphens, and underscores.';
    }
    return null;
  };

  const fields = [
    // ═════ SECTION 1: BASIC DETAILS ═════
    {
      key: 'basic_header',
      render: () => (
        <div className="mb-4">
          <h4 className="font-heading font-black text-slate-500 text-[11px] tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building size={14} className="stroke-[2.5]" /> Basic Details
          </h4>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter company name...',
      required: true
    },
    {
      key: 'code',
      label: 'Unique Entity Code',
      required: !isEdit,
      disabled: isEdit,
      render: (value, onChange, formValues, errorText) => (
        <TextField
          id="company-code"
          label="Unique Entity Code"
          disabled={isEdit}
          value={value || ''}
          onChange={(val) => onChange('code', val.toUpperCase())}
          placeholder="e.g. LIFORA"
          errorText={errorText}
          required={!isEdit}
          helperText={!isEdit ? "System-wide unique database identifier. Cannot be changed later." : undefined}
          inputSx={{
            '& .MuiInputBase-input': {
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }
          }}
        />
      ),
      validate: validateEntityCode
    },
    {
      key: 'logo',
      label: 'Logo Image',
      render: (value, onChange, formValues, errorText) => {
        const handleFileChange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, JPEG, and PNG images are allowed.');
            return;
          }

          if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be under 2MB.');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            onChange('logo', reader.result);
          };
          reader.readAsDataURL(file);
        };

        const handleRemove = () => {
          onChange('logo', '');
        };

        return (
          <div className="flex flex-col gap-1.5 w-full mb-1">
            <span className="block text-slate-500 font-bold text-xs ml-0.5">
              Company Logo
            </span>
            
            <div className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              {value ? (
                <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                  <img
                    src={value}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-[72px] h-[72px] rounded-[18px] border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white flex-shrink-0">
                  <Building size={24} />
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                    id="logo-file-input"
                    className="hidden"
                  />
                  <label htmlFor="logo-file-input">
                    <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 bg-white font-bold text-[12px] py-2 px-4 shadow-sm hover:border-primary hover:text-primary hover:bg-orange-50/40 cursor-pointer select-none transition-all">
                      {value ? 'Change Logo' : 'Upload Logo'}
                    </span>
                  </label>
                  
                  {value && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="inline-flex items-center justify-center rounded-lg text-[12px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 py-2 px-4 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-slate-400 text-[10.5px] font-medium block mt-0.5">
                  PNG, JPG or JPEG. Max size 2MB.
                </span>
              </div>
            </div>
          </div>
        );
      }
    },

    // ═════ SECTION 2: BUSINESS DETAILS ═════
    {
      key: 'business_header',
      render: () => (
        <div className="mb-4 mt-6">
          <h4 className="font-heading font-black text-slate-500 text-[11px] tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
            <Briefcase size={14} className="stroke-[2.5]" /> Business Details
          </h4>
        </div>
      )
    },
    {
      key: 'industry',
      label: 'Industry Sector',
      type: 'text',
      placeholder: 'e.g. Education, Tech, Finance...',
      required: false
    },
    {
      key: 'website',
      label: 'Corporate Website',
      type: 'text',
      placeholder: 'e.g. https://stackdot.co',
      required: false
    },
    {
      key: 'address',
      label: 'HQ Street Address',
      type: 'text',
      placeholder: 'Enter physical headquarters address...',
      required: false
    },

    // ═════ SECTION 3: COMPANY ADMIN (ONLY SHOWN FOR CREATE) ═════
    ...(!isEdit ? [
      {
        key: 'admin_header',
        render: () => (
          <div className="mb-4 mt-6">
            <h4 className="font-heading font-black text-slate-500 text-[11px] tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <User size={14} className="stroke-[2.5]" /> Primary Company Admin
            </h4>
          </div>
        )
      },
      {
        key: 'adminName',
        label: 'Admin Full Name',
        type: 'text',
        placeholder: 'Enter admin first and last name...',
        required: true
      },
      {
        key: 'adminEmail',
        label: 'Admin Email Address',
        type: 'text',
        placeholder: 'admin@company.com',
        required: true
      },
      {
        key: 'adminPassword',
        label: 'Admin Password',
        type: 'password',
        placeholder: 'Minimum 6 characters...',
        required: true
      }
    ] : [])
  ];

  // ─── PROFILE SKELETON LOADER ───────────────────────────────────────────────
  const ProfileSkeleton = () => (
    <div className="flex flex-col gap-5 w-full px-0 lg:px-1">
      <div className="bg-white rounded-3xl border border-slate-200/60 w-full shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 py-5 px-6 md:py-6 md:px-8 border-b border-slate-100">
          <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="py-4 md:py-5 px-6 md:px-8 bg-slate-50/50 border-t border-slate-100">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );

  if (inlineMode && (!company || !company.name)) {
    return <ProfileSkeleton />;
  }

  // ─── READ-ONLY VIEW MODE ────────────────────────────────────────────────────
  if (inlineMode) {
    return (
      <div className="flex flex-col gap-5 w-full px-0 lg:px-1">
        
        {/* Main profile card, spanning full height and width */}
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden w-full shadow-sm">
          
          {/* Header Card Area with decorative gradient background element */}
          <div 
            className="py-5 px-6 md:py-6 md:px-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 65%, rgba(248, 111, 3, 0.05) 100%)'
            }}
          >
            {/* Background design accents */}
            <div 
              className="absolute right-0 top-0 w-[180px] h-full pointer-events-none opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(248, 111, 3, 0.1) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-center gap-6">
              {/* Logo squircle exactly matching reference styling */}
              {company.logo ? (
                <div className="w-[88px] h-[88px] rounded-[22px] overflow-hidden border border-slate-200/80 shadow-md shadow-slate-100 flex-shrink-0">
                  <img src={company.logo} alt="Company avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-[88px] h-[88px] rounded-[22px] flex items-center justify-center bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
                  <Building size={36} />
                </div>
              )}

              <div>
                <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl tracking-tight leading-none">
                  {company.name}
                </h2>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200/80 uppercase tracking-wider">
                    # {company.code}
                  </span>
                  
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black bg-[#ECFDF5] text-[#047857] border border-[#D1FAE5] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#10B981] animate-pulse" />
                    {company.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Only: Industry and Website horizontal metadata block */}
            <div className="hidden lg:flex items-center gap-12 xl:gap-16 mx-auto">
              {/* Industry Segment */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-100/50 shrink-0">
                  <Tag size={15} className="stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 font-bold uppercase text-[9.5px] tracking-wider leading-none">
                    Industry Sector
                  </span>
                  <span className="text-slate-800 font-extrabold text-[13.5px] mt-1 leading-none">
                    {company.industry || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Website Segment */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-100/50 shrink-0">
                  <Globe size={15} className="stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 font-bold uppercase text-[9.5px] tracking-wider leading-none">
                    Corporate Website
                  </span>
                  {company.website ? (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-[#E06202] text-[13.5px] font-extrabold hover:underline inline-flex items-center gap-1 mt-1 leading-none"
                    >
                      {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                      <ExternalLink size={11} className="stroke-[2.5]" />
                    </a>
                  ) : (
                    <span className="text-slate-500 font-medium italic text-[13.5px] mt-1 leading-none">
                      Not Specified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {hasPermission('COMPANY', 'canCreate') && (
              <button
                onClick={handleEditClick}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-sm py-2.5 px-5 z-10 shadow-sm shadow-slate-100 transition-all hover:border-primary hover:text-primary hover:bg-orange-50/40 hover:shadow-md hover:shadow-orange-100/30 shrink-0"
              >
                <Pencil size={14} className="stroke-[2.5]" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Headquarters Address integrated directly below header to save vertical space */}
          <div className="py-4 md:py-5 px-6 md:px-8 flex items-center gap-4 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
              <MapPin size={18} className="stroke-[2.5]" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 min-w-[140px]">
                Headquarters Address
              </span>
              <span className="text-slate-800 font-extrabold text-[13.5px] leading-relaxed">
                {company.address || 'Not Specified'}
              </span>
            </div>
          </div>

          {/* Mobile/Tablet Only: INDUSTRY & WEBSITE stacked layouts */}
          <div className="lg:hidden p-5 flex flex-col gap-4 bg-slate-50/20 border-t border-slate-100">
            {/* Mobile/Tablet Industry */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
                <Tag size={16} />
              </div>
              <div className="flex-1 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Industry</span>
                <span className="text-slate-800 font-extrabold">{company.industry || 'Not Specified'}</span>
              </div>
            </div>

            {/* Mobile/Tablet Website */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
                <Globe size={16} />
              </div>
              <div className="flex-1 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Website</span>
                {company.website ? (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-[#E06202] font-extrabold hover:underline inline-flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink size={12} className="stroke-[2.5]" />
                  </a>
                ) : (
                  <span className="text-slate-500 font-medium italic">Not Specified</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Lower Dashboard Grid - Fills remaining screen area beautifully */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card A: Authorized Administrator details */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-slate-900 text-sm">
                  Primary Administrator
                </h3>
                <p className="text-slate-400 font-bold text-[10px] mt-0.5">
                  System authorization credentials
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-slate-400 stroke-[2.5]" /> Admin User
                </span>
                <span className="text-slate-800 font-extrabold">{user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} className="text-slate-400 stroke-[2.5]" /> Email Address
                </span>
                <span className="text-slate-800 font-extrabold">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={12} className="text-slate-400 stroke-[2.5]" /> Role Scope
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-primary text-[10px] font-extrabold uppercase border border-orange-100">
                  {user?.primaryRole || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Card B: CRM Operational Insight */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50/70 text-primary border border-orange-200/50 flex-shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-slate-900 text-sm">
                  CRM Operational Insight
                </h3>
                <p className="text-slate-400 font-bold text-[10px] mt-0.5">
                  Enterprise syncing node details
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} className="text-slate-400 stroke-[2.5]" /> System Status
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 uppercase">
                  <CheckCircle2 size={12} className="stroke-[2.5]" /> Sync Active
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Server size={12} className="text-slate-400 stroke-[2.5]" /> Network Node
                </span>
                <span className="text-slate-800 font-extrabold">Enterprise Primary Server</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400 stroke-[2.5]" /> Security Layer
                </span>
                <span className="text-slate-800 font-extrabold">AES-256 JWT Signed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Edit Form Slideover instantiated inside the component view */}
        <CompanyForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          company={company}
          onSuccess={onSuccess}
          inlineMode={false}
        />

      </div>
    );
  }

  // ─── DRAWER / SLIDEOVER FORM MODE (inlineMode === false) ────────────────────
  const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN';
  const drawerFields = fields.filter(f => {
    if (!isSuperAdmin && isEdit && (f.key === 'status' || f.key === 'status_header')) {
      return false;
    }
    return true;
  });

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Refine Entity Details' : 'Register New Company'}
      subtitle={isEdit ? 'Updating global identity for an existing entity' : 'Onboard a new organization to the CRM cloud foundation'}
      icon={Building}
      fields={drawerFields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? 'Commit Changes' : 'Initialize Enterprise'}
      submitIcon={Save}
    />
  );
};

export default CompanyForm;
