import React from 'react';
import { Trash2 } from 'lucide-react';
import { deleteLead } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';
import Alert from '../../../shared/components/elements/Alert';

/**
 * LeadDeleteModal
 * Rendered popup modal to confirm deletion of a lead.
 * Powered by reusable DynamicFormModal.
 */
const LeadDeleteModal = ({ lead, onClose, onDeleted }) => {
  const handleDelete = async () => {
    try {
      await deleteLead(lead.id);
      toast.success(`"${lead.name}" has been removed from the pipeline`);
      onDeleted(lead.id);
      onClose();
    } catch (err) {
      if (err?.statusCode === 404 || err?.status === 404) {
        toast.warning('Lead was already removed');
        onDeleted(lead.id);
        onClose();
        return;
      }
      toast.error(err?.message || 'Failed to delete lead. Please try again.');
      throw err;
    }
  };

  return (
    <DynamicFormModal
      isOpen={true}
      onClose={onClose}
      title="Delete lead?"
      icon={Trash2}
      onSubmit={handleDelete}
      submitText="Delete"
      cancelText="Cancel"
      danger={true}
    >
      <Alert severity="error">
        Lead <span className="font-bold">"{lead.name}"</span> will be removed from the pipeline. This action cannot be undone.
      </Alert>
    </DynamicFormModal>
  );
};

export default LeadDeleteModal;

