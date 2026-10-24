import {
  AdminOperatorGrant,
  AdminPermissionScope,
  AdminTier,
  AuditLogEntry,
  FeatureFlags,
  Profile,
  Company,
  Job,
  Post,
  SystemPolicies,
  VerificationRequest,
  ContentReport,
} from '../../types';

export const GENESIS_AUDIT_HASH = '00000000000000000000000000000000';

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enable_easy_apply: true,
  enable_external_jsearch: true,
  enable_realtime_chat: true,
  enable_resume_ai: true,
  enable_open_to_work_badges: true,
};

/**
 * Deterministic 64-bit FNV-1a twin digest (32-hex chars) for tamper-evident audit logs
 * that runs synchronously in both Node (`tsx --test`) and browsers without async SubtleCrypto overhead.
 */
export function computeAuditHash(payload: {
  index: number;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  timestamp: string;
  prev_hash: string;
}): string {
  const canonical = [
    payload.index,
    payload.actor_id,
    payload.action,
    payload.target_type,
    payload.target_id,
    payload.summary,
    payload.timestamp,
    payload.prev_hash,
  ].join('|');

  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2d;
  let h3 = 0x165667b1;
  let h4 = 0x9e3779b9;

  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch ^ (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
    h3 ^= ch + 17;
    h3 = Math.imul(h3, 0xc2b2ae35);
    h4 ^= ch * 31;
    h4 = Math.imul(h4, 0x27d4eb2f);
  }

  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
}

/**
 * Appends a tamper-evident entry linked to the previous tail hash.
 */
export function appendAuditEntry(
  chain: AuditLogEntry[],
  input: {
    actor_id: string;
    actor_name: string;
    action: string;
    target_type: AuditLogEntry['target_type'];
    target_id: string;
    summary: string;
    timestamp?: string;
  }
): AuditLogEntry[] {
  const prev = chain.length > 0 ? chain[chain.length - 1] : null;
  const index = prev ? prev.index + 1 : 1;
  const prev_hash = prev ? prev.hash : GENESIS_AUDIT_HASH;
  const timestamp = input.timestamp || new Date().toISOString();

  const hash = computeAuditHash({
    index,
    actor_id: input.actor_id,
    action: input.action,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    timestamp,
    prev_hash,
  });

  const entry: AuditLogEntry = {
    id: `audit_${index}_${hash.slice(0, 8)}`,
    index,
    actor_id: input.actor_id,
    actor_name: input.actor_name,
    action: input.action,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    timestamp,
    prev_hash,
    hash,
  };

  return [...chain, entry];
}

/**
 * Verifies the entire hash chain for integrity and detects tampering at any index.
 */
export function verifyAuditChain(chain: AuditLogEntry[]): {
  valid: boolean;
  checkedCount: number;
  brokenAtIndex?: number;
  reason?: string;
} {
  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];
    const expectedPrev = i === 0 ? GENESIS_AUDIT_HASH : chain[i - 1].hash;
    const expectedIndex = i + 1;

    if (entry.index !== expectedIndex) {
      return {
        valid: false,
        checkedCount: i + 1,
        brokenAtIndex: entry.index,
        reason: `Sequence index mismatch at #${entry.index} (expected #${expectedIndex})`,
      };
    }

    if (entry.prev_hash !== expectedPrev) {
      return {
        valid: false,
        checkedCount: i + 1,
        brokenAtIndex: entry.index,
        reason: `Broken prev_hash link at entry #${entry.index}`,
      };
    }

    const recomputed = computeAuditHash({
      index: entry.index,
      actor_id: entry.actor_id,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      summary: entry.summary,
      timestamp: entry.timestamp,
      prev_hash: entry.prev_hash,
    });

    if (entry.hash !== recomputed) {
      return {
        valid: false,
        checkedCount: i + 1,
        brokenAtIndex: entry.index,
        reason: `Payload digest mismatch at entry #${entry.index}`,
      };
    }
  }

  return {
    valid: true,
    checkedCount: chain.length,
  };
}

export function buildSeedAuditChain(): AuditLogEntry[] {
  let chain: AuditLogEntry[] = [];
  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'SYSTEM_LOCALE_CONFIGURED',
    target_type: 'system',
    target_id: 'pk_market_v2',
    summary: 'Configured default market locale en-PK, PKR currency, and Asia/Karachi (PKT) timezone.',
    timestamp: '2026-10-20T06:00:00Z',
  });
  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'VERIFY_COMPANY',
    target_type: 'company',
    target_id: 'comp_systems',
    summary: 'Verified Systems Limited SECP & PSEB corporate credentials.',
    timestamp: '2026-10-21T09:15:00Z',
  });
  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'VERIFY_RECRUITER',
    target_type: 'user',
    target_id: 'usr_recruiter_sarah',
    summary: 'Approved verified recruiter badge for Ayesha Siddiqui (@ayeshasiddiqui).',
    timestamp: '2026-10-22T11:30:00Z',
  });
  return chain;
}

export function computePlatformAnalytics(params: {
  profiles: Profile[];
  companies: Company[];
  jobs: Job[];
  posts: Post[];
  verifications: VerificationRequest[];
  reports: ContentReport[];
}) {
  const activeUsers = params.profiles.filter((p) => p.status === 'active').length;
  const suspendedOrBanned = params.profiles.length - activeUsers;
  const verifiedRecruiters = params.profiles.filter(
    (p) => p.role === 'recruiter' && p.verified
  ).length;
  const openJobs = params.jobs.filter((j) => j.status === 'open').length;
  const avgMonthlyMaxPKR =
    openJobs > 0
      ? Math.round(
          params.jobs
            .filter((j) => j.status === 'open')
            .reduce((sum, j) => sum + (j.salary_max || 450000), 0) / openJobs
        )
      : 480000;

  return {
    totalUsers: params.profiles.length,
    activeUsers,
    suspendedOrBanned,
    verifiedRecruiters,
    totalCompanies: params.companies.length,
    verifiedCompanies: params.companies.filter((c) => c.verified).length,
    totalJobs: params.jobs.length,
    openJobs,
    totalPosts: params.posts.length,
    pendingVerifications: params.verifications.filter((v) => v.status === 'pending').length,
    pendingReports: params.reports.filter((r) => r.status === 'pending').length,
    avgMonthlyMaxPKR,
  };
}

export const ADMIN_TIER_METADATA: Record<
  AdminTier,
  { label: string; description: string }
> = {
  super_admin: {
    label: 'Super Administrator',
    description: 'Full sovereign authority across RBAC, security policies, audit exports, and platform governance.',
  },
  trust_safety_admin: {
    label: 'Trust & Safety Lead',
    description: 'Governs user suspensions, content moderation, report resolution, and SECP/PSEB verifications.',
  },
  recruiter_ops_admin: {
    label: 'Recruiter & Org Ops',
    description: 'Manages corporate verifications, Pakistani organization pages, and PKR job requisitions.',
  },
  content_moderator: {
    label: 'Feed & Job Moderator',
    description: 'Reviews reported posts, feed quality, and job listing compliance without role-assignment power.',
  },
};

export const ALL_ADMIN_SCOPES: {
  scope: AdminPermissionScope;
  label: string;
  category: 'Identity & RBAC' | 'Verification & Orgs' | 'Moderation' | 'System & Audit';
  description: string;
}[] = [
  {
    scope: 'users:moderate',
    label: 'Moderate User Accounts',
    category: 'Identity & RBAC',
    description: 'Suspend, ban, reinstate, or toggle verification badges on member accounts.',
  },
  {
    scope: 'roles:assign',
    label: 'Assign Roles & Admin Scopes',
    category: 'Identity & RBAC',
    description: 'Promote/demote user roles and grant or revoke administrator permission scopes.',
  },
  {
    scope: 'verifications:review',
    label: 'Approve SECP / PSEB Credentials',
    category: 'Verification & Orgs',
    description: 'Approve or decline corporate recruiter and organization verification filings.',
  },
  {
    scope: 'companies:govern',
    label: 'Govern Organizations',
    category: 'Verification & Orgs',
    description: 'Create, edit, suspend, or verify Pakistani company pages and employer records.',
  },
  {
    scope: 'posts:moderate',
    label: 'Moderate Feed & Reports',
    category: 'Moderation',
    description: 'Resolve content reports and remove or restore community feed posts.',
  },
  {
    scope: 'jobs:moderate',
    label: 'Moderate Job Requisitions',
    category: 'Moderation',
    description: 'Open, pause, close, or review native and external PKR job listings.',
  },
  {
    scope: 'announcements:manage',
    label: 'Broadcast Announcements',
    category: 'System & Audit',
    description: 'Publish, edit, or archive platform-wide announcement banners.',
  },
  {
    scope: 'flags:manage',
    label: 'Toggle Feature Flags',
    category: 'System & Audit',
    description: 'Enable or disable live runtime modules (Easy Apply, JSearch, Chat, Career AI).',
  },
  {
    scope: 'security:policies',
    label: 'Configure Security Policies',
    category: 'System & Audit',
    description: 'Modify SECP enforcement, salary transparency rules, rate limits, and read-only lock.',
  },
  {
    scope: 'audit:export',
    label: 'Verify & Export Audit Ledger',
    category: 'System & Audit',
    description: 'Run cryptographic hash-chain verification and export compliance CSV/JSON ledgers.',
  },
];

export const ROLE_PERMISSION_MATRIX: Record<AdminTier, AdminPermissionScope[]> = {
  super_admin: ALL_ADMIN_SCOPES.map((s) => s.scope),
  trust_safety_admin: [
    'users:moderate',
    'verifications:review',
    'posts:moderate',
    'jobs:moderate',
    'announcements:manage',
    'audit:export',
  ],
  recruiter_ops_admin: [
    'verifications:review',
    'companies:govern',
    'jobs:moderate',
    'announcements:manage',
  ],
  content_moderator: ['posts:moderate', 'jobs:moderate'],
};

export const DEFAULT_OPERATOR_GRANTS: AdminOperatorGrant[] = [
  {
    user_id: 'usr_admin_alex',
    tier: 'super_admin',
    custom_granted: [],
    custom_revoked: [],
    updated_by: 'System Bootstrap',
    updated_at: '2026-10-20T06:00:00Z',
  },
  {
    user_id: 'usr_recruiter_sarah',
    tier: 'recruiter_ops_admin',
    custom_granted: [],
    custom_revoked: ['announcements:manage'],
    updated_by: 'Bilal Sheikh',
    updated_at: '2026-10-21T08:00:00Z',
  },
];

export const DEFAULT_SYSTEM_POLICIES: SystemPolicies = {
  require_secp_for_jobs: true,
  require_salary_range_pkr: true,
  auto_quarantine_flagged_posts: false,
  allow_new_registrations: true,
  maintenance_read_only: false,
  max_daily_outreach_per_recruiter: 50,
  session_timeout_minutes: 120,
};

export function resolveAdminPermissions(
  userId: string,
  grants: AdminOperatorGrant[],
  isBaseAdmin: boolean
): AdminPermissionScope[] {
  const grant = grants.find((g) => g.user_id === userId);
  if (!grant) {
    return isBaseAdmin ? ROLE_PERMISSION_MATRIX.super_admin : [];
  }
  const baseScopes = new Set<AdminPermissionScope>(ROLE_PERMISSION_MATRIX[grant.tier] || []);
  for (const s of grant.custom_granted) baseScopes.add(s);
  for (const s of grant.custom_revoked) baseScopes.delete(s);
  return Array.from(baseScopes);
}

export function hasAdminPermission(
  userId: string,
  scope: AdminPermissionScope,
  grants: AdminOperatorGrant[],
  isBaseAdmin: boolean
): boolean {
  const effective = resolveAdminPermissions(userId, grants, isBaseAdmin);
  return effective.includes(scope);
}

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAuditLogsCSV(chain: AuditLogEntry[]): string {
  const headers = [
    'Index',
    'Timestamp_UTC',
    'Actor_ID',
    'Actor_Name',
    'Action',
    'Target_Type',
    'Target_ID',
    'Summary',
    'Prev_Hash',
    'Hash',
  ];
  const rows = chain.map((e) =>
    [
      e.index,
      e.timestamp,
      e.actor_id,
      e.actor_name,
      e.action,
      e.target_type,
      e.target_id,
      e.summary,
      e.prev_hash,
      e.hash,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportUsersCSV(users: Profile[]): string {
  const headers = [
    'ID',
    'Handle',
    'Full_Name',
    'Email',
    'Role',
    'Verified',
    'Status',
    'Location',
    'Open_To_Work',
    'Open_To_Hiring',
  ];
  const rows = users.map((u) =>
    [
      u.id,
      u.handle,
      `${u.first_name} ${u.last_name}`.trim(),
      u.email,
      u.role,
      u.verified,
      u.status,
      u.location || '',
      u.open_to_work,
      u.open_to_hiring,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

