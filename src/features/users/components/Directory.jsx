import React from 'react';
import Table from '../../../shared/components/elements/Table';
import { User, Mail, Shield, Building } from 'lucide-react';

const Directory = ({ users, isLoading }) => {
  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail size={12} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (_, row) => {
        const roleName = row.userRoles?.[0]?.role?.name || 'No Role';
        return (
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Shield size={14} className="text-slate-400" />
            {roleName}
          </div>
        )
      }
    },
    {
      header: 'Branch',
      accessor: 'branch',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Building size={14} className="text-slate-400" />
          {row.branch?.name || 'All Branches'}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <Table 
        columns={columns} 
        data={users} 
        isLoading={isLoading} 
        emptyMessage="No users found in directory."
      />
    </div>
  );
};

export default Directory;
