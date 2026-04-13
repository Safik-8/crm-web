import React from 'react';
import { Route, Routes } from 'react-router-dom';
import BranchSettingsPage from '../pages/BranchSettingsPage';

/**
 * Branch Module Sub-routes
 * Internal routes for the branch feature area.
 * Mounted at: /companies/:companyId/branches/*
 */
const BranchRoutes = () => {
  return (
    <Routes>
      <Route index element={<BranchSettingsPage />} />
    </Routes>
  );
};

export default BranchRoutes;
