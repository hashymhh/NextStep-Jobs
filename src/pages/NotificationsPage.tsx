import React from 'react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../lib/notificationsStore';
import { NotificationFilter, formatNotificationTime } from '../features/notifications/notificationUtils';
import {
  Bell,
  CheckCheck,
  ThumbsUp,
  UserCheck,
  Briefcase,
  Heart,
  MessageCircle,
  Repeat,
  Sparkles,
  AtSign,
  Trash2,
  Check,
  Settings,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    filteredNotifications,
    unreadCount,
    activeFilter,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    removeNotif,
  } = useNotifications();

  const navigate = useNavigate();

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }

    if (notif.entity_type === 'post' && notif.entity_id) {
      navigate(`/?post=${notif.entity_id}`);
    } else if (notif.entity_type === 'job' && notif.entity_id) {
      navigate(`/jobs?id=${notif.entity_id}`);
    } else if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      navigate('/network');
    } else if (notif.actor?.handle) {
      navigate(`/in/${notif.actor.handle}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reaction':
        return <ThumbsUp className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'repost':
        return <Repeat className="w-3.5 h-3.5 text-purple-600" />;
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-amber-600" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserCheck className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'job_alert':
      case 'application_status':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      case 'profile_view':
        return <Eye className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <Shell
      leftRail={
        <div className="space-y-3">
          <Card padding="md">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              Manage notifications
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              You have <strong className="text-[#0A66C2] dark:text-[#71B7FB]">{unreadCount} unread</strong> notification{unreadCount === 1 ? '' : 's'}.
            </p>
            <Link
              to="/settings"
              className="text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Notification Settings
            </Link>
          </Card>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Header with Filter Tabs & Actions */}
        <Card padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('my_posts')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                activeFilter === 'my_posts'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              My Posts
            </button>
            <button
              onClick={() => setActiveFilter('mentions')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                activeFilter === 'mentions'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Mentions
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  toast.success('All notifications marked as read');
                }}
                className="flex items-center gap-1.5 text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>
        </Card>

        {/* Notifications List */}
        <Card padding="none" className="overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No notifications in this filter
              </p>
              <p className="text-xs text-gray-400 mt-1">
                When people interact with you or your posts, updates will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer group ${
                  !notif.read
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              >
                {/* Left: Avatar or Icon with reaction badge */}
                <div className="relative shrink-0">
                  {notif.actor ? (
                    <Avatar
                      name={`${notif.actor.first_name} ${notif.actor.last_name}`}
                      src={notif.actor.avatar_url}
                      size="md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#0A66C2] flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}

                  {/* Corner indicator badge */}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#1B1F23] border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xs">
                    {getNotificationIcon(notif.type)}
                  </span>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formatNotificationTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>

                  {/* Action link hints if applicable */}
                  {notif.type === 'connection_request' && (
                    <div className="mt-2 flex gap-2">
                      <Link
                        to="/network"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 bg-[#0A66C2] text-white text-[11px] font-semibold rounded-full hover:bg-[#004182]"
                      >
                        Respond to Request
                      </Link>
                    </div>
                  )}
                </div>

                {/* Right: Unread Dot & Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {!notif.read && (
                    <span
                      title="Unread"
                      className="w-2.5 h-2.5 rounded-full bg-[#0A66C2] dark:bg-[#71B7FB]"
                    />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotif(notif.id);
                      toast.info('Notification dismissed');
                    }}
                    title="Delete notification"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
};
