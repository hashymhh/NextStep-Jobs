import { Post, ReactionType } from '../../types';

/**
 * Extracts hashtags from a post body string (e.g. #tech, #nextstep)
 */
export function extractHashtags(body: string): string[] {
  const matches = body.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((tag) => tag.slice(1).toLowerCase())));
}

/**
 * Extracts @mentions from a post body string
 */
export function extractMentions(body: string): string[] {
  const matches = body.match(/@[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

/**
 * Calculates poll option percentages safely
 */
export function calculatePollPercentages(
  options: { id: string; text: string; votes: number }[],
  totalVotes: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (totalVotes <= 0) {
    options.forEach((opt) => (result[opt.id] = 0));
    return result;
  }
  options.forEach((opt) => {
    result[opt.id] = Math.round((opt.votes / totalVotes) * 100);
  });
  return result;
}

/**
 * Sorts posts by 'Top' (engagement score: likes + comments*2 + reposts*3) or 'Recent'
 */
export function sortPosts(posts: Post[], sortBy: 'top' | 'recent'): Post[] {
  const copy = [...posts];
  if (sortBy === 'recent') {
    return copy.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Top engagement sort
  return copy.sort((a, b) => {
    const scoreA = a.likes_count + a.comments_count * 2 + a.reposts_count * 3;
    const scoreB = b.likes_count + b.comments_count * 2 + b.reposts_count * 3;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Filters posts by hashtag or query
 */
export function filterPosts(posts: Post[], tagOrQuery?: string): Post[] {
  if (!tagOrQuery || !tagOrQuery.trim()) return posts;
  const q = tagOrQuery.trim().toLowerCase().replace(/^#/, '');
  return posts.filter((p) => {
    const hasTag = p.hashtags?.some((t) => t.toLowerCase() === q);
    const bodyMatches = p.body.toLowerCase().includes(q);
    const authorMatches =
      p.author?.first_name.toLowerCase().includes(q) ||
      p.author?.last_name.toLowerCase().includes(q);
    return hasTag || bodyMatches || authorMatches;
  });
}
