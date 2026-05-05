import { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const ProspectsPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Prospects" 
      description="Manage and track potential customers" 
      icon={Users} 
    />
  );
};

export default ProspectsPage;
