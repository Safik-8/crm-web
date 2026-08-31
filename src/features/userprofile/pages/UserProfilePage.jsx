// src/features/userprofile/pages/UserProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  User, Mail, Phone, Building2, Shield, Calendar, MapPin, 
  Hash, UserCheck, Sparkles, Map, Landmark, Briefcase, 
  Edit3, Sliders, Bell, Key, Monitor, Camera, X, Check, Loader2,
  Eye, EyeOff, Laptop, Smartphone, Globe, Trash2, LogOut
} from 'lucide-react';
import { userProfileService } from '../services/userProfileService';
import ProfileSection from '../components/ProfileSection';
import Alert from '../../../shared/components/elements/Alert';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { toast } from '../../../shared/utils/toast';
import { IconButton, InputAdornment } from '@mui/material';

import { useAuth } from '../../../app/providers/AuthProvider';

const UserProfilePage = () => {
  const { refetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences'
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Close lightbox modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPreviewModalOpen(false);
      }
    };
    if (isPreviewModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewModalOpen]);

  // Local state for edit form fields
  const [editFields, setEditFields] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    emergencyContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  });

  const [editErrors, setEditErrors] = useState({});

  // Local state for password change fields
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user profile using TanStack useQuery
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await userProfileService.getUserProfile();
      if (res?.success && res?.data?.profile) {
        return res.data.profile;
      }
      throw new Error('Failed to retrieve user profile data');
    }
  });

  // Update profile details mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userProfileService.updateUserProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditOpen(false);
      refetch();
      if (typeof refetchUser === 'function') {
        refetchUser();
      }
      setEditErrors({});
    },
    onError: (err) => {
      const backendMsg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      const validationFields = err?.response?.data?.errors;
      
      if (Array.isArray(validationFields)) {
        const errorMap = {};
        validationFields.forEach(f => {
          errorMap[f.field] = f.message;
        });
        setEditErrors(errorMap);
      } else {
        setEditErrors({ global: backendMsg });
      }
    },
    onSettled: () => {
      setIsSavingProfile(false);
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data) => userProfileService.changePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setPasswordFields({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      setTimeout(() => {
        window.location.reload();
      }, 800);
    },
    onError: (err) => {
      const backendMsg = err?.response?.data?.message || err?.message || 'Failed to update password';
      const validationFields = err?.response?.data?.errors;
      
      if (Array.isArray(validationFields)) {
        const errorMap = {};
        validationFields.forEach(f => {
          errorMap[f.field] = f.message;
        });
        setPasswordErrors(errorMap);
      } else {
        if (backendMsg.toLowerCase().includes('current password')) {
          setPasswordErrors({ currentPassword: backendMsg });
        } else {
          setPasswordErrors({ global: backendMsg });
        }
      }
    },
    onSettled: () => {
      setIsUpdatingPassword(false);
    }
  });

  // Active Sessions Query
  const { data: sessions, refetch: refetchSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const res = await userProfileService.getActiveSessions();
      if (res?.success && res?.data?.sessions) {
        return res.data.sessions;
      }
      return [];
    },
    enabled: activeTab === 'preferences'
  });

  // Revoke Specific Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: (id) => userProfileService.revokeSession(id),
    onSuccess: (res, variables) => {
      setSessionToRevoke(null);
      toast.success('Session revoked successfully!');
      refetchSessions();
      // If we revoked the current session, the backend cleared cookies, so we should reload/redirect
      const revokedSession = sessions?.find(s => s.id === variables);
      if (revokedSession?.isCurrent) {
        window.location.reload();
      }
    },
    onError: (err) => {
      setSessionToRevoke(null);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to revoke session');
    }
  });

  // Deactivate Account Mutation
  const deactivateAccountMutation = useMutation({
    mutationFn: () => userProfileService.deactivateAccount(),
    onSuccess: () => {
      setIsDeactivateModalOpen(false);
      toast.success('Account deactivated and logged out successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (err) => {
      setIsDeactivateModalOpen(false);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to deactivate account');
    }
  });

  // Prefill local edit state when profile data is available
  useEffect(() => {
    if (profile) {
      let fName = profile.firstName || '';
      let lName = profile.lastName || '';

      // Fallback: if firstName/lastName are not populated, split the existing name field
      if (!fName && !lName && profile.name) {
        const parts = profile.name.trim().split(/\s+/);
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      setEditFields({
        firstName: fName,
        lastName: lName,
        mobileNumber: profile.mobileNumber || '',
        emergencyContact: profile.profile?.emergencyContact || '',
        address: profile.profile?.address || '',
        city: profile.profile?.city || '',
        state: profile.profile?.state || '',
        pincode: profile.profile?.pincode || '',
        country: profile.profile?.country || '',
      });
      setPreviewPhoto(profile.profilePhoto || null);
    }
  }, [profile]);

  const handleEditFieldChange = (key, val) => {
    setEditFields((prev) => ({ ...prev, [key]: val }));
    if (editErrors[key] || editErrors.global) {
      setEditErrors((prev) => ({ ...prev, [key]: '', global: '' }));
    }
  };

  const handlePasswordFieldChange = (key, val) => {
    setPasswordFields((prev) => ({ ...prev, [key]: val }));
    if (passwordErrors[key] || passwordErrors.global) {
      setPasswordErrors((prev) => ({ ...prev, [key]: '', global: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Format validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported format! Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // 2. File size limit (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size exceeds the 2MB limit!');
      return;
    }

    // 3. Image dimension check
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const minDimension = 150;
      if (img.width < minDimension || img.height < minDimension) {
        toast.error(`Image is too small! Minimum dimensions are ${minDimension}x${minDimension}px.`);
        return;
      }

      // Valid base64 conversion
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      toast.error('Invalid image file!');
    };
  };

  const preventCopyPaste = (e) => {
    e.preventDefault();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditErrors({});

    // Front-end Validation
    const errors = {};
    if (editFields.mobileNumber && editFields.mobileNumber.trim() !== '') {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(editFields.mobileNumber.trim())) {
        errors.mobileNumber = 'Mobile number must be exactly 10 digits';
      }
    }

    if (!editFields.firstName || editFields.firstName.trim() === '') {
      errors.firstName = 'First name is required';
    } else if (editFields.firstName.length > 100) {
      errors.firstName = 'First name must be under 100 characters';
    }

    if (!editFields.lastName || editFields.lastName.trim() === '') {
      errors.lastName = 'Last name is required';
    } else if (editFields.lastName.length > 100) {
      errors.lastName = 'Last name must be under 100 characters';
    }
    if (editFields.address && editFields.address.length > 500) {
      errors.address = 'Address must be under 500 characters';
    }
    if (editFields.city && editFields.city.length > 100) {
      errors.city = 'City name must be under 100 characters';
    }
    if (editFields.state && editFields.state.length > 100) {
      errors.state = 'State name must be under 100 characters';
    }
    if (editFields.country && editFields.country.length > 100) {
      errors.country = 'Country name must be under 100 characters';
    }
    if (editFields.pincode && editFields.pincode.length > 20) {
      errors.pincode = 'Pincode must be under 20 characters';
    }
    if (editFields.emergencyContact && editFields.emergencyContact.length > 100) {
      errors.emergencyContact = 'Emergency contact must be under 100 characters';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    // Call mutation (mapping empty strings to null for optional nullable database properties)
    const payload = {};
    Object.keys(editFields).forEach(key => {
      const val = editFields[key];
      payload[key] = val === '' ? null : val;
    });
    // Add preview photo if uploaded/modified
    payload.profilePhoto = previewPhoto;

    setIsSavingProfile(true);
    updateProfileMutation.mutate(payload);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Front-end Validation
    const errors = {};
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      if (newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(newPassword)) {
        errors.newPassword = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(newPassword)) {
        errors.newPassword = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(newPassword)) {
        errors.newPassword = 'Password must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
        errors.newPassword = 'Password must contain at least one special character';
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'New password and confirmation do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsUpdatingPassword(true);
    // Call mutation
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-semibold">Loading profile information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert severity="error" title="Error Loading Profile">
          {error?.message || 'An error occurred while fetching your profile.'}
        </Alert>
      </div>
    );
  }

  const fullName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() 
    : profile?.name || 'User';

  const primaryRoleObj = profile?.userRoles?.find(ur => ur.isPrimary);
  const primaryRoleName = profile?.primaryRole || primaryRoleObj?.role?.name || profile?.userRoles?.[0]?.role?.name || 'Member';

  const newPasswordVal = passwordFields.newPassword || '';
  const hasMinLength = newPasswordVal.length >= 6;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500 relative">
      
      {/* ── PROFILE HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-200/80 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar */}
          <div
            className={`shrink-0 relative group ${profile?.profilePhoto ? 'cursor-pointer' : ''}`}
            onClick={() => profile?.profilePhoto && setIsPreviewModalOpen(true)}
            title={profile?.profilePhoto ? 'Click to view photo in full size' : ''}
          >
            {profile?.profilePhoto ? (
              <div className="relative overflow-hidden rounded-full ring-4 ring-orange-500/10 shadow-sm">
                <img
                  src={profile.profilePhoto}
                  alt={fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 text-white backdrop-blur-[1px]">
                  <Eye size={22} className="drop-shadow-md" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center rounded-full ring-4 ring-orange-500/10 text-orange-600 font-extrabold text-2xl shadow-inner">
                {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* User Quick Metadata */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200/50 uppercase tracking-wider">
                  <Shield size={10} className="shrink-0" />
                  {primaryRoleName}
                </span>
              </div>
              <p className="text-zinc-500 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={14} className="text-zinc-400 shrink-0" />
                {profile?.email || 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {profile?.company?.name && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-50 text-zinc-600 border border-zinc-200/60">
                  <Building2 size={11} className="text-zinc-400 shrink-0" />
                  {profile.company.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button (Only visible on Profile tab) */}
        {activeTab === 'profile' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditOpen(true)}
            startIcon={<Edit3 size={15} />}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex gap-2 border-b border-zinc-200/70 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all duration-150 ${
            activeTab === 'profile'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <User size={15} />
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all duration-150 ${
            activeTab === 'preferences'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Sliders size={15} />
          Account Settings
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'profile' ? (
        <div className="space-y-8 sm:space-y-12">
          
          {/* Row 1: Personal Details */}
          <ProfileSection 
            title="Personal Info" 
            description="Basic identifying credentials" 
            icon={User}
          >
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">First Name</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.firstName || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Last Name</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.lastName || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Email Address</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.email || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Mobile Number</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.mobileNumber || '—'}</p>
            </div>
          </ProfileSection>

          {/* Row 2: Company Details */}
          <ProfileSection 
            title="Organization" 
            description="Tenancy and business unit details" 
            icon={Building2}
          >
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Company Name</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.company?.name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Company Code</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.company?.code || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Branch Name</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.branch?.name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Branch Code</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.branch?.code || '—'}</p>
            </div>
          </ProfileSection>

          {/* Row 3: Role & Governance */}
          <ProfileSection 
            title="Roles & Access" 
            description="System access and hierarchy" 
            icon={Shield}
          >
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Reporting Manager</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.reportingManager?.name ? `${profile.reportingManager.name} (${profile.reportingManager.email})` : 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Primary Designation</p>
              <p className="text-base font-semibold text-zinc-800">{primaryRoleName}</p>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">All Assigned Roles</p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {profile?.userRoles && profile.userRoles.length > 0 ? (
                  profile.userRoles.map((ur) => (
                    <span
                      key={ur.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                        ur.isPrimary
                          ? 'bg-orange-50 text-orange-600 border-orange-200/60'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200/60'
                      }`}
                    >
                      {ur.role?.name} {ur.isPrimary && ' (Primary)'}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-zinc-800">—</span>
                )}
              </div>
            </div>
          </ProfileSection>

          {/* Row 4: Employment Registry */}
          <ProfileSection 
            title="Employment" 
            description="Registry and joining metrics" 
            icon={Briefcase}
          >
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Employee ID</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.employeeId || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Joining Date</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}</p>
            </div>
          </ProfileSection>

          {/* Row 5: Contact & Location details */}
          <ProfileSection 
            title="Location" 
            description="Address and contact details" 
            icon={MapPin}
          >
            <div className="sm:col-span-2 space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Street Address</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.address || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">City</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.city || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">State</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.state || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pincode</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.pincode || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Country</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.country || '—'}</p>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Emergency Contact</p>
              <p className="text-base font-semibold text-zinc-800">{profile?.profile?.emergencyContact || '—'}</p>
            </div>
          </ProfileSection>

        </div>
      ) : (
        /* ── TAB: ACCOUNT SETTINGS ── */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Left side: Navigation / Overview */}
            <div className="w-full md:w-64 shrink-0 space-y-4 sticky top-6">
              <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Settings</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Manage notifications, credentials, and active device sessions.</p>
                </div>
                
                <hr className="border-zinc-200/60" />

                <div className="space-y-1">
                  <a href="#notifications-card" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 transition-all">
                    <Bell size={14} className="text-zinc-400" />
                    Notification preferences
                  </a>
                  <a href="#security-card" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 transition-all">
                    <Key size={14} className="text-zinc-400" />
                    Sign-in & Password
                  </a>
                  <a href="#sessions-card" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 transition-all">
                    <Monitor size={14} className="text-zinc-400" />
                    Devices & Sessions
                  </a>
                </div>
              </div>
            </div>

            {/* Right side: Settings Cards */}
            <div className="flex-1 space-y-8">
              
              {/* Card 1: Notifications */}
              <div id="notifications-card" className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
                <div className="border-b border-zinc-200/60 px-6 py-4 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Bell size={16} className="text-orange-500" />
                    Notifications
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">Control email and push alert preferences</p>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4 p-4 hover:bg-zinc-55/30 rounded-xl transition-all border border-transparent hover:border-zinc-100">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-800">Email Notifications</p>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                        Receive daily report summaries, security updates, and lead allocation alerts via email.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex items-start justify-between gap-4 p-4 hover:bg-zinc-55/30 rounded-xl transition-all border border-transparent hover:border-zinc-100">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-800">Push Alerts</p>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                        Real-time alerts for lead status changes, team mentions, and scheduled tasks in browser.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Security & Password Change */}
              <div id="security-card" className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
                <div className="border-b border-zinc-200/60 px-6 py-4 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Key size={16} className="text-orange-500" />
                    Security
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">Manage authentication credentials</p>
                </div>

                <div className="p-6 space-y-6">
                  {passwordErrors.global && (
                    <Alert severity="error" title="Security Error">
                      {passwordErrors.global}
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Form Fields */}
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Change Password</p>
                        
                        <div>
                          <TextField 
                            id="current-password" 
                            label="Current Password" 
                            type={showCurrentPassword ? 'text' : 'password'} 
                            value={passwordFields.currentPassword}
                            onChange={(val) => handlePasswordFieldChange('currentPassword', val)}
                            placeholder="Enter current password" 
                            errorText={passwordErrors.currentPassword}
                            onCopy={preventCopyPaste}
                            onPaste={preventCopyPaste}
                            onCut={preventCopyPaste}
                            endIcon={
                              <InputAdornment position="end" sx={{ pr: 1 }}>
                                <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </div>
                        <div>
                          <TextField 
                            id="new-password" 
                            label="New Password" 
                            type={showNewPassword ? 'text' : 'password'} 
                            value={passwordFields.newPassword}
                            onChange={(val) => handlePasswordFieldChange('newPassword', val)}
                            placeholder="Enter new password" 
                            errorText={passwordErrors.newPassword}
                            onCopy={preventCopyPaste}
                            onPaste={preventCopyPaste}
                            onCut={preventCopyPaste}
                            endIcon={
                              <InputAdornment position="end" sx={{ pr: 1 }}>
                                <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </div>
                        <div>
                          <TextField 
                            id="confirm-password" 
                            label="Confirm New Password" 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            value={passwordFields.confirmPassword}
                            onChange={(val) => handlePasswordFieldChange('confirmPassword', val)}
                            placeholder="Re-enter new password" 
                            errorText={passwordErrors.confirmPassword}
                            onCopy={preventCopyPaste}
                            onPaste={preventCopyPaste}
                            onCut={preventCopyPaste}
                            endIcon={
                              <InputAdornment position="end" sx={{ pr: 1 }}>
                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </div>

                        <div className="pt-2">
                          <Button 
                            type="submit"
                            variant="contained" 
                            color="primary"
                            isLoading={isUpdatingPassword}
                            startIcon={<Check size={16} />}
                          >
                            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                          </Button>
                        </div>
                      </div>

                      {/* Complexity Requirements Checklist */}
                      {(() => {
                        const newPass = passwordFields.newPassword || '';
                        const hasMinLength = newPass.length >= 8;
                        const hasUppercase = /[A-Z]/.test(newPass);
                        const hasLowercase = /[a-z]/.test(newPass);
                        const hasNumber = /[0-9]/.test(newPass);
                        const hasSpecial = /[^A-Za-z0-9]/.test(newPass);

                        return (
                          <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-5 space-y-4 self-start">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Password Requirements</p>
                            
                            <div className="space-y-2.5 text-[11px] font-semibold text-zinc-500">
                              <div className={`flex items-center gap-2.5 transition-colors duration-200 ${hasMinLength ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  hasMinLength ? 'bg-emerald-50 border-emerald-300' : 'border-zinc-300'
                                }`}>
                                  {hasMinLength && <Check size={10} className="stroke-[3]" />}
                                </div>
                                <span>At least 8 characters</span>
                              </div>

                              <div className={`flex items-center gap-2.5 transition-colors duration-200 ${hasUppercase ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  hasUppercase ? 'bg-emerald-50 border-emerald-300' : 'border-zinc-300'
                                }`}>
                                  {hasUppercase && <Check size={10} className="stroke-[3]" />}
                                </div>
                                <span>At least 1 uppercase letter (A-Z)</span>
                              </div>

                              <div className={`flex items-center gap-2.5 transition-colors duration-200 ${hasLowercase ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  hasLowercase ? 'bg-emerald-50 border-emerald-300' : 'border-zinc-300'
                                }`}>
                                  {hasLowercase && <Check size={10} className="stroke-[3]" />}
                                </div>
                                <span>At least 1 lowercase letter (a-z)</span>
                              </div>

                              <div className={`flex items-center gap-2.5 transition-colors duration-200 ${hasNumber ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  hasNumber ? 'bg-emerald-50 border-emerald-300' : 'border-zinc-300'
                                }`}>
                                  {hasNumber && <Check size={10} className="stroke-[3]" />}
                                </div>
                                <span>At least 1 number (0-9)</span>
                              </div>

                              <div className={`flex items-center gap-2.5 transition-colors duration-200 ${hasSpecial ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  hasSpecial ? 'bg-emerald-50 border-emerald-300' : 'border-zinc-300'
                                }`}>
                                  {hasSpecial && <Check size={10} className="stroke-[3]" />}
                                </div>
                                <span>At least 1 special character (!@#$%^&*)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </form>
                </div>
              </div>

              {/* Card 3: Session Preferences & Devices */}
              <div id="sessions-card" className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
                <div className="border-b border-zinc-200/60 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Monitor size={16} className="text-orange-500" />
                      Devices & Sessions
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">Monitor and revoke active sign-ins</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Account Control (Deactivation) */}
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider text-red-700">Enterprise Control</p>
                    <div className="p-4 bg-red-50/30 border border-red-200/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-red-800">Deactivate Enterprise Account</p>
                        <p className="text-xs text-red-600/90 font-medium leading-relaxed max-w-lg">
                          Deactivating your account will block login access and immediately terminate all active sessions across all devices. Contact your Administrator to reactivate.
                        </p>
                      </div>
                      <Button
                        variant="contained"
                        color="error"
                        className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold"
                        isLoading={deactivateAccountMutation.isPending}
                        onClick={() => setIsDeactivateModalOpen(true)}
                      >
                        Deactivate Account
                      </Button>
                    </div>
                  </div>

                  <hr className="border-zinc-150" />

                  {/* Active Devices List */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Currently Logged-in Devices</p>
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">These devices have accessed your account. Revoking will terminate the session.</p>
                    </div>

                    {isLoadingSessions ? (
                      <div className="flex items-center justify-center py-8 text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <Loader2 className="animate-spin mr-2" size={16} />
                        <span className="text-xs font-semibold">Retrieving session list...</span>
                      </div>
                    ) : sessions && sessions.length > 0 ? (
                      <div className="space-y-3">
                        {sessions.map((session) => {
                          const isDesktop = session.deviceName?.toLowerCase().includes('pc') || session.deviceName?.toLowerCase().includes('mac') || session.os?.toLowerCase().includes('windows') || session.os?.toLowerCase().includes('mac');
                          const Icon = isDesktop ? Laptop : Smartphone;
                          
                          return (
                            <div
                              key={session.id}
                              className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-150 ${
                                session.isCurrent
                                  ? 'bg-emerald-50/15 border-emerald-200/50 shadow-sm'
                                  : 'bg-white border-zinc-200/60 hover:border-zinc-300'
                              }`}
                            >
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                                  session.isCurrent ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                  <Icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold text-zinc-800 truncate">
                                      {session.deviceName || 'Unknown Device'}
                                    </p>
                                    {session.isCurrent && (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200/40 tracking-wider">
                                        Current Session
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs font-semibold text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">OS:</span>
                                      <span className="text-zinc-700">{session.os || 'Unknown OS'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Browser:</span>
                                      <span className="text-zinc-700">{session.browser || 'Unknown Browser'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">IP:</span>
                                      <span className="text-zinc-700">{session.ipAddress || 'Unknown IP'}</span>
                                    </div>
                                    <div className="sm:col-span-3 flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                                      <span className="text-[10px] font-bold uppercase tracking-wider">Last Active:</span>
                                      <span className="font-medium">{new Date(session.lastActive || session.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <button
                                disabled={revokeSessionMutation.isPending}
                                onClick={() => setSessionToRevoke(session)}
                                className={`p-2 rounded-lg border transition-colors shrink-0 ml-4 ${
                                  session.isCurrent
                                    ? 'border-red-200 text-red-600 hover:bg-red-50 bg-white'
                                    : 'border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50/30'
                                }`}
                                title="Terminate session"
                              >
                                <LogOut size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100 text-xs font-semibold text-zinc-500">
                        No active sessions registered.
                      </div>
                    )}
                  </div>



                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ── EDIT PROFILE DRAWER (SLIDE-OVER UI ONLY) ── */}
      <DynamicFormSlideover
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditErrors({});
        }}
        title="Edit Profile Information"
        subtitle="Update your basic and location details"
        icon={Edit3}
        showFooter={true}
        customFooter={
          <div className="flex items-center justify-end gap-3">
            <Button 
              type="button"
              variant="outlined" 
              onClick={() => {
                setIsEditOpen(false);
                setEditErrors({});
              }}
              disabled={isSavingProfile}
              sx={{
                borderColor: '#E2E8F0',
                color: '#475569',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              isLoading={isSavingProfile}
              startIcon={<Check size={16} />}
              onClick={handleEditSubmit}
              sx={{
                bgcolor: '#F86F03',
                color: '#FFFFFF',
                px: 5,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#E05D02'
                }
              }}
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
        onSubmit={handleEditSubmit}
      >
        <div className="space-y-6">
          {/* Global error alert */}
          {editErrors.global && (
            <Alert severity="error" title="Error">
              {editErrors.global}
            </Alert>
          )}

          {/* Avatar Upload Widget */}
          <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-2">
            <div className="relative shrink-0 w-16 h-16 bg-orange-100 flex items-center justify-center rounded-2xl text-orange-600 font-black text-xl">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Upload Preview" className="w-full h-full object-cover rounded-2xl animate-fadeIn" />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
              <label htmlFor="drawer-photo" className="absolute -bottom-1.5 -right-1.5 p-1 bg-white border border-zinc-200 text-zinc-500 rounded-lg hover:text-orange-500 transition-colors shadow-sm cursor-pointer">
                <Camera size={14} />
              </label>
              <input 
                id="drawer-photo" 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-800">Profile Photo</h4>
              <p className="text-[9px] text-zinc-400 font-medium leading-tight">Supports JPG, PNG, or WEBP. Max 2MB. Min dimensions: 150px.</p>
              {previewPhoto && (
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="text-[10px] text-red-500 font-bold hover:underline block pt-0.5"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* Inputs with proper spacing wraps */}
          <div className="space-y-4">
            <TextField 
              id="edit-firstName" 
              label="First Name" 
              value={editFields.firstName} 
              onChange={(val) => handleEditFieldChange('firstName', val)}
              placeholder="Enter first name" 
              errorText={editErrors.firstName}
              required
            />
            <TextField 
              id="edit-lastName" 
              label="Last Name" 
              value={editFields.lastName} 
              onChange={(val) => handleEditFieldChange('lastName', val)}
              placeholder="Enter last name" 
              errorText={editErrors.lastName}
              required
            />
            <TextField 
              id="edit-mobileNumber" 
              label="Mobile Number" 
              value={editFields.mobileNumber} 
              onChange={(val) => handleEditFieldChange('mobileNumber', val)}
              placeholder="Enter mobile number" 
              errorText={editErrors.mobileNumber}
            />
            <TextField 
              id="edit-emergencyContact" 
              label="Emergency Contact" 
              value={editFields.emergencyContact} 
              onChange={(val) => handleEditFieldChange('emergencyContact', val)}
              placeholder="Emergency Contact Name/Phone" 
              errorText={editErrors.emergencyContact}
            />
            
            <div className="w-full border-t border-zinc-100 my-4" />
            
            <TextField 
              id="edit-address" 
              label="Street Address" 
              value={editFields.address} 
              onChange={(val) => handleEditFieldChange('address', val)}
              placeholder="Street Address" 
              errorText={editErrors.address}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <TextField 
                id="edit-city" 
                label="City" 
                value={editFields.city} 
                onChange={(val) => handleEditFieldChange('city', val)}
                placeholder="City" 
                errorText={editErrors.city}
              />
              <TextField 
                id="edit-state" 
                label="State" 
                value={editFields.state} 
                onChange={(val) => handleEditFieldChange('state', val)}
                placeholder="State" 
                errorText={editErrors.state}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <TextField 
                id="edit-pincode" 
                label="Pincode" 
                value={editFields.pincode} 
                onChange={(val) => handleEditFieldChange('pincode', val)}
                placeholder="Pincode" 
                errorText={editErrors.pincode}
              />
              <TextField 
                id="edit-country" 
                label="Country" 
                value={editFields.country} 
                onChange={(val) => handleEditFieldChange('country', val)}
                placeholder="Country" 
                errorText={editErrors.country}
              />
            </div>
          </div>
        </div>
      </DynamicFormSlideover>

      {/* Account Deactivation Confirmation Dialog */}
      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Deactivate Enterprise Account?"
        message="Are you absolutely sure you want to deactivate your account? This action will block your login access and terminate all active sessions across all devices immediately."
        warningMessage="Warning: Contact your Administrator to reactivate your system access once deactivated."
        confirmText="Deactivate Account"
        cancelText="Cancel"
        type="error"
        isLoading={deactivateAccountMutation.isPending}
        onConfirm={() => deactivateAccountMutation.mutate()}
      />

      {/* Session Revocation Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        title={sessionToRevoke?.isCurrent ? "Terminate Current Session?" : "Terminate Device Session?"}
        message={
          sessionToRevoke?.isCurrent
            ? "Are you sure you want to terminate your current active session? You will be signed out of this browser immediately."
            : `Are you sure you want to log out the session on "${sessionToRevoke?.deviceName || 'this device'}" (${sessionToRevoke?.os || 'Unknown OS'} - ${sessionToRevoke?.browser || 'Unknown Browser'})?`
        }
        warningMessage={sessionToRevoke?.isCurrent ? "You will need to re-enter your credentials to sign back in." : undefined}
        confirmText={sessionToRevoke?.isCurrent ? "Sign Out Device" : "Terminate Session"}
        cancelText="Cancel"
        type="error"
        isLoading={revokeSessionMutation.isPending}
        onConfirm={() => {
          if (sessionToRevoke) {
            revokeSessionMutation.mutate(sessionToRevoke.id);
          }
        }}
      />

      {/* ── FULLSCREEN PROFILE PHOTO LIGHTBOX MODAL ── */}
      {isPreviewModalOpen && profile?.profilePhoto && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          {/* Top Floating Header Bar */}
          <div
            className="absolute top-4 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-extrabold text-base">
                {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white text-base font-extrabold leading-tight tracking-tight">{fullName}</p>
                <p className="text-xs text-zinc-400 font-medium">Profile Photo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="p-2.5 text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-150 backdrop-blur-sm cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Centered Image Frame (Sleek, Frameless, High Quality) */}
          <div
            className="relative max-w-md sm:max-w-lg w-full aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15 animate-in zoom-in-95 duration-200 bg-zinc-950 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profile.profilePhoto}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
