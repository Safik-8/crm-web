import { useEffect } from 'react';
import { Target } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const TargetsPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Targets" 
      description="Track and manage performance goals" 
      icon={Target} 
    />
  );
};

export default TargetsPage;
