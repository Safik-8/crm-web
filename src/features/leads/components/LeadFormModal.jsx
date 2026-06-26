import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, BookOpen, UserCheck, Plus } from 'lucide-react';
import { createLead, getBranchUsers } from '../services/leadService';
import { toast } from 'sonner';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

/**
 * LeadFormModal
 * Rendered popup modal to add a new lead to a pipeline.
 * Powered by reusable DynamicFormModal.
 */
const LeadFormModal = ({ pipelineId, onClose, onCreated }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
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
  }, []);

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
      const res = await createLead({
        ...values,
        pipelineId,
        date: new Date(values.date).toISOString(),
        assignedToId: values.assignedToId ? Number(values.assignedToId) : null
      });
      const lead = res?.data?.lead;
      toast.success('Lead added successfully!');
      onCreated(lead);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to add lead');
      throw err;
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'e.g. Ravi Kumar', required: true },
    { key: 'mobile', label: 'Mobile', icon: Phone, type: 'tel', placeholder: '10-digit number', required: true },
    { key: 'date', label: 'Date', icon: Calendar, type: 'date', required: true },
    { key: 'interested_for', label: 'Interested In', icon: BookOpen, type: 'text', placeholder: 'e.g. MBA, BBA, Full Stack…', required: true },
    {
      key: 'assignedToId',
      label: 'Assign To',
      icon: UserCheck,
      type: 'select',
      placeholder: '— Unassigned —',
      options: users.map(u => ({ value: u.id.toString(), label: `${u.name}${u.role ? ` (${u.role})` : ''}` }))
    }
  ];

  return (
    <DynamicFormModal
      isOpen={true}
      onClose={onClose}
      title="Add Lead"
      subtitle="Fill in the lead details below"
      icon={Plus}
      fields={fields}
      initialValues={{ name: '', mobile: '', date: '', interested_for: '', assignedToId: '' }}
      onSubmit={handleSubmit}
      submitText="Add Lead"
      validate={validate}
      isLoading={loadingUsers}
    />
  );
};

export default LeadFormModal;
