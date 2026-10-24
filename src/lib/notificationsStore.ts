import { useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { DEMO_NOTIFICATIONS } from './seed/demoData';
import {
  filterNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationFilter,
} from '../features/notifications/notificationUtils';

const STORAGE_KEY = 'nextstep_v2_pk_notifications_store';
const EVENT_KEY = 'nextstep_v2_pk_notifications_updated';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEMO_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setNotifications(JSON.parse(saved));
      } catch {
        // ignore
      }
    };
    window.addEventListener(EVENT_KEY, handleSync);
    return () => window.removeEventListener(EVENT_KEY, handleSync);
  }, []);

  const saveNotifications = useCallback((newNotifs: AppNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifs));
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  }, []);

  const markAsRead = useCallback(
    (notifId: string) => {
      const updated = markNotificationAsRead(notifications, notifId);
      saveNotifications(updated);
    },
    [notifications, saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    const updated = markAllNotificationsAsRead(notifications);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const removeNotif = useCallback(
    (notifId: string) => {
      const updated = deleteNotification(notifications, notifId);
      saveNotifications(updated);
    },
    [notifications, saveNotifications]
  );

  const addNotification = useCallback(
    (newNotif: AppNotification) => {
      saveNotifications([newNotif, ...notifications]);
    },
    [notifications, saveNotifications]
  );

  const unreadCount = getUnreadCount(notifications);
  const filteredNotifications = filterNotifications(notifications, activeFilter);

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    activeFilter,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    removeNotif,
    addNotification,
  };
}
