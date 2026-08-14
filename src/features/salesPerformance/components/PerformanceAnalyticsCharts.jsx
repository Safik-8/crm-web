// crm-web/src/features/salesPerformance/components/PerformanceAnalyticsCharts.jsx

import React from 'react';
import { BarChart3, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function PerformanceAnalyticsCharts({ bdeData = [], teamData = [] }) {
  // Aggregate sales funnel metrics
  const totalLeads = bdeData.reduce((acc, curr) => acc + (curr.leadsAssigned || 0), 0);
  const qualified = bdeData.reduce((acc, curr) => acc + (curr.qualifiedLeads || 0), 0);
  const opportunities = bdeData.reduce((acc, curr) => acc + (curr.opportunitiesCreated || 0), 0);
  const dealsWon = bdeData.reduce((acc, curr) => acc + (curr.dealsWon || 0), 0);

  const funnelData = [
    { stage: 'Assigned Leads', count: totalLeads, color: '#6366f1' },
    { stage: 'Qualified Leads', count: qualified, color: '#3b82f6' },
    { stage: 'Opportunities', count: opportunities, color: '#f59e0b' },
    { stage: 'Deals Won', count: dealsWon, color: '#10b981' }
  ];

  // Team revenue dataset
  const teamRevenueData = teamData.map((t) => ({
    name: t.teamName || t.teamCode || 'Team',
    revenue: t.totalRevenue || 0,
    deals: t.dealsWon || 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-slate-900 p-3 rounded-xl shadow-md text-xs border border-slate-200">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          <p className="font-extrabold text-orange-600">
            {payload[0].name === 'revenue' 
              ? `₹${Number(payload[0].value).toLocaleString('en-IN')}`
              : `${payload[0].value} count`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Sales Pipeline Conversion Funnel */}
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Pipeline Conversion Funnel</h3>
              <p className="text-[11px] text-slate-500 font-medium">Stage-by-stage conversion flow</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {totalLeads > 0 ? `${((dealsWon / totalLeads) * 100).toFixed(1)}% Total Conv` : '0%'}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={26}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Team Revenue Contribution */}
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Team Revenue Contribution</h3>
              <p className="text-[11px] text-slate-500 font-medium">Comparative sales revenue by team</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {teamData.length} Teams
          </span>
        </div>

        <div className="h-64 w-full">
          {teamRevenueData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No team revenue metrics available for period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamRevenueData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
