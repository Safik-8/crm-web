import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CompanySettingsPage from '../pages/CompanySettingsPage';
// import CompanyDetailsPage from '../pages/CompanyDetailsPage'; // Optional

/**
 * Company Module Sub-routes
 * Internal routes for the company feature area.
 */
const CompanyRoutes = () => {
  return (
    <Routes>
      <Route index element={<CompanySettingsPage />} />
      {/* <Route path=":id" element={<CompanyDetailsPage />} /> */}
    </Routes>
  );
};

export default CompanyRoutes;
