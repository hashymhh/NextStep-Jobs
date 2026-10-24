import { useState, useEffect, useCallback } from 'react';
import { Job, Application, ApplicationStatus, JobAlertRule, Profile } from '../types';
import { DEMO_JOBS, DEMO_APPLICATIONS, DEMO_COMPANIES } from './seed/demoData';
import { advanceApplicationStatus } from '../features/jobs/jobsUtils';

const JOBS_KEY = 'nextstep_v2_pk_jobs';
const SAVED_JOBS_KEY = 'nextstep_v2_pk_saved_jobs';
const APPS_KEY = 'nextstep_v2_pk_applications';
const ALERTS_KEY = 'nextstep_v2_pk_job_alerts';
const SYNC_EVENT = 'nextstep_v2_pk_jobs_sync';

const DEFAULT_ALERTS: JobAlertRule[] = [
  {
    id: 'alert_1',
    keyword: 'Senior Full-Stack React',
    location: 'Lahore',
    work_mode: 'hybrid',
    min_salary_pkr: 400000,
    frequency: 'instant',
    enabled: true,
    created_at: '2026-10-15T05:00:00Z',
  },
  {
    id: 'alert_2',
    keyword: 'TypeScript Node.js',
    location: 'Remote',
    work_mode: 'remote',
    min_salary_pkr: 500000,
    frequency: 'daily',
    enabled: true,
    created_at: '2026-10-18T05:00:00Z',
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

export function useJobsStore() {
  const [jobs, setJobs] = useState<Job[]>(() => readJson(JOBS_KEY, DEMO_JOBS));
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() =>
    readJson(SAVED_JOBS_KEY, ['job_systems_senior_fs', 'job_careem_external_jsearch'])
  );
  const [applications, setApplications] = useState<Application[]>(() =>
    readJson(APPS_KEY, DEMO_APPLICATIONS)
  );
  const [alerts, setAlerts] = useState<JobAlertRule[]>(() =>
    readJson(ALERTS_KEY, DEFAULT_ALERTS)
  );
  const [externalFetched, setExternalFetched] = useState(false);

  // Sync across components & tabs
  useEffect(() => {
    const onSync = () => {
      setJobs(readJson(JOBS_KEY, DEMO_JOBS));
      setSavedJobIds(readJson(SAVED_JOBS_KEY, []));
      setApplications(readJson(APPS_KEY, DEMO_APPLICATIONS));
      setAlerts(readJson(ALERTS_KEY, DEFAULT_ALERTS));
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  // Merge live JSearch external jobs once per mount
  useEffect(() => {
    if (externalFetched) return;
    setExternalFetched(true);

    fetch('/api/jobs/external?q=Software+Engineer+Pakistan')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.jobs) && data.jobs.length > 0) {
          const current = readJson<Job[]>(JOBS_KEY, DEMO_JOBS);
          const existingIds = new Set(current.map((j) => j.id));
          const fresh = data.jobs.filter((j: Job) => !existingIds.has(j.id));
          if (fresh.length > 0) {
            const merged = [...fresh, ...current];
            setJobs(merged);
            localStorage.setItem(JOBS_KEY, JSON.stringify(merged));
          }
        }
      })
      .catch(() => {
        // graceful offline fallback
      });
  }, [externalFetched]);

  const emit = () => window.dispatchEvent(new CustomEvent(SYNC_EVENT));

  const toggleSaveJob = useCallback((jobId: string) => {
    const current = readJson<string[]>(SAVED_JOBS_KEY, []);
    const next = current.includes(jobId)
      ? current.filter((id) => id !== jobId)
      : [jobId, ...current];
    setSavedJobIds(next);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const submitEasyApply = useCallback(
    (params: {
      job: Job;
      applicant: Profile;
      phone: string;
      email: string;
      resumeName: string;
      coverNote?: string;
      answers?: Record<string, string>;
    }) => {
      const currentApps = readJson<Application[]>(APPS_KEY, DEMO_APPLICATIONS);
      const now = new Date().toISOString();
      const newApp: Application = {
        id: `app_${Date.now()}`,
        job_id: params.job.id,
        job: params.job,
        applicant_id: params.applicant.id,
        applicant: params.applicant,
        phone: params.phone,
        email: params.email,
        resume_name: params.resumeName,
        cover_note: params.coverNote,
        answers: params.answers,
        status: 'applied',
        status_timeline: [
          {
            status: 'applied',
            timestamp: now,
            note: 'Submitted via NextStep Easy Apply (PKT)',
          },
        ],
        created_at: now,
        updated_at: now,
      };

      const nextApps = [newApp, ...currentApps];
      setApplications(nextApps);
      localStorage.setItem(APPS_KEY, JSON.stringify(nextApps));

      // Increment job applicants_count
      const currentJobs = readJson<Job[]>(JOBS_KEY, DEMO_JOBS);
      const nextJobs = currentJobs.map((j) =>
        j.id === params.job.id ? { ...j, applicants_count: j.applicants_count + 1 } : j
      );
      setJobs(nextJobs);
      localStorage.setItem(JOBS_KEY, JSON.stringify(nextJobs));
      emit();
      return newApp;
    },
    []
  );

  const updateApplicationStage = useCallback(
    (applicationId: string, nextStatus: ApplicationStatus, note?: string) => {
      const currentApps = readJson<Application[]>(APPS_KEY, DEMO_APPLICATIONS);
      const nextApps = advanceApplicationStatus(currentApps, applicationId, nextStatus, note);
      setApplications(nextApps);
      localStorage.setItem(APPS_KEY, JSON.stringify(nextApps));
      emit();
    },
    []
  );

  const createOrUpdateJob = useCallback((jobInput: Partial<Job> & { title: string; posted_by: string }) => {
    const currentJobs = readJson<Job[]>(JOBS_KEY, DEMO_JOBS);
    const savedCompanies = readJson('nextstep_v2_pk_companies_store', DEMO_COMPANIES);
    const company =
      savedCompanies.find((c) => c.id === jobInput.company_id) ||
      DEMO_COMPANIES.find((c) => c.id === jobInput.company_id) ||
      savedCompanies[0] ||
      DEMO_COMPANIES[0];

    if (jobInput.id && currentJobs.some((j) => j.id === jobInput.id)) {
      const next = currentJobs.map((j) =>
        j.id === jobInput.id ? { ...j, ...jobInput, company } : j
      );
      setJobs(next);
      localStorage.setItem(JOBS_KEY, JSON.stringify(next));
      emit();
      return;
    }

    const newJob: Job = {
      id: `job_custom_${Date.now()}`,
      company_id: company.id,
      company,
      posted_by: jobInput.posted_by,
      title: jobInput.title,
      description: jobInput.description || '',
      location: jobInput.location || 'Lahore, Punjab, Pakistan',
      work_mode: jobInput.work_mode || 'hybrid',
      type: jobInput.type || 'full-time',
      experience_level: jobInput.experience_level || 'senior',
      salary_min: jobInput.salary_min || 350000,
      salary_max: jobInput.salary_max || 550000,
      salary_currency: 'PKR',
      salary_period: 'monthly',
      skills: jobInput.skills && jobInput.skills.length > 0 ? jobInput.skills : ['React', 'TypeScript'],
      screening_questions: jobInput.screening_questions || [],
      is_external: false,
      featured: Boolean(jobInput.featured),
      source_name: 'NextStep Easy Apply',
      status: jobInput.status || 'open',
      applicants_count: 0,
      views_count: 1,
      match_score: 90,
      created_at: new Date().toISOString(),
    };

    const next = [newJob, ...currentJobs];
    setJobs(next);
    localStorage.setItem(JOBS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const toggleFeaturedJob = useCallback((jobId: string) => {
    const currentJobs = readJson<Job[]>(JOBS_KEY, DEMO_JOBS);
    const next = currentJobs.map((j) =>
      j.id === jobId ? { ...j, featured: !j.featured } : j
    );
    setJobs(next);
    localStorage.setItem(JOBS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const updateJobModerationStatus = useCallback(
    (jobId: string, status: Job['status']) => {
      const currentJobs = readJson<Job[]>(JOBS_KEY, DEMO_JOBS);
      const next = currentJobs.map((j) => (j.id === jobId ? { ...j, status } : j));
      setJobs(next);
      localStorage.setItem(JOBS_KEY, JSON.stringify(next));
      emit();
    },
    []
  );

  const addJobAlert = useCallback(
    (rule: Omit<JobAlertRule, 'id' | 'created_at'>) => {
      const current = readJson<JobAlertRule[]>(ALERTS_KEY, DEFAULT_ALERTS);
      const next: JobAlertRule[] = [
        {
          ...rule,
          id: `alert_${Date.now()}`,
          created_at: new Date().toISOString(),
        },
        ...current,
      ];
      setAlerts(next);
      localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
      emit();
    },
    []
  );

  const toggleJobAlert = useCallback((alertId: string) => {
    const current = readJson<JobAlertRule[]>(ALERTS_KEY, DEFAULT_ALERTS);
    const next = current.map((a) => (a.id === alertId ? { ...a, enabled: !a.enabled } : a));
    setAlerts(next);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const deleteJobAlert = useCallback((alertId: string) => {
    const current = readJson<JobAlertRule[]>(ALERTS_KEY, DEFAULT_ALERTS);
    const next = current.filter((a) => a.id !== alertId);
    setAlerts(next);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
    emit();
  }, []);

  return {
    jobs,
    savedJobIds,
    applications,
    alerts,
    toggleSaveJob,
    submitEasyApply,
    updateApplicationStage,
    createOrUpdateJob,
    toggleFeaturedJob,
    updateJobModerationStatus,
    addJobAlert,
    toggleJobAlert,
    deleteJobAlert,
  };
}
