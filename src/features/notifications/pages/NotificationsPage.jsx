import { Bell } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';
import { useLoader } from '../../../shared/context/LoaderContext';
import React, { useEffect } from 'react';

const NotificationsPage = () => {

   const { forceHideLoader } = useLoader();
  
    useEffect(() => {
      const timer = setTimeout(() => {
        forceHideLoader();
      }, 100);
      return () => clearTimeout(timer);
    }, [forceHideLoader]);

  return (
    <GenericPage 
      title="Notifications" 
      description="View system alerts and team updates" 
      icon={Bell} 
    />
  );
};

export default NotificationsPage;
