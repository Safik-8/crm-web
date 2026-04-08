import { BarChart3 } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ReportsPage = () => {
  return (
    <GenericPage 
      title="Reports" 
      description="View and analyze performance metrics" 
      icon={BarChart3} 
    />
  );
};

export default ReportsPage;
