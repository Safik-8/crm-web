import { useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const SessionsPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Sessions" 
      description="View and manage interactive customer sessions" 
      icon={PlayCircle} 
    />
  );
};

export default SessionsPage;
