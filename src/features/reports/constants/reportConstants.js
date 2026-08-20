// Centralized report categories configuration (Issue 2)
export const REPORT_CATEGORIES = [
  { id: "LEAD_REPORT", category: "LEADS" },
  { id: "TEAM_PERFORMANCE_REPORT", category: "TEAM" },
  { id: "OPPORTUNITY_REPORT", category: "OPPORTUNITY" },
  { id: "DEAL_REPORT", category: "DEALS" },
  { id: "REVENUE_REPORT", category: "FINANCE" },
  { id: "CUSTOMER_REPORT", category: "CUSTOMER" }
];

// Helper mapping for category titles
export const CATEGORY_METADATA = {
  LEADS: { label: 'Leads Reports', description: 'Track lead sources, volume, and qualification status distribution.' },
  TEAM: { label: 'Team Performance', description: 'Track agent conversions, assigned leads, and total performance value.' },
  OPPORTUNITY: { label: 'Opportunities & Stages', description: 'Analyze opportunities pipelines, average probabilities, and expected revenue.' },
  DEALS: { label: 'Deals & Outcome', description: 'Analyze outcome statuses, conversion rates, and reason distributions.' },
  FINANCE: { label: 'Revenue & Payments', description: 'Track billing summaries, product revenue values, and payment status.' },
  CUSTOMER: { label: 'Customers Reports', description: 'Detailed analysis of customer acquisition, status, and purchased product value.' }
};

// Map of system report types to their details
export const SYSTEM_REPORTS_METADATA = {
  LEAD_REPORT: {
    title: 'Leads Summary & Distribution',
    description: 'Detailed analysis of leads by status, courses, and sources.',
    category: 'LEADS',
    columns: [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Mobile', accessorKey: 'mobile' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Status', accessorKey: 'status', cell: (row) => row.status?.name || 'N/A' },
      { header: 'Source', accessorKey: 'source', cell: (row) => row.source?.name || 'N/A' },
      { header: 'Interested Course', accessorKey: 'course', cell: (row) => row.course?.name || 'N/A' },
      { header: 'Qualified', accessorKey: 'isQualified', cell: (row) => row.isQualified ? 'Yes' : 'No' },
      { header: 'Created At', accessorKey: 'createdAt', cell: (row) => new Date(row.createdAt).toLocaleDateString() }
    ]
  },
  OPPORTUNITY_REPORT: {
    title: 'Opportunities Pipeline Analysis',
    description: 'Monitor opportunities, stages, probability rates, and expected revenues.',
    category: 'OPPORTUNITY',
    columns: [
      { header: 'Opportunity Name', accessorKey: 'opportunityName' },
      { header: 'Lead', accessorKey: 'lead', cell: (row) => row.lead?.name || 'N/A' },
      { header: 'Product/Course', accessorKey: 'product', cell: (row) => row.product?.name || 'N/A' },
      { header: 'Stage', accessorKey: 'stage', cell: (row) => row.stage?.name || 'N/A' },
      { header: 'Expected Revenue', accessorKey: 'expectedRevenue', cell: (row) => `₹${Number(row.expectedRevenue || 0).toLocaleString('en-IN')}` },
      { header: 'Probability', accessorKey: 'probabilityPercentage', cell: (row) => `${row.probabilityPercentage}%` },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Closing Date', accessorKey: 'closingDate', cell: (row) => new Date(row.closingDate).toLocaleDateString() }
    ]
  },
  DEAL_REPORT: {
    title: 'Deals & Conversions',
    description: 'Won and lost deals, deal values, and win/loss reason frequencies.',
    category: 'DEALS',
    columns: [
      { header: 'Deal Number', accessorKey: 'dealNumber' },
      { header: 'Opportunity', accessorKey: 'opportunity', cell: (row) => row.opportunity?.opportunityName || 'N/A' },
      { header: 'Customer/Lead', accessorKey: 'lead', cell: (row) => row.lead?.name || 'N/A' },
      { header: 'Final Amount', accessorKey: 'finalAmount', cell: (row) => `₹${Number(row.finalAmount || 0).toLocaleString('en-IN')}` },
      { header: 'Outcome', accessorKey: 'outcome' },
      { header: 'Closed By', accessorKey: 'closedBy', cell: (row) => row.closedBy?.name || 'N/A' },
      { header: 'Closing Date', accessorKey: 'closingDate', cell: (row) => new Date(row.closingDate).toLocaleDateString() }
    ]
  },
  REVENUE_REPORT: {
    title: 'Revenue Breakdown & Payments',
    description: 'Branch revenues, product performance, and payment statuses.',
    category: 'FINANCE',
    columns: [
      { header: 'Deal Number', accessorKey: 'deal', cell: (row) => row.deal?.dealNumber || 'N/A' },
      { header: 'Customer', accessorKey: 'customer', cell: (row) => row.customer?.customerName || 'N/A' },
      { header: 'Course/Product', accessorKey: 'product', cell: (row) => row.product?.name || 'N/A' },
      { header: 'Revenue Amount', accessorKey: 'revenueAmount', cell: (row) => `₹${Number(row.revenueAmount || 0).toLocaleString('en-IN')}` },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
      { header: 'Revenue Date', accessorKey: 'revenueDate', cell: (row) => new Date(row.revenueDate).toLocaleDateString() }
    ]
  },
  TEAM_PERFORMANCE_REPORT: {
    title: 'Team Conversions & KPI Metrics',
    description: 'Measure conversion rates, assigned leads, targets, and total revenue.',
    category: 'TEAM',
    columns: [
      { header: 'Employee', accessorKey: 'employeeName' },
      { header: 'Branch', accessorKey: 'branchName' },
      { header: 'Team', accessorKey: 'teamName' },
      { header: 'Leads Assigned', accessorKey: 'leadsAssigned' },
      { header: 'Deals Closed', accessorKey: 'dealsClosed' },
      { header: 'Total Revenue', accessorKey: 'totalRevenue', cell: (row) => `₹${Number(row.totalRevenue || 0).toLocaleString('en-IN')}` },
      { header: 'Conversion Rate', accessorKey: 'conversionRate', cell: (row) => `${row.conversionRate}%` }
    ]
  },
  CUSTOMER_REPORT: {
    title: 'Customers Summary & Acquisition',
    description: 'Detailed analysis of customers by status, purchased products, and value.',
    category: 'CUSTOMER',
    columns: [
      { header: 'Customer Name', accessorKey: 'customerName' },
      { header: 'Customer Code', accessorKey: 'customerCode' },
      { header: 'Contact', accessorKey: 'contactNumber' },
      { header: 'Email', accessorKey: 'email', cell: (row) => row.email || 'N/A' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Product Purchased', accessorKey: 'purchasedProduct', cell: (row) => row.purchasedProduct?.name || 'N/A' },
      { header: 'Total Revenue', accessorKey: 'totalRevenue', cell: (row) => `₹${Number(row.totalRevenue || 0).toLocaleString('en-IN')}` },
      { header: 'Purchase Date', accessorKey: 'purchaseDate', cell: (row) => new Date(row.purchaseDate).toLocaleDateString() }
    ]
  }
};
