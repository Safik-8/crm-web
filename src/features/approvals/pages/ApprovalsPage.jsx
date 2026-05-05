import { useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ApprovalsPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Transfer Approvals" 
      description="Review and approve transfer requests" 
      icon={ClipboardCheck} 
    />
  );
};

export default ApprovalsPage;
