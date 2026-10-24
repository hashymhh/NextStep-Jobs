import { useState, useEffect, useCallback } from 'react';
import {
  AdminOperatorGrant,
  AdminPermissionScope,
  AdminTier,
  Profile,
  UserRole,
  UserStatus,
  VerificationRequest,
  ContentReport,
  PlatformAnnouncement,
  FeatureFlags,
  AuditLogEntry,
  SystemPolicies,
  Company,
} from '../types';
import {
  DEMO_PROFILES,
  DEMO_VERIFICATION_REQUESTS,
  DEMO_CONTENT_REPORTS,
  DEMO_ANNOUNCEMENTS,
  DEMO_COMPANIES,
} from './seed/demoData';
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_OPERATOR_GRANTS,
  DEFAULT_SYSTEM_POLICIES,
  ROLE_PERMISSION_MATRIX,
  appendAuditEntry,
  buildSeedAuditChain,
  hasAdminPermission,
  resolveAdminPermissions,
} from '../features/admin/adminUtils';
import { COMPANIES_EVENT_KEY, COMPANIES_STORAGE_KEY } from './companiesStore';

export const PROFILES_STORAGE_KEY = 'nextstep_v2_pk_profiles_store';
const VERIFICATIONS_KEY = 'nextstep_v2_pk_verifications';
const REPORTS_KEY = 'nextstep_v2_pk_reports';
const ANNOUNCEMENTS_KEY = 'nextstep_v2_pk_announcements';
const FLAGS_KEY = 'nextstep_v2_pk_feature_flags';
const AUDIT_KEY = 'nextstep_v2_pk_audit_logs';
const GRANTS_KEY = 'nextstep_v2_pk_admin_grants';
const POLICIES_KEY = 'nextstep_v2_pk_system_policies';
export const ADMIN_SYNC_EVENT = 'nextstep_v2_pk_admin_sync';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

export function useAdminStore() {
  const [users, setUsers] = useState<Profile[]>(() =>
    readJson(PROFILES_STORAGE_KEY, DEMO_PROFILES)
  );
  const [verifications, setVerifications] = useState<VerificationRequest[]>(() =>
    readJson(VERIFICATIONS_KEY, DEMO_VERIFICATION_REQUESTS)
  );
  const [reports, setReports] = useState<ContentReport[]>(() =>
    readJson(REPORTS_KEY, DEMO_CONTENT_REPORTS)
  );
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(() =>
    readJson(ANNOUNCEMENTS_KEY, DEMO_ANNOUNCEMENTS)
  );
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() =>
    readJson(FLAGS_KEY, DEFAULT_FEATURE_FLAGS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    readJson(AUDIT_KEY, buildSeedAuditChain())
  );
  const [operatorGrants, setOperatorGrants] = useState<AdminOperatorGrant[]>(() =>
    readJson(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS)
  );
  const [systemPolicies, setSystemPolicies] = useState<SystemPolicies>(() =>
    readJson(POLICIES_KEY, DEFAULT_SYSTEM_POLICIES)
  );

  useEffect(() => {
    const onSync = () => {
      setUsers(readJson(PROFILES_STORAGE_KEY, DEMO_PROFILES));
      setVerifications(readJson(VERIFICATIONS_KEY, DEMO_VERIFICATION_REQUESTS));
      setReports(readJson(REPORTS_KEY, DEMO_CONTENT_REPORTS));
      setAnnouncements(readJson(ANNOUNCEMENTS_KEY, DEMO_ANNOUNCEMENTS));
      setFeatureFlags(readJson(FLAGS_KEY, DEFAULT_FEATURE_FLAGS));
      setAuditLogs(readJson(AUDIT_KEY, buildSeedAuditChain()));
      setOperatorGrants(readJson(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS));
      setSystemPolicies(readJson(POLICIES_KEY, DEFAULT_SYSTEM_POLICIES));
    };
    window.addEventListener(ADMIN_SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(ADMIN_SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const emit = () => window.dispatchEvent(new CustomEvent(ADMIN_SYNC_EVENT));

  const recordAudit = useCallback(
    (entryInput: {
      actor_id: string;
      actor_name: string;
      action: string;
      target_type: AuditLogEntry['target_type'];
      target_id: string;
      summary: string;
    }) => {
      const current = readJson<AuditLogEntry[]>(AUDIT_KEY, buildSeedAuditChain());
      const next = appendAuditEntry(current, entryInput);
      setAuditLogs(next);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
      return next;
    },
    []
  );

  const checkScope = useCallback(
    (userId: string, scope: AdminPermissionScope, isBaseAdmin = true) => {
      const currentGrants = readJson<AdminOperatorGrant[]>(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS);
      return hasAdminPermission(userId, scope, currentGrants, isBaseAdmin);
    },
    []
  );

  const getOperatorScopes = useCallback((userId: string, isBaseAdmin = true) => {
    const currentGrants = readJson<AdminOperatorGrant[]>(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS);
    return resolveAdminPermissions(userId, currentGrants, isBaseAdmin);
  }, []);

  const setOperatorTier = useCallback(
    (targetUserId: string, tier: AdminTier, actor: { id: string; name: string }) => {
      const currentGrants = readJson<AdminOperatorGrant[]>(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS);
      const now = new Date().toISOString();
      const exists = currentGrants.some((g) => g.user_id === targetUserId);
      const nextGrants = exists
        ? currentGrants.map((g) =>
            g.user_id === targetUserId
              ? {
                  ...g,
                  tier,
                  custom_granted: [],
                  custom_revoked: [],
                  updated_by: actor.name,
                  updated_at: now,
                }
              : g
          )
        : [
            ...currentGrants,
            {
              user_id: targetUserId,
              tier,
              custom_granted: [],
              custom_revoked: [],
              updated_by: actor.name,
              updated_at: now,
            },
          ];

      setOperatorGrants(nextGrants);
      localStorage.setItem(GRANTS_KEY, JSON.stringify(nextGrants));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'ASSIGN_ADMIN_TIER',
        target_type: 'user',
        target_id: targetUserId,
        summary: `Assigned RBAC tier "${tier}" to operator ${targetUserId}`,
      });
      emit();
    },
    [recordAudit]
  );

  const toggleOperatorScope = useCallback(
    (
      targetUserId: string,
      scope: AdminPermissionScope,
      actor: { id: string; name: string }
    ) => {
      const currentGrants = readJson<AdminOperatorGrant[]>(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS);
      const now = new Date().toISOString();
      const existing =
        currentGrants.find((g) => g.user_id === targetUserId) || {
          user_id: targetUserId,
          tier: 'content_moderator' as AdminTier,
          custom_granted: [],
          custom_revoked: [],
          updated_by: actor.name,
          updated_at: now,
        };

      const defaultTierScopes = ROLE_PERMISSION_MATRIX[existing.tier] || [];
      const currentlyHas = resolveAdminPermissions(targetUserId, currentGrants, false).includes(scope);

      let customGranted = [...existing.custom_granted];
      let customRevoked = [...existing.custom_revoked];

      if (currentlyHas) {
        // Revoke it
        customGranted = customGranted.filter((s) => s !== scope);
        if (defaultTierScopes.includes(scope) && !customRevoked.includes(scope)) {
          customRevoked.push(scope);
        }
      } else {
        // Grant it
        customRevoked = customRevoked.filter((s) => s !== scope);
        if (!defaultTierScopes.includes(scope) && !customGranted.includes(scope)) {
          customGranted.push(scope);
        }
      }

      const updatedGrant: AdminOperatorGrant = {
        ...existing,
        custom_granted: customGranted,
        custom_revoked: customRevoked,
        updated_by: actor.name,
        updated_at: now,
      };

      const nextGrants = currentGrants.some((g) => g.user_id === targetUserId)
        ? currentGrants.map((g) => (g.user_id === targetUserId ? updatedGrant : g))
        : [...currentGrants, updatedGrant];

      setOperatorGrants(nextGrants);
      localStorage.setItem(GRANTS_KEY, JSON.stringify(nextGrants));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: currentlyHas ? 'REVOKE_PERMISSION_SCOPE' : 'GRANT_PERMISSION_SCOPE',
        target_type: 'user',
        target_id: targetUserId,
        summary: `${currentlyHas ? 'Revoked' : 'Granted'} permission "${scope}" on ${targetUserId}`,
      });
      emit();
    },
    [recordAudit]
  );

  const revokeOperatorGrant = useCallback(
    (targetUserId: string, actor: { id: string; name: string }) => {
      if (targetUserId === 'usr_admin_alex') return;
      const currentGrants = readJson<AdminOperatorGrant[]>(GRANTS_KEY, DEFAULT_OPERATOR_GRANTS);
      const nextGrants = currentGrants.filter((g) => g.user_id !== targetUserId);
      setOperatorGrants(nextGrants);
      localStorage.setItem(GRANTS_KEY, JSON.stringify(nextGrants));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'REVOKE_OPERATOR_ACCESS',
        target_type: 'user',
        target_id: targetUserId,
        summary: `Removed delegated admin authority from ${targetUserId}`,
      });
      emit();
    },
    [recordAudit]
  );

  const updateSystemPolicy = useCallback(
    <K extends keyof SystemPolicies>(
      key: K,
      value: SystemPolicies[K],
      actor: { id: string; name: string }
    ) => {
      const current = readJson<SystemPolicies>(POLICIES_KEY, DEFAULT_SYSTEM_POLICIES);
      const next = { ...current, [key]: value };
      setSystemPolicies(next);
      localStorage.setItem(POLICIES_KEY, JSON.stringify(next));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'UPDATE_SYSTEM_POLICY',
        target_type: 'system',
        target_id: String(key),
        summary: `Updated system policy ${String(key)} = ${String(value)}`,
      });
      emit();
    },
    [recordAudit]
  );

  const moderateUser = useCallback(
    (
      targetUserId: string,
      updates: { status?: UserStatus; role?: UserRole; verified?: boolean },
      actor: { id: string; name: string }
    ) => {
      const currentUsers = readJson<Profile[]>(PROFILES_STORAGE_KEY, DEMO_PROFILES);
      const target = currentUsers.find((u) => u.id === targetUserId);
      if (!target) return;

      const nextUsers = currentUsers.map((u) =>
        u.id === targetUserId
          ? { ...u, ...updates, updated_at: new Date().toISOString() }
          : u
      );
      setUsers(nextUsers);
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(nextUsers));

      const changes = Object.entries(updates)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(', ');
      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'MODERATE_USER',
        target_type: 'user',
        target_id: targetUserId,
        summary: `Updated ${target.first_name} ${target.last_name} (@${target.handle}): ${changes}`,
      });
      emit();
    },
    [recordAudit]
  );

  const submitVerificationRequest = useCallback(
    (reqInput: Omit<VerificationRequest, 'id' | 'status' | 'created_at'>) => {
      const current = readJson<VerificationRequest[]>(
        VERIFICATIONS_KEY,
        DEMO_VERIFICATION_REQUESTS
      );
      const newReq: VerificationRequest = {
        ...reqInput,
        id: `ver_${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const next = [newReq, ...current];
      setVerifications(next);
      localStorage.setItem(VERIFICATIONS_KEY, JSON.stringify(next));
      recordAudit({
        actor_id: reqInput.requester_id,
        actor_name: reqInput.requester_name,
        action: 'SUBMIT_VERIFICATION',
        target_type: 'verification',
        target_id: newReq.id,
        summary: `Submitted ${reqInput.entity_type} verification for ${reqInput.company_name} (${reqInput.registration_number || 'PSEB/SECP'})`,
      });
      emit();
      return newReq;
    },
    [recordAudit]
  );

  const reviewVerificationRequest = useCallback(
    (
      reqId: string,
      decision: 'approved' | 'rejected',
      actor: { id: string; name: string }
    ) => {
      const current = readJson<VerificationRequest[]>(
        VERIFICATIONS_KEY,
        DEMO_VERIFICATION_REQUESTS
      );
      const target = current.find((r) => r.id === reqId);
      if (!target) return;

      const now = new Date().toISOString();
      const next = current.map((r) =>
        r.id === reqId
          ? { ...r, status: decision, reviewed_by: actor.name, reviewed_at: now }
          : r
      );
      setVerifications(next);
      localStorage.setItem(VERIFICATIONS_KEY, JSON.stringify(next));

      if (decision === 'approved') {
        const currentUsers = readJson<Profile[]>(PROFILES_STORAGE_KEY, DEMO_PROFILES);
        const nextUsers = currentUsers.map((u) =>
          u.id === target.requester_id
            ? {
                ...u,
                verified: true,
                role: target.entity_type === 'recruiter' ? ('recruiter' as UserRole) : u.role,
                open_to_hiring: true,
                updated_at: now,
              }
            : u
        );
        setUsers(nextUsers);
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(nextUsers));

        // Also mark matching company as verified if found
        const currentCompanies = readJson<Company[]>(COMPANIES_STORAGE_KEY, DEMO_COMPANIES);
        const nextCompanies = currentCompanies.map((c) =>
          c.name.toLowerCase() === target.company_name.toLowerCase()
            ? { ...c, verified: true }
            : c
        );
        localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(nextCompanies));
        window.dispatchEvent(new CustomEvent(COMPANIES_EVENT_KEY));
      }

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: decision === 'approved' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
        target_type: 'verification',
        target_id: reqId,
        summary: `${decision.toUpperCase()} ${target.entity_type} verification for ${target.requester_name} (${target.company_name})`,
      });
      emit();
    },
    [recordAudit]
  );

  const submitContentReport = useCallback(
    (input: Omit<ContentReport, 'id' | 'status' | 'created_at'>) => {
      const current = readJson<ContentReport[]>(REPORTS_KEY, DEMO_CONTENT_REPORTS);
      const newReport: ContentReport = {
        ...input,
        id: `rep_${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const next = [newReport, ...current];
      setReports(next);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      emit();
      return newReport;
    },
    []
  );

  const resolveContentReport = useCallback(
    (
      reportId: string,
      resolution: 'resolved_removed' | 'dismissed',
      actor: { id: string; name: string }
    ) => {
      const current = readJson<ContentReport[]>(REPORTS_KEY, DEMO_CONTENT_REPORTS);
      const target = current.find((r) => r.id === reportId);
      if (!target) return;

      const next = current.map((r) =>
        r.id === reportId ? { ...r, status: resolution } : r
      );
      setReports(next);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'RESOLVE_REPORT',
        target_type:
          target.target_type === 'job'
            ? 'job'
            : target.target_type === 'user'
            ? 'user'
            : 'post',
        target_id: target.target_id,
        summary: `Report ${reportId} marked ${resolution} (${target.reason})`,
      });
      emit();
    },
    [recordAudit]
  );

  const publishAnnouncement = useCallback(
    (
      input: Omit<PlatformAnnouncement, 'id' | 'created_at' | 'active'>,
      actor: { id: string; name: string }
    ) => {
      const current = readJson<PlatformAnnouncement[]>(ANNOUNCEMENTS_KEY, DEMO_ANNOUNCEMENTS);
      const created: PlatformAnnouncement = {
        ...input,
        id: `ann_${Date.now()}`,
        active: true,
        created_at: new Date().toISOString(),
      };
      const next = [created, ...current];
      setAnnouncements(next);
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(next));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'PUBLISH_ANNOUNCEMENT',
        target_type: 'system',
        target_id: created.id,
        summary: `Published platform announcement: "${created.title}"`,
      });
      emit();
    },
    [recordAudit]
  );

  const toggleAnnouncementActive = useCallback(
    (annId: string, actor: { id: string; name: string }) => {
      const current = readJson<PlatformAnnouncement[]>(ANNOUNCEMENTS_KEY, DEMO_ANNOUNCEMENTS);
      const target = current.find((a) => a.id === annId);
      if (!target) return;
      const next = current.map((a) => (a.id === annId ? { ...a, active: !a.active } : a));
      setAnnouncements(next);
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(next));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'TOGGLE_ANNOUNCEMENT',
        target_type: 'system',
        target_id: annId,
        summary: `${!target.active ? 'Activated' : 'Archived'} announcement "${target.title}"`,
      });
      emit();
    },
    [recordAudit]
  );

  const toggleFeatureFlag = useCallback(
    (flagKey: keyof FeatureFlags, actor: { id: string; name: string }) => {
      const current = readJson<FeatureFlags>(FLAGS_KEY, DEFAULT_FEATURE_FLAGS);
      const nextVal = !current[flagKey];
      const next = { ...current, [flagKey]: nextVal };
      setFeatureFlags(next);
      localStorage.setItem(FLAGS_KEY, JSON.stringify(next));

      recordAudit({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'TOGGLE_FEATURE_FLAG',
        target_type: 'system',
        target_id: flagKey,
        summary: `Set feature flag ${flagKey} = ${nextVal}`,
      });
      emit();
    },
    [recordAudit]
  );

  return {
    users,
    verifications,
    reports,
    announcements,
    activeAnnouncements: announcements.filter((a) => a.active),
    featureFlags,
    auditLogs,
    operatorGrants,
    systemPolicies,
    checkScope,
    getOperatorScopes,
    setOperatorTier,
    toggleOperatorScope,
    revokeOperatorGrant,
    updateSystemPolicy,
    recordAudit,
    moderateUser,
    submitVerificationRequest,
    reviewVerificationRequest,
    submitContentReport,
    resolveContentReport,
    publishAnnouncement,
    toggleAnnouncementActive,
    toggleFeatureFlag,
  };
}
