import { Profile, Job, Post, Company } from '../../types';

export type SearchTab = 'all' | 'people' | 'jobs' | 'posts' | 'companies';

export interface SearchFacetFilters {
  location?: string;
  workMode?: string;
  industry?: string;
  experienceLevel?: string;
}

export interface SearchResults {
  people: Profile[];
  jobs: Job[];
  posts: Post[];
  companies: Company[];
  counts: {
    all: number;
    people: number;
    jobs: number;
    posts: number;
    companies: number;
  };
}

/**
 * Searches across People, Jobs, Posts, and Companies with keyword matching and faceted filtering
 */
export function executeGlobalSearch(
  query: string,
  data: {
    profiles: Profile[];
    jobs: Job[];
    posts: Post[];
    companies: Company[];
  },
  filters?: SearchFacetFilters
): SearchResults {
  const cleanQ = query.trim().toLowerCase();

  // Filter People
  const matchedPeople = data.profiles.filter((p) => {
    if (cleanQ) {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const headline = (p.headline || '').toLowerCase();
      const about = (p.about || '').toLowerCase();
      const location = (p.location || '').toLowerCase();
      const skills = (p.skills || []).map((s) => s.name.toLowerCase()).join(' ');

      const matchesText =
        fullName.includes(cleanQ) ||
        headline.includes(cleanQ) ||
        about.includes(cleanQ) ||
        location.includes(cleanQ) ||
        skills.includes(cleanQ);

      if (!matchesText) return false;
    }

    if (filters?.location && filters.location !== 'all') {
      if (!p.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Filter Jobs
  const matchedJobs = data.jobs.filter((j) => {
    if (cleanQ) {
      const title = j.title.toLowerCase();
      const company = (j.company?.name || '').toLowerCase();
      const location = j.location.toLowerCase();
      const description = j.description.toLowerCase();
      const skills = j.skills.map((s) => s.toLowerCase()).join(' ');

      const matchesText =
        title.includes(cleanQ) ||
        company.includes(cleanQ) ||
        location.includes(cleanQ) ||
        description.includes(cleanQ) ||
        skills.includes(cleanQ);

      if (!matchesText) return false;
    }

    if (filters?.workMode && filters.workMode !== 'all') {
      if (j.work_mode !== filters.workMode) return false;
    }

    if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
      if (j.experience_level !== filters.experienceLevel) return false;
    }

    if (filters?.location && filters.location !== 'all') {
      if (!j.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Filter Posts
  const matchedPosts = data.posts.filter((p) => {
    if (cleanQ) {
      const body = p.body.toLowerCase();
      const authorName = `${p.author?.first_name || ''} ${p.author?.last_name || ''}`.toLowerCase();
      const companyName = (p.company?.name || '').toLowerCase();
      const tags = p.hashtags.map((t) => t.toLowerCase()).join(' ');

      const matchesText =
        body.includes(cleanQ) ||
        authorName.includes(cleanQ) ||
        companyName.includes(cleanQ) ||
        tags.includes(cleanQ);

      if (!matchesText) return false;
    }

    return true;
  });

  // Filter Companies
  const matchedCompanies = data.companies.filter((c) => {
    if (cleanQ) {
      const name = c.name.toLowerCase();
      const tagline = (c.tagline || '').toLowerCase();
      const about = (c.about || '').toLowerCase();
      const industry = c.industry.toLowerCase();
      const hq = (c.hq || '').toLowerCase();

      const matchesText =
        name.includes(cleanQ) ||
        tagline.includes(cleanQ) ||
        about.includes(cleanQ) ||
        industry.includes(cleanQ) ||
        hq.includes(cleanQ);

      if (!matchesText) return false;
    }

    if (filters?.industry && filters.industry !== 'all') {
      if (!c.industry.toLowerCase().includes(filters.industry.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const totalAll =
    matchedPeople.length +
    matchedJobs.length +
    matchedPosts.length +
    matchedCompanies.length;

  return {
    people: matchedPeople,
    jobs: matchedJobs,
    posts: matchedPosts,
    companies: matchedCompanies,
    counts: {
      all: totalAll,
      people: matchedPeople.length,
      jobs: matchedJobs.length,
      posts: matchedPosts.length,
      companies: matchedCompanies.length,
    },
  };
}
