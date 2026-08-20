const fs = require('fs');
const path = require('path');

const files = [
  'pages/RevenueReportPage.jsx',
  'components/RevenueTrendChart.jsx',
  'components/RevenueSummaryCards.jsx',
  'components/QuarterlyRevenueTable.jsx',
  'components/MonthlyRevenueTable.jsx',
  'components/BranchRevenueTable.jsx',
  'components/ProductRevenueTable.jsx',
  'components/TeamRevenueTable.jsx',
  'components/RevenueFilterBar.jsx'
];

const basePath = 'c:/Users/InteL/Desktop/crm project/crm-web/src/features/revenueReport';

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace text classes
    content = content.replace(/emerald/g, 'orange');
    
    // Replace hex codes
    content = content.replace(/#10b981/g, '#F86F03'); // emerald-500 -> custom orange
    content = content.replace(/#059669/g, '#DE5D02'); // emerald-600 -> custom orange darker
    content = content.replace(/#047857/g, '#C24102'); // emerald-700 -> custom orange darkest
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
});
