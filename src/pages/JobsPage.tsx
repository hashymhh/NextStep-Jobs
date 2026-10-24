import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/clerk/useAuth';
import { useJobsStore } from '../lib/jobsStore';
import { useAdminStore } from '../lib/adminStore';
import { filterJobsList, calculateJobMatchScore } from '../features/jobs/jobsUtils';
import { EasyApplyModal } from '../features/jobs/EasyApplyModal';
import {
  formatSalaryRangePKR,
  formatCurrencyPKR,
  formatRelativePKT,
  formatDateTimePKT,
} from '../lib/locale/pakistan';
import { WorkMode } from '../types';
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bell,
  Clock,
  Trash2,
  Plus,
  Building,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

type JobsTab = 'explore' | 'applications' | 'saved' | 'alerts';

export const JobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isVerifiedRecruiter, isAdmin } = useAuth();
  const { featureFlags } = useAdminStore();
  const {
    jobs,
    savedJobIds,
    applications,
    alerts,
    toggleSaveJob,
    submitEasyApply,
    addJobAlert,
    toggleJobAlert,
    deleteJobAlert,
  } = useJobsStore();

  const initialTab = (searchParams.get('tab') as JobsTab) || 'explore';
  const [activeTab, setActiveTab] = useState<JobsTab>(initialTab);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [workMode, setWorkMode] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'native' | 'external'>('all');
  const [minSalaryPKR, setMinSalaryPKR] = useState<number>(0);

  // Easy Apply & AI Match state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<
    Record<
      string,
      { score: number; strengths: string[]; missingSkills: string[]; tip: string }
    >
  >({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  // New Alert Form
  const [alertKeyword, setAlertKeyword] = useState('');
  const [alertLocation, setAlertLocation] = useState('Lahore');
  const [alertMode, setAlertMode] = useState<'all' | WorkMode>('hybrid');
  const [alertMinPKR, setAlertMinPKR] = useState(400000);

  const visibleJobs = useMemo(() => {
    const base = featureFlags.enable_external_jsearch
      ? jobs
      : jobs.filter((j) => !j.is_external);
    return filterJobsList(base, {
      keyword,
      location: locationFilter,
      workMode,
      experienceLevel,
      source: sourceFilter,
      minSalaryPKR,
    });
  }, [
    jobs,
    featureFlags.enable_external_jsearch,
    keyword,
    locationFilter,
    workMode,
    experienceLevel,
    sourceFilter,
    minSalaryPKR,
  ]);

  const selectedJobId = searchParams.get('id') || visibleJobs[0]?.id || '';
  const selectedJob =
    visibleJobs.find((j) => j.id === selectedJobId) ||
    jobs.find((j) => j.id === selectedJobId) ||
    visibleJobs[0] ||
    null;

  const myApplications = useMemo(
    () =>
      applications.filter(
        (a) => a.applicant_id === (profile?.id || 'usr_candidate_john')
      ),
    [applications, profile?.id]
  );

  const savedJobsList = useMemo(
    () => jobs.filter((j) => savedJobIds.includes(j.id)),
    [jobs, savedJobIds]
  );

  const hasAppliedToSelected = selectedJob
    ? myApplications.some((a) => a.job_id === selectedJob.id)
    : false;

  const localMatch = selectedJob
    ? calculateJobMatchScore(selectedJob, profile)
    : null;
  const activeAiInsight = selectedJob ? aiInsights[selectedJob.id] : undefined;

  const handleRunAiMatch = async () => {
    if (!selectedJob || !profile) return;
    setAiLoadingId(selectedJob.id);
    try {
      const res = await fetch('/api/ai/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          jobSkills: selectedJob.skills,
          jobDescription: selectedJob.description,
          candidateHeadline: profile.headline,
          candidateSkills: (profile.skills || []).map((s) => s.name),
          candidateAbout: profile.about,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights((prev) => ({ ...prev, [selectedJob.id]: data }));
        toast.success('AI Job Match analysis updated');
      }
    } catch {
      toast.error('Could not reach AI Match service');
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleSwitchTab = (tab: JobsTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'explore') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertKeyword.trim()) {
      toast.error('Enter a role or skill keyword for your job alert.');
      return;
    }
    addJobAlert({
      keyword: alertKeyword.trim(),
      location: alertLocation,
      work_mode: alertMode,
      min_salary_pkr: alertMinPKR,
      frequency: 'daily',
      enabled: true,
    });
    setAlertKeyword('');
    toast.success('PKR Job Alert created');
  };

  return (
    <Shell hideLeftRail hideRightRail fullWidth>
      <div className="space-y-4">
        {/* Top Sub-Navigation & Filter Bar */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'explore', label: `Explore Jobs (${visibleJobs.length})` },
                  { id: 'applications', label: `My Applications (${myApplications.length})` },
                  { id: 'saved', label: `Saved Jobs (${savedJobsList.length})` },
                  { id: 'alerts', label: `Job Alerts (${alerts.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                    activeTab === tab.id
                      ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-2">
              <Link
                to={
                  isVerifiedRecruiter || isAdmin
                    ? '/recruiter?tab=requisitions&action=new-job'
                    : '/recruiter/verify'
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#004182] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post a PKR Job</span>
              </Link>
              {(isVerifiedRecruiter || isAdmin) && (
                <Link
                  to="/recruiter?tab=pipeline"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0A66C2] dark:hover:text-[#71B7FB] whitespace-nowrap shrink-0"
                >
                  Applicant Pipeline
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin?tab=jobs"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Moderate Jobs
                </Link>
              )}
              <Link
                to="/resume-builder"
                className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline whitespace-nowrap shrink-0"
              >
                Tailor ATS Resume &rarr;
              </Link>
            </div>
          </div>

          {/* Search & Multi-Attribute PKR Filter Bar */}
          {activeTab === 'explore' && (
            <div className="p-3.5 bg-gray-50/70 dark:bg-[#161B22] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="Filter jobs by title, skill, or company"
                  placeholder="Title, skill, or company (e.g. SadaPay, React)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white"
                />
              </div>

              <select
                aria-label="Filter by Pakistan city"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="all">All Pakistan Hubs</option>
                <option value="lahore">Lahore</option>
                <option value="karachi">Karachi</option>
                <option value="islamabad">Islamabad</option>
                <option value="rawalpindi">Rawalpindi</option>
                <option value="remote">Remote</option>
              </select>

              <select
                aria-label="Filter by workplace mode"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="all">Any Workplace</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
              </select>

              <select
                aria-label="Filter by minimum PKR salary"
                value={minSalaryPKR}
                onChange={(e) => setMinSalaryPKR(Number(e.target.value))}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23] tabular-nums"
              >
                <option value={0}>Any PKR Salary</option>
                <option value={250000}>PKR 250,000+ / mo</option>
                <option value={400000}>PKR 400,000+ / mo</option>
                <option value={550000}>PKR 550,000+ / mo</option>
              </select>

              <select
                aria-label="Filter by listing source"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              >
                <option value="all">All Sources (Native + JSearch)</option>
                <option value="native">NextStep Easy Apply Only</option>
                <option value="external">JSearch External Only</option>
              </select>
            </div>
          )}
        </Card>

        {/* TAB 1: LINKEDIN SPLIT-VIEW EXPLORE */}
        {activeTab === 'explore' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Jobs List (5 cols) */}
            <Card padding="none" className="lg:col-span-5 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[720px] overflow-y-auto">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                  {visibleJobs.length} open positions in Pakistan
                </span>
                {(keyword || locationFilter !== 'all' || workMode !== 'all' || minSalaryPKR > 0 || sourceFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword('');
                      setLocationFilter('all');
                      setWorkMode('all');
                      setExperienceLevel('all');
                      setMinSalaryPKR(0);
                      setSourceFilter('all');
                    }}
                    className="text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {visibleJobs.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-500">
                  <SlidersHorizontal className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  No jobs match your active filters. Try lowering the minimum PKR threshold or broadening city filters.
                </div>
              ) : (
                visibleJobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const match = calculateJobMatchScore(job, profile);
                  const isSaved = savedJobIds.includes(job.id);
                  const isApplied = myApplications.some((a) => a.job_id === job.id);

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set('id', job.id);
                        setSearchParams(next);
                      }}
                      className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EDF3F8] dark:bg-[#242B33]'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Avatar
                        name={job.company?.name || 'Company'}
                        src={job.company?.logo_url}
                        size="md"
                        className="rounded-md shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-xs sm:text-sm text-[#0A66C2] dark:text-[#71B7FB] leading-snug line-clamp-2">
                            {job.title}
                          </h3>
                          <span className="text-[11px] font-bold text-[#057642] dark:text-[#34A853] shrink-0 tabular-nums">
                            {match.score}% match
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                          {job.company?.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {job.location} · <span className="capitalize">{job.work_mode}</span>
                        </p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
                          {formatSalaryRangePKR(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                          <span>{formatRelativePKT(job.created_at)}</span>
                          <span>·</span>
                          <span>{job.is_external ? job.source_name || 'JSearch External' : 'Easy Apply'}</span>
                          {isApplied && (
                            <span className="text-[#057642] dark:text-[#34A853] font-bold">· Applied</span>
                          )}
                          {isSaved && <span className="text-[#0A66C2] font-bold">· Saved</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </Card>

            {/* Right Detail Split Pane (7 cols) */}
            <Card padding="lg" className="lg:col-span-7 max-h-[720px] overflow-y-auto space-y-5">
              {selectedJob ? (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar
                        name={selectedJob.company?.name || 'Company'}
                        src={selectedJob.company?.logo_url}
                        size="lg"
                        className="rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        {selectedJob.company?.slug ? (
                          <Link
                            to={`/company/${selectedJob.company.slug}`}
                            className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:underline"
                          >
                            {selectedJob.company.name}
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {selectedJob.company?.name || 'Verified Employer'}
                          </span>
                        )}
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 leading-snug">
                          {selectedJob.title}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1.5 tabular-nums">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{selectedJob.location}</span>
                          <span>·</span>
                          <span>{formatRelativePKT(selectedJob.created_at)}</span>
                          <span>·</span>
                          <span>{selectedJob.applicants_count} applicants</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Compensation & Attribute Strip */}
                  <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">
                        Compensation (PKR)
                      </span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatSalaryRangePKR(
                          selectedJob.salary_min,
                          selectedJob.salary_max,
                          selectedJob.salary_currency,
                          selectedJob.salary_period
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">
                        Work Mode &amp; Type
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">
                        {selectedJob.work_mode} · {selectedJob.type} · {selectedJob.experience_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">
                        Listing Source
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedJob.source_name || 'NextStep Easy Apply'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {hasAppliedToSelected ? (
                      <Button
                        variant="secondary"
                        size="md"
                        leftIcon={<CheckCircle2 className="w-4 h-4 text-[#057642]" />}
                        onClick={() => handleSwitchTab('applications')}
                      >
                        Applied · View Status Timeline
                      </Button>
                    ) : selectedJob.is_external ? (
                      <a
                        href={selectedJob.apply_url || 'https://systemsltd.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="primary"
                          size="md"
                          rightIcon={<ExternalLink className="w-4 h-4" />}
                        >
                          Apply on Company Site
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!featureFlags.enable_easy_apply}
                        onClick={() => setApplyModalOpen(true)}
                      >
                        Easy Apply
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={
                        <Bookmark
                          className={`w-4 h-4 ${
                            savedJobIds.includes(selectedJob.id) ? 'fill-[#0A66C2] text-[#0A66C2]' : ''
                          }`}
                        />
                      }
                      onClick={() => {
                        toggleSaveJob(selectedJob.id);
                        toast.success(
                          savedJobIds.includes(selectedJob.id)
                            ? 'Removed from Saved Jobs'
                            : 'Saved job to your list'
                        );
                      }}
                    >
                      {savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save'}
                    </Button>

                    <Button
                      variant="tertiary"
                      size="md"
                      leftIcon={<Sparkles className="w-4 h-4 text-[#0A66C2]" />}
                      isLoading={aiLoadingId === selectedJob.id}
                      onClick={handleRunAiMatch}
                    >
                      Analyze AI Fit
                    </Button>
                  </div>

                  {/* AI Job Match Card */}
                  {localMatch && (
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#0A66C2]" />
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            Profile &amp; Skill Match Score
                          </h3>
                        </div>
                        <span className="text-base font-extrabold text-[#0A66C2] dark:text-[#71B7FB] tabular-nums">
                          {activeAiInsight?.score ?? localMatch.score}%
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {selectedJob.skills.map((sk) => {
                          const matched = localMatch.matchedSkills.includes(sk);
                          return (
                            <span
                              key={sk}
                              className={`px-2 py-0.5 rounded font-semibold ${
                                matched
                                  ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {matched ? '✓ ' : '+ '}
                              {sk}
                            </span>
                          );
                        })}
                      </div>

                      {activeAiInsight && (
                        <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/50 text-xs space-y-1 text-gray-700 dark:text-gray-300">
                          {activeAiInsight.strengths.map((s, idx) => (
                            <p key={idx}>• {s}</p>
                          ))}
                          <p className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] pt-1">
                            Coach Tip: {activeAiInsight.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Job Description */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      About the job
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {selectedJob.description}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-gray-500 text-sm">
                  Select a job from the left list to view full compensation and Easy Apply details.
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS & STATUS TIMELINE TRACKER */}
        {activeTab === 'applications' && (
          <div className="space-y-3">
            {myApplications.length === 0 ? (
              <Card padding="lg" className="text-center py-12">
                <Briefcase className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  No applications submitted yet
                </h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Use Easy Apply on any open position to track recruiter stages in real time.
                </p>
                <Button size="sm" onClick={() => handleSwitchTab('explore')}>
                  Explore Open PKR Jobs
                </Button>
              </Card>
            ) : (
              myApplications.map((app) => (
                <Card key={app.id} padding="md" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={app.job?.company?.name || 'Company'}
                        src={app.job?.company?.logo_url}
                        size="md"
                        className="rounded-md"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          {app.job?.title || 'Software Engineering Role'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {app.job?.company?.name} · {app.job?.location} · Resume: {app.resume_name}
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center text-xs font-bold uppercase tracking-wide text-[#0A66C2] dark:text-[#71B7FB]">
                      Stage: {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Chronological Status Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    {app.status_timeline.map((stepItem, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white capitalize">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#057642]" />
                          <span>{stepItem.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 tabular-nums">
                          {formatDateTimePKT(stepItem.timestamp)}
                        </p>
                        {stepItem.note && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                            {stepItem.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SAVED JOBS */}
        {activeTab === 'saved' && (
          <Card padding="md">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
              Saved Jobs ({savedJobsList.length})
            </h2>
            {savedJobsList.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">
                No saved jobs yet. Bookmark interesting PKR positions to compare and apply later.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {savedJobsList.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('explore');
                          setSearchParams({ id: job.id });
                        }}
                        className="font-bold text-sm text-[#0A66C2] dark:text-[#71B7FB] hover:underline text-left truncate block cursor-pointer"
                      >
                        {job.title}
                      </button>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {job.company?.name} · {job.location}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                        {formatSalaryRangePKR(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveTab('explore');
                          setSearchParams({ id: job.id });
                        }}
                      >
                        View &amp; Apply
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        aria-label={`Remove ${job.title} from saved`}
                        onClick={() => toggleSaveJob(job.id)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: JOB ALERTS */}
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="md" className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0A66C2]" />
                Create PKR Job Alert
              </h3>
              <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Role or Skill Keyword *</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal React Engineer"
                    value={alertKeyword}
                    onChange={(e) => setAlertKeyword(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">City / Hub</label>
                  <select
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Remote">Remote (Pakistan)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Minimum Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    step={25000}
                    value={alertMinPKR}
                    onChange={(e) => setAlertMinPKR(Number(e.target.value))}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] tabular-nums"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Save Job Alert
                </Button>
              </form>
            </Card>

            <Card padding="md" className="md:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#0A66C2]" />
                Active Alert Rules ({alerts.length})
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {alerts.map((rule) => (
                  <div key={rule.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{rule.keyword}</p>
                      <p className="text-gray-500 mt-0.5 tabular-nums">
                        {rule.location} · {rule.work_mode} · Min{' '}
                        {formatCurrencyPKR(rule.min_salary_pkr || 300000)} / mo · {rule.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={rule.enabled ? 'secondary' : 'tertiary'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleJobAlert(rule.id)}
                      >
                        {rule.enabled ? 'Enabled' : 'Paused'}
                      </Button>
                      <button
                        type="button"
                        aria-label={`Delete alert ${rule.keyword}`}
                        onClick={() => deleteJobAlert(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {selectedJob && profile && applyModalOpen && (
        <EasyApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={selectedJob}
          applicant={profile}
          onSubmitApplication={(payload) => {
            submitEasyApply({
              job: selectedJob,
              applicant: profile,
              ...payload,
            });
            toast.success(`Application submitted to ${selectedJob.company?.name}!`);
          }}
        />
      )}
    </Shell>
  );
};
