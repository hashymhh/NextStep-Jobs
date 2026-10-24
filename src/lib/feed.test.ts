import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractHashtags,
  extractMentions,
  calculatePollPercentages,
  sortPosts,
  filterPosts,
} from '../features/feed/feedUtils';
import { Post } from '../types';

test('extractHashtags accurately extracts tags without prefix and deduplicates', () => {
  const text = 'Excited to announce our new #Engineering initiative! #Tech #engineering #AI';
  const tags = extractHashtags(text);
  assert.deepEqual(tags, ['engineering', 'tech', 'ai']);

  const emptyText = 'No tags here at all.';
  assert.deepEqual(extractHashtags(emptyText), []);
});

test('extractMentions accurately extracts user handles and deduplicates', () => {
  const text = 'Kudos to @ayeshasiddiqui and @BilalSheikh for the great work! @AyeshaSiddiqui';
  const mentions = extractMentions(text);
  assert.deepEqual(mentions, ['ayeshasiddiqui', 'bilalsheikh']);

  const noMentions = 'Nobody is tagged here.';
  assert.deepEqual(extractMentions(noMentions), []);
});

test('calculatePollPercentages handles zero votes and proportional calculations', () => {
  const zeroOptions = [
    { id: '1', text: 'Opt 1', votes: 0 },
    { id: '2', text: 'Opt 2', votes: 0 },
  ];
  const zeroResults = calculatePollPercentages(zeroOptions, 0);
  assert.equal(zeroResults['1'], 0);
  assert.equal(zeroResults['2'], 0);

  const options = [
    { id: '1', text: 'React', votes: 75 },
    { id: '2', text: 'Vue', votes: 25 },
  ];
  const results = calculatePollPercentages(options, 100);
  assert.equal(results['1'], 75);
  assert.equal(results['2'], 25);
});

test('sortPosts correctly ranks by engagement score and chronological order', () => {
  const samplePosts: Post[] = [
    {
      id: 'p1',
      author_id: 'u1',
      body: 'Low engagement',
      kind: 'text',
      visibility: 'public',
      hashtags: ['test'],
      likes_count: 2,
      comments_count: 0,
      reposts_count: 0,
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
    },
    {
      id: 'p2',
      author_id: 'u2',
      body: 'High engagement',
      kind: 'text',
      visibility: 'public',
      hashtags: ['test'],
      likes_count: 100,
      comments_count: 20,
      reposts_count: 10,
      created_at: '2026-02-01T10:00:00Z',
      updated_at: '2026-02-01T10:00:00Z',
    },
    {
      id: 'p3',
      author_id: 'u3',
      body: 'Most recent but medium engagement',
      kind: 'text',
      visibility: 'public',
      hashtags: ['test'],
      likes_count: 10,
      comments_count: 2,
      reposts_count: 1,
      created_at: '2026-03-15T10:00:00Z',
      updated_at: '2026-03-15T10:00:00Z',
    },
  ];

  const topSorted = sortPosts(samplePosts, 'top');
  assert.equal(topSorted[0].id, 'p2', 'Highest engagement post should be first');

  const recentSorted = sortPosts(samplePosts, 'recent');
  assert.equal(recentSorted[0].id, 'p3', 'Most recently created post should be first');
});

test('filterPosts filters accurately by hashtag and query string', () => {
  const samplePosts: Post[] = [
    {
      id: 'p1',
      author_id: 'u1',
      body: 'Working on #ai and LLMs',
      kind: 'text',
      visibility: 'public',
      hashtags: ['ai', 'tech'],
      likes_count: 5,
      comments_count: 0,
      reposts_count: 0,
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
    },
    {
      id: 'p2',
      author_id: 'u2',
      body: 'Hiring React developers for remote roles #careers',
      kind: 'text',
      visibility: 'public',
      hashtags: ['careers', 'remote'],
      likes_count: 10,
      comments_count: 1,
      reposts_count: 0,
      created_at: '2026-03-02T10:00:00Z',
      updated_at: '2026-03-02T10:00:00Z',
    },
  ];

  const aiFiltered = filterPosts(samplePosts, '#ai');
  assert.equal(aiFiltered.length, 1);
  assert.equal(aiFiltered[0].id, 'p1');

  const remoteFiltered = filterPosts(samplePosts, 'remote');
  assert.equal(remoteFiltered.length, 1);
  assert.equal(remoteFiltered[0].id, 'p2');
});
