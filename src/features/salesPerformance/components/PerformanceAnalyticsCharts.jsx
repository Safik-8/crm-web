// crm-web/src/features/salesPerformance/components/PerformanceAnalyticsCharts.jsx

import React from 'react';
import { BarChart3, Layers } from 'lucide-react';
import { CrmFunnelChart, CrmBarChart } from '../../../shared/components/charts';
import {
  toPipelineFunnelData,
  toTeamRevenueBarData,
} from '../../../shared/utils/chartDataTransformers';

export default function PerformanceAnalyticsCharts({ bdeData = [], teamData = [] }) {
  const funnelData = toPipelineFunnelData(bdeData);
  const teamRevenueData = toTeamRevenueBarData(teamData);

  const teamBarSeries = [
    {
      dataKey: 'revenue',
      name: 'Revenue',
      fill: '#f97316',
      radius: [6, 6, 0, 0],
      barSize: 36,
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-slate-900 p-3 rounded-xl shadow-md text-xs border border-slate-200">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          <p className="font-extrabold text-orange-600">
            {payload[0].name === 'Revenue' || payload[0].dataKey === 'revenue'
              ? `₹${Number(payload[0].value).toLocaleString('en-IN')}`
              : `${payload[0].value} count`}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalLeads = bdeData.reduce((acc, curr) => acc + (curr.leadsAssigned || 0), 0);
  const dealsWon = bdeData.reduce((acc, curr) => acc + (curr.dealsWon || 0), 0);

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

        <CrmFunnelChart
          data={funnelData}
          height={256}
          barSize={26}
          showConversionBadge={false}
          emptyMessage="No sales funnel data available for period."
        />
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
          <CrmBarChart
            data={teamRevenueData}
            xKey="name"
            bars={teamBarSeries}
            layout="horizontal"
            height="100%"
            formatYAxis={(val) => `₹${val / 1000}k`}
            customTooltip={<CustomTooltip />}
            emptyMessage="No team revenue metrics available for period."
          />
        </div>
      </div>
    </div>
  );
}
