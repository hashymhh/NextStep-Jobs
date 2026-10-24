import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useCompanies } from '../lib/companiesStore';
import { useNetwork } from '../lib/networkStore';
import { useJobsStore } from '../lib/jobsStore';
import { useMessaging } from '../lib/messagingStore';
import { useAuth } from '../lib/clerk/useAuth';
import { useRecruiterStore } from '../lib/recruiterStore';
import { DEMO_POSTS, DEMO_PROFILES } from '../lib/seed/demoData';
import {
  formatSalaryRangePKR,
  formatDatePKT,
  formatRelativePKT,
} from '../lib/locale/pakistan';
import { Profile } from '../types';
import {
  Building,
  MapPin,
  Users,
  Globe,
  CheckCircle,
  ExternalLink,
  Plus,
  Check,
  ThumbsUp,
  MessageCircle,
  Share2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

type CompanyTab = 'home' | 'about' | 'posts' | 'jobs' | 'people';

export const CompanyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getCompanyBySlug, toggleFollow } = useCompanies();
  const { connect, getConnectionStatus, getMutualInfo } = useNetwork();
  const { jobs } = useJobsStore();
  const { startOrOpenConversation } = useMessaging();
  const { isVerifiedRecruiter, isAdmin } = useAuth();
  const { setAffiliatedCompanyId } = useRecruiterStore();

  const [activeTab, setActiveTab] = useState<CompanyTab>('home');
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [peopleFilter, setPeopleFilter] = useState('');

  const company = slug ? getCompanyBySlug(slug) : null;

  if (!company) {
    return (
      <Shell>
        <Card padding="lg" className="text-center py-16">
          <Building className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Organization Not Found
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            The company page &ldquo;{slug}&rdquo; could not be located on NextStep Pakistan.
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/search')}>
            Browse Pakistani Companies
          </Button>
        </Card>
      </Shell>
    );
  }

  const companyJobs = jobs.filter(
    (j) =>
      j.status === 'open' &&
      (j.company_id === company.id ||
        j.company?.slug === company.slug ||
        j.company?.name.toLowerCase() === company.name.toLowerCase())
  );

  const companyPosts = DEMO_POSTS.filter(
    (p) =>
      p.company_id === company.id ||
      p.company?.slug === company.slug ||
      p.company?.name.toLowerCase() === company.name.toLowerCase() ||
      p.body.toLowerCase().includes(company.name.toLowerCase())
  );

  const matchedEmployees = DEMO_PROFILES.filter(
    (p) =>
      p.headline?.toLowerCase().includes(company.name.toLowerCase()) ||
      p.experiences?.some(
        (exp) =>
          exp.company_id === company.id ||
          exp.company_name.toLowerCase().includes(company.name.toLowerCase())
      )
  );

  const baseEmployees =
    matchedEmployees.length > 0 ? matchedEmployees : DEMO_PROFILES.slice(0, 6);

  const displayedEmployees = peopleFilter.trim()
    ? baseEmployees.filter((emp) => {
        const q = peopleFilter.toLowerCase();
        return (
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
          (emp.headline || '').toLowerCase().includes(q) ||
          (emp.location || '').toLowerCase().includes(q)
        );
      })
    : baseEmployees;

  const handleFollow = () => {
    toggleFollow(company.id);
    toast.success(
      company.is_following ? `Unfollowed ${company.name}` : `Following ${company.name}`
    );
  };

  const handleConnect = (person: Profile) => {
    connect(person);
    toast.success(`Connection invitation sent to ${person.first_name} ${person.last_name}`);
  };

  const handleMessageEmployee = (person: Profile) => {
    startOrOpenConversation(
      person,
      `Assalam-o-Alaikum ${person.first_name}, reaching out from the ${company.name} page on NextStep!`
    );
    navigate('/messaging');
  };

  const tabs: { id: CompanyTab; label: string; count?: number }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'posts', label: 'Posts', count: companyPosts.length },
    { id: 'jobs', label: 'Jobs', count: companyJobs.length },
    { id: 'people', label: 'People', count: baseEmployees.length },
  ];

  return (
    <Shell
      leftRail={
        <div className="space-y-3">
          <Card padding="md">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              Organization Snapshot
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4 mb-3 leading-relaxed">
              {company.about || company.tagline}
            </p>
            <div className="space-y-2 text-xs border-t border-gray-100 dark:border-gray-800 pt-3 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{company.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{company.hq || 'Pakistan'}</span>
              </div>
              {company.verified && (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>SECP &amp; PSEB Verified</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline truncate"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-1.5">
              {isVerifiedRecruiter || isAdmin
                ? `Recruiter Controls · ${company.name}`
                : `Hiring for ${company.name}?`}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              {isVerifiedRecruiter || isAdmin
                ? `Manage ${company.name}'s employer brand, post PKR requisitions, or review inbound candidates.`
                : `Verify your corporate recruiter credentials to publish PKR roles under ${company.name}.`}
            </p>
            {isVerifiedRecruiter || isAdmin ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAffiliatedCompanyId(company.id);
                    navigate('/recruiter?tab=company');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer text-left"
                >
                  <span>Manage Employer Brand</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAffiliatedCompanyId(company.id);
                    navigate('/recruiter?tab=requisitions&action=new-job');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-left"
                >
                  <span>Publish PKR Role for {company.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <Link
                    to="/admin?tab=companies"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    <span>Govern Organization in Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/recruiter/verify"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline"
              >
                <span>Request Recruiter Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </Card>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Company Header Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="h-36 sm:h-48 w-full relative bg-slate-800">
            {company.banner_url && !bannerError ? (
              <img
                src={company.banner_url}
                alt={`${company.name} campus banner`}
                referrerPolicy="no-referrer"
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-900 via-[#0A66C2] to-slate-800" />
            )}
          </div>

          <div className="px-5 pb-4 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-3 gap-3">
              <div className="relative">
                {company.logo_url && !logoError ? (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="w-24 h-24 rounded-lg border-4 border-white dark:border-[#1B1F23] bg-white shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg border-4 border-white dark:border-[#1B1F23] bg-[#0A66C2] text-white flex items-center justify-center font-bold text-3xl shadow-sm">
                    {company.name[0]}
                  </div>
                )}
                {company.verified && (
                  <span
                    title="SECP & PSEB Verified Organization"
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1B1F23] rounded-full p-0.5"
                  >
                    <CheckCircle className="w-5 h-5 text-[#0A66C2]" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
                <Button
                  variant={company.is_following ? 'tertiary' : 'primary'}
                  size="sm"
                  leftIcon={
                    company.is_following ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )
                  }
                  onClick={handleFollow}
                >
                  {company.is_following ? 'Following' : 'Follow'}
                </Button>

                {(isVerifiedRecruiter || isAdmin) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAffiliatedCompanyId(company.id);
                      navigate('/recruiter?tab=company');
                    }}
                  >
                    Manage Employer
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => navigate('/admin?tab=companies')}
                  >
                    Admin Governance
                  </Button>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB] text-xs font-semibold hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {company.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {company.tagline || 'Leading technology & engineering organization in Pakistan'}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1 tabular-nums">
                <span>{company.industry}</span>
                <span aria-hidden="true">·</span>
                <span>{company.hq}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {company.followers_count.toLocaleString('en-PK')} followers
                </span>
                <span aria-hidden="true">·</span>
                <span>{company.size}</span>
              </div>
            </div>
          </div>

          {/* 5-Tab Bar: Home, About, Posts, Jobs, People */}
          <div
            role="tablist"
            aria-label="Company sections"
            className="flex overflow-x-auto border-t border-gray-200 dark:border-gray-800 px-5 gap-1"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    isActive
                      ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
                </button>
              );
            })}
          </div>
        </Card>

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                  Overview
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  Full details
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {company.about ||
                  `${company.name} builds scalable software, FinTech, and cloud platforms across Pakistan and global markets.`}
              </p>
            </Card>

            {/* Featured Open Roles */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                  Recent PKR Openings ({companyJobs.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('jobs')}
                  className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  View all jobs
                </button>
              </div>
              {companyJobs.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">
                  No open requisitions published right now.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {companyJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/jobs?id=${job.id}`}
                          className="font-bold text-xs sm:text-sm text-[#0A66C2] dark:text-[#71B7FB] hover:underline block truncate"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.location} · <span className="capitalize">{job.work_mode}</span> ·{' '}
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {formatSalaryRangePKR(
                              job.salary_min,
                              job.salary_max,
                              job.salary_currency,
                              job.salary_period
                            )}
                          </span>
                        </p>
                      </div>
                      <Link to={`/jobs?id=${job.id}`} className="shrink-0">
                        <Button variant="secondary" size="sm">
                          Apply
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Featured Posts Preview */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                  Latest Announcements &amp; Engineering Updates
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  See all posts
                </button>
              </div>
              {companyPosts.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">
                  No recent updates published by {company.name}.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {companyPosts.slice(0, 2).map((post) => (
                    <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-xs text-gray-500 mb-1 tabular-nums">
                        {formatRelativePKT(post.created_at)} · PKT
                      </p>
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {post.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: ABOUT */}
        {activeTab === 'about' && (
          <Card padding="md">
            <h2 className="font-bold text-base text-gray-900 dark:text-white mb-2">
              About {company.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
              {company.about ||
                `${company.name} is a premier ${company.industry} enterprise headquartered in ${company.hq}, delivering resilient software engineering, cloud infrastructure, and digital products.`}
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Corporate Website</dt>
                <dd>
                  <a
                    href={company.website || 'https://nextstep.pk'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline"
                  >
                    {company.website || 'https://nextstep.pk'}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Industry Sector</dt>
                <dd className="text-gray-900 dark:text-gray-100">{company.industry}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Organization Size</dt>
                <dd className="text-gray-900 dark:text-gray-100 tabular-nums">{company.size}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Pakistan Headquarters</dt>
                <dd className="text-gray-900 dark:text-gray-100">{company.hq}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Founded</dt>
                <dd className="text-gray-900 dark:text-gray-100 tabular-nums">
                  {company.founded || 2012}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 mb-0.5">Core Specialties</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {(
                    company.specialties || [
                      'Full-Stack Engineering',
                      'Digital Payments & RAAST',
                      'Cloud Infrastructure',
                      'Applied AI',
                    ]
                  ).join(' · ')}
                </dd>
              </div>
            </dl>
          </Card>
        )}

        {/* TAB 3: POSTS */}
        {activeTab === 'posts' && (
          <Card padding="md">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
              Organization Posts &amp; Mentions ({companyPosts.length})
            </h2>

            {companyPosts.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs">
                No public posts found for {company.name}.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {companyPosts.map((post) => (
                  <article key={post.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {post.author
                            ? `${post.author.first_name} ${post.author.last_name}`
                            : company.name}
                        </p>
                        <p className="text-[11px] text-gray-500 tabular-nums">
                          {formatDatePKT(post.created_at)} · PKT
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line mb-3 leading-relaxed">
                      {post.body}
                    </p>

                    <div className="flex items-center gap-5 text-xs text-gray-500 tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {post.likes_count}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post.comments_count}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        {post.reposts_count}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: JOBS */}
        {activeTab === 'jobs' && (
          <Card padding="md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-sm text-gray-900 dark:text-white tabular-nums">
                Open Requisitions at {company.name} ({companyJobs.length})
              </h2>
              <span className="text-xs text-gray-500">Compensation in PKR</span>
            </div>

            {companyJobs.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                There are currently no active openings listed for {company.name}.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {companyJobs.map((job) => (
                  <div
                    key={job.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/jobs?id=${job.id}`}
                        className="font-bold text-sm text-[#0A66C2] dark:text-[#71B7FB] hover:underline block truncate"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {job.location} · <span className="capitalize">{job.work_mode}</span> ·{' '}
                        <span className="capitalize">{job.type}</span> · Posted{' '}
                        {formatDatePKT(job.created_at, 'short')}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                        {formatSalaryRangePKR(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.salary_period
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        {job.skills.join(' · ')}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link to={`/jobs?id=${job.id}`}>
                        <Button variant="secondary" size="sm">
                          {job.is_external ? 'View Listing' : 'Easy Apply'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 5: PEOPLE */}
        {activeTab === 'people' && (
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                  People at {company.name}
                </h2>
                <p className="text-xs text-gray-500 tabular-nums">
                  {displayedEmployees.length} professionals listed
                </p>
              </div>
              <input
                type="search"
                aria-label={`Search employees at ${company.name}`}
                placeholder="Search by name, role, or city..."
                value={peopleFilter}
                onChange={(e) => setPeopleFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white focus:outline-none focus:border-[#0A66C2] w-full sm:w-60"
              />
            </div>

            {displayedEmployees.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">
                No team members matched &ldquo;{peopleFilter}&rdquo;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayedEmployees.map((emp) => {
                  const status = getConnectionStatus(emp.id);
                  const mutual = getMutualInfo(emp.id);

                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 flex items-start gap-3 bg-white dark:bg-[#1B1F23]"
                    >
                      <Avatar
                        name={`${emp.first_name} ${emp.last_name}`}
                        src={emp.avatar_url}
                        size="md"
                        openToWork={emp.open_to_work}
                        openToHiring={emp.open_to_hiring}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/in/${emp.handle}`}
                          className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline truncate block"
                        >
                          {emp.first_name} {emp.last_name}
                        </Link>
                        <p className="text-[11px] text-gray-500 truncate">{emp.headline}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#0A66C2]" />
                          <span>{mutual.displayText}</span>
                        </p>

                        <div className="mt-2.5 flex items-center gap-2">
                          {status === 'connected' ? (
                            <Button
                              variant="tertiary"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleMessageEmployee(emp)}
                            >
                              Message
                            </Button>
                          ) : status === 'pending_outgoing' ? (
                            <Button
                              variant="tertiary"
                              size="sm"
                              className="h-7 text-xs"
                              disabled
                            >
                              Pending
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs"
                              leftIcon={<UserPlus className="w-3 h-3" />}
                              onClick={() => handleConnect(emp)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </Shell>
  );
};
