import { Users } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ProspectsPage = () => {
  return (
    <GenericPage 
      title="Prospects" 
      description="Manage and track potential customers" 
      icon={Users} 
    />
  );
};

export default ProspectsPage;
