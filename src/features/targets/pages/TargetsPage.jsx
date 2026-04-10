import { Target } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const TargetsPage = () => {
  return (
    <GenericPage 
      title="Targets" 
      description="Track and manage performance goals" 
      icon={Target} 
    />
  );
};

export default TargetsPage;
