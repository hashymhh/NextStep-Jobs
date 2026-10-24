import { AppNotification } from '../../types';

export type NotificationFilter = 'all' | 'my_posts' | 'mentions';

/**
 * Filter notifications by type category
 * - 'all': all notifications
 * - 'my_posts': reactions, comments, replies, reposts on the user's content
 * - 'mentions': mentions of the user in posts or comments
 */
export function filterNotifications(
  notifications: AppNotification[],
  filter: NotificationFilter
): AppNotification[] {
  switch (filter) {
    case 'my_posts':
      return notifications.filter((n) =>
        ['reaction', 'comment', 'reply', 'repost'].includes(n.type)
      );
    case 'mentions':
      return notifications.filter((n) => n.type === 'mention');
    case 'all':
    default:
      return notifications;
  }
}

/**
 * Computes the total unread notifications count
 */
export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Marks a single notification as read
 */
export function markNotificationAsRead(
  notifications: AppNotification[],
  notifId: string
): AppNotification[] {
  return notifications.map((n) =>
    n.id === notifId ? { ...n, read: true } : n
  );
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsAsRead(
  notifications: AppNotification[]
): AppNotification[] {
  return notifications.map((n) => ({ ...n, read: true }));
}

/**
 * Deletes a notification by ID
 */
export function deleteNotification(
  notifications: AppNotification[],
  notifId: string
): AppNotification[] {
  return notifications.filter((n) => n.id !== notifId);
}

/**
 * Formats a relative timestamp
 */
export function formatNotificationTime(timeStr: string): string {
  if (!timeStr) return 'Just now';
  // If already relative (e.g. '15m ago', '1h ago', '1d ago')
  if (timeStr.includes('ago') || timeStr.includes('now')) {
    return timeStr;
  }
  try {
    const date = new Date(timeStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  } catch {
    return timeStr;
  }
}
