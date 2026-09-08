import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ShoppingBag, PieChart, Users } from 'lucide-react';
import { useFormatters } from '../../../shared/hooks/useFormatters';

export const RevenueSummaryCards = ({ metrics = {}, period = 'ALL', isLoading = false }) => {
  const { formatCurrency } = useFormatters();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 border border-slate-200/80 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    totalRevenue = 0,
    revenueGrowthPct = 0,
    monthlyRevenue = 0,
    monthlyGrowthPct = 0,
    quarterlyRevenue = 0,
    yearlyRevenue = 0,
    averageDealSize = 0,
    totalDeals = 0
  } = metrics;

  const isCustomRange = period === 'CUSTOM';

  const cards = isCustomRange
    ? [
        {
          title: 'Period Revenue',
          value: formatCurrency(totalRevenue),
          growth: revenueGrowthPct,
          growthLabel: 'vs prev period',
          icon: DollarSign,
          iconBg: 'bg-orange-50 text-orange-600'
        },
        {
          title: 'Deals Won',
          value: `${totalDeals}`,
          subtitle: 'Deals closed in selected period',
          icon: ShoppingBag,
          iconBg: 'bg-blue-50 text-blue-600'
        },
        {
          title: 'Period Growth',
          value: `${revenueGrowthPct >= 0 ? '+' : ''}${revenueGrowthPct}%`,
          subtitle: 'Revenue growth vs prior period',
          icon: Calendar,
          iconBg: 'bg-purple-50 text-purple-600'
        },
        {
          title: 'Average Deal Size (ADS)',
          value: formatCurrency(averageDealSize),
          subtitle: 'Per won deal in selected period',
          icon: Users,
          iconBg: 'bg-amber-50 text-amber-600'
        }
      ]
    : [
        {
          title: 'Total Revenue',
          value: formatCurrency(totalRevenue),
          growth: revenueGrowthPct,
          growthLabel: 'vs prev period',
          icon: DollarSign,
          iconBg: 'bg-orange-50 text-orange-600'
        },
        {
          title: 'Monthly Revenue',
          value: formatCurrency(monthlyRevenue),
          growth: monthlyGrowthPct,
          growthLabel: 'vs prev month',
          icon: Calendar,
          iconBg: 'bg-blue-50 text-blue-600'
        },
        {
          title: 'Quarterly Revenue',
          value: formatCurrency(quarterlyRevenue),
          subtitle: `Yearly: ${formatCurrency(yearlyRevenue)}`,
          icon: PieChart,
          iconBg: 'bg-purple-50 text-purple-600'
        },
        {
          title: 'Average Deal Size (ADS)',
          value: formatCurrency(averageDealSize),
          subtitle: `${totalDeals} Total Deals Won`,
          icon: ShoppingBag,
          iconBg: 'bg-amber-50 text-amber-600'
        }
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isPositive = card.growth >= 0;

        return (
          <div
            key={idx}
            className="bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {card.growth !== undefined ? (
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isPositive
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-orange-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-rose-600" />
                    )}
                    {isPositive ? `+${card.growth}%` : `${card.growth}%`}
                  </span>
                  <span className="text-slate-400">{card.growthLabel}</span>
                </div>
              ) : (
                <span className="text-slate-500 font-medium">{card.subtitle}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
