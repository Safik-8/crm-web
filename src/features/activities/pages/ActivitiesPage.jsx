import { useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ActivitiesPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Activities" 
      description="Track and analyze ongoing sales activities" 
      icon={Activity} 
    />
  );
};

export default ActivitiesPage;
