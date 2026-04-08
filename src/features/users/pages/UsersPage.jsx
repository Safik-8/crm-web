import { Users2 } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const UsersPage = () => {
  return (
    <GenericPage 
      title="User Management" 
      description="Manage application users and roles" 
      icon={Users2} 
    />
  );
};

export default UsersPage;
