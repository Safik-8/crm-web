import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, BookOpen, UserCheck, Pencil } from 'lucide-react';
import { updateLead, getBranchUsers } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

/**
 * LeadEditModal
 * Rendered popup modal to edit lead fields.
 * Powered by reusable DynamicFormModal.
 */
const LeadEditModal = ({ lead, assignableUsers: propUsers = [], onClose, onUpdated }) => {
  const [users, setUsers] = useState(propUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch branch users if not provided via props
  useEffect(() => {
    if (propUsers.length > 0) return;
    let mounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await getBranchUsers();
        if (mounted && res?.success) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch branch users:', err);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, [propUsers.length]);

  const validate = (values) => {
    const errs = {};
    const name = (values.name || '').trim();
    const mobile = (values.mobile || '').trim();

    if (name && !/^[a-zA-Z\s.]+$/.test(name)) {
      errs.name = 'Name should only contain letters';
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }
    return errs;
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        date: values.date,
        interestedFor: values.interestedFor.trim() || null,
        assignedToId: values.assignedToId ? Number(values.assignedToId) : null,
      };

      const res = await updateLead(lead.id, payload);
      const updatedLead = res?.data?.lead || res?.lead;

      toast.success('Lead updated successfully');
      onUpdated(updatedLead || { ...lead, ...payload });
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to update lead');
      throw err;
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'e.g. Ravi Kumar', required: true },
    { key: 'mobile', label: 'Mobile', icon: Phone, type: 'tel', placeholder: '10-digit number', required: true },
    { key: 'date', label: 'Date', icon: Calendar, type: 'date', required: true },
    { key: 'interestedFor', label: 'Interested In', icon: BookOpen, type: 'text', placeholder: 'e.g. MBA, BBA, Full Stack…' },
    {
      key: 'assignedToId',
      label: 'Assign To',
      icon: UserCheck,
      type: 'select',
      placeholder: '— Unassigned —',
      options: users.map(u => ({ value: u.id.toString(), label: `${u.name}${u.role ? ` (${u.role})` : ''}` }))
    }
  ];

  const initialValues = {
    name: lead.name || '',
    mobile: lead.mobile?.toString() || '',
    date: lead.date ? lead.date.split('T')[0] : '',
    interestedFor: lead.interestedFor || lead.interested_for || '',
    assignedToId: lead.assignedTo?.id?.toString() || lead.assignedToId?.toString() || '',
  };

  return (
    <DynamicFormModal
      isOpen={true}
      onClose={onClose}
      title="Edit Lead"
      subtitle={lead.name}
      icon={Pencil}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitText="Save Changes"
      validate={validate}
      isLoading={loadingUsers}
    >
      <p className="text-[11px] text-zinc-400 font-medium px-0.5 leading-relaxed">
        Stage can only be changed by dragging the card on the board.
      </p>
    </DynamicFormModal>
  );
};

export default LeadEditModal;
