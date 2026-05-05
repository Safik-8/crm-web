import { useEffect } from 'react';
import { Users2 } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';
import GenericPage from '../../../shared/components/templates/GenericPage';

const UsersPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  return (
    <GenericPage 
      title="User Management" 
      description="Manage application users and roles" 
      icon={Users2} 
    />
  );
};

export default UsersPage;
