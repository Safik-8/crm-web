import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deleteLead } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

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
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-[12px] font-medium text-red-700 leading-relaxed">
          Lead <span className="font-bold">"{lead.name}"</span> will be removed from the pipeline. This action cannot be undone.
        </p>
      </div>
    </DynamicFormModal>
  );
};

export default LeadDeleteModal;
