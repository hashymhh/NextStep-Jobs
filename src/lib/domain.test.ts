import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PROFILES, DEMO_COMPANIES, DEMO_JOBS, DEMO_POSTS } from './seed/demoData';

test('seed dataset requirements: 30 users, 10 companies, 60 posts, 40 jobs', () => {
  assert.equal(DEMO_PROFILES.length, 30, 'Should contain exactly 30 seed user profiles');
  assert.equal(DEMO_COMPANIES.length, 10, 'Should contain exactly 10 seed companies');
  assert.equal(DEMO_POSTS.length, 60, 'Should contain exactly 60 seed posts');
  assert.equal(DEMO_JOBS.length, 40, 'Should contain exactly 40 seed jobs');
});

test('admin persona has correct role and permissions', () => {
  const admin = DEMO_PROFILES.find((p) => p.role === 'admin');
  assert.ok(admin, 'Admin user must exist');
  assert.equal(admin?.verified, true, 'Admin must be verified');
  assert.equal(admin?.status, 'active', 'Admin must be active');
});

test('verified recruiter persona has correct role and verified status', () => {
  const recruiter = DEMO_PROFILES.find((p) => p.role === 'recruiter' && p.verified);
  assert.ok(recruiter, 'Verified recruiter must exist');
  assert.equal(recruiter?.status, 'active');
  assert.equal(recruiter?.open_to_hiring, true);
});

test('candidate persona has correct role and open_to_work', () => {
  const candidate = DEMO_PROFILES.find((p) => p.role === 'candidate');
  assert.ok(candidate, 'Candidate must exist');
  assert.equal(candidate?.open_to_work, true);
});

test('posts data integrity', () => {
  for (const post of DEMO_POSTS) {
    assert.ok(post.id, 'Post must have an id');
    assert.ok(post.author_id, 'Post must have an author_id');
    assert.ok(post.body.length > 0, 'Post body must not be empty');
    assert.ok(Array.isArray(post.hashtags), 'Post hashtags must be an array');
  }
});
