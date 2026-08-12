import React, { useState, useEffect } from 'react';
import { FileText, Filter, Plus, Search, Eye, Trash2, ShieldAlert, Award, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { apiClient } from '../../../lib/api/api';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Pagination from '../../../shared/components/elements/Pagination';
import PageHeader from '../../../shared/components/modules/PageHeader';
import ProposalModal from '../components/ProposalModal';
import ProposalDetailDrawer from '../components/ProposalDetailDrawer';
import { getProposals, createProposal, updateProposal, updateProposalStatus, deleteProposal } from '../services/proposalService';
import { toast } from '../../../shared/utils/toast';

const STATUS_META = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  SENT: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function ProposalsPage() {
  const { user } = useAuth();
  const rank = user?.primaryRoleRank ?? 0;

  // List State
  const [proposals, setProposals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [editProposalData, setEditProposalData] = useState(null);

  const fetchProposals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProposals({
        page,
        limit: 15,
        search,
        status,
        dateFrom,
        dateTo
      });
      setProposals(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total || 0);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProposals();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    // Directly fetch after clearing
    setTimeout(() => fetchProposals(), 50);
  };

  // Status transitions
  const handleStatusChange = async (id, nextStatus) => {
    try {
      await updateProposalStatus(id, nextStatus);
      toast.success(`Proposal marked as ${nextStatus.toLowerCase()} successfully`);
      fetchProposals();
      // If drawer is open, refresh detail
      if (selectedProposal && selectedProposal.id === id) {
        apiClient(`/proposals/${id}`).then(res => {
          setSelectedProposal(res.data);
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update proposal status');
    }
  };

  // Create or update revision submission
  const handleProposalSubmit = async (payload) => {
    try {
      if (editProposalData) {
        // Edit/Revise
        await updateProposal(editProposalData.id, payload);
        toast.success('Proposal revised successfully');
      } else {
        // Create new
        await createProposal(payload);
        toast.success('Proposal created successfully');
      }
      setIsModalOpen(false);
      setEditProposalData(null);
      fetchProposals();
      if (selectedProposal) {
        // Refresh details drawer if it was open
        const detailRes = await apiClient(`/proposals/${selectedProposal.id}`);
        setSelectedProposal(detailRes.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit proposal');
    }
  };

  // Triggered from drawer
  const handleEditRevision = (proposal) => {
    setIsDrawerOpen(false);
    setEditProposalData(proposal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) return;
    try {
      await deleteProposal(id);
      toast.success('Proposal deleted successfully');
      setIsDrawerOpen(false);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      toast.error(err.message || 'Failed to delete proposal');
    }
  };

  const handleRowClick = async (proposal) => {
    try {
      const res = await apiClient(`/proposals/${proposal.id}`);
      setSelectedProposal(res.data);
      setIsDrawerOpen(true);
    } catch (err) {
      toast.error('Failed to load proposal details');
    }
  };

  const columns = [
    {
      header: 'Proposal Number',
      accessor: 'proposalNumber',
      render: (row) => (
        <span className="font-bold text-slate-800">{row.proposalNumber}</span>
      )
    },
    {
      header: 'Opportunity Name',
      accessor: (row) => row.opportunity?.opportunityName || '—'
    },
    {
      header: 'Lead Name',
      accessor: (row) => row.opportunity?.lead?.name || '—'
    },
    {
      header: 'Final Amount',
      accessor: 'finalAmount',
      render: (row) => (
        <span className="font-semibold text-slate-900">₹{Number(row.finalAmount).toLocaleString()}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const meta = STATUS_META[row.status] || STATUS_META.DRAFT;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
              {meta.label}
            </span>
            {row.isExpired && row.status !== 'ACCEPTED' && row.status !== 'REJECTED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Expired
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Valid Till',
      accessor: 'validTill',
      render: (row) => new Date(row.validTill).toLocaleDateString()
    },
    {
      header: 'Created By',
      accessor: (row) => row.createdBy?.name || '—'
    },
    {
      header: 'Actions',
      isActionColumn: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
          >
            <Eye size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Proposals & Quotations"
        subtitle="Manage and track commercial proposals and pricing version revisions."
        icon={FileText}
      >
        {rank >= 40 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditProposalData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Generate Proposal
          </Button>
        )}
      </PageHeader>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by proposal number or opportunity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="w-[180px]">
            <SelectField
              placeholder="All Statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SENT', label: 'Sent' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="contained" color="primary" type="submit">
              Search
            </Button>
            <Button
              variant="outlined"
              color="primary"
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Main Proposals List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={proposals}
          loadingState={loading ? 'loading' : error ? 'error' : proposals.length === 0 ? 'empty' : 'success'}
          errorMessage={error}
          onRetry={fetchProposals}
          emptyTitle="No Proposals Found"
          emptyDescription="Start by generating a commercial proposal for an opportunity."
        />
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Proposal Revision / Generation Form Modal */}
      <ProposalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProposalData(null);
        }}
        onSubmit={handleProposalSubmit}
        initialData={editProposalData}
      />

      {/* Detail Slideover Drawer */}
      <ProposalDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal}
        onStatusChange={handleStatusChange}
        onEditRevision={handleEditRevision}
        onDelete={handleDelete}
        currentUserRoleRank={rank}
      />
    </div>
  );
}
