import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualifyLead, getQualificationHistory } from '../services/qualificationService';
import { toast } from '../../../shared/utils/toast';
import { LEAD_KEYS } from './useLeads'; // If exported, or just invalidate 'leads'

export const useQualifyLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }) => qualifyLead(leadId, data),
    onSuccess: (res, variables) => {
      // Invalidate both lists and detail queries
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      const status = res?.qualification?.status || res?.data?.qualification?.status || variables?.data?.status;
      let msg = 'Lead qualification evaluation saved';
      if (status === 'QUALIFIED') {
        msg = 'Lead qualified successfully! 🎉';
      } else if (status === 'NOT_QUALIFIED') {
        msg = 'Lead evaluated and marked as Not Qualified';
      } else if (status === 'ON_HOLD') {
        msg = 'Lead qualification placed On Hold';
      }
      toast.success(msg);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to qualify lead';
      toast.error(msg);
    }
  });
};

export const useLeadQualificationHistoryQuery = (leadId) => {
  return useQuery({
    queryKey: ['leads', leadId, 'qualification-history'],
    queryFn: () => getQualificationHistory(leadId),
    enabled: !!leadId,
  });
};
