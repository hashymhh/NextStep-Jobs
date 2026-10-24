import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PK_LOCALE,
  PK_CURRENCY,
  PK_TIMEZONE,
  formatCurrencyPKR,
  formatSalaryRangePKR,
  formatDatePKT,
  formatTimePKT,
  formatDateTimePKT,
} from './locale/pakistan';
import {
  DEMO_PROFILES,
  DEMO_COMPANIES,
  DEMO_JOBS,
  DEMO_POSTS,
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES,
  DEMO_APPLICATIONS,
} from './seed/demoData';
import {
  partitionConversations,
  getTotalUnreadCount,
  markThreadMessagesRead,
} from '../features/messaging/messagingUtils';
import {
  filterJobsList,
  calculateJobMatchScore,
  advanceApplicationStatus,
} from '../features/jobs/jobsUtils';
import {
  appendAuditEntry,
  verifyAuditChain,
  buildSeedAuditChain,
  computePlatformAnalytics,
} from '../features/admin/adminUtils';
import {
  autofillResumeFromProfile,
  calculateResumeATSScore,
  suggestPKRRoles,
  generateDefaultRoadmap,
} from '../features/resume/resumeUtils';

test('Localization: default market constants and PKR / PKT formatters align to Pakistan', () => {
  assert.equal(PK_LOCALE, 'en-PK');
  assert.equal(PK_CURRENCY, 'PKR');
  assert.equal(PK_TIMEZONE, 'Asia/Karachi');

  assert.equal(formatCurrencyPKR(450000), 'PKR 450,000');
  assert.equal(formatCurrencyPKR(1500000, { compact: true }), 'PKR 1.5M');
  assert.equal(
    formatSalaryRangePKR(400000, 650000, 'PKR', 'monthly'),
    'PKR 400,000 – PKR 650,000 / mo'
  );

  // 2026-10-24T07:30:00Z in UTC+5 (Asia/Karachi) is 12:30 pm PKT
  const pktTime = formatTimePKT('2026-10-24T07:30:00Z');
  assert.ok(pktTime.includes('12:30'), `Expected 12:30 in PKT, got ${pktTime}`);
  assert.ok(pktTime.endsWith('PKT'));

  const pktDate = formatDatePKT('2026-10-24T20:30:00Z', 'short');
  // 20:30Z + 5h = 01:30 on 25 Oct 2026 in Asia/Karachi!
  assert.ok(pktDate.includes('25'), `UTC+5 date rollover should yield 25 Oct, got ${pktDate}`);
  assert.ok(formatDateTimePKT('2026-10-24T07:30:00Z').endsWith('PKT'));
});

test('Seed Dataset Localization: Pakistani personas, organizations, and PKR salaries', () => {
  assert.equal(DEMO_PROFILES.length, 30);
  assert.equal(DEMO_COMPANIES.length, 10);
  assert.equal(DEMO_POSTS.length, 60);
  assert.equal(DEMO_JOBS.length, 40);

  const candidate = DEMO_PROFILES.find((p) => p.id === 'usr_candidate_john')!;
  const recruiter = DEMO_PROFILES.find((p) => p.id === 'usr_recruiter_sarah')!;
  const admin = DEMO_PROFILES.find((p) => p.id === 'usr_admin_alex')!;

  assert.equal(`${candidate.first_name} ${candidate.last_name}`, 'Hamza Tariq');
  assert.equal(`${recruiter.first_name} ${recruiter.last_name}`, 'Ayesha Siddiqui');
  assert.equal(`${admin.first_name} ${admin.last_name}`, 'Bilal Sheikh');

  const companyNames = DEMO_COMPANIES.map((c) => c.name);
  assert.ok(companyNames.includes('Systems Limited'));
  assert.ok(companyNames.includes('SadaPay'));
  assert.ok(companyNames.includes('Arbisoft'));

  for (const job of DEMO_JOBS) {
    assert.equal(job.salary_currency, 'PKR', `Job ${job.id} must use PKR currency`);
  }
});

test('Phase 5 Messaging: partitionConversations, unread counters, and read receipts', () => {
  const { focused, requests } = partitionConversations(DEMO_CONVERSATIONS);
  assert.ok(focused.length >= 2, 'Should have focused threads');
  assert.ok(requests.length >= 1, 'Should have pending message request');

  const initialUnread = getTotalUnreadCount(
    DEMO_CONVERSATIONS,
    DEMO_MESSAGES,
    'usr_candidate_john'
  );
  assert.ok(initialUnread >= 1, 'Should detect unread messages for Hamza Tariq');

  const firstConvId = focused[0].id;
  const marked = markThreadMessagesRead(
    DEMO_MESSAGES[firstConvId] || [],
    'usr_candidate_john'
  );
  assert.ok(
    marked.every((m) => m.read_by.includes('usr_candidate_john')),
    'All messages in thread must include viewer read receipt'
  );
});

test('Phase 6 & 7 Jobs & Pipeline: PKR filtering, match score, and Kanban stage transitions', () => {
  const highPkrRemote = filterJobsList(DEMO_JOBS, {
    workMode: 'remote',
    minSalaryPKR: 500000,
  });
  assert.ok(highPkrRemote.length > 0);
  assert.ok(
    highPkrRemote.every(
      (j) => j.work_mode === 'remote' && (j.salary_max || j.salary_min || 0) >= 500000
    )
  );

  const externalOnly = filterJobsList(DEMO_JOBS, { source: 'external' });
  assert.ok(externalOnly.every((j) => Boolean(j.is_external)));

  const candidate = DEMO_PROFILES[0];
  const fit = calculateJobMatchScore(DEMO_JOBS[0], candidate);
  assert.ok(fit.score >= 58 && fit.score <= 99);

  const targetApp = DEMO_APPLICATIONS[0];
  const updatedApps = advanceApplicationStatus(
    DEMO_APPLICATIONS,
    targetApp.id,
    'interview',
    'Technical interview scheduled in PKT'
  );
  const moved = updatedApps.find((a) => a.id === targetApp.id)!;
  assert.equal(moved.status, 'interview');
  assert.equal(
    moved.status_timeline[moved.status_timeline.length - 1].status,
    'interview'
  );
});

test('Phase 8 Admin Authority Engine: tamper-evident hash chain & analytics', () => {
  let chain = buildSeedAuditChain();
  assert.equal(chain.length, 3);

  chain = appendAuditEntry(chain, {
    actor_id: 'usr_admin_alex',
    actor_name: 'Bilal Sheikh',
    action: 'APPROVE_VERIFICATION',
    target_type: 'verification',
    target_id: 'ver_test_1',
    summary: 'Approved SECP verification for Arbisoft recruiter',
    timestamp: '2026-10-24T08:00:00Z',
  });

  const validCheck = verifyAuditChain(chain);
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.checkedCount, 4);

  // Tamper with block #2 summary and verify detection
  const tampered = chain.map((b, idx) =>
    idx === 1 ? { ...b, summary: 'Tampered unauthorized edit' } : b
  );
  const tamperedCheck = verifyAuditChain(tampered);
  assert.equal(tamperedCheck.valid, false);
  assert.equal(tamperedCheck.brokenAtIndex, 2);

  const metrics = computePlatformAnalytics({
    profiles: DEMO_PROFILES,
    companies: DEMO_COMPANIES,
    jobs: DEMO_JOBS,
    posts: DEMO_POSTS,
    verifications: [],
    reports: [],
  });
  assert.equal(metrics.totalUsers, 30);
  assert.equal(metrics.totalCompanies, 10);
  assert.ok(metrics.avgMonthlyMaxPKR > 200000);
});

test('Phase 9 Resume Builder & ATS Suite: autofill, ATS score, PKR roles & 30/60/90 roadmap', () => {
  const hamza = DEMO_PROFILES.find((p) => p.id === 'usr_candidate_john')!;
  const resume = autofillResumeFromProfile(hamza, 'modern');

  assert.equal(resume.personal.fullName, 'Hamza Tariq');
  assert.ok(resume.personal.phone.startsWith('+92'));
  assert.ok(resume.experiences.length >= 3);

  const ats = calculateResumeATSScore(resume);
  assert.ok(ats.score >= 70 && ats.score <= 100, `Expected high ATS score, got ${ats.score}`);
  assert.equal(ats.checks.length, 7);

  const roles = suggestPKRRoles(resume);
  assert.equal(roles.length, 4);
  assert.ok(roles[0].monthlyMaxPKR >= roles[0].monthlyMinPKR);

  const roadmap = generateDefaultRoadmap(resume.target_role, resume.skills);
  assert.equal(roadmap.length, 3);
  assert.deepEqual(
    roadmap.map((r) => r.horizon),
    ['30 Days', '60 Days', '90 Days']
  );
});
