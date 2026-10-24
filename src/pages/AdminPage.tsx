import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { RoleRoute } from '../components/layout/RouteGuards';
import { useAuth } from '../lib/clerk/useAuth';
import { useAdminStore } from '../lib/adminStore';
import { useJobsStore } from '../lib/jobsStore';
import { useCompanies } from '../lib/companiesStore';
import { usePostsStore } from '../lib/postsStore';
import {
  computePlatformAnalytics,
  exportAuditLogsCSV,
  exportUsersCSV,
  hasAdminPermission,
  resolveAdminPermissions,
  verifyAuditChain,
} from '../features/admin/adminUtils';
import { AdminAuthorizationsSection } from '../features/admin/AdminAuthorizationsSection';
import { AdminOrganizationsSection } from '../features/admin/AdminOrganizationsSection';
import { AdminModerationSection } from '../features/admin/AdminModerationSection';
import { AdminSystemSecuritySection } from '../features/admin/AdminSystemSecuritySection';
import {
  formatCurrencyPKR,
  formatSalaryRangePKR,
  formatDateTimePKT,
} from '../lib/locale/pakistan';
import { ContentReport, Job, Post, UserRole, UserStatus } from '../types';
import {
  Shield,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  ShieldCheck,
  Download,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export type AdminTab =
  | 'overview'
  | 'authorizations'
  | 'users'
  | 'companies'
  | 'verifications'
  | 'moderation'
  | 'jobs'
  | 'system'
  | 'audit';

function normalizeAdminTab(raw?: string | null): AdminTab {
  if (!raw) return 'overview';
  if (raw === 'reports') return 'moderation';
  if (raw === 'announcements' || raw === 'flags') return 'system';
  const valid: AdminTab[] = [
    'overview',
    'authorizations',
    'users',
    'companies',
    'verifications',
    'moderation',
    'jobs',
    'system',
    'audit',
  ];
  return valid.includes(raw as AdminTab) ? (raw as AdminTab) : 'overview';
}

function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const AdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { section } = useParams<{ section?: string }>();
  const { profile, isAdmin } = useAuth();
  const {
    users,
    verifications,
    reports,
    announcements,
    featureFlags,
    auditLogs,
    operatorGrants,
    systemPolicies,
    setOperatorTier,
    toggleOperatorScope,
    revokeOperatorGrant,
    updateSystemPolicy,
    recordAudit,
    moderateUser,
    reviewVerificationRequest,
    resolveContentReport,
    publishAnnouncement,
    toggleAnnouncementActive,
    toggleFeatureFlag,
  } = useAdminStore();
  const { jobs, updateJobModerationStatus } = useJobsStore();
  const { companies, updateCompany, createCompany } = useCompanies();
  const { allPosts, activePosts, removedPostIds, moderateRemovePost, moderateRestorePost } =
    usePostsStore();

  const initialTab = normalizeAdminTab(searchParams.get('tab') || section);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    const incoming = searchParams.get('tab') || section;
    if (incoming) {
      setActiveTab(normalizeAdminTab(incoming));
    }
  }, [searchParams, section]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  // Search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | Job['status']>('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Explicit Audit Chain verification state
  const [chainReport, setChainReport] = useState<{
    valid: boolean;
    checkedCount: number;
    brokenAtIndex?: number;
    reason?: string;
    verifiedAt?: string;
  } | null>(null);

  const actor = {
    id: profile?.id || 'usr_admin_alex',
    name: profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : 'Bilal Sheikh',
  };

  // Effective RBAC permission checks for the signed-in operator
  const canModerateUsers = hasAdminPermission(
    actor.id,
    'users:moderate',
    operatorGrants,
    isAdmin
  );
  const canAssignRoles = hasAdminPermission(
    actor.id,
    'roles:assign',
    operatorGrants,
    isAdmin
  );
  const canReviewVerifications = hasAdminPermission(
    actor.id,
    'verifications:review',
    operatorGrants,
    isAdmin
  );
  const canGovernCompanies = hasAdminPermission(
    actor.id,
    'companies:govern',
    operatorGrants,
    isAdmin
  );
  const canModeratePosts = hasAdminPermission(
    actor.id,
    'posts:moderate',
    operatorGrants,
    isAdmin
  );
  const canModerateJobs = hasAdminPermission(
    actor.id,
    'jobs:moderate',
    operatorGrants,
    isAdmin
  );
  const canManageAnnouncements = hasAdminPermission(
    actor.id,
    'announcements:manage',
    operatorGrants,
    isAdmin
  );
  const canManageFlags = hasAdminPermission(
    actor.id,
    'flags:manage',
    operatorGrants,
    isAdmin
  );
  const canManagePolicies = hasAdminPermission(
    actor.id,
    'security:policies',
    operatorGrants,
    isAdmin
  );
  const canExportAudit = hasAdminPermission(
    actor.id,
    'audit:export',
    operatorGrants,
    isAdmin
  );

  const myScopeCount = resolveAdminPermissions(
    actor.id,
    operatorGrants,
    isAdmin
  ).length;

  const analytics = useMemo(
    () =>
      computePlatformAnalytics({
        profiles: users,
        companies,
        jobs,
        posts: activePosts,
        verifications,
        reports,
      }),
    [activePosts, companies, jobs, reports, users, verifications]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const hay = `${u.first_name} ${u.last_name} ${u.email} ${u.handle} ${u.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [userRoleFilter, userSearch, userStatusFilter, users]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (jobStatusFilter !== 'all' && j.status !== jobStatusFilter) return false;
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          (j.company?.name || '').toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [jobSearch, jobStatusFilter, jobs]);

  const filteredAuditLogs = useMemo(() => {
    const reversed = [...auditLogs].reverse();
    if (!auditSearch.trim()) return reversed;
    const q = auditSearch.toLowerCase();
    return reversed.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.actor_name.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.target_id.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const handleModerateJob = (job: Job, nextStatus: Job['status']) => {
    if (!canModerateJobs) {
      toast.error('Missing required scope: jobs:moderate');
      return;
    }
    updateJobModerationStatus(job.id, nextStatus);
    recordAudit({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'MODERATE_JOB',
      target_type: 'job',
      target_id: job.id,
      summary: `Set job "${job.title}" (${job.company?.name || 'Employer'}) status = ${nextStatus}`,
    });
    toast.success(`Job status updated to ${nextStatus.replace('_', ' ')}`);
  };

  const handleVerifyHashChain = () => {
    const result = verifyAuditChain(auditLogs);
    setChainReport({
      ...result,
      verifiedAt: formatDateTimePKT(new Date()),
    });
    if (result.valid) {
      toast.success(
        `Verified ${result.checkedCount} hash-chained audit blocks with zero tampering.`
      );
    } else {
      toast.error(
        `Audit chain integrity error at #${result.brokenAtIndex}: ${result.reason}`
      );
    }
  };

  const handleResolveReportAndEnforce = (
    rep: ContentReport,
    resolution: 'resolved_removed' | 'dismissed'
  ) => {
    if (!canModeratePosts) return;
    resolveContentReport(rep.id, resolution, actor);
    if (resolution === 'resolved_removed') {
      if (rep.target_type === 'post') {
        moderateRemovePost(rep.target_id);
      } else if (rep.target_type === 'job') {
        updateJobModerationStatus(rep.target_id, 'closed');
      }
    }
  };

  const handleQuarantinePost = (post: Post) => {
    if (!canModeratePosts) return;
    moderateRemovePost(post.id);
    recordAudit({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'QUARANTINE_POST',
      target_type: 'post',
      target_id: post.id,
      summary: `Quarantined feed post ${post.id} ("${post.body.slice(0, 48)}...")`,
    });
  };

  const handleRestorePost = (post: Post) => {
    if (!canModeratePosts) return;
    moderateRestorePost(post.id);
    recordAudit({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'RESTORE_POST',
      target_type: 'post',
      target_id: post.id,
      summary: `Restored feed post ${post.id} to community feed`,
    });
  };

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Analytics' },
    { id: 'authorizations', label: 'Authorizations', count: operatorGrants.length },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'companies', label: 'Organizations', count: companies.length },
    { id: 'verifications', label: 'Verifications', count: analytics.pendingVerifications },
    { id: 'moderation', label: 'Moderation', count: analytics.pendingReports },
    { id: 'jobs', label: 'Jobs', count: jobs.length },
    { id: 'system', label: 'System & Security' },
    { id: 'audit', label: 'Audit Chain', count: auditLogs.length },
  ];

  return (
    <RoleRoute allowedRoles={['admin']}>
      <Shell hideLeftRail hideRightRail fullWidth>
        <div className="space-y-5">
          {/* Authority Console Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#1B1F23] p-5 rounded-xl border border-[#E0DFDC] dark:border-[#38434F]">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0A66C2] dark:text-[#71B7FB]" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  NextStep Authority &amp; Governance Console
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                Operator: {actor.name} · {myScopeCount}/10 RBAC Scopes Active · Pakistan Market (en-PK · PKR · PKT)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                onClick={() => handleSelectTab('authorizations')}
              >
                RBAC Matrix
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                onClick={() => {
                  handleSelectTab('audit');
                  handleVerifyHashChain();
                }}
              >
                Verify Audit Chain
              </Button>
            </div>
          </div>

          {systemPolicies.maintenance_read_only && (
            <div
              role="status"
              className="px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2"
            >
              <span>
                <strong>Emergency Read-Only Governance Lock Active:</strong> Non-administrative member writes are currently paused.
              </span>
              {canManagePolicies && (
                <button
                  type="button"
                  onClick={() => updateSystemPolicy('maintenance_read_only', false, actor)}
                  className="font-semibold underline cursor-pointer whitespace-nowrap"
                >
                  Lift Lock
                </button>
              )}
            </div>
          )}

          {/* Segmented Console Tabs */}
          <div
            role="tablist"
            aria-label="Admin console sections"
            className="flex overflow-x-auto p-1 rounded-lg bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] gap-1"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    active
                      ? 'bg-[#0A66C2] text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
                </button>
              );
            })}
          </div>

          {/* 1. OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Registered Professionals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.totalUsers}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {analytics.activeUsers} active · {analytics.suspendedOrBanned} restricted
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Verified Organizations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analytics.verifiedCompanies} / {analytics.totalCompanies}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {analytics.verifiedRecruiters} SECP/PSEB recruiters
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Open PKR Requisitions</p>
                  <p className="text-2xl font-bold text-[#0A66C2] dark:text-[#71B7FB] mt-1">
                    {analytics.openJobs}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {analytics.totalJobs} total · {analytics.totalPosts} live feed posts
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Avg Senior Monthly Cap</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {formatCurrencyPKR(analytics.avgMonthlyMaxPKR)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Lahore · Karachi · Islamabad
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card padding="md" className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      Pending Trust &amp; Safety Queues
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Action required on corporate SECP verifications and flagged community content.
                    </p>
                    <div className="space-y-2.5 text-xs tabular-nums">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-700 dark:text-gray-300">
                          SECP / PSEB Verifications
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {analytics.pendingVerifications} pending
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-700 dark:text-gray-300">
                          Content &amp; Job Reports
                        </span>
                        <span className="font-bold text-[#CC1016] dark:text-red-400">
                          {analytics.pendingReports} pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectTab('verifications')}
                    >
                      Review Verifications
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectTab('moderation')}
                    >
                      Moderation Queue
                    </Button>
                  </div>
                </Card>

                <Card padding="md" className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      RBAC &amp; Policy Posture
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Delegated console operators and active Pakistan hiring guardrails.
                    </p>
                    <div className="space-y-2 text-xs tabular-nums">
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400">Authorized Operators</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {operatorGrants.length} active
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400">SECP Gate on Jobs</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {systemPolicies.require_secp_for_jobs ? 'Enforced' : 'Optional'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-gray-600 dark:text-gray-400">Recruiter Daily Outreach</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {systemPolicies.max_daily_outreach_per_recruiter} / day
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectTab('authorizations')}
                    >
                      Manage Scopes
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectTab('companies')}
                    >
                      Govern Employers
                    </Button>
                  </div>
                </Card>

                <Card padding="md" className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      Tamper-Evident Audit Ledger
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Cryptographic FNV-1a twin-digest chain across all RBAC, verification, and moderation events.
                    </p>
                    <div className="text-xs space-y-1.5 font-mono tabular-nums text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#12161A] p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                      <p>Chain Length: {auditLogs.length} blocks</p>
                      <p className="truncate">
                        Head Digest: {auditLogs[auditLogs.length - 1]?.hash || '0000'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleSelectTab('audit');
                        handleVerifyHashChain();
                      }}
                    >
                      Inspect Hash Chain
                    </Button>
                    <Link
                      to="/recruiter"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline ml-2"
                    >
                      <span>Open Recruiter Hub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 2. AUTHORIZATIONS & RBAC MATRIX */}
          {activeTab === 'authorizations' && (
            <AdminAuthorizationsSection
              currentUserId={actor.id}
              isBaseAdmin={isAdmin}
              users={users}
              operatorGrants={operatorGrants}
              canAssignRoles={canAssignRoles}
              onSetOperatorTier={(userId, tier) => setOperatorTier(userId, tier, actor)}
              onToggleOperatorScope={(userId, scope) =>
                toggleOperatorScope(userId, scope, actor)
              }
              onRevokeOperator={(userId) => revokeOperatorGrant(userId, actor)}
            />
          )}

          {/* 3. USER MODERATION & ROLE GOVERNANCE */}
          {activeTab === 'users' && (
            <Card padding="md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Search platform users"
                    placeholder="Search by Pakistani name, @handle, email, or city..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter users by role"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as 'all' | UserRole)}
                    className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="candidate">Candidates</option>
                    <option value="recruiter">Recruiters</option>
                    <option value="admin">Administrators</option>
                  </select>

                  <select
                    aria-label="Filter users by status"
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as 'all' | UserStatus)}
                    className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canExportAudit}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      downloadTextFile('nextstep-pk-users.csv', exportUsersCSV(filteredUsers));
                      toast.success(`Exported ${filteredUsers.length} member records to CSV`);
                    }}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 font-semibold">
                      <th className="py-2.5 pr-3">Member</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Verified</th>
                      <th className="py-2.5 px-3">Standing</th>
                      <th className="py-2.5 pl-3 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredUsers.map((u) => {
                      const fullName = `${u.first_name} ${u.last_name}`;
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={fullName} src={u.avatar_url} size="xs" />
                              <div>
                                <Link
                                  to={`/in/${u.handle}`}
                                  className="font-bold text-gray-900 dark:text-white hover:text-[#0A66C2]"
                                >
                                  {fullName}
                                </Link>
                                <p className="text-[11px] text-gray-500">
                                  @{u.handle} · {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                            {u.location || 'Pakistan'}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              aria-label={`Change role for ${fullName}`}
                              disabled={!canAssignRoles}
                              value={u.role}
                              onChange={(e) => {
                                const nextRole = e.target.value as UserRole;
                                moderateUser(u.id, { role: nextRole }, actor);
                                toast.success(`Updated ${fullName} role to ${nextRole}`);
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white disabled:opacity-50"
                            >
                              <option value="candidate">Candidate</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              disabled={!canModerateUsers}
                              aria-label={`Toggle verified badge for ${fullName}`}
                              onClick={() => {
                                moderateUser(u.id, { verified: !u.verified }, actor);
                                toast.success(
                                  `${!u.verified ? 'Granted' : 'Revoked'} verified badge for ${fullName}`
                                );
                              }}
                              className={`inline-flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-40 ${
                                u.verified
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{u.verified ? 'Verified' : 'Unverified'}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`font-semibold capitalize ${
                                u.status === 'active'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : u.status === 'suspended'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-[#CC1016] dark:text-red-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {u.status !== 'active' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={!canModerateUsers}
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    moderateUser(u.id, { status: 'active' }, actor);
                                    toast.success(`Restored ${fullName}`);
                                  }}
                                >
                                  Activate
                                </Button>
                              )}
                              {u.status !== 'suspended' && u.id !== 'usr_admin_alex' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!canModerateUsers}
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    moderateUser(u.id, { status: 'suspended' }, actor);
                                    toast.success(`Suspended ${fullName}`);
                                  }}
                                >
                                  Suspend
                                </Button>
                              )}
                              {u.status !== 'banned' && u.id !== 'usr_admin_alex' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!canModerateUsers}
                                  className="h-7 text-xs text-[#CC1016]"
                                  onClick={() => {
                                    moderateUser(u.id, { status: 'banned' }, actor);
                                    toast.success(`Banned ${fullName}`);
                                  }}
                                >
                                  Ban
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 4. ORGANIZATIONS GOVERNANCE */}
          {activeTab === 'companies' && (
            <AdminOrganizationsSection
              companies={companies}
              jobs={jobs}
              canGovernCompanies={canGovernCompanies}
              onUpdateCompany={(companyId, updates, summary) => {
                updateCompany(companyId, updates);
                recordAudit({
                  actor_id: actor.id,
                  actor_name: actor.name,
                  action: 'GOVERN_COMPANY',
                  target_type: 'company',
                  target_id: companyId,
                  summary,
                });
              }}
              onCreateCompany={(input) => {
                const created = createCompany(input);
                recordAudit({
                  actor_id: actor.id,
                  actor_name: actor.name,
                  action: 'REGISTER_COMPANY',
                  target_type: 'company',
                  target_id: created.id,
                  summary: `Registered employer "${created.name}" (${created.hq})`,
                });
              }}
            />
          )}

          {/* 5. RECRUITER & COMPANY VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <Card padding="md">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                SECP, FBR NTN &amp; PSEB Verification Queue ({verifications.length})
              </h2>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {verifications.map((req) => (
                  <div
                    key={req.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {req.requester_name} (@{req.requester_handle}) ·{' '}
                        <span className="text-[#0A66C2] dark:text-[#71B7FB]">
                          {req.company_name}
                        </span>
                      </p>
                      <p className="text-gray-500 tabular-nums">
                        Type: <span className="capitalize font-medium">{req.entity_type}</span> ·
                        Email: {req.work_email} · Reg: {req.registration_number || 'PSEB-PK'} ·
                        Submitted {formatDateTimePKT(req.created_at)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 pt-1">
                        {req.evidence_note}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!canReviewVerifications}
                            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => {
                              reviewVerificationRequest(req.id, 'approved', actor);
                              toast.success(
                                `Approved ${req.requester_name} (${req.company_name})`
                              );
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!canReviewVerifications}
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => {
                              reviewVerificationRequest(req.id, 'rejected', actor);
                              toast.success(`Declined request from ${req.requester_name}`);
                            }}
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <span
                          className={`font-semibold capitalize ${
                            req.status === 'approved'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-[#CC1016] dark:text-red-400'
                          }`}
                        >
                          {req.status} {req.reviewed_by ? `by ${req.reviewed_by}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 6. MODERATION & COMMUNITY FEED */}
          {activeTab === 'moderation' && (
            <AdminModerationSection
              reports={reports}
              allPosts={allPosts}
              removedPostIds={removedPostIds}
              canModeratePosts={canModeratePosts}
              onResolveReport={handleResolveReportAndEnforce}
              onRemovePost={handleQuarantinePost}
              onRestorePost={handleRestorePost}
            />
          )}

          {/* 7. JOB REQUISITIONS MODERATION */}
          {activeTab === 'jobs' && (
            <Card padding="md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  PKR Job Listings Governance ({filteredJobs.length})
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    aria-label="Filter jobs for moderation"
                    placeholder="Search job title, employer, or Pakistan city..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white w-full sm:w-64"
                  />
                  <select
                    aria-label="Filter jobs by status"
                    value={jobStatusFilter}
                    onChange={(e) =>
                      setJobStatusFilter(e.target.value as 'all' | Job['status'])
                    }
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="paused">Paused</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredJobs.slice(0, 30).map((job) => (
                  <div
                    key={job.id}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {job.title} ·{' '}
                        <span className="font-normal text-gray-500">{job.company?.name}</span>
                        {job.is_external ? (
                          <span className="font-normal text-gray-400"> · External Feed</span>
                        ) : null}
                      </p>
                      <p className="text-gray-500 tabular-nums mt-0.5">
                        {job.location} ·{' '}
                        {formatSalaryRangePKR(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.salary_period
                        )}{' '}
                        · {job.applicants_count} applicants · Status:{' '}
                        <strong className="capitalize">{job.status.replace('_', ' ')}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        aria-label={`Moderation status for ${job.title}`}
                        disabled={!canModerateJobs}
                        value={job.status}
                        onChange={(e) =>
                          handleModerateJob(job, e.target.value as Job['status'])
                        }
                        className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="open">Open (Published)</option>
                        <option value="paused">Paused</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="closed">Closed / Delisted</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 8. SYSTEM POLICIES, FEATURE FLAGS & ANNOUNCEMENTS */}
          {activeTab === 'system' && (
            <AdminSystemSecuritySection
              announcements={announcements}
              featureFlags={featureFlags}
              systemPolicies={systemPolicies}
              canManageAnnouncements={canManageAnnouncements}
              canManageFlags={canManageFlags}
              canManagePolicies={canManagePolicies}
              actorName={actor.name}
              onPublishAnnouncement={(input) => publishAnnouncement(input, actor)}
              onToggleAnnouncement={(id) => toggleAnnouncementActive(id, actor)}
              onToggleFlag={(flagKey) => toggleFeatureFlag(flagKey, actor)}
              onUpdatePolicy={(key, val) => updateSystemPolicy(key, val, actor)}
            />
          )}

          {/* 9. TAMPER-EVIDENT CRYPTOGRAPHIC AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <Card padding="md" className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Tamper-Evident Cryptographic Audit Trail ({auditLogs.length} Blocks)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Each block chains{' '}
                    <code className="font-mono text-[11px]">
                      (index | actor_id | action | target | summary | timestamp | prev_hash)
                    </code>{' '}
                    via FNV-1a twin digesting.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="search"
                    aria-label="Search audit ledger"
                    placeholder="Filter action, actor, or target..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canExportAudit}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      downloadTextFile(
                        'nextstep-pk-audit-ledger.csv',
                        exportAuditLogsCSV(auditLogs)
                      );
                      toast.success('Exported cryptographic audit ledger CSV');
                    }}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canExportAudit}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      downloadTextFile(
                        'nextstep-pk-audit-ledger.json',
                        JSON.stringify(auditLogs, null, 2),
                        'application/json'
                      );
                      toast.success('Exported cryptographic audit ledger JSON');
                    }}
                  >
                    JSON
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleVerifyHashChain}>
                    Verify Chain Integrity
                  </Button>
                </div>
              </div>

              {chainReport && (
                <div
                  role="status"
                  className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    chainReport.valid
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-900 dark:text-red-200'
                  }`}
                >
                  <span className="font-semibold">
                    {chainReport.valid
                      ? `Integrity Verified: All ${chainReport.checkedCount} blocks valid from Genesis (0000...0000) to Head.`
                      : `Tampering Detected at Block #${chainReport.brokenAtIndex}: ${chainReport.reason}`}
                  </span>
                  <span className="font-mono tabular-nums text-[11px]">
                    Checked {chainReport.verifiedAt}
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 font-semibold">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 px-3">Timestamp (PKT)</th>
                      <th className="py-2 px-3">Actor</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Summary</th>
                      <th className="py-2 pl-3">Prev Hash → Digest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredAuditLogs.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                      >
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-gray-500">
                          #{entry.index}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDateTimePKT(entry.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {entry.actor_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#0A66C2] dark:text-[#71B7FB] whitespace-nowrap">
                          {entry.action}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                          {entry.summary}
                        </td>
                        <td className="py-2.5 pl-3 font-mono tabular-nums text-[11px] text-gray-500 whitespace-nowrap">
                          {entry.prev_hash.slice(0, 8)}… →{' '}
                          <span className="text-gray-900 dark:text-gray-200 font-semibold">
                            {entry.hash.slice(0, 10)}…
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </Shell>
    </RoleRoute>
  );
};
