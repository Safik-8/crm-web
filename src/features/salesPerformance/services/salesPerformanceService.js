// crm-web/src/features/salesPerformance/services/salesPerformanceService.js

import axiosClient from '../../../api/axiosClient';

const BASE_PATH = '/sales-performance';

export const salesPerformanceService = {
  getBDEPerformance: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.teamId) queryParams.set('teamId', params.teamId);
    if (params.employeeId) queryParams.set('employeeId', params.employeeId);
    if (params.rankingPeriod) queryParams.set('rankingPeriod', params.rankingPeriod);
    if (params.year) queryParams.set('year', params.year);
    if (params.quarter) queryParams.set('quarter', params.quarter);
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    return axiosClient.get(`${BASE_PATH}/bde?${queryParams.toString()}`);
  },

  getISEPerformance: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.teamId) queryParams.set('teamId', params.teamId);
    if (params.employeeId) queryParams.set('employeeId', params.employeeId);
    if (params.rankingPeriod) queryParams.set('rankingPeriod', params.rankingPeriod);
    if (params.year) queryParams.set('year', params.year);
    if (params.quarter) queryParams.set('quarter', params.quarter);

    return axiosClient.get(`${BASE_PATH}/ise?${queryParams.toString()}`);
  },

  getTeamPerformance: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.teamId) queryParams.set('teamId', params.teamId);
    if (params.rankingPeriod) queryParams.set('rankingPeriod', params.rankingPeriod);

    return axiosClient.get(`${BASE_PATH}/team?${queryParams.toString()}`);
  },

  getBranchPerformance: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.branchId) queryParams.set('branchId', params.branchId);
    if (params.rankingPeriod) queryParams.set('rankingPeriod', params.rankingPeriod);

    return axiosClient.get(`${BASE_PATH}/branch?${queryParams.toString()}`);
  },

  getPerformanceRankings: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.set('companyId', params.companyId);
    if (params.rankingPeriod) queryParams.set('rankingPeriod', params.rankingPeriod);
    if (params.branchId) queryParams.set('branchId', params.branchId);

    return axiosClient.get(`${BASE_PATH}/rankings?${queryParams.toString()}`);
  }
};
