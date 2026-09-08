/**
 * LeadDeepLinkRedirect
 *
 * Backward-compatibility shim for notification action URLs that were generated
 * with the now-deprecated /leads/:id pattern (e.g. reminderJob before the
 * deep-link refactor).
 *
 * Transparently redirects:
 *   /leads/123          → /leads?leadId=123
 *   /leads/123?tab=xyz  → /leads?leadId=123&tab=xyz   (preserves tab hint)
 *
 * Uses <Navigate replace> so the /leads/:id URL is removed from browser history
 * and the Back button still works as expected.
 */
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

const LeadDeepLinkRedirect = () => {
  const { leadId } = useParams();
  const [searchParams] = useSearchParams();

  const tab = searchParams.get('tab');
  const filter = searchParams.get('filter') || searchParams.get('status');

  const params = new URLSearchParams();
  params.set('leadId', leadId);
  if (tab) params.set('tab', tab);
  if (filter) params.set('filter', filter);

  return <Navigate to={`/leads?${params.toString()}`} replace />;
};

export default LeadDeepLinkRedirect;
