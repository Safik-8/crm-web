/**
 * Resolves a normalized actionUrl for any notification, ensuring proper deep-linking
 * to the exact lead, tab (e.g. followups), and sub-filter (e.g. MISSED, PENDING, COMPLETED).
 *
 * @param {Object} notification - Notification object from DB or WebSocket
 * @returns {string} Fully resolved router path
 */
export const resolveNotificationActionUrl = (notification) => {
  if (!notification) return '/leads';

  const {
    actionUrl,
    notificationType,
    moduleName,
    message = '',
    leadId,
    relatedRecordId,
  } = notification;

  let targetLeadId = leadId;
  if (!targetLeadId && actionUrl) {
    const match = actionUrl.match(/\/leads\/([0-9]+)/) || actionUrl.match(/leadId=([0-9]+)/);
    if (match) targetLeadId = match[1];
  }
  if (!targetLeadId && (moduleName === 'LEAD' || moduleName === 'FOLLOWUP')) {
    targetLeadId = relatedRecordId;
  }

  // Detect if this is a follow-up related notification
  const rawMsg = typeof message === 'string' ? message : '';
  const notifType = typeof notificationType === 'string' ? notificationType : '';

  const isFollowup =
    moduleName === 'FOLLOWUP' ||
    notifType.startsWith('FOLLOWUP_') ||
    notifType === 'OVERDUE_ALERT' ||
    notifType === 'REMINDER' ||
    rawMsg.startsWith('[OVERDUE]') ||
    rawMsg.startsWith('[REMINDER]') ||
    rawMsg.startsWith('[SCHEDULED]') ||
    rawMsg.startsWith('[COMPLETED]') ||
    rawMsg.startsWith('[CANCELLED]') ||
    (actionUrl && actionUrl.includes('tab=followups'));

  if (isFollowup && targetLeadId) {
    let filter = 'ALL';
    if (
      notifType === 'FOLLOWUP_MISSED' ||
      notifType === 'OVERDUE_ALERT' ||
      rawMsg.startsWith('[OVERDUE]')
    ) {
      filter = 'MISSED';
    } else if (
      notifType === 'FOLLOWUP_REMINDER' ||
      notifType === 'REMINDER' ||
      rawMsg.startsWith('[REMINDER]') ||
      rawMsg.startsWith('[SCHEDULED]')
    ) {
      filter = 'PENDING';
    } else if (
      notifType === 'FOLLOWUP_COMPLETED' ||
      rawMsg.startsWith('[COMPLETED]')
    ) {
      filter = 'COMPLETED';
    } else if (
      notifType === 'FOLLOWUP_CANCELLED' ||
      rawMsg.startsWith('[CANCELLED]')
    ) {
      filter = 'CANCELLED';
    } else if (actionUrl && actionUrl.includes('filter=')) {
      const match = actionUrl.match(/filter=([A-Z_]+)/i);
      if (match) filter = match[1].toUpperCase();
    }

    return `/leads?leadId=${targetLeadId}&tab=followups&filter=${filter}`;
  }

  // If this points to a lead record without specific follow-up sub-tab
  if (targetLeadId && (!actionUrl || actionUrl.startsWith('/leads/'))) {
    return `/leads?leadId=${targetLeadId}`;
  }

  return actionUrl || '/leads';
};
