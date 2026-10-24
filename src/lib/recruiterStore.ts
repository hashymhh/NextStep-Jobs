import { useState, useEffect, useCallback } from 'react';
import {
  CandidateEvaluation,
  InterviewRecord,
  OfferRecord,
  TalentPoolCategory,
  TalentPoolItem,
  WorkMode,
} from '../types';
import { DEMO_APPLICATIONS, DEMO_COMPANIES, DEMO_JOBS, DEMO_PROFILES } from './seed/demoData';

const EVALS_KEY = 'nextstep_v2_pk_recruiter_evals';
const INTERVIEWS_KEY = 'nextstep_v2_pk_recruiter_interviews';
const OFFERS_KEY = 'nextstep_v2_pk_recruiter_offers';
const TALENT_POOL_KEY = 'nextstep_v2_pk_recruiter_talent_pool';
const AFFILIATED_COMP_KEY = 'nextstep_v2_pk_recruiter_company_id';
const RECRUITER_SYNC_EVENT = 'nextstep_v2_pk_recruiter_sync';

const SEED_EVALUATIONS: Record<string, CandidateEvaluation> = {
  [DEMO_APPLICATIONS[0]?.id || 'app_seed_1']: {
    application_id: DEMO_APPLICATIONS[0]?.id || 'app_seed_1',
    technical_score: 5,
    system_design_score: 4,
    communication_score: 5,
    recommendation: 'strong_hire',
    notes: [
      {
        id: 'note_seed_1',
        author: 'Ayesha Siddiqui',
        text: 'Strong distributed TypeScript & PostgreSQL depth; led Raast high-throughput microservices in Lahore.',
        created_at: '2026-10-22T09:30:00Z',
      },
    ],
    updated_at: '2026-10-22T09:30:00Z',
  },
};

const SEED_INTERVIEWS: InterviewRecord[] = [
  {
    id: 'int_seed_1',
    application_id: DEMO_APPLICATIONS[0]?.id || 'app_seed_1',
    job_id: DEMO_JOBS[0]?.id || 'job_systems_senior_fs',
    job_title: DEMO_JOBS[0]?.title || 'Senior Full-Stack Engineer (React / Node.js)',
    candidate_id: DEMO_PROFILES[0]?.id || 'usr_candidate_john',
    candidate_name: `${DEMO_PROFILES[0]?.first_name || 'Hamza'} ${DEMO_PROFILES[0]?.last_name || 'Tariq'}`,
    scheduled_at: '2026-10-27T06:00:00Z', // 11:00 AM PKT
    duration_minutes: 60,
    mode: 'video',
    round: 'system_design',
    panelist: 'Ayesha Siddiqui & Principal Engineering Lead',
    location_or_link: 'https://meet.systemsltd.com/pk-arch-hamza',
    status: 'scheduled',
    notes: 'Focus on event-driven payment settlement and React 19 performance.',
    created_at: '2026-10-23T08:00:00Z',
  },
  {
    id: 'int_seed_2',
    application_id: DEMO_APPLICATIONS[1]?.id || 'app_seed_2',
    job_id: DEMO_JOBS[1]?.id || 'job_sadapay_backend',
    job_title: DEMO_JOBS[1]?.title || 'Staff Backend Engineer',
    candidate_id: DEMO_PROFILES[3]?.id || 'usr_candidate_4',
    candidate_name: `${DEMO_PROFILES[3]?.first_name || 'Usman'} ${DEMO_PROFILES[3]?.last_name || 'Ali'}`,
    scheduled_at: '2026-10-28T09:30:00Z', // 2:30 PM PKT
    duration_minutes: 45,
    mode: 'onsite',
    round: 'technical',
    panelist: 'Ayesha Siddiqui',
    location_or_link: 'Systems Limited DHA Phase 8 Campus, Lahore — Room 4B',
    status: 'scheduled',
    notes: 'Live coding + API schema review.',
    created_at: '2026-10-23T11:15:00Z',
  },
];

const SEED_OFFERS: OfferRecord[] = [
  {
    id: 'off_seed_1',
    application_id: DEMO_APPLICATIONS[0]?.id || 'app_seed_1',
    job_id: DEMO_JOBS[0]?.id || 'job_systems_senior_fs',
    job_title: DEMO_JOBS[0]?.title || 'Senior Full-Stack Engineer (React / Node.js)',
    candidate_id: DEMO_PROFILES[0]?.id || 'usr_candidate_john',
    candidate_name: `${DEMO_PROFILES[0]?.first_name || 'Hamza'} ${DEMO_PROFILES[0]?.last_name || 'Tariq'}`,
    base_monthly_pkr: 580000,
    signing_bonus_pkr: 250000,
    equity_notes: 'Annual performance bonus (up to 2 gross salaries) + OPD/IPD family medical + fuel allowance',
    joining_date: '2026-11-16',
    work_mode: 'hybrid',
    status: 'sent',
    created_at: '2026-10-23T13:00:00Z',
  },
];

const SEED_TALENT_POOL: TalentPoolItem[] = [
  {
    id: 'tp_seed_1',
    candidate_id: DEMO_PROFILES[0]?.id || 'usr_candidate_john',
    pool_name: 'Shortlisted',
    note: 'Top full-stack candidate in Lahore; immediate cultural fit.',
    saved_by: 'Ayesha Siddiqui',
    created_at: '2026-10-21T07:00:00Z',
  },
  {
    id: 'tp_seed_2',
    candidate_id: DEMO_PROFILES[4]?.id || 'usr_candidate_5',
    pool_name: 'Frontend Guild',
    note: 'Strong design systems & accessibility portfolio.',
    saved_by: 'Ayesha Siddiqui',
    created_at: '2026-10-22T07:00:00Z',
  },
  {
    id: 'tp_seed_3',
    candidate_id: DEMO_PROFILES[5]?.id || 'usr_candidate_6',
    pool_name: 'Backend & Cloud',
    note: 'Kubernetes & FinTech ledger specialist in Islamabad.',
    saved_by: 'Ayesha Siddiqui',
    created_at: '2026-10-22T10:00:00Z',
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

export function useRecruiterStore() {
  const [evaluations, setEvaluations] = useState<Record<string, CandidateEvaluation>>(() =>
    readJson(EVALS_KEY, SEED_EVALUATIONS)
  );
  const [interviews, setInterviews] = useState<InterviewRecord[]>(() =>
    readJson(INTERVIEWS_KEY, SEED_INTERVIEWS)
  );
  const [offers, setOffers] = useState<OfferRecord[]>(() =>
    readJson(OFFERS_KEY, SEED_OFFERS)
  );
  const [talentPool, setTalentPool] = useState<TalentPoolItem[]>(() =>
    readJson(TALENT_POOL_KEY, SEED_TALENT_POOL)
  );
  const [affiliatedCompanyId, setAffiliatedCompanyIdState] = useState<string>(() =>
    readJson(AFFILIATED_COMP_KEY, DEMO_COMPANIES[0]?.id || 'comp_systems')
  );

  useEffect(() => {
    const onSync = () => {
      setEvaluations(readJson(EVALS_KEY, SEED_EVALUATIONS));
      setInterviews(readJson(INTERVIEWS_KEY, SEED_INTERVIEWS));
      setOffers(readJson(OFFERS_KEY, SEED_OFFERS));
      setTalentPool(readJson(TALENT_POOL_KEY, SEED_TALENT_POOL));
      setAffiliatedCompanyIdState(
        readJson(AFFILIATED_COMP_KEY, DEMO_COMPANIES[0]?.id || 'comp_systems')
      );
    };
    window.addEventListener(RECRUITER_SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(RECRUITER_SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const emit = () => window.dispatchEvent(new CustomEvent(RECRUITER_SYNC_EVENT));

  const upsertEvaluation = useCallback(
    (
      applicationId: string,
      scores: {
        technical_score: number;
        system_design_score: number;
        communication_score: number;
        recommendation: CandidateEvaluation['recommendation'];
      }
    ) => {
      const current = readJson<Record<string, CandidateEvaluation>>(EVALS_KEY, SEED_EVALUATIONS);
      const existing = current[applicationId];
      const nextRecord: CandidateEvaluation = {
        application_id: applicationId,
        technical_score: scores.technical_score,
        system_design_score: scores.system_design_score,
        communication_score: scores.communication_score,
        recommendation: scores.recommendation,
        notes: existing?.notes || [],
        updated_at: new Date().toISOString(),
      };
      const next = { ...current, [applicationId]: nextRecord };
      setEvaluations(next);
      localStorage.setItem(EVALS_KEY, JSON.stringify(next));
      emit();
      return nextRecord;
    },
    []
  );

  const addEvaluationNote = useCallback(
    (applicationId: string, author: string, text: string) => {
      if (!text.trim()) return;
      const current = readJson<Record<string, CandidateEvaluation>>(EVALS_KEY, SEED_EVALUATIONS);
      const existing: CandidateEvaluation = current[applicationId] || {
        application_id: applicationId,
        technical_score: 4,
        system_design_score: 4,
        communication_score: 4,
        recommendation: 'hire',
        notes: [],
        updated_at: new Date().toISOString(),
      };
      const nextRecord: CandidateEvaluation = {
        ...existing,
        notes: [
          {
            id: `note_${Date.now()}`,
            author,
            text: text.trim(),
            created_at: new Date().toISOString(),
          },
          ...existing.notes,
        ],
        updated_at: new Date().toISOString(),
      };
      const next = { ...current, [applicationId]: nextRecord };
      setEvaluations(next);
      localStorage.setItem(EVALS_KEY, JSON.stringify(next));
      emit();
    },
    []
  );

  const scheduleInterview = useCallback(
    (input: Omit<InterviewRecord, 'id' | 'status' | 'created_at'>) => {
      const current = readJson<InterviewRecord[]>(INTERVIEWS_KEY, SEED_INTERVIEWS);
      const created: InterviewRecord = {
        ...input,
        id: `int_${Date.now()}`,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };
      const next = [created, ...current];
      setInterviews(next);
      localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(next));
      emit();
      return created;
    },
    []
  );

  const updateInterviewStatus = useCallback(
    (interviewId: string, status: InterviewRecord['status']) => {
      const current = readJson<InterviewRecord[]>(INTERVIEWS_KEY, SEED_INTERVIEWS);
      const next = current.map((i) => (i.id === interviewId ? { ...i, status } : i));
      setInterviews(next);
      localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(next));
      emit();
    },
    []
  );

  const createOffer = useCallback(
    (input: {
      application_id: string;
      job_id: string;
      job_title: string;
      candidate_id: string;
      candidate_name: string;
      base_monthly_pkr: number;
      signing_bonus_pkr: number;
      equity_notes?: string;
      joining_date: string;
      work_mode: WorkMode;
      status?: OfferRecord['status'];
    }) => {
      const current = readJson<OfferRecord[]>(OFFERS_KEY, SEED_OFFERS);
      const created: OfferRecord = {
        id: `off_${Date.now()}`,
        application_id: input.application_id,
        job_id: input.job_id,
        job_title: input.job_title,
        candidate_id: input.candidate_id,
        candidate_name: input.candidate_name,
        base_monthly_pkr: input.base_monthly_pkr,
        signing_bonus_pkr: input.signing_bonus_pkr,
        equity_notes: input.equity_notes,
        joining_date: input.joining_date,
        work_mode: input.work_mode,
        status: input.status || 'sent',
        created_at: new Date().toISOString(),
      };
      const next = [created, ...current];
      setOffers(next);
      localStorage.setItem(OFFERS_KEY, JSON.stringify(next));
      emit();
      return created;
    },
    []
  );

  const updateOfferStatus = useCallback((offerId: string, status: OfferRecord['status']) => {
    const current = readJson<OfferRecord[]>(OFFERS_KEY, SEED_OFFERS);
    const next = current.map((o) => (o.id === offerId ? { ...o, status } : o));
    setOffers(next);
    localStorage.setItem(OFFERS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const saveToTalentPool = useCallback(
    (params: {
      candidate_id: string;
      pool_name: TalentPoolCategory;
      note?: string;
      saved_by: string;
    }) => {
      const current = readJson<TalentPoolItem[]>(TALENT_POOL_KEY, SEED_TALENT_POOL);
      const existingIdx = current.findIndex((i) => i.candidate_id === params.candidate_id);
      let next: TalentPoolItem[];
      if (existingIdx >= 0) {
        next = current.map((item, idx) =>
          idx === existingIdx
            ? { ...item, pool_name: params.pool_name, note: params.note || item.note }
            : item
        );
      } else {
        next = [
          {
            id: `tp_${Date.now()}`,
            candidate_id: params.candidate_id,
            pool_name: params.pool_name,
            note: params.note,
            saved_by: params.saved_by,
            created_at: new Date().toISOString(),
          },
          ...current,
        ];
      }
      setTalentPool(next);
      localStorage.setItem(TALENT_POOL_KEY, JSON.stringify(next));
      emit();
    },
    []
  );

  const removeFromTalentPool = useCallback((candidateId: string) => {
    const current = readJson<TalentPoolItem[]>(TALENT_POOL_KEY, SEED_TALENT_POOL);
    const next = current.filter((i) => i.candidate_id !== candidateId);
    setTalentPool(next);
    localStorage.setItem(TALENT_POOL_KEY, JSON.stringify(next));
    emit();
  }, []);

  const setAffiliatedCompanyId = useCallback((companyId: string) => {
    setAffiliatedCompanyIdState(companyId);
    localStorage.setItem(AFFILIATED_COMP_KEY, JSON.stringify(companyId));
    emit();
  }, []);

  return {
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
  };
}
