import { useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ReportsPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Reports" 
      description="View and analyze performance metrics" 
      icon={BarChart3} 
    />
  );
};

export default ReportsPage;
