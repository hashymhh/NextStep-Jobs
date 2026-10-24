import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedRecruiterRoute } from '../components/layout/RouteGuards';
import { useAuth } from '../lib/clerk/useAuth';
import { useJobsStore } from '../lib/jobsStore';
import { useCompanies } from '../lib/companiesStore';
import { useAdminStore } from '../lib/adminStore';
import { useRecruiterStore } from '../lib/recruiterStore';
import { useMessaging } from '../lib/messagingStore';
import {
  FUNNEL_STAGE_ORDER,
  cloneJobRequisition,
  computeEvaluationAverage,
  computeRecruiterFunnel,
} from '../features/recruiter/recruiterUtils';
import { RecruiterCandidateDrawer } from '../features/recruiter/RecruiterCandidateDrawer';
import { RecruiterInterviewsOffersSection } from '../features/recruiter/RecruiterInterviewsOffersSection';
import { RecruiterTalentPoolSection } from '../features/recruiter/RecruiterTalentPoolSection';
import { RecruiterCompanySection } from '../features/recruiter/RecruiterCompanySection';
import {
  formatCurrencyPKR,
  formatSalaryRangePKR,
  formatDateTimePKT,
} from '../lib/locale/pakistan';
import {
  Application,
  ApplicationStatus,
  ExperienceLevel,
  Job,
  JobType,
  Profile,
  ScreeningQuestion,
  WorkMode,
} from '../types';
import {
  Briefcase,
  Plus,
  Search,
  MessageSquare,
  X,
  Trash2,
  ShieldCheck,
  Edit3,
  Copy,
  Star,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export type RecruiterTab =
  | 'overview'
  | 'pipeline'
  | 'requisitions'
  | 'interviews'
  | 'talent'
  | 'company'
  | 'verification';

function normalizeRecruiterTab(raw?: string | null): RecruiterTab {
  if (!raw) return 'overview';
  if (raw === 'jobs') return 'requisitions';
  if (raw === 'offers') return 'interviews';
  const valid: RecruiterTab[] = [
    'overview',
    'pipeline',
    'requisitions',
    'interviews',
    'talent',
    'company',
    'verification',
  ];
  return valid.includes(raw as RecruiterTab) ? (raw as RecruiterTab) : 'overview';
}

export const RecruiterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { section } = useParams<{ section?: string }>();
  const { profile, isVerifiedRecruiter, isAdmin } = useAuth();
  const {
    jobs,
    applications,
    createOrUpdateJob,
    toggleFeaturedJob,
    updateJobModerationStatus,
    updateApplicationStage,
  } = useJobsStore();
  const { companies, updateCompany } = useCompanies();
  const { users, verifications, submitVerificationRequest } = useAdminStore();
  const {
    evaluations,
    interviews,
    offers,
    talentPool,
    affiliatedCompanyId,
    upsertEvaluation,
    addEvaluationNote,
    scheduleInterview,
    updateInterviewStatus,
    createOffer,
    updateOfferStatus,
    saveToTalentPool,
    removeFromTalentPool,
    setAffiliatedCompanyId,
  } = useRecruiterStore();
  const { startOrOpenConversation } = useMessaging();

  const initialTab = normalizeRecruiterTab(searchParams.get('tab') || section);
  const [activeTab, setActiveTab] = useState<RecruiterTab>(initialTab);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [requisitionSearch, setRequisitionSearch] = useState('');
  const [requisitionStatusFilter, setRequisitionStatusFilter] = useState<
    'all' | Job['status']
  >('all');
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [inspectAppId, setInspectAppId] = useState<string | null>(null);

  // Job Editor Modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | undefined>(undefined);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompanyId, setJobCompanyId] = useState(
    affiliatedCompanyId || companies[0]?.id || 'comp_systems'
  );
  const [jobLocation, setJobLocation] = useState('Lahore, Punjab, Pakistan');
  const [jobWorkMode, setJobWorkMode] = useState<WorkMode>('hybrid');
  const [jobType, setJobType] = useState<JobType>('full-time');
  const [jobExpLevel, setJobExpLevel] = useState<ExperienceLevel>('senior');
  const [salaryMin, setSalaryMin] = useState('420000');
  const [salaryMax, setSalaryMax] = useState('680000');
  const [jobSkillsInput, setJobSkillsInput] = useState(
    'React, TypeScript, Node.js, PostgreSQL'
  );
  const [jobDescription, setJobDescription] = useState('');
  const [jobStatusField, setJobStatusField] = useState<Job['status']>('open');
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);
  const [jobFormError, setJobFormError] = useState<string | null>(null);

  const recruiterName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Ayesha Siddiqui';

  const openCreateJobModal = () => {
    setEditingJobId(undefined);
    setJobTitle('');
    setJobCompanyId(affiliatedCompanyId || companies[0]?.id || 'comp_systems');
    setJobLocation('Lahore, Punjab, Pakistan');
    setJobWorkMode('hybrid');
    setJobType('full-time');
    setJobExpLevel('senior');
    setSalaryMin('420000');
    setSalaryMax('680000');
    setJobSkillsInput('React, TypeScript, Node.js, PostgreSQL');
    setJobDescription(
      'Own end-to-end architecture and production delivery for high-scale digital services in Pakistan.'
    );
    setJobStatusField('open');
    setScreeningQuestions([
      {
        id: `sq_${Date.now()}`,
        question: 'How many years of production TypeScript & React experience do you have?',
        type: 'number',
        required: true,
      },
    ]);
    setJobFormError(null);
    setIsJobModalOpen(true);
  };

  useEffect(() => {
    const incoming = searchParams.get('tab') || section;
    if (incoming) {
      setActiveTab(normalizeRecruiterTab(incoming));
    }
    if (searchParams.get('action') === 'new-job') {
      openCreateJobModal();
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, section]);

  const handleSelectTab = (tab: RecruiterTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const nativeRecruiterJobs = useMemo(
    () => jobs.filter((j) => !j.is_external),
    [jobs]
  );

  const filteredRequisitions = useMemo(() => {
    return nativeRecruiterJobs.filter((j) => {
      if (requisitionStatusFilter !== 'all' && j.status !== requisitionStatusFilter) {
        return false;
      }
      if (requisitionSearch.trim()) {
        const q = requisitionSearch.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          (j.company?.name || '').toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nativeRecruiterJobs, requisitionSearch, requisitionStatusFilter]);

  const filteredPipelineApps = useMemo(() => {
    if (selectedJobFilter === 'all') return applications;
    return applications.filter((a) => a.job_id === selectedJobFilter);
  }, [applications, selectedJobFilter]);

  const funnel = useMemo(
    () =>
      computeRecruiterFunnel({
        jobs,
        applications,
        offers,
      }),
    [applications, jobs, offers]
  );

  const inspectApp: Application | null = useMemo(
    () => (inspectAppId ? applications.find((a) => a.id === inspectAppId) || null : null),
    [applications, inspectAppId]
  );

  const openEditJobModal = (job: Job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobCompanyId(job.company_id || companies[0]?.id || 'comp_systems');
    setJobLocation(job.location);
    setJobWorkMode(job.work_mode);
    setJobType(job.type);
    setJobExpLevel(job.experience_level);
    setSalaryMin(String(job.salary_min || 380000));
    setSalaryMax(String(job.salary_max || 600000));
    setJobSkillsInput(job.skills.join(', '));
    setJobDescription(job.description);
    setJobStatusField(job.status);
    setScreeningQuestions(job.screening_questions || []);
    setJobFormError(null);
    setIsJobModalOpen(true);
  };

  const handleCloneJob = (job: Job) => {
    const clonedPayload = cloneJobRequisition(job, profile?.id || 'usr_recruiter_sarah');
    createOrUpdateJob(clonedPayload);
    toast.success(`Cloned requisition as draft: "${clonedPayload.title}"`);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    setJobFormError(null);

    if (!jobTitle.trim()) {
      setJobFormError('Job title is required.');
      return;
    }
    const minNum = Number(salaryMin);
    const maxNum = Number(salaryMax);
    if (!Number.isFinite(minNum) || !Number.isFinite(maxNum) || minNum <= 0 || maxNum < minNum) {
      setJobFormError('Enter valid monthly PKR salary bounds (maximum must be >= minimum).');
      return;
    }
    if (!jobDescription.trim()) {
      setJobFormError('Job description cannot be empty.');
      return;
    }

    const cleanedQuestions = screeningQuestions
      .map((q) => ({ ...q, question: q.question.trim() }))
      .filter((q) => q.question.length > 0);

    const parsedSkills = jobSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createOrUpdateJob({
      id: editingJobId,
      title: jobTitle.trim(),
      company_id: jobCompanyId,
      posted_by: profile?.id || 'usr_recruiter_sarah',
      location: jobLocation.trim() || 'Lahore, Pakistan',
      work_mode: jobWorkMode,
      type: jobType,
      experience_level: jobExpLevel,
      salary_min: minNum,
      salary_max: maxNum,
      salary_currency: 'PKR',
      salary_period: 'monthly',
      skills: parsedSkills.length > 0 ? parsedSkills : ['TypeScript', 'React'],
      description: jobDescription.trim(),
      screening_questions: cleanedQuestions,
      status: jobStatusField,
    });

    setIsJobModalOpen(false);
    toast.success(
      editingJobId
        ? `Updated requisition "${jobTitle.trim()}"`
        : `Published PKR requisition "${jobTitle.trim()}"`
    );
  };

  const handleMoveStage = (appId: string, nextStage: ApplicationStatus) => {
    updateApplicationStage(appId, nextStage, `Updated by ${recruiterName} (PKT)`);
    toast.success(`Candidate moved to ${nextStage.replace('_', ' ')}`);
  };

  const handleMessageCandidate = (candidate?: Profile, customMessage?: string) => {
    if (!candidate) return;
    startOrOpenConversation(
      candidate,
      customMessage ||
        `Assalam-o-Alaikum ${candidate.first_name}, thank you for applying via NextStep Pakistan. Are you available for a quick screening call this week (PKT)?`
    );
    navigate('/messaging');
  };

  const tabs: { id: RecruiterTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview & Funnel' },
    { id: 'pipeline', label: 'Applicant Pipeline', count: applications.length },
    { id: 'requisitions', label: 'Job Requisitions', count: nativeRecruiterJobs.length },
    {
      id: 'interviews',
      label: 'Interviews & Offers',
      count: interviews.filter((i) => i.status === 'scheduled').length + offers.length,
    },
    { id: 'talent', label: 'Talent Search & Pools', count: talentPool.length },
    { id: 'company', label: 'Employer Profile' },
    { id: 'verification', label: 'SECP Credentials' },
  ];

  const activeEmployer =
    companies.find((c) => c.id === affiliatedCompanyId) || companies[0];

  return (
    <VerifiedRecruiterRoute>
      <Shell hideLeftRail hideRightRail fullWidth>
        <div className="space-y-5">
          {/* Top Workspace Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#1B1F23] p-5 rounded-xl border border-[#E0DFDC] dark:border-[#38434F]">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#0A66C2] dark:text-[#71B7FB]" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recruiter Command Center &amp; Hiring Suite
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                Active Recruiter: {recruiterName} · Organization: {activeEmployer?.name || 'Systems Limited'} · Currency PKR · Timezone PKT
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="secondary" size="sm">
                    Admin Console
                  </Button>
                </Link>
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                onClick={() => handleSelectTab('verification')}
              >
                SECP Verified
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openCreateJobModal}
              >
                Post a PKR Job
              </Button>
            </div>
          </div>

          {/* Segmented 7-Section Navigation */}
          <div
            role="tablist"
            aria-label="Recruiter workspace sections"
            className="flex overflow-x-auto p-1 rounded-lg bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] gap-1"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    active
                      ? 'bg-[#0A66C2] text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
                </button>
              );
            })}
          </div>

          {/* 1. OVERVIEW & HIRING FUNNEL ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Open PKR Requisitions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {funnel.openJobs}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {funnel.pausedJobs} paused · {funnel.closedJobs} closed
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Pipeline Applicants</p>
                  <p className="text-2xl font-bold text-[#0A66C2] dark:text-[#71B7FB] mt-1">
                    {funnel.totalApplicants}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {funnel.shortlistRatePercent}% shortlist conversion
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Scheduled PKT Loops</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {interviews.filter((i) => i.status === 'scheduled').length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {talentPool.length} candidates in talent pools
                  </p>
                </Card>

                <Card padding="md">
                  <p className="text-xs text-gray-500 font-medium">Avg Senior Monthly Cap</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {formatCurrencyPKR(funnel.avgMonthlyMaxPKR)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {offers.length} active PKR offer letters
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Stage Conversion Funnel */}
                <Card padding="md" className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        End-to-End Hiring Stage Funnel
                      </h2>
                      <p className="text-xs text-gray-500">
                        Click any pipeline stage to inspect candidates on the Kanban board.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectTab('pipeline')}
                    >
                      Open Kanban
                    </Button>
                  </div>

                  <div className="space-y-2.5 pt-1 tabular-nums">
                    {FUNNEL_STAGE_ORDER.map((stage) => {
                      const count = funnel.stageCounts[stage.id] || 0;
                      const maxRef = Math.max(1, funnel.totalApplicants);
                      const pct = Math.max(6, Math.round((count / maxRef) * 100));
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => handleSelectTab('pipeline')}
                          className="w-full text-left group cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#0A66C2]">
                              {stage.label}
                            </span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">
                              {count} candidate{count === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                stage.id === 'hired' || stage.id === 'offer'
                                  ? 'bg-emerald-600'
                                  : stage.id === 'rejected'
                                  ? 'bg-gray-400'
                                  : 'bg-[#0A66C2]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Upcoming PKT Interviews + Quick Actions */}
                <Card padding="md" className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#0A66C2]" />
                        <span>Upcoming PKT Interviews</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleSelectTab('interviews')}
                        className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                      >
                        Manage All
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                      {interviews
                        .filter((i) => i.status === 'scheduled')
                        .slice(0, 3)
                        .map((item) => (
                          <div key={item.id} className="py-2.5 first:pt-0">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {item.candidate_name} ·{' '}
                              <span className="font-normal text-gray-500 capitalize">
                                {item.round.replace('_', ' ')}
                              </span>
                            </p>
                            <p className="text-gray-500 tabular-nums mt-0.5">
                              {formatDateTimePKT(item.scheduled_at)} · {item.mode}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateJobModal}
                    >
                      Post PKR Job
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectTab('talent')}
                    >
                      Search Talent
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 2. APPLICANT KANBAN PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Drag candidate cards across columns or open any candidate dossier to score, schedule PKT interviews, and issue PKR offers.
                </p>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="pipeline-job-filter"
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap"
                  >
                    Requisition:
                  </label>
                  <select
                    id="pipeline-job-filter"
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white"
                  >
                    <option value="all">
                      All Requisitions ({applications.length})
                    </option>
                    {nativeRecruiterJobs.slice(0, 20).map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} — {j.company?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto pb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3 min-w-[1020px]">
                  {FUNNEL_STAGE_ORDER.map((stage) => {
                    const stageApps = filteredPipelineApps.filter(
                      (a) => a.status === stage.id
                    );
                    return (
                      <div
                        key={stage.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAppId) {
                            handleMoveStage(draggedAppId, stage.id);
                            setDraggedAppId(null);
                          }
                        }}
                        className="bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-xl p-3 flex flex-col min-h-[420px]"
                      >
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 dark:border-gray-800">
                          <h2 className="text-xs font-bold text-gray-900 dark:text-white">
                            {stage.label}
                          </h2>
                          <span className="text-xs font-mono tabular-nums text-gray-500">
                            {stageApps.length}
                          </span>
                        </div>

                        <div className="space-y-2.5 flex-1">
                          {stageApps.length === 0 ? (
                            <p className="text-[11px] text-gray-400 text-center py-8">
                              Drop candidate here
                            </p>
                          ) : (
                            stageApps.map((app) => {
                              const candName = app.applicant
                                ? `${app.applicant.first_name} ${app.applicant.last_name}`
                                : 'Hamza Tariq';
                              const evalData = evaluations[app.id];
                              const avg = computeEvaluationAverage(evalData);

                              return (
                                <div
                                  key={app.id}
                                  draggable
                                  onDragStart={() => setDraggedAppId(app.id)}
                                  className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/80 bg-[#FAF9F7] dark:bg-[#12161A] space-y-2 cursor-grab active:cursor-grabbing"
                                >
                                  <div className="flex items-start gap-2">
                                    <Avatar
                                      name={candName}
                                      src={app.applicant?.avatar_url}
                                      size="xs"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                        {candName}
                                      </p>
                                      <p className="text-[11px] text-gray-500 truncate">
                                        {app.job?.title || 'Engineering Role'}
                                      </p>
                                    </div>
                                  </div>

                                  {avg > 0 && (
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 tabular-nums">
                                      <Star className="w-3 h-3 fill-current" />
                                      <span>{avg} / 5 Scorecard</span>
                                    </p>
                                  )}

                                  <select
                                    aria-label={`Move ${candName} stage`}
                                    value={app.status}
                                    onChange={(e) =>
                                      handleMoveStage(
                                        app.id,
                                        e.target.value as ApplicationStatus
                                      )
                                    }
                                    className="w-full text-[11px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                                  >
                                    {FUNNEL_STAGE_ORDER.map((st) => (
                                      <option key={st.id} value={st.id}>
                                        {st.label}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-200/70 dark:border-gray-800">
                                    <button
                                      type="button"
                                      onClick={() => setInspectAppId(app.id)}
                                      className="text-[11px] font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                                    >
                                      Evaluate &amp; Offer
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Message ${candName}`}
                                      onClick={() =>
                                        handleMessageCandidate(app.applicant)
                                      }
                                      className="p-1 text-gray-500 hover:text-[#0A66C2] cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. JOB REQUISITIONS MANAGER (FULL LIFECYCLE) */}
          {activeTab === 'requisitions' && (
            <Card padding="md" className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Filter job requisitions"
                    placeholder="Filter requisitions by title, company, or hub..."
                    value={requisitionSearch}
                    onChange={(e) => setRequisitionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter requisitions by status"
                    value={requisitionStatusFilter}
                    onChange={(e) =>
                      setRequisitionStatusFilter(e.target.value as 'all' | Job['status'])
                    }
                    className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  >
                    <option value="all">All Statuses ({nativeRecruiterJobs.length})</option>
                    <option value="open">Open</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={openCreateJobModal}
                  >
                    New PKR Requisition
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRequisitions.map((job) => {
                  const appCount = applications.filter((a) => a.job_id === job.id).length;
                  return (
                    <div
                      key={job.id}
                      className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/jobs?id=${job.id}`}
                            className="font-bold text-sm text-gray-900 dark:text-white hover:text-[#0A66C2]"
                          >
                            {job.title}
                          </Link>
                          <span className="text-gray-500">· {job.company?.name}</span>
                          {job.featured && (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              · Promoted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 tabular-nums">
                          {job.location} · <span className="capitalize">{job.work_mode}</span> ·{' '}
                          {formatSalaryRangePKR(
                            job.salary_min,
                            job.salary_max,
                            job.salary_currency,
                            job.salary_period
                          )}{' '}
                          · {(job.screening_questions || []).length} screening Qs
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobFilter(job.id);
                            handleSelectTab('pipeline');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer tabular-nums"
                        >
                          <span>{appCount || job.applicants_count} Applicants</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <select
                          aria-label={`Change status for ${job.title}`}
                          value={job.status}
                          onChange={(e) => {
                            const nextSt = e.target.value as Job['status'];
                            updateJobModerationStatus(job.id, nextSt);
                            toast.success(`Set "${job.title}" to ${nextSt}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] capitalize"
                        >
                          <option value="open">Open</option>
                          <option value="paused">Paused</option>
                          <option value="draft">Draft</option>
                          <option value="closed">Closed</option>
                        </select>

                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-label={`Promote ${job.title}`}
                          onClick={() => {
                            toggleFeaturedJob(job.id);
                            toast.success(
                              job.featured ? 'Removed promoted boost' : 'Promoted requisition'
                            );
                          }}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              job.featured ? 'text-amber-500 fill-amber-500' : ''
                            }`}
                          />
                        </Button>

                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-label={`Clone ${job.title}`}
                          onClick={() => handleCloneJob(job)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          onClick={() => openEditJobModal(job)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 4. INTERVIEWS & PKR OFFERS DESK */}
          {activeTab === 'interviews' && (
            <RecruiterInterviewsOffersSection
              interviews={interviews}
              offers={offers}
              applications={applications}
              recruiterName={recruiterName}
              onScheduleInterview={scheduleInterview}
              onUpdateInterviewStatus={updateInterviewStatus}
              onUpdateOfferStatus={(offerId, status, appId) => {
                updateOfferStatus(offerId, status);
                if (status === 'accepted') {
                  updateApplicationStage(appId, 'hired', 'Accepted PKR offer letter');
                }
              }}
            />
          )}

          {/* 5. PAKISTAN TALENT SEARCH, POOLS & OUTREACH */}
          {activeTab === 'talent' && (
            <RecruiterTalentPoolSection
              candidates={users}
              talentPool={talentPool}
              openJobs={nativeRecruiterJobs.filter((j) => j.status === 'open')}
              recruiterName={recruiterName}
              onSaveToPool={saveToTalentPool}
              onRemoveFromPool={removeFromTalentPool}
              onSendOutreach={(cand, body) => handleMessageCandidate(cand, body)}
            />
          )}

          {/* 6. EMPLOYER BRAND & ORGANIZATION PAGE MANAGER */}
          {activeTab === 'company' && (
            <RecruiterCompanySection
              mode="company"
              companies={companies}
              affiliatedCompanyId={affiliatedCompanyId}
              onSelectAffiliatedCompany={setAffiliatedCompanyId}
              onSaveCompanyDetails={updateCompany}
              verifications={verifications}
              recruiterName={recruiterName}
              recruiterId={profile?.id || 'usr_recruiter_sarah'}
              recruiterHandle={profile?.handle || 'ayeshasiddiqui'}
              recruiterEmail={profile?.email || 'ayesha@systemsltd.com'}
              isVerifiedRecruiter={isVerifiedRecruiter}
              onSubmitVerification={submitVerificationRequest}
            />
          )}

          {/* 7. SECP / PSEB CREDENTIALS & COMPLIANCE */}
          {activeTab === 'verification' && (
            <RecruiterCompanySection
              mode="verification"
              companies={companies}
              affiliatedCompanyId={affiliatedCompanyId}
              onSelectAffiliatedCompany={setAffiliatedCompanyId}
              onSaveCompanyDetails={updateCompany}
              verifications={verifications}
              recruiterName={recruiterName}
              recruiterId={profile?.id || 'usr_recruiter_sarah'}
              recruiterHandle={profile?.handle || 'ayeshasiddiqui'}
              recruiterEmail={profile?.email || 'ayesha@systemsltd.com'}
              isVerifiedRecruiter={isVerifiedRecruiter}
              onSubmitVerification={submitVerificationRequest}
            />
          )}
        </div>

        {/* CANDIDATE EVALUATION, SCORECARD, INTERVIEW & PKR OFFER DRAWER */}
        {inspectApp && (
          <RecruiterCandidateDrawer
            application={inspectApp}
            evaluation={evaluations[inspectApp.id]}
            recruiterName={recruiterName}
            onClose={() => setInspectAppId(null)}
            onMoveStage={handleMoveStage}
            onMessageCandidate={() => handleMessageCandidate(inspectApp.applicant)}
            onSaveScorecard={(scores) => upsertEvaluation(inspectApp.id, scores)}
            onAddNote={(txt) => addEvaluationNote(inspectApp.id, recruiterName, txt)}
            onScheduleInterview={scheduleInterview}
            onCreateOffer={createOffer}
          />
        )}

        {/* JOB REQUISITION EDITOR MODAL */}
        {isJobModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingJobId ? 'Edit PKR Requisition' : 'Post a PKR Job'}
            className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          >
            <Card
              padding="lg"
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 bg-white dark:bg-[#1B1F23]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingJobId ? 'Edit PKR Job Requisition' : 'Publish New PKR Job Requisition'}
                </h2>
                <button
                  type="button"
                  aria-label="Close job editor"
                  onClick={() => setIsJobModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-3.5 text-xs" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="job-ed-title" className="block font-semibold mb-1">
                      Role Title
                    </label>
                    <input
                      id="job-ed-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Principal Backend Engineer (Go / FinTech)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="job-ed-comp" className="block font-semibold mb-1">
                      Hiring Organization
                    </label>
                    <select
                      id="job-ed-comp"
                      value={jobCompanyId}
                      onChange={(e) => setJobCompanyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="job-ed-loc" className="block font-semibold mb-1">
                      Pakistan Hub / City
                    </label>
                    <input
                      id="job-ed-loc"
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="job-ed-mode" className="block font-semibold mb-1">
                        Workplace
                      </label>
                      <select
                        id="job-ed-mode"
                        value={jobWorkMode}
                        onChange={(e) => setJobWorkMode(e.target.value as WorkMode)}
                        className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                      >
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="job-ed-exp" className="block font-semibold mb-1">
                        Seniority
                      </label>
                      <select
                        id="job-ed-exp"
                        value={jobExpLevel}
                        onChange={(e) =>
                          setJobExpLevel(e.target.value as ExperienceLevel)
                        }
                        className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                      >
                        <option value="entry">Entry</option>
                        <option value="mid">Mid-Level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Staff / Lead</option>
                        <option value="director">Director</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="job-ed-min" className="block font-semibold mb-1">
                      Monthly Min Salary (PKR)
                    </label>
                    <input
                      id="job-ed-min"
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
                    />
                  </div>

                  <div>
                    <label htmlFor="job-ed-max" className="block font-semibold mb-1">
                      Monthly Max Salary (PKR)
                    </label>
                    <input
                      id="job-ed-max"
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="job-ed-skills" className="block font-semibold mb-1">
                      Required Skills (comma-separated)
                    </label>
                    <input
                      id="job-ed-skills"
                      type="text"
                      value={jobSkillsInput}
                      onChange={(e) => setJobSkillsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    />
                  </div>
                  <div>
                    <label htmlFor="job-ed-status" className="block font-semibold mb-1">
                      Publish State
                    </label>
                    <select
                      id="job-ed-status"
                      value={jobStatusField}
                      onChange={(e) => setJobStatusField(e.target.value as Job['status'])}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    >
                      <option value="open">Open Immediately</option>
                      <option value="draft">Save as Draft</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="job-ed-desc" className="block font-semibold mb-1">
                    Role Responsibilities &amp; Requirements
                  </label>
                  <textarea
                    id="job-ed-desc"
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>

                {/* Custom Screening Questions */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Easy Apply Screening Questions ({screeningQuestions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setScreeningQuestions((prev) => [
                          ...prev,
                          {
                            id: `sq_${Date.now()}_${prev.length}`,
                            question: '',
                            type: 'text',
                            required: true,
                          },
                        ])
                      }
                      className="text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                    >
                      + Add Screening Question
                    </button>
                  </div>

                  {screeningQuestions.map((sq, idx) => (
                    <div key={sq.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        aria-label={`Screening question ${idx + 1}`}
                        placeholder="e.g. What is your notice period in weeks?"
                        value={sq.question}
                        onChange={(e) =>
                          setScreeningQuestions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, question: e.target.value } : item
                            )
                          )
                        }
                        className="flex-1 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                      />
                      <button
                        type="button"
                        aria-label="Remove screening question"
                        onClick={() =>
                          setScreeningQuestions((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 text-gray-400 hover:text-[#CC1016] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {jobFormError && (
                  <p role="alert" className="text-xs font-medium text-[#CC1016]">
                    {jobFormError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsJobModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {editingJobId ? 'Save Requisition Changes' : 'Publish PKR Requisition'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </Shell>
    </VerifiedRecruiterRoute>
  );
};
