import React, { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { DEMO_PROFILES, DEMO_POSTS } from '../lib/seed/demoData';
import { executeGlobalSearch, SearchTab } from '../features/search/searchUtils';
import { useNetwork } from '../lib/networkStore';
import { useCompanies } from '../lib/companiesStore';
import { useJobsStore } from '../lib/jobsStore';
import { formatSalaryRangePKR, formatDatePKT } from '../lib/locale/pakistan';
import {
  Search,
  Users,
  Briefcase,
  Building,
  FileText,
  UserPlus,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const tabParam = (searchParams.get('type') as SearchTab) || 'all';

  const [searchInput, setSearchInput] = useState(query);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const { connect, getConnectionStatus, getMutualInfo } = useNetwork();
  const { companies, toggleFollow } = useCompanies();
  const { jobs } = useJobsStore();

  // Combine fresh companies & jobs state with seed data
  const searchResults = useMemo(() => {
    return executeGlobalSearch(
      query,
      {
        profiles: DEMO_PROFILES,
        jobs,
        posts: DEMO_POSTS,
        companies,
      },
      {
        location: selectedLocation,
        workMode: selectedWorkMode,
        industry: selectedIndustry,
      }
    );
  }, [query, selectedLocation, selectedWorkMode, selectedIndustry, companies, jobs]);

  const handleTabChange = (newTab: SearchTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      nextParams.delete('type');
    } else {
      nextParams.set('type', newTab);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('q', searchInput.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleConnect = (person: any) => {
    connect(person);
    toast.success(`Connection request sent to ${person.first_name} ${person.last_name}`);
  };

  const clearFilters = () => {
    setSelectedLocation('all');
    setSelectedWorkMode('all');
    setSelectedIndustry('all');
  };

  const hasActiveFilters =
    selectedLocation !== 'all' ||
    selectedWorkMode !== 'all' ||
    selectedIndustry !== 'all';

  return (
    <Shell
      leftRail={
        <div className="space-y-3">
          {/* Faceted Filters Card */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0A66C2]" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {/* Location Filter */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Pakistan &amp; Remote</option>
                  <option value="Lahore">Lahore, Punjab</option>
                  <option value="Karachi">Karachi, Sindh</option>
                  <option value="Islamabad">Islamabad, ICT</option>
                  <option value="Rawalpindi">Rawalpindi, Punjab</option>
                  <option value="Remote">Remote (Pakistan)</option>
                </select>
              </div>

              {/* Work Mode Filter (Jobs) */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Workplace Type (Jobs)
                </label>
                <select
                  value={selectedWorkMode}
                  onChange={(e) => setSelectedWorkMode(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">Any Mode</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              {/* Industry Filter (Companies) */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Industry (Companies)
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Industries</option>
                  <option value="Enterprise">Enterprise IT &amp; AI</option>
                  <option value="FinTech">FinTech &amp; Payments</option>
                  <option value="AI">AI &amp; Data Engineering</option>
                  <option value="B2B">B2B Commerce &amp; Mobility</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Header & Tab Bar */}
        <Card padding="none" className="overflow-hidden">
          {/* Top Search Input inside results page */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search jobs, people, companies, or posts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      const next = new URLSearchParams(searchParams);
                      next.delete('q');
                      setSearchParams(next);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="md">
                Search
              </Button>
            </form>
          </div>

          {/* Tab Filter Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 pt-2 overflow-x-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                tabParam === 'all'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({searchResults.counts.all})
            </button>
            <button
              onClick={() => handleTabChange('people')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                tabParam === 'people'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              People ({searchResults.counts.people})
            </button>
            <button
              onClick={() => handleTabChange('jobs')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                tabParam === 'jobs'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Jobs ({searchResults.counts.jobs})
            </button>
            <button
              onClick={() => handleTabChange('companies')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                tabParam === 'companies'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Companies ({searchResults.counts.companies})
            </button>
            <button
              onClick={() => handleTabChange('posts')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                tabParam === 'posts'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Posts ({searchResults.counts.posts})
            </button>
          </div>
        </Card>

        {/* Query Summary */}
        {query && (
          <p className="text-xs text-gray-500 px-1">
            Showing results for <strong className="text-gray-900 dark:text-white">&ldquo;{query}&rdquo;</strong>
          </p>
        )}

        {/* RESULTS SECTION */}
        {searchResults.counts.all === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
              No results found for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Try checking your spelling, using more general search terms, or clearing your active filters.
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Active Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {/* 1. PEOPLE SECTION */}
            {(tabParam === 'all' || tabParam === 'people') && searchResults.people.length > 0 && (
              <Card padding="md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0A66C2]" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">People</h3>
                  </div>
                  {tabParam === 'all' && searchResults.people.length > 3 && (
                    <button
                      onClick={() => handleTabChange('people')}
                      className="text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                    >
                      See all {searchResults.people.length} people
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(tabParam === 'all' ? searchResults.people.slice(0, 3) : searchResults.people).map(
                    (person) => {
                      const status = getConnectionStatus(person.id);
                      const mutual = getMutualInfo(person.id);

                      return (
                        <div
                          key={person.id}
                          className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              name={`${person.first_name} ${person.last_name}`}
                              src={person.avatar_url}
                              size="md"
                              openToWork={person.open_to_work}
                              openToHiring={person.open_to_hiring}
                            />
                            <div className="truncate">
                              <Link
                                to={`/in/${person.handle}`}
                                className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline truncate block"
                              >
                                {person.first_name} {person.last_name}
                              </Link>
                              <p className="text-xs text-gray-500 truncate">{person.headline}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {person.location || 'Lahore, Pakistan'} • {mutual.displayText}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {status === 'connected' ? (
                              <Button
                                variant="tertiary"
                                size="sm"
                                onClick={() => navigate('/messaging')}
                              >
                                Message
                              </Button>
                            ) : status === 'pending_outgoing' ? (
                              <Button variant="tertiary" size="sm" disabled>
                                Pending
                              </Button>
                            ) : status === 'pending_incoming' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/network')}
                              >
                                Respond
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                onClick={() => handleConnect(person)}
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </Card>
            )}

            {/* 2. JOBS SECTION */}
            {(tabParam === 'all' || tabParam === 'jobs') && searchResults.jobs.length > 0 && (
              <Card padding="md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#0A66C2]" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Jobs</h3>
                  </div>
                  {tabParam === 'all' && searchResults.jobs.length > 3 && (
                    <button
                      onClick={() => handleTabChange('jobs')}
                      className="text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                    >
                      See all {searchResults.jobs.length} jobs
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(tabParam === 'all' ? searchResults.jobs.slice(0, 3) : searchResults.jobs).map(
                    (job) => (
                      <div
                        key={job.id}
                        className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            to={`/jobs?id=${job.id}`}
                            className="font-bold text-xs sm:text-sm text-[#0A66C2] dark:text-[#71B7FB] hover:underline block truncate"
                          >
                            {job.title}
                          </Link>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                            {job.company?.name || 'Top Tech Company'}
                          </p>
                          <p className="text-[11px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{job.location} ({job.work_mode})</span>
                            {job.salary_min && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                                • {formatSalaryRangePKR(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills.slice(0, 4).map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 pt-1">
                          <Link to={`/jobs?id=${job.id}`}>
                            <Button variant="secondary" size="sm">
                              Easy Apply
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}

            {/* 3. COMPANIES SECTION */}
            {(tabParam === 'all' || tabParam === 'companies') && searchResults.companies.length > 0 && (
              <Card padding="md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Companies</h3>
                  </div>
                  {tabParam === 'all' && searchResults.companies.length > 3 && (
                    <button
                      onClick={() => handleTabChange('companies')}
                      className="text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                    >
                      See all {searchResults.companies.length} companies
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(tabParam === 'all'
                    ? searchResults.companies.slice(0, 3)
                    : searchResults.companies
                  ).map((comp) => (
                    <div
                      key={comp.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {comp.logo_url ? (
                          <img
                            src={comp.logo_url}
                            alt={comp.name}
                            className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {comp.name[0]}
                          </div>
                        )}
                        <div className="truncate">
                          <Link
                            to={`/company/${comp.slug}`}
                            className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline truncate block"
                          >
                            {comp.name}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">{comp.industry} • {comp.hq}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {comp.followers_count.toLocaleString()} followers
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Button
                          variant={comp.is_following ? 'tertiary' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            toggleFollow(comp.id);
                            toast.success(
                              comp.is_following
                                ? `Unfollowed ${comp.name}`
                                : `Following ${comp.name}`
                            );
                          }}
                        >
                          {comp.is_following ? 'Following' : '+ Follow'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 4. POSTS SECTION */}
            {(tabParam === 'all' || tabParam === 'posts') && searchResults.posts.length > 0 && (
              <Card padding="md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Posts</h3>
                  </div>
                  {tabParam === 'all' && searchResults.posts.length > 3 && (
                    <button
                      onClick={() => handleTabChange('posts')}
                      className="text-xs text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                    >
                      See all {searchResults.posts.length} posts
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(tabParam === 'all' ? searchResults.posts.slice(0, 3) : searchResults.posts).map(
                    (post) => (
                      <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <Avatar
                            name={`${post.author?.first_name || 'User'} ${post.author?.last_name || ''}`}
                            src={post.author?.avatar_url}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">
                              {post.author?.first_name} {post.author?.last_name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {formatDatePKT(post.created_at)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                          {post.body}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-[#0A66C2]" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments_count} comments
                          </span>
                          <Link
                            to={`/?post=${post.id}`}
                            className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline font-medium ml-auto"
                          >
                            View post
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
};
