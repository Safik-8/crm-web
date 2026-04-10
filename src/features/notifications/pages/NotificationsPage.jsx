import { Bell } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const NotificationsPage = () => {
  return (
    <GenericPage 
      title="Notifications" 
      description="View system alerts and team updates" 
      icon={Bell} 
    />
  );
};

export default NotificationsPage;
