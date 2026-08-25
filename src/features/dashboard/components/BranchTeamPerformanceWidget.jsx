// crm-web/src/features/dashboard/components/BranchTeamPerformanceWidget.jsx
import React, { useState, useMemo } from 'react';
import {
  Award, Users, ArrowUpDown, ChevronRight, Search, X,
  LayoutGrid, List, Trophy, ArrowUpRight, TrendingUp, CheckCircle,
} from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import { useNavigate } from 'react-router-dom';

const RANK_BADGES = {
  1: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: '🥇', label: '#1' },
  2: { bg: 'bg-slate-200 text-slate-800 border-slate-300', icon: '🥈', label: '#2' },
  3: { bg: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🥉', label: '#3' },
};

const SORT_OPTIONS = [
  { id: 'revenue', name: 'Sort: Highest Revenue' },
  { id: 'wonDeals', name: 'Sort: Most Deals Won' },
  { id: 'leads', name: 'Sort: Most Leads' },
];

const BranchTeamPerformanceWidget = ({ teamMembers = [], isLoading = false }) => {
  const [selectedTeam, setSelectedTeam]   = useState('ALL');
  const [sortBy, setSortBy]               = useState('revenue'); // 'revenue' | 'wonDeals' | 'leads'
  const [viewMode, setViewMode]           = useState('cards');   // 'cards' | 'table'
  const [isDrawerOpen, setIsDrawerOpen]   = useState(false);
  const [drawerSearch, setDrawerSearch]   = useState('');
  const navigate = useNavigate();

  // Extract unique teams for dropdown
  const uniqueTeams = useMemo(() => {
    const teams = new Set();
    teamMembers.forEach((m) => {
      if (m.teamName) teams.add(m.teamName);
    });
    return Array.from(teams);
  }, [teamMembers]);

  const teamOptions = useMemo(() => {
    return [
      { id: 'ALL', name: `All Teams (${teamMembers.length} Reps)` },
      ...uniqueTeams.map((t) => ({ id: t, name: t })),
    ];
  }, [uniqueTeams, teamMembers]);

  // Filter and sort members
  const processedMembers = useMemo(() => {
    let list = [...teamMembers];

    // Filter by team
    if (selectedTeam !== 'ALL') {
      list = list.filter((m) => m.teamName === selectedTeam);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'revenue')  return (b.revenue || 0) - (a.revenue || 0);
      if (sortBy === 'wonDeals') return (b.wonDealsCount || 0) - (a.wonDealsCount || 0);
      if (sortBy === 'leads')    return (b.leadsCount || 0) - (a.leadsCount || 0);
      return 0;
    });

    return list;
  }, [teamMembers, selectedTeam, sortBy]);

  // Show top 6 on dashboard widget
  const displayedMembers = processedMembers.slice(0, 6);
  const hasMore = processedMembers.length > 6;

  // Drawer filtered list (supports text search)
  const drawerList = useMemo(() => {
    if (!drawerSearch.trim()) return processedMembers;
    const q = drawerSearch.trim().toLowerCase();
    return processedMembers.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const team = (m.teamName || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || team.includes(q) || role.includes(q);
    });
  }, [processedMembers, drawerSearch]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 shadow-sm p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-100 shadow-sm p-6">
        {/* Widget Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-2xs">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Team Performance & Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contribution and pipeline conversion by representative
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Team Filter Dropdown */}
            {uniqueTeams.length > 1 && (
              <div className="w-48">
                <SelectField
                  value={selectedTeam}
                  onChange={(val) => setSelectedTeam(val)}
                  options={teamOptions}
                  searchable={false}
                />
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="w-48">
              <SelectField
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={SORT_OPTIONS}
                searchable={false}
              />
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200/60">
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'text'}
                size="small"
                onClick={() => setViewMode('cards')}
                sx={{
                  minWidth: '34px',
                  height: '34px',
                  padding: 0,
                  borderRadius: '0',
                  backgroundColor: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'cards' ? '#1E293B' : '#94A3B8',
                  boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': {
                    backgroundColor: viewMode === 'cards' ? '#FFFFFF' : '#F1F5F9',
                    color: '#0F172A',
                  },
                }}
                title="Card View"
              >
                <LayoutGrid size={15} />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'text'}
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  minWidth: '34px',
                  height: '34px',
                  padding: 0,
                  borderRadius: '0',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#1E293B' : '#94A3B8',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': {
                    backgroundColor: viewMode === 'table' ? '#FFFFFF' : '#F1F5F9',
                    color: '#0F172A',
                  },
                }}
                title="Table View"
              >
                <List size={15} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {processedMembers.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 bg-slate-50/50">
            <Users size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No representatives found</p>
            <p className="text-xs text-slate-400 mt-0.5">No active team members match the selected filter.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMembers.map((member, index) => {
              const rank = index + 1;
              const rankBadge = RANK_BADGES[rank];
              const isBde = member.role === 'BDE';

              return (
                <div
                  key={member.userId}
                  className={`p-4 border transition-all duration-150 flex flex-col gap-3 relative group ${
                    rank === 1
                      ? 'bg-gradient-to-br from-amber-50/40 to-white border-amber-200/80 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-orange-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Avatar, Names, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        {rankBadge && (
                          <span
                            className={`absolute -top-1.5 -left-1.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border shadow-2xs ${rankBadge.bg}`}
                          >
                            {rankBadge.label}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-orange-950 truncate">
                            {member.name}
                          </p>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase border shrink-0 ${
                              isBde
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                        {member.teamName && (
                          <p className="text-[10px] font-semibold text-orange-600 flex items-center gap-1 mt-0.5 truncate">
                            <Users size={10} className="text-orange-500 shrink-0" />
                            <span className="truncate">{member.teamName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3 Metric Pillars */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 text-center bg-slate-50/50 p-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Leads</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">{member.leadsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Won</p>
                      <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{member.wonDealsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Revenue</p>
                      <p className="text-xs font-extrabold text-blue-600 mt-0.5">₹{(member.revenue / 1000).toFixed(0)}k</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Leaderboard View */
          <div className="overflow-x-auto border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-center">Leads</th>
                  <th className="py-3 px-4 text-center">Deals Won</th>
                  <th className="py-3 px-4 text-right">Closed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMembers.map((member, index) => {
                  const rank = index + 1;
                  const rankBadge = RANK_BADGES[rank];
                  return (
                    <tr key={member.userId} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {rankBadge ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-extrabold ${rankBadge.bg}`}>
                            {rankBadge.icon} {rankBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-[11px] text-slate-400">{member.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <Users size={11} className="text-slate-400" />
                          {member.teamName || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{member.leadsCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{member.wonDealsCount}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                        ₹{member.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with "View All (N) Reps" if count > 6 or scalable drawer */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{Math.min(6, processedMembers.length)}</strong> of <strong>{processedMembers.length}</strong> representatives
          </span>

          {processedMembers.length > 6 ? (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsDrawerOpen(true)}
              endIcon={<ChevronRight size={14} />}
              sx={{
                borderRadius: '0',
                fontSize: '11px',
                fontWeight: 700,
                color: '#F86F03',
                borderColor: '#F86F03',
                '&:hover': {
                  borderColor: '#EA580C',
                  backgroundColor: '#FFF7ED',
                },
              }}
            >
              View All {processedMembers.length} Representatives
            </Button>
          ) : (
            <Button
              variant="text"
              size="small"
              onClick={() => setIsDrawerOpen(true)}
              endIcon={<ArrowUpRight size={13} />}
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#F86F03',
                padding: '2px 8px',
                '&:hover': {
                  backgroundColor: '#FFF7ED',
                },
              }}
            >
              Full Team Roster
            </Button>
          )}
        </div>
      </div>

      {/* Full Team Roster Slide-Over Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Branch Team Performance Roster"
        subtitle={`Complete leaderboard of ${processedMembers.length} representatives across all teams`}
        width={{ xs: '100%', sm: 600, md: 720 }}
      >
        <div className="flex flex-col h-full space-y-4">
          {/* Drawer Search & Team Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <SearchInput
              value={drawerSearch}
              onChange={setDrawerSearch}
              placeholder="Search by representative, email, team, or role..."
              className="w-full"
            />
            {uniqueTeams.length > 1 && (
              <div className="w-full sm:w-48">
                <SelectField
                  value={selectedTeam}
                  onChange={(val) => setSelectedTeam(val)}
                  options={teamOptions}
                  searchable={false}
                />
              </div>
            )}
          </div>

          {/* Drawer Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-3 px-3.5">Rank</th>
                  <th className="py-3 px-3.5">Representative</th>
                  <th className="py-3 px-3.5">Team</th>
                  <th className="py-3 px-3.5 text-center">Leads</th>
                  <th className="py-3 px-3.5 text-center">Deals Won</th>
                  <th className="py-3 px-3.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {drawerList.map((member, index) => {
                  const rank = index + 1;
                  const rankBadge = RANK_BADGES[rank];
                  return (
                    <tr key={member.userId} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-700">
                        {rankBadge ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-extrabold ${rankBadge.bg}`}>
                            {rankBadge.icon} {rankBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                          <Users size={10} className="text-slate-400" />
                          {member.teamName || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-slate-800">{member.leadsCount}</td>
                      <td className="py-3 px-3.5 text-center font-bold text-emerald-600">{member.wonDealsCount}</td>
                      <td className="py-3 px-3.5 text-right font-extrabold text-blue-600">
                        ₹{member.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default BranchTeamPerformanceWidget;
