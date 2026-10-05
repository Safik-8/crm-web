import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { PERMISSIONS } from '../../lib/constants/permissions';
import { useActiveTeamQuery } from '../../features/teams/hooks/useTeams';

const MyTeamRouteGuard = ({ children }) => {
  const { hasPermission } = useAuth();
  const canViewTeam = hasPermission(PERMISSIONS.VIEW_TEAMS) || hasPermission('TEAM', 'canView');

  const { data: activeTeam, isLoading, isError } = useActiveTeamQuery();

  // 1. Permission check: Block access if user lacks TEAM.canView
  if (!canViewTeam) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 2. Loading state while verifying team membership
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-white/50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 3. Team membership check: Only active team members or leaders can access My Team
  if (!activeTeam?.id || isError) {
    const canManageTeams = hasPermission('TEAM', 'canCreate') || hasPermission('TEAM', 'canEdit');
    if (canManageTeams) {
      return <Navigate to="/teams" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default MyTeamRouteGuard;
