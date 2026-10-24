import React, { useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../lib/clerk/useAuth';
import { useTheme } from '../lib/theme/ThemeContext';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Trash2,
  Shield,
  Bell,
  Eye,
  Lock,
  User,
  UserX,
  CheckCircle2,
  Mail,
  Smartphone,
  Globe,
} from 'lucide-react';
import { PK_CURRENCY, PK_LOCALE, PK_TIMEZONE, formatTimePKT } from '../lib/locale/pakistan';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [blockedUsers, setBlockedUsers] = useState<string[]>(
    profile?.settings.blockedUsers || ['usr_demo_18']
  );
  const [emailNotifs, setEmailNotifs] = useState(profile?.settings.emailNotifications ?? true);
  const [jobAlerts, setJobAlerts] = useState(profile?.settings.jobAlerts ?? true);
  const [connectionNotifs, setConnectionNotifs] = useState(true);
  const [locale, setLocale] = useState(profile?.settings.locale || PK_LOCALE);
  const [currency, setCurrency] = useState(profile?.settings.currency || PK_CURRENCY);
  const [timezone, setTimezone] = useState(profile?.settings.timezone || PK_TIMEZONE);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nextstep-profile-${profile?.handle || 'data'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Your complete account archive has been downloaded');
  };

  const handleUnblock = (userId: string) => {
    const updated = blockedUsers.filter((id) => id !== userId);
    setBlockedUsers(updated);
    if (profile) {
      updateProfile({
        settings: {
          ...profile.settings,
          blockedUsers: updated,
        },
      });
    }
    toast.info('User unblocked');
  };

  const handleSaveNotifications = () => {
    if (profile) {
      updateProfile({
        settings: {
          ...profile.settings,
          emailNotifications: emailNotifs,
          jobAlerts: jobAlerts,
        },
      });
      toast.success('Notification preferences updated');
    }
  };

  return (
    <Shell hideRightRail>
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Settings &amp; Privacy
          </h1>
          <p className="text-xs text-gray-500">
            Control your profile discovery, appearance, security, and notification channels.
          </p>
        </div>

        {/* 1. Account & Identity */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Account Preferences
            </h2>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar
                name={`${profile?.first_name} ${profile?.last_name}`}
                src={profile?.avatar_url}
                size="md"
              />
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#0A66C2] dark:text-[#71B7FB] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  {profile?.role} Account {profile?.verified ? '• Verified' : ''}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast.info('Use the Persona Switcher in the top bar or Me menu to switch roles.')
              }
            >
              Manage Identity
            </Button>
          </div>
        </Card>

        {/* Regional, Currency (PKR) & Timezone (PKT) Preferences */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                Regional, Currency &amp; Timezone (Pakistan Market)
              </h2>
            </div>
            <span className="text-[11px] text-gray-500 tabular-nums">
              Current clock: {formatTimePKT(new Date())}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Default Locale
              </label>
              <select
                value={locale}
                onChange={(e) => {
                  setLocale(e.target.value);
                  if (profile) {
                    updateProfile({ settings: { ...profile.settings, locale: e.target.value } });
                  }
                  toast.success(`Locale updated to ${e.target.value}`);
                }}
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="en-PK">English (Pakistan · en-PK)</option>
                <option value="en-US">English (International · en-US)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Salary &amp; Offer Currency
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  if (profile) {
                    updateProfile({ settings: { ...profile.settings, currency: e.target.value } });
                  }
                  toast.success(`Default currency set to ${e.target.value}`);
                }}
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="PKR">PKR — Pakistani Rupee (Rs)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Standard Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  if (profile) {
                    updateProfile({ settings: { ...profile.settings, timezone: e.target.value } });
                  }
                  toast.success(`Timezone aligned to ${e.target.value}`);
                }}
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="Asia/Karachi">Pakistan Standard Time (PKT · UTC+5)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 2. Display & Appearance Theme */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Display &amp; Theme
            </h2>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Choose how NextStep appears across your devices.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <button
              onClick={() => {
                setTheme('light');
                toast.success('Light theme activated');
              }}
              className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/30 font-bold shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <span className="text-xs">Light</span>
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                toast.success('Dark theme activated');
              }}
              className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/30 font-bold shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              onClick={() => {
                setTheme('system');
                toast.success('System theme activated');
              }}
              className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/30 font-bold shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <Laptop className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <span className="text-xs">Auto</span>
            </button>
          </div>
        </Card>

        {/* 3. Visibility & Privacy */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Visibility &amp; Networking Permissions
            </h2>
          </div>

          <div className="space-y-4 text-xs divide-y divide-gray-100 dark:divide-gray-800">
            {/* Profile Visibility */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Profile Visibility
                </p>
                <p className="text-gray-500 text-xs">
                  Choose who can discover and view your full profile details
                </p>
              </div>
              <select
                value={profile?.settings.profileVisibility || 'public'}
                onChange={(e) => {
                  updateProfile({
                    settings: {
                      ...profile!.settings,
                      profileVisibility: e.target.value as any,
                    },
                  });
                  toast.success('Visibility preference saved');
                }}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="public">Public to Everyone</option>
                <option value="connections">Connections Only</option>
                <option value="private">Private (Only You)</option>
              </select>
            </div>

            {/* Messaging */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Who can message me
                </p>
                <p className="text-gray-500 text-xs">
                  Direct message requests permissions from other professionals
                </p>
              </div>
              <select
                value={profile?.settings.whoCanMessage || 'anyone'}
                onChange={(e) => {
                  updateProfile({
                    settings: {
                      ...profile!.settings,
                      whoCanMessage: e.target.value as any,
                    },
                  });
                  toast.success('Messaging permissions saved');
                }}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="anyone">Anyone on NextStep</option>
                <option value="connections">Connections Only</option>
              </select>
            </div>

            {/* Connection Visibility */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Who can see your connections
                </p>
                <p className="text-gray-500 text-xs">
                  Allow your connections to see your complete connections list
                </p>
              </div>
              <select
                value={profile?.settings.whoCanSeeConnections || 'anyone'}
                onChange={(e) => {
                  updateProfile({
                    settings: {
                      ...profile!.settings,
                      whoCanSeeConnections: e.target.value as any,
                    },
                  });
                  toast.success('Connection visibility updated');
                }}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="anyone">Anyone on NextStep</option>
                <option value="connections">Your Connections</option>
                <option value="only_me">Only You</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 4. Notification Preferences */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                Notification Preferences
              </h2>
            </div>
            <Button size="sm" onClick={handleSaveNotifications}>
              Save Preferences
            </Button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Email Notifications
                </p>
                <p className="text-[11px] text-gray-500">
                  Receive daily digests of message requests and connection activity.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-[#0A66C2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Job Match &amp; Application Alerts
                </p>
                <p className="text-[11px] text-gray-500">
                  Get notified when a new role matches your target skills or application status changes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={jobAlerts}
                onChange={(e) => setJobAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0A66C2] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Connection Request Alerts
                </p>
                <p className="text-[11px] text-gray-500">
                  Real-time push notifications when colleagues send invitations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={connectionNotifs}
                onChange={(e) => setConnectionNotifs(e.target.checked)}
                className="w-4 h-4 text-[#0A66C2] rounded"
              />
            </label>
          </div>
        </Card>

        {/* 5. Blocked Users Manager */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <UserX className="w-4 h-4 text-red-600" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Blocked Users
            </h2>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Blocked members cannot view your profile, send messages, or see your activity.
          </p>

          {blockedUsers.length > 0 ? (
            <div className="space-y-2">
              {blockedUsers.map((uid) => (
                <div
                  key={uid}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                      BU
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        Blocked Member ({uid})
                      </p>
                      <p className="text-[10px] text-gray-400">Blocked on your request</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleUnblock(uid)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">You have not blocked any members.</p>
          )}
        </Card>

        {/* 6. Data Portability & Account Deletion */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-500" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Data Portability &amp; Account Closing
            </h2>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Under data protection regulations, you can export a full copy of your profile, experience, connections, and posts at any time.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportData}
            >
              Export Profile Data (JSON)
            </Button>
            {!confirmingClose ? (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setConfirmingClose(true)}
              >
                Close Account
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setConfirmingClose(false);
                    signOut();
                    toast.info('Session reset to default Pakistani Candidate persona.');
                  }}
                >
                  Confirm Reset Session
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setConfirmingClose(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
};
