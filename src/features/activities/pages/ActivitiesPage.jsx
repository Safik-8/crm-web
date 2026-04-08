import { Activity } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ActivitiesPage = () => {
  return (
    <GenericPage 
      title="Activities" 
      description="Track and analyze ongoing sales activities" 
      icon={Activity} 
    />
  );
};

export default ActivitiesPage;
