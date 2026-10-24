import { Job, Profile, Application, ApplicationStatus } from '../../types';

export interface JobFilterCriteria {
  keyword?: string;
  location?: string;
  workMode?: string;
  experienceLevel?: string;
  jobType?: string;
  source?: 'all' | 'native' | 'external';
  minSalaryPKR?: number;
}

/**
 * Deterministically scores how well a candidate profile matches a job's required skills & level (0-100).
 */
export function calculateJobMatchScore(job: Job, candidate?: Profile | null): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  if (!candidate || !candidate.skills || candidate.skills.length === 0) {
    return {
      score: job.match_score || 78,
      matchedSkills: job.skills.slice(0, 2),
      missingSkills: job.skills.slice(2),
    };
  }

  const candSkillNames = candidate.skills.map((s) => s.name.toLowerCase());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of job.skills) {
    const reqLower = reqSkill.toLowerCase();
    const hit = candSkillNames.some(
      (cs) => cs.includes(reqLower) || reqLower.includes(cs)
    );
    if (hit) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const ratio = job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.75;
  const locationBonus =
    job.work_mode === 'remote' ||
    (candidate.location &&
      job.location.toLowerCase().includes(candidate.location.split(',')[0].toLowerCase()))
      ? 7
      : 2;

  const computed = Math.min(99, Math.max(58, Math.round(ratio * 62 + 30 + locationBonus)));
  return {
    score: computed,
    matchedSkills,
    missingSkills,
  };
}

/**
 * Multi-attribute job search & filter engine supporting PKR thresholds and native vs JSearch sources.
 */
export function filterJobsList(jobs: Job[], filters: JobFilterCriteria): Job[] {
  const kw = (filters.keyword || '').trim().toLowerCase();
  const loc = (filters.location || 'all').toLowerCase();
  const mode = filters.workMode || 'all';
  const exp = filters.experienceLevel || 'all';
  const type = filters.jobType || 'all';
  const source = filters.source || 'all';
  const minSal = filters.minSalaryPKR || 0;

  return jobs.filter((job) => {
    if (job.status === 'closed' || job.status === 'draft') return false;

    if (kw) {
      const matchesTitle = job.title.toLowerCase().includes(kw);
      const matchesComp = (job.company?.name || '').toLowerCase().includes(kw);
      const matchesSkills = job.skills.some((s) => s.toLowerCase().includes(kw));
      const matchesDesc = job.description.toLowerCase().includes(kw);
      if (!matchesTitle && !matchesComp && !matchesSkills && !matchesDesc) {
        return false;
      }
    }

    if (loc !== 'all') {
      if (!job.location.toLowerCase().includes(loc)) return false;
    }

    if (mode !== 'all' && job.work_mode !== mode) return false;
    if (exp !== 'all' && job.experience_level !== exp) return false;
    if (type !== 'all' && job.type !== type) return false;

    if (source === 'native' && job.is_external) return false;
    if (source === 'external' && !job.is_external) return false;

    if (minSal > 0) {
      const upperBand = job.salary_max || job.salary_min || 0;
      if (upperBand < minSal) return false;
    }

    return true;
  });
}

/**
 * Transitions an application to a new pipeline stage and appends to its chronological status_timeline.
 */
export function advanceApplicationStatus(
  applications: Application[],
  applicationId: string,
  nextStatus: ApplicationStatus,
  note?: string
): Application[] {
  const now = new Date().toISOString();
  return applications.map((app) => {
    if (app.id !== applicationId) return app;
    if (app.status === nextStatus && !note) return app;
    return {
      ...app,
      status: nextStatus,
      updated_at: now,
      status_timeline: [
        ...app.status_timeline,
        {
          status: nextStatus,
          timestamp: now,
          note: note || `Moved to ${nextStatus.replace('_', ' ')}`,
        },
      ],
    };
  });
}
