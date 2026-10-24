import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProfileCompleteness } from '../features/profile/completeness';
import { DEMO_PROFILES } from './seed/demoData';
import { Profile } from '../types';

test('completeness score is 100% when all profile sections are populated', () => {
  const fullProfile: Profile = {
    id: 'test_full',
    handle: 'testfull',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    headline: 'Senior Full-Stack Engineer at Systems Limited',
    about: 'Experienced software engineer building resilient distributed systems and modern frontends.',
    location: 'Lahore, Punjab, Pakistan',
    avatar_url: '/src/assets/images/pk_tech_campus_banner_1792823334083.jpg',
    role: 'candidate',
    verified: false,
    status: 'active',
    open_to_work: true,
    open_to_hiring: false,
    completeness_score: 100,
    profile_views_count: 100,
    connections_count: 50,
    followers_count: 100,
    following_count: 50,
    experiences: [
      {
        id: 'e1',
        profile_id: 'test_full',
        title: 'Staff Engineer',
        company_name: 'Systems Limited',
        start_date: '2021-01-01',
        is_current: true,
        work_mode: 'remote',
      },
    ],
    educations: [
      {
        id: 'ed1',
        profile_id: 'test_full',
        school_name: 'LUMS',
        start_year: 2015,
        end_year: 2019,
      },
    ],
    skills: [
      { id: 's1', name: 'React', endorsements_count: 5 },
      { id: 's2', name: 'TypeScript', endorsements_count: 4 },
      { id: 's3', name: 'PostgreSQL', endorsements_count: 3 },
    ],
    projects: [
      {
        id: 'p1',
        profile_id: 'test_full',
        title: 'Distributed Cache',
      },
    ],
    settings: {
      theme: 'system',
      profileVisibility: 'public',
      whoCanMessage: 'anyone',
      whoCanSeeConnections: 'anyone',
      emailNotifications: true,
      jobAlerts: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = calculateProfileCompleteness(fullProfile);
  assert.equal(result.score, 100);
  assert.equal(result.missingCount, 0);
});

test('completeness score reflects missing sections accurately', () => {
  const minimalProfile: Profile = {
    id: 'test_min',
    handle: 'testmin',
    email: 'min@nextstep.pk',
    first_name: 'Zain',
    last_name: 'Malik',
    role: 'candidate',
    verified: false,
    status: 'active',
    open_to_work: false,
    open_to_hiring: false,
    completeness_score: 0,
    profile_views_count: 0,
    connections_count: 0,
    followers_count: 0,
    following_count: 0,
    settings: {
      theme: 'system',
      profileVisibility: 'public',
      whoCanMessage: 'anyone',
      whoCanSeeConnections: 'anyone',
      emailNotifications: true,
      jobAlerts: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = calculateProfileCompleteness(minimalProfile);
  assert.equal(result.score, 0);
  assert.equal(result.missingCount, 8);
});

test('Hamza Tariq demo profile has all 8 sections populated', () => {
  const hamza = DEMO_PROFILES.find((p) => p.id === 'usr_candidate_john')!;
  assert.equal(hamza.first_name, 'Hamza');
  assert.equal(hamza.last_name, 'Tariq');
  assert.ok(hamza.experiences && hamza.experiences.length >= 3, 'Must have at least 3 experiences');
  assert.ok(hamza.educations && hamza.educations.length >= 1, 'Must have education');
  assert.ok(hamza.skills && hamza.skills.length >= 5, 'Must have skills');
  assert.ok(hamza.certifications && hamza.certifications.length >= 2, 'Must have certifications');
  assert.ok(hamza.projects && hamza.projects.length >= 2, 'Must have projects');
  assert.ok(hamza.languages && hamza.languages.length >= 2, 'Must have languages');
  assert.ok(hamza.phone, 'Must have phone');
  assert.ok(hamza.website, 'Must have website');
});
