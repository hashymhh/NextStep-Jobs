import { NewsItem } from '../../types';
import { DEMO_NEWS } from '../seed/demoData';

const CACHE_KEY = 'nextstep_news_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedNews {
  timestamp: number;
  data: NewsItem[];
}

export async function fetchNextStepNews(): Promise<NewsItem[]> {
  // 1. Check local cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedNews = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data.length > 0) {
        return parsed.data;
      }
    }
  } catch {
    // ignore cache read errors
  }

  // 2. Fetch live stories from Dev.to public API (no API key needed)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch('https://dev.to/api/articles?tag=career&top=5', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const articles = await res.json();
      if (Array.isArray(articles) && articles.length > 0) {
        const liveNews: NewsItem[] = [
          // Keep pinned announcement at top
          DEMO_NEWS[1],
          ...articles.slice(0, 4).map((art: any) => ({
            id: `devto_${art.id}`,
            title: art.title,
            source: 'Dev.to Tech Career',
            url: art.url,
            published_at: art.readable_publish_date || 'Today',
            readers_count: (art.public_reactions_count || 120) * 85,
            is_announcement: false,
          })),
        ];

        // Save to cache
        try {
          const cacheObj: CachedNews = {
            timestamp: Date.now(),
            data: liveNews,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
        } catch {
          // ignore cache write error
        }

        return liveNews;
      }
    }
  } catch (err) {
    // Network offline or failed - fallback gracefully
    console.debug('Dev.to fetch fallback to seed:', err);
  }

  // 3. Graceful fallback to seeded news
  return DEMO_NEWS;
}
