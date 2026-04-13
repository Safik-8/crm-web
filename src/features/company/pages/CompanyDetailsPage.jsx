import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ChevronLeft } from 'lucide-react';
import GenericPage from '../../../shared/components/templates/GenericPage';

const CompanyDetailsPage = () => {
  const { id } = useParams();

  return (
    <GenericPage 
      title="Company Details" 
      description={`Deep dive into entity #${id}`} 
      icon={Building2}
    >
      <div className="space-y-6">
        <Link 
          to="/settings/company" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Registry
        </Link>
        
        <div className="bg-white p-12 rounded-2xl border border-slate-200/60 text-center">
          <p className="text-slate-500 font-medium">Detailed view for Company ID: <span className="text-primary font-bold">{id}</span> is under construction.</p>
        </div>
      </div>
    </GenericPage>
  );
};

export default CompanyDetailsPage;
