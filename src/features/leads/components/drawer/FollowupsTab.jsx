// src/features/leads/components/drawer/FollowupsTab.jsx

import React from 'react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import FollowupList from '../../../followups/components/FollowupList';

/**
 * FollowupsTab — Drawer sub-tab component wrapping FollowupList.
 * Uses Mode A hasPermission('FOLLOWUP', action) to check backend permissions directly.
 * Evaluates `user.permissions?.['FOLLOWUP']?.['canCreate']` so Company Admin (with canCreate=false in DB)
 * will evaluate `canCreate === false` and not see write buttons.
 *
 * @param {Object} props
 * @param {number} props.leadId - Target lead ID
 */
const FollowupsTab = ({ leadId }) => {
  const { user } = useAuth();

  // Super Admin has full system access; all other roles (including Managers & Admins)
  // strictly follow their assigned DB permission matrix for the FOLLOWUP module.
  const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN';

  const canCreate = isSuperAdmin || !!(user?.permissions?.FOLLOWUP?.canCreate);
  const canEdit   = isSuperAdmin || !!(user?.permissions?.FOLLOWUP?.canEdit);
  const canDelete = isSuperAdmin || !!(user?.permissions?.FOLLOWUP?.canDelete);



  return (
    <div style={{ paddingTop: '4px', paddingBottom: '8px' }}>
      <FollowupList
        leadId={leadId}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
};

export default FollowupsTab;
