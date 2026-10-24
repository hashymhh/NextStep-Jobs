import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ADMIN_SCOPES,
  DEFAULT_OPERATOR_GRANTS,
  appendAuditEntry,
  buildSeedAuditChain,
  exportAuditLogsCSV,
  exportUsersCSV,
  hasAdminPermission,
  resolveAdminPermissions,
  verifyAuditChain,
} from '../features/admin/adminUtils';
import {
  cloneJobRequisition,
  computeAnnualPackagePKR,
  computeEvaluationAverage,
  computeRecruiterFunnel,
  validateInterviewInput,
  validateOfferInput,
} from '../features/recruiter/recruiterUtils';
import { DEMO_APPLICATIONS, DEMO_JOBS, DEMO_PROFILES } from './seed/demoData';

test('Super Admin receives all 10 granular admin permission scopes', () => {
  const scopes = resolveAdminPermissions('usr_admin_alex', DEFAULT_OPERATOR_GRANTS, true);
  assert.equal(scopes.length, ALL_ADMIN_SCOPES.length);
  assert.equal(
    hasAdminPermission('usr_admin_alex', 'security:policies', DEFAULT_OPERATOR_GRANTS, true),
    true
  );
  assert.equal(
    hasAdminPermission('usr_admin_alex', 'roles:assign', DEFAULT_OPERATOR_GRANTS, true),
    true
  );
});

test('Delegated Recruiter Ops Admin honors custom revoked and granted scopes', () => {
  // Default grant for usr_recruiter_sarah is recruiter_ops_admin with announcements:manage revoked
  assert.equal(
    hasAdminPermission('usr_recruiter_sarah', 'verifications:review', DEFAULT_OPERATOR_GRANTS, false),
    true
  );
  assert.equal(
    hasAdminPermission('usr_recruiter_sarah', 'companies:govern', DEFAULT_OPERATOR_GRANTS, false),
    true
  );
  assert.equal(
    hasAdminPermission('usr_recruiter_sarah', 'announcements:manage', DEFAULT_OPERATOR_GRANTS, false),
    false
  );
  assert.equal(
    hasAdminPermission('usr_recruiter_sarah', 'roles:assign', DEFAULT_OPERATOR_GRANTS, false),
    false
  );

  // Non-admin candidate without grant gets 0 scopes
  assert.equal(
    resolveAdminPermissions('usr_candidate_john', DEFAULT_OPERATOR_GRANTS, false).length,
    0
  );
});

test('Tamper-evident audit chain preserves integrity across RBAC & policy mutations and exports CSV', () => {
  let chain = buildSeedAuditChain();
  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'UPDATE_ADMIN_GRANT',
    target_type: 'user',
    target_id: 'usr_recruiter_sarah',
    summary: 'Granted audit:export scope to Ayesha Siddiqui',
  });
  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'UPDATE_SYSTEM_POLICY',
    target_type: 'system',
    target_id: 'require_secp_for_jobs',
    summary: 'Enabled mandatory SECP corporate verification for native job publishing',
  });

  const verification = verifyAuditChain(chain);
  assert.equal(verification.valid, true);
  assert.equal(verification.checkedCount, 5);

  const csv = exportAuditLogsCSV(chain);
  assert.ok(csv.includes('Index,Timestamp_UTC,Actor_ID'));
  assert.ok(csv.includes('UPDATE_ADMIN_GRANT'));

  const usersCsv = exportUsersCSV(DEMO_PROFILES.slice(0, 3));
  assert.ok(usersCsv.includes('Handle,Full_Name,Email,Role'));
});

test('Recruiter funnel analytics, evaluation scorecard, job clone, and PKR package math work accurately', () => {
  const funnel = computeRecruiterFunnel({
    jobs: DEMO_JOBS,
    applications: DEMO_APPLICATIONS,
    offers: [
      {
        id: 'off_1',
        application_id: 'app_1',
        job_id: DEMO_JOBS[0].id,
        job_title: DEMO_JOBS[0].title,
        candidate_id: 'usr_candidate_john',
        candidate_name: 'Hamza Tariq',
        base_monthly_pkr: 550000,
        signing_bonus_pkr: 200000,
        joining_date: '2026-11-15',
        work_mode: 'hybrid',
        status: 'accepted',
        created_at: '2026-10-24T06:00:00Z',
      },
    ],
  });

  assert.ok(funnel.totalJobs >= 30);
  assert.ok(funnel.openJobs >= 25);
  assert.equal(funnel.offerAcceptanceRatePercent, 100);

  const avgScore = computeEvaluationAverage({
    application_id: 'app_1',
    technical_score: 5,
    system_design_score: 4,
    communication_score: 5,
    recommendation: 'strong_hire',
    notes: [],
    updated_at: '2026-10-24T06:00:00Z',
  });
  assert.equal(avgScore, 4.7);

  assert.equal(
    computeAnnualPackagePKR({ base_monthly_pkr: 500000, signing_bonus_pkr: 300000 }),
    6300000
  );

  const cloned = cloneJobRequisition(DEMO_JOBS[0], 'usr_recruiter_sarah');
  assert.ok(cloned.title.endsWith('(Copy)'));
  assert.equal(cloned.status, 'draft');
  assert.equal(cloned.salary_currency, 'PKR');

  assert.equal(
    validateInterviewInput({ scheduled_at: '', panelist: 'Ayesha', location_or_link: 'Meet' }),
    'Please select an interview date and time (PKT).'
  );
  assert.equal(
    validateOfferInput({ base_monthly_pkr: 10000, signing_bonus_pkr: 0, joining_date: '2026-12-01' }),
    'Base monthly compensation must be at least PKR 50,000.'
  );
});
