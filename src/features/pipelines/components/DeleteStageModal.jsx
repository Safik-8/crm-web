import React from 'react';
import { AlertTriangle } from 'lucide-react';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

/**
 * DeleteStageModal
 * Confirmation dialog for global stage deletion.
 * Powered by reusable DynamicFormModal.
 */
const DeleteStageModal = ({ stage, onConfirm, onCancel, isDeleting = false }) => {
  if (!stage) return null;

  return (
    <DynamicFormModal
      isOpen={!!stage}
      onClose={onCancel}
      title="Delete Stage"
      subtitle="This action cannot be undone"
      icon={AlertTriangle}
      onSubmit={onConfirm}
      submitText="Delete Stage"
      cancelText="Cancel"
      danger={true}
      isLoading={isDeleting}
    >
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5 space-y-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            You are about to permanently delete{' '}
            <span className="font-bold text-slate-900">"{stage.name}"</span>.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            This stage will be removed globally across all pipelines — but only if no leads are currently using it.
          </p>
        </div>

        <div className="flex items-start gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            If this stage has active leads, the deletion will be blocked. Move or delete those leads first.
          </p>
        </div>
      </div>
    </DynamicFormModal>
  );
};

export default DeleteStageModal;
