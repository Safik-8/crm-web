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

  // Preserve any extra query params that might have been appended (e.g. ?tab=)
  const tab = searchParams.get('tab');

  const to = tab
    ? `/leads?leadId=${leadId}&tab=${encodeURIComponent(tab)}`
    : `/leads?leadId=${leadId}`;

  return <Navigate to={to} replace />;
};

export default LeadDeepLinkRedirect;
