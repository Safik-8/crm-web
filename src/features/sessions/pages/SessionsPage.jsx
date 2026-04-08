import { PlayCircle } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const SessionsPage = () => {
  return (
    <GenericPage 
      title="Sessions" 
      description="View and manage interactive customer sessions" 
      icon={PlayCircle} 
    />
  );
};

export default SessionsPage;
