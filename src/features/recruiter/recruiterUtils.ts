import {
  Application,
  ApplicationStatus,
  CandidateEvaluation,
  InterviewRecord,
  Job,
  OfferRecord,
} from '../../types';

export const FUNNEL_STAGE_ORDER: { id: ApplicationStatus; label: string }[] = [
  { id: 'applied', label: 'Applied' },
  { id: 'in_review', label: 'In Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Declined' },
];

export interface RecruiterFunnelMetrics {
  totalJobs: number;
  openJobs: number;
  pausedJobs: number;
  closedJobs: number;
  totalApplicants: number;
  shortlistedOrBeyond: number;
  interviewCount: number;
  offerCount: number;
  hiredCount: number;
  shortlistRatePercent: number;
  offerAcceptanceRatePercent: number;
  avgMonthlyMaxPKR: number;
  stageCounts: Record<ApplicationStatus, number>;
}

export function computeRecruiterFunnel(params: {
  jobs: Job[];
  applications: Application[];
  offers: OfferRecord[];
}): RecruiterFunnelMetrics {
  const nativeJobs = params.jobs.filter((j) => !j.is_external);
  const openJobs = nativeJobs.filter((j) => j.status === 'open').length;
  const pausedJobs = nativeJobs.filter((j) => j.status === 'paused').length;
  const closedJobs = nativeJobs.filter((j) => j.status === 'closed').length;

  const stageCounts: Record<ApplicationStatus, number> = {
    applied: 0,
    in_review: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  for (const app of params.applications) {
    stageCounts[app.status] = (stageCounts[app.status] || 0) + 1;
  }

  const totalApplicants = params.applications.length;
  const shortlistedOrBeyond =
    stageCounts.shortlisted + stageCounts.interview + stageCounts.offer + stageCounts.hired;

  const shortlistRatePercent =
    totalApplicants > 0 ? Math.round((shortlistedOrBeyond / totalApplicants) * 100) : 0;

  const decidedOffers = params.offers.filter(
    (o) => o.status === 'accepted' || o.status === 'declined' || o.status === 'sent'
  );
  const acceptedOffers = params.offers.filter((o) => o.status === 'accepted').length;
  const offerAcceptanceRatePercent =
    decidedOffers.length > 0 ? Math.round((acceptedOffers / decidedOffers.length) * 100) : 0;

  const avgMonthlyMaxPKR =
    openJobs > 0
      ? Math.round(
          nativeJobs
            .filter((j) => j.status === 'open')
            .reduce((acc, j) => acc + (j.salary_max || 480000), 0) / openJobs
        )
      : 480000;

  return {
    totalJobs: nativeJobs.length,
    openJobs,
    pausedJobs,
    closedJobs,
    totalApplicants,
    shortlistedOrBeyond,
    interviewCount: stageCounts.interview,
    offerCount: stageCounts.offer + params.offers.length,
    hiredCount: stageCounts.hired + acceptedOffers,
    shortlistRatePercent,
    offerAcceptanceRatePercent,
    avgMonthlyMaxPKR,
    stageCounts,
  };
}

export function computeEvaluationAverage(evalRecord?: CandidateEvaluation | null): number {
  if (!evalRecord) return 0;
  const raw =
    (evalRecord.technical_score +
      evalRecord.system_design_score +
      evalRecord.communication_score) /
    3;
  return Math.round(raw * 10) / 10;
}

export function computeAnnualPackagePKR(offer: {
  base_monthly_pkr: number;
  signing_bonus_pkr?: number;
}): number {
  const monthly = Math.max(0, Number(offer.base_monthly_pkr) || 0);
  const bonus = Math.max(0, Number(offer.signing_bonus_pkr) || 0);
  return monthly * 12 + bonus;
}

export function cloneJobRequisition(source: Job, postedBy: string): Partial<Job> & { title: string; posted_by: string } {
  return {
    company_id: source.company_id,
    company: source.company,
    posted_by: postedBy,
    title: `${source.title} (Copy)`,
    description: source.description,
    location: source.location,
    work_mode: source.work_mode,
    type: source.type,
    experience_level: source.experience_level,
    salary_min: source.salary_min,
    salary_max: source.salary_max,
    salary_currency: 'PKR',
    salary_period: 'monthly',
    skills: [...source.skills],
    screening_questions: (source.screening_questions || []).map((q, idx) => ({
      ...q,
      id: `sq_clone_${Date.now()}_${idx}`,
    })),
    status: 'draft',
    featured: false,
  };
}

export function validateInterviewInput(input: {
  scheduled_at: string;
  panelist: string;
  location_or_link: string;
}): string | null {
  if (!input.scheduled_at.trim()) {
    return 'Please select an interview date and time (PKT).';
  }
  if (!input.panelist.trim()) {
    return 'Please specify the interviewer or hiring panelist.';
  }
  if (!input.location_or_link.trim()) {
    return 'Please provide a meeting link or office campus room.';
  }
  return null;
}

export function validateOfferInput(input: {
  base_monthly_pkr: number;
  signing_bonus_pkr: number;
  joining_date: string;
}): string | null {
  if (!Number.isFinite(input.base_monthly_pkr) || input.base_monthly_pkr < 50000) {
    return 'Base monthly compensation must be at least PKR 50,000.';
  }
  if (!Number.isFinite(input.signing_bonus_pkr) || input.signing_bonus_pkr < 0) {
    return 'Signing bonus must be zero or a positive PKR amount.';
  }
  if (!input.joining_date.trim()) {
    return 'Target joining date is required.';
  }
  return null;
}

export function sortInterviewsChronologically(interviews: InterviewRecord[]): InterviewRecord[] {
  return [...interviews].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
}
