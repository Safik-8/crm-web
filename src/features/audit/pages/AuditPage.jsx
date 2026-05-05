import { useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const AuditPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Audit Logs" 
      description="Track system activities and security events" 
      icon={ClipboardList} 
    />
  );
};

export default AuditPage;
