import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FeatureFlags, PlatformAnnouncement, SystemPolicies } from '../../types';
import { formatDateTimePKT } from '../../lib/locale/pakistan';
import { Lock, Megaphone, Sliders } from 'lucide-react';
import { toast } from 'sonner';

const FEATURE_FLAG_LABELS: Record<
  keyof FeatureFlags,
  { label: string; description: string }
> = {
  enable_easy_apply: {
    label: 'Native 1-Click Easy Apply',
    description: 'Allow Pakistani candidates to submit structured screening & ATS CV applications.',
  },
  enable_external_jsearch: {
    label: 'External JSearch Pakistan Feed',
    description: 'Merge verified external Pakistan engineering job listings in PKR.',
  },
  enable_realtime_chat: {
    label: '1:1 Realtime Messaging & Mini-Dock',
    description: 'Enable instant WebSocket / BroadcastChannel DMs, typing indicators & read receipts.',
  },
  enable_resume_ai: {
    label: 'Resume & Career AI Suite',
    description: 'Enable server-side bullet rewriting, ATS scoring & 30/60/90 skill roadmaps.',
  },
  enable_open_to_work_badges: {
    label: 'Open to Work & Hiring Avatar Frames',
    description: 'Render emerald & blue hiring/open-to-work indicators across profile cards.',
  },
};

const BOOLEAN_POLICY_LABELS: {
  key:
    | 'require_secp_for_jobs'
    | 'require_salary_range_pkr'
    | 'auto_quarantine_flagged_posts'
    | 'allow_new_registrations'
    | 'maintenance_read_only';
  label: string;
  description: string;
}[] = [
  {
    key: 'require_secp_for_jobs',
    label: 'Require SECP / PSEB Verification for Job Publishing',
    description: 'Block unverified accounts from publishing native PKR requisitions.',
  },
  {
    key: 'require_salary_range_pkr',
    label: 'Mandate Monthly PKR Salary Range Transparency',
    description: 'Enforce minimum and maximum monthly PKR compensation disclosure on new jobs.',
  },
  {
    key: 'auto_quarantine_flagged_posts',
    label: 'Auto-Quarantine High-Risk Flagged Posts',
    description: 'Automatically hide feed posts pending moderator review after multiple reports.',
  },
  {
    key: 'allow_new_registrations',
    label: 'Open Member Self-Registration',
    description: 'Allow new candidates and corporate recruiters in Pakistan to onboard.',
  },
  {
    key: 'maintenance_read_only',
    label: 'Emergency Read-Only Governance Lock',
    description: 'Place non-admin write endpoints into temporary maintenance freeze.',
  },
];

interface AdminSystemSecuritySectionProps {
  announcements: PlatformAnnouncement[];
  featureFlags: FeatureFlags;
  systemPolicies: SystemPolicies;
  canManageAnnouncements: boolean;
  canManageFlags: boolean;
  canManagePolicies: boolean;
  actorName: string;
  onPublishAnnouncement: (input: Omit<PlatformAnnouncement, 'id' | 'created_at' | 'active'>) => void;
  onToggleAnnouncement: (annId: string) => void;
  onToggleFlag: (flagKey: keyof FeatureFlags) => void;
  onUpdatePolicy: <K extends keyof SystemPolicies>(key: K, value: SystemPolicies[K]) => void;
}

export const AdminSystemSecuritySection: React.FC<AdminSystemSecuritySectionProps> = ({
  announcements,
  featureFlags,
  systemPolicies,
  canManageAnnouncements,
  canManageFlags,
  canManagePolicies,
  actorName,
  onPublishAnnouncement,
  onToggleAnnouncement,
  onToggleFlag,
  onUpdatePolicy,
}) => {
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<PlatformAnnouncement['severity']>('info');
  const [annLinkUrl, setAnnLinkUrl] = useState('/jobs');
  const [annLinkLabel, setAnnLinkLabel] = useState('Explore Roles');
  const [annError, setAnnError] = useState<string | null>(null);

  const [outreachQuota, setOutreachQuota] = useState(
    String(systemPolicies.max_daily_outreach_per_recruiter)
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    String(systemPolicies.session_timeout_minutes)
  );

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError(null);
    if (!canManageAnnouncements) {
      toast.error('Missing required scope: announcements:manage');
      return;
    }
    if (!annTitle.trim() || !annMessage.trim()) {
      setAnnError('Announcement title and message are both required.');
      return;
    }
    onPublishAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      severity: annSeverity,
      link_url: annLinkUrl.trim() || undefined,
      link_label: annLinkLabel.trim() || undefined,
      created_by: actorName,
    });
    setAnnTitle('');
    setAnnMessage('');
    toast.success('Published global announcement banner across NextStep Pakistan.');
  };

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePolicies) {
      toast.error('Missing required scope: security:policies');
      return;
    }
    const parsedOutreach = Math.max(5, Math.min(500, Number(outreachQuota) || 50));
    const parsedTimeout = Math.max(15, Math.min(720, Number(sessionTimeout) || 120));
    onUpdatePolicy('max_daily_outreach_per_recruiter', parsedOutreach);
    onUpdatePolicy('session_timeout_minutes', parsedTimeout);
    setOutreachQuota(String(parsedOutreach));
    setSessionTimeout(String(parsedTimeout));
    toast.success('Updated recruiter outreach rate limits & session security policy.');
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Security & Governance Policies + Runtime Feature Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Security, Compliance &amp; Rate-Limit Policies
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {BOOLEAN_POLICY_LABELS.map((pol) => {
              const enabled = systemPolicies[pol.key];
              return (
                <div key={pol.key} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{pol.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pol.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={pol.label}
                    disabled={!canManagePolicies}
                    onClick={() => {
                      onUpdatePolicy(pol.key, !enabled);
                      toast.success(`Updated policy ${pol.key}`);
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 ${
                      enabled ? 'bg-[#0A66C2]' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSaveQuotas}
            className="pt-3 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end text-xs"
          >
            <div>
              <label htmlFor="quota-outreach" className="block font-semibold mb-1">
                Daily InMail Cap / Recruiter
              </label>
              <input
                id="quota-outreach"
                type="number"
                min={5}
                max={500}
                disabled={!canManagePolicies}
                value={outreachQuota}
                onChange={(e) => setOutreachQuota(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="quota-session" className="block font-semibold mb-1">
                Admin Session TTL (mins)
              </label>
              <input
                id="quota-session"
                type="number"
                min={15}
                max={720}
                disabled={!canManagePolicies}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" disabled={!canManagePolicies}>
              Save Quotas
            </Button>
          </form>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Runtime Feature Flags
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(Object.keys(FEATURE_FLAG_LABELS) as (keyof FeatureFlags)[]).map((key) => {
              const meta = FEATURE_FLAG_LABELS[key];
              const enabled = featureFlags[key];
              return (
                <div key={key} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{meta.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={meta.label}
                    disabled={!canManageFlags}
                    onClick={() => {
                      onToggleFlag(key);
                      toast.success(`Feature flag ${key} set to ${!enabled}`);
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 ${
                      enabled ? 'bg-[#0A66C2]' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 2: Global Announcements */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Platform Broadcast Announcements ({announcements.length})
          </h2>
        </div>

        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs" noValidate>
          <div className="lg:col-span-4">
            <label htmlFor="ann-title-in" className="block font-semibold mb-1">
              Banner Headline
            </label>
            <input
              id="ann-title-in"
              type="text"
              disabled={!canManageAnnouncements}
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="e.g. Pakistan Software Export Hiring Drive 2026"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          <div className="lg:col-span-5">
            <label htmlFor="ann-msg-in" className="block font-semibold mb-1">
              Broadcast Message
            </label>
            <input
              id="ann-msg-in"
              type="text"
              disabled={!canManageAnnouncements}
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="Verified SECP employers have listed 40+ monthly PKR roles..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          <div className="lg:col-span-3 flex items-end gap-2">
            <select
              aria-label="Announcement severity"
              disabled={!canManageAnnouncements}
              value={annSeverity}
              onChange={(e) => setAnnSeverity(e.target.value as PlatformAnnouncement['severity'])}
              className="px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
            </select>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canManageAnnouncements}
            >
              Broadcast
            </Button>
          </div>
          <div className="lg:col-span-6">
            <label htmlFor="ann-link-url" className="block font-semibold mb-1">
              CTA Route (optional)
            </label>
            <input
              id="ann-link-url"
              type="text"
              disabled={!canManageAnnouncements}
              value={annLinkUrl}
              onChange={(e) => setAnnLinkUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          <div className="lg:col-span-6">
            <label htmlFor="ann-link-lbl" className="block font-semibold mb-1">
              CTA Label (optional)
            </label>
            <input
              id="ann-link-lbl"
              type="text"
              disabled={!canManageAnnouncements}
              value={annLinkLabel}
              onChange={(e) => setAnnLinkLabel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          {annError && (
            <p role="alert" className="lg:col-span-12 text-xs font-medium text-[#CC1016]">
              {annError}
            </p>
          )}
        </form>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 pt-2">
          {announcements.map((ann) => (
            <div key={ann.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white">
                  {ann.title}{' '}
                  <span className="font-normal text-gray-500">
                    · {ann.active ? 'Live Banner' : 'Archived'} · {formatDateTimePKT(ann.created_at)}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-400 truncate">{ann.message}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!canManageAnnouncements}
                onClick={() => onToggleAnnouncement(ann.id)}
              >
                {ann.active ? 'Archive' : 'Re-activate'}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
