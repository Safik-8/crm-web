import { ClipboardCheck } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ApprovalsPage = () => {
  return (
    <GenericPage 
      title="Transfer Approvals" 
      description="Review and approve transfer requests" 
      icon={ClipboardCheck} 
    />
  );
};

export default ApprovalsPage;
