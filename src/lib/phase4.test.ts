import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  withdrawConnectionRequest,
  sendConnectionRequest,
  calculateMutualConnections,
  getPendingIncomingRequests,
} from '../features/network/networkUtils';
import {
  filterNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../features/notifications/notificationUtils';
import { executeGlobalSearch } from '../features/search/searchUtils';
import { Connection, Profile, Job, Post, Company, AppNotification } from '../types';

const mockProfiles: Profile[] = [
  {
    id: 'u1',
    handle: 'hamzatariq',
    email: 'hamza.tariq@nextstep.pk',
    first_name: 'Hamza',
    last_name: 'Tariq',
    headline: 'Senior Full-Stack Engineer',
    about: 'Passionate about React and distributed RAAST payment systems',
    location: 'Lahore, Punjab, Pakistan',
    role: 'candidate',
    verified: true,
    status: 'active',
    open_to_work: true,
    open_to_hiring: false,
    completeness_score: 100,
    profile_views_count: 50,
    connections_count: 2,
    followers_count: 100,
    following_count: 50,
    skills: [
      { id: 's1', name: 'React', endorsements_count: 10 },
      { id: 's2', name: 'TypeScript', endorsements_count: 8 },
    ],
    settings: {
      theme: 'light',
      profileVisibility: 'public',
      whoCanMessage: 'anyone',
      whoCanSeeConnections: 'anyone',
      emailNotifications: true,
      jobAlerts: true,
      locale: 'en-PK',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    handle: 'ayeshasiddiqui',
    email: 'ayesha.siddiqui@systemsltd.com',
    first_name: 'Ayesha',
    last_name: 'Siddiqui',
    headline: 'Lead Technical Recruiter at Systems Limited',
    location: 'Lahore, Punjab, Pakistan',
    role: 'recruiter',
    verified: true,
    status: 'active',
    open_to_work: false,
    open_to_hiring: true,
    completeness_score: 90,
    profile_views_count: 120,
    connections_count: 500,
    followers_count: 1200,
    following_count: 300,
    settings: {
      theme: 'light',
      profileVisibility: 'public',
      whoCanMessage: 'anyone',
      whoCanSeeConnections: 'anyone',
      emailNotifications: true,
      jobAlerts: true,
      locale: 'en-PK',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u3',
    handle: 'bilalsheikh',
    email: 'bilal.sheikh@nextstep.pk',
    first_name: 'Bilal',
    last_name: 'Sheikh',
    headline: 'Head of Platform Trust & Governance',
    location: 'Islamabad, ICT, Pakistan',
    role: 'admin',
    verified: true,
    status: 'active',
    open_to_work: false,
    open_to_hiring: false,
    completeness_score: 95,
    profile_views_count: 200,
    connections_count: 450,
    followers_count: 900,
    following_count: 200,
    settings: {
      theme: 'light',
      profileVisibility: 'public',
      whoCanMessage: 'anyone',
      whoCanSeeConnections: 'anyone',
      emailNotifications: true,
      jobAlerts: true,
      locale: 'en-PK',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockConnections: Connection[] = [
  {
    id: 'c1',
    requester_id: 'u1',
    addressee_id: 'u2',
    status: 'accepted',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    partner: mockProfiles[1],
  },
  {
    id: 'c2',
    requester_id: 'u3',
    addressee_id: 'u1',
    status: 'pending',
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
    partner: mockProfiles[2],
  },
];

test('Network: getPendingIncomingRequests filters correctly', () => {
  const incoming = getPendingIncomingRequests(mockConnections, 'u1');
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].id, 'c2');
  assert.equal(incoming[0].requester_id, 'u3');
});

test('Network: acceptConnectionRequest transitions status to accepted', () => {
  const updated = acceptConnectionRequest(mockConnections, 'c2');
  const target = updated.find((c) => c.id === 'c2');
  assert.equal(target?.status, 'accepted');
});

test('Network: declineConnectionRequest transitions status to declined', () => {
  const updated = declineConnectionRequest(mockConnections, 'c2');
  const target = updated.find((c) => c.id === 'c2');
  assert.equal(target?.status, 'declined');
});

test('Network: withdrawConnectionRequest transitions status to withdrawn', () => {
  const outgoingConn: Connection = {
    id: 'c_out',
    requester_id: 'u1',
    addressee_id: 'u3',
    status: 'pending',
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  };
  const list = [outgoingConn, ...mockConnections];
  const updated = withdrawConnectionRequest(list, 'c_out');
  const target = updated.find((c) => c.id === 'c_out');
  assert.equal(target?.status, 'withdrawn');
});

test('Network: sendConnectionRequest creates pending invitation', () => {
  const { newConnections, createdConnection } = sendConnectionRequest(
    mockConnections,
    'u1',
    mockProfiles[2]
  );
  assert.equal(createdConnection.status, 'pending');
  assert.equal(createdConnection.requester_id, 'u1');
  assert.equal(createdConnection.addressee_id, 'u3');
  assert.ok(newConnections.length >= mockConnections.length);
});

test('Network: calculateMutualConnections produces mutual connection details', () => {
  const mutual = calculateMutualConnections('u1', 'u2', mockConnections, mockProfiles);
  assert.ok(typeof mutual.count === 'number');
  assert.ok(mutual.displayText.length > 0);
});

test('Notifications: filtering by category works as expected', () => {
  const notifs: AppNotification[] = [
    {
      id: 'n1',
      user_id: 'u1',
      type: 'reaction',
      title: 'Reaction',
      body: 'Liked your post',
      read: false,
      created_at: '10m ago',
    },
    {
      id: 'n2',
      user_id: 'u1',
      type: 'mention',
      title: 'Mention',
      body: 'Mentioned you in a post',
      read: true,
      created_at: '1h ago',
    },
    {
      id: 'n3',
      user_id: 'u1',
      type: 'job_alert',
      title: 'Job Alert',
      body: 'New matching PKR job',
      read: false,
      created_at: '2h ago',
    },
  ];

  const myPosts = filterNotifications(notifs, 'my_posts');
  assert.equal(myPosts.length, 1);
  assert.equal(myPosts[0].id, 'n1');

  const mentions = filterNotifications(notifs, 'mentions');
  assert.equal(mentions.length, 1);
  assert.equal(mentions[0].id, 'n2');

  const all = filterNotifications(notifs, 'all');
  assert.equal(all.length, 3);
});

test('Notifications: unread count and mark-all-read work accurately', () => {
  const notifs: AppNotification[] = [
    { id: 'n1', user_id: 'u1', type: 'reaction', title: 'T1', body: 'B1', read: false, created_at: '1m ago' },
    { id: 'n2', user_id: 'u1', type: 'comment', title: 'T2', body: 'B2', read: false, created_at: '2m ago' },
    { id: 'n3', user_id: 'u1', type: 'mention', title: 'T3', body: 'B3', read: true, created_at: '3m ago' },
  ];

  assert.equal(getUnreadCount(notifs), 2);

  const markedSingle = markNotificationAsRead(notifs, 'n1');
  assert.equal(getUnreadCount(markedSingle), 1);

  const markedAll = markAllNotificationsAsRead(notifs);
  assert.equal(getUnreadCount(markedAll), 0);
});

test('Search: executeGlobalSearch filters people, jobs, posts, and companies', () => {
  const mockJobs: Job[] = [
    {
      id: 'j1',
      posted_by: 'u2',
      title: 'Staff React Engineer',
      description: 'Building high speed frontends in Lahore',
      location: 'Lahore, Punjab, Pakistan',
      work_mode: 'hybrid',
      type: 'full-time',
      experience_level: 'senior',
      salary_min: 450000,
      salary_max: 680000,
      salary_currency: 'PKR',
      salary_period: 'monthly',
      skills: ['React', 'TypeScript'],
      status: 'open',
      applicants_count: 10,
      views_count: 100,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockPosts: Post[] = [
    {
      id: 'p1',
      author_id: 'u1',
      body: 'Super excited about building NextStep React SPA for Pakistan tech!',
      kind: 'text',
      visibility: 'public',
      hashtags: ['react', 'nextstep'],
      likes_count: 5,
      comments_count: 1,
      reposts_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCompanies: Company[] = [
    {
      id: 'c1',
      slug: 'sadapay',
      name: 'SadaPay',
      tagline: 'Modern digital banking & RAAST infrastructure for Pakistan',
      industry: 'FinTech',
      size: '501-1,000 employees',
      verified: true,
      followers_count: 200000,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const results = executeGlobalSearch('react', {
    profiles: mockProfiles,
    jobs: mockJobs,
    posts: mockPosts,
    companies: mockCompanies,
  });

  assert.equal(results.people.length, 1);
  assert.equal(results.people[0].first_name, 'Hamza');
  assert.equal(results.jobs.length, 1);
  assert.equal(results.jobs[0].title, 'Staff React Engineer');
  assert.equal(results.posts.length, 1);
  assert.equal(results.companies.length, 0);
  assert.equal(results.counts.all, 3);
});
