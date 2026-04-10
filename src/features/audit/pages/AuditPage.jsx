import { ClipboardList } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const AuditPage = () => {
  return (
    <GenericPage 
      title="Audit Logs" 
      description="Track system activities and security events" 
      icon={ClipboardList} 
    />
  );
};

export default AuditPage;
