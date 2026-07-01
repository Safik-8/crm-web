import React from 'react';
import { Route, Routes } from 'react-router-dom';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage';

/**
 * Company Module Sub-routes
 * Internal routes for the company feature area.
 */
const CompanyRoutes = () => {
  return (
    <Routes>
      <Route index element={<OrganizationSettingsPage />} />
    </Routes>
  );
};

export default CompanyRoutes;
