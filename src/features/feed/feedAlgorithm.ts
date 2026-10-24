import { Post } from '../../types';

export type FeedSortOption = 'top' | 'recent';

export function calculateEngagementScore(post: Post): number {
  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const reposts = post.reposts_count || 0;
  
  // Recency decay in hours
  const hoursSincePost = Math.max(
    1,
    (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
  );

  const rawScore = likes * 1.5 + comments * 3 + reposts * 4;
  // Gravity decay formula: Score / (hours + 2)^1.2
  return rawScore / Math.pow(hoursSincePost + 2, 1.2);
}

export function sortFeedPosts(posts: Post[], sortOption: FeedSortOption): Post[] {
  const copy = [...posts];

  if (sortOption === 'recent') {
    return copy.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Top sort
  return copy.sort((a, b) => {
    const scoreA = calculateEngagementScore(a);
    const scoreB = calculateEngagementScore(b);
    return scoreB - scoreA;
  });
}

export function filterFeedPosts(
  posts: Post[],
  filter: {
    hashtag?: string;
    visibility?: 'public' | 'connections';
    authorId?: string;
  }
): Post[] {
  return posts.filter((post) => {
    if (filter.hashtag) {
      const tag = filter.hashtag.toLowerCase().replace(/^#/, '');
      const hasTag = post.hashtags.some((t) => t.toLowerCase() === tag);
      if (!hasTag && !post.body.toLowerCase().includes(`#${tag}`)) {
        return false;
      }
    }

    if (filter.authorId && post.author_id !== filter.authorId) {
      return false;
    }

    if (filter.visibility && post.visibility !== filter.visibility) {
      return false;
    }

    return true;
  });
}
