import { Profile, ResumeDocument, ResumeTemplateId } from '../../types';

/**
 * Autofills an ATS ResumeDocument directly from a NextStep Profile.
 */
export function autofillResumeFromProfile(
  profile: Profile,
  template: ResumeTemplateId = 'modern'
): ResumeDocument {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const experiences = (profile.experiences || []).map((exp, idx) => {
    const rawLines = (exp.description || '')
      .split(/\n+/)
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    const bullets =
      rawLines.length > 0
        ? rawLines
        : [
            `Engineered scalable production services as ${exp.title} at ${exp.company_name}, improving API reliability and user experience.`,
            `Collaborated across cross-functional engineering and product squads in ${exp.location || 'Pakistan'} using agile CI/CD workflows.`,
          ];

    return {
      id: exp.id || `res_exp_${idx}`,
      title: exp.title,
      company: exp.company_name,
      location: exp.location || profile.location || 'Lahore, Pakistan',
      startDate: exp.start_date.slice(0, 7),
      endDate: exp.is_current ? 'Present' : exp.end_date?.slice(0, 7) || '2024-01',
      bullets,
    };
  });

  const educations = (profile.educations || []).map((edu, idx) => ({
    id: edu.id || `res_edu_${idx}`,
    school: edu.school_name,
    degree: [edu.degree, edu.field_of_study].filter(Boolean).join(' in ') || 'BS Computer Science',
    year: `${edu.start_year} – ${edu.end_year || 'Present'}`,
    grade: edu.grade || '',
  }));

  const projects = (profile.projects || []).map((proj, idx) => ({
    id: proj.id || `res_proj_${idx}`,
    name: proj.title,
    link: proj.url || '',
    description: proj.description || '',
  }));

  const skills = (profile.skills || []).map((s) => s.name);
  const certifications = (profile.certifications || []).map(
    (c) => `${c.name} — ${c.issuing_org} (${c.issue_date.slice(0, 4)})`
  );

  return {
    id: `res_${profile.handle || 'default'}`,
    title: `${fullName} — ATS Resume`,
    template,
    target_role:
      profile.open_to_work_details?.roles?.[0] ||
      profile.experiences?.[0]?.title ||
      'Senior Full-Stack Software Engineer',
    personal: {
      fullName,
      headline: profile.headline || 'Senior Software Engineer',
      email: profile.email || 'hamza.tariq@nextstep.pk',
      phone: profile.phone || '+92 300 4128910',
      location: profile.location || 'Lahore, Punjab, Pakistan',
      website: profile.website || 'https://nextstep.pk',
      github: profile.github_url || `https://github.com/${profile.handle}`,
      linkedin: `nextstep.pk/in/${profile.handle}`,
    },
    summary:
      profile.about ||
      `Results-oriented ${profile.headline || 'Software Engineer'} based in ${
        profile.location || 'Pakistan'
      } with strong expertise in building resilient web applications, cloud microservices, and high-throughput APIs.`,
    experiences:
      experiences.length > 0
        ? experiences
        : [
            {
              id: 'res_exp_default',
              title: 'Senior Full-Stack Engineer',
              company: 'Systems Limited',
              location: 'Lahore, Pakistan',
              startDate: '2022-03',
              endDate: 'Present',
              bullets: [
                'Architected React & TypeScript digital banking portals serving 1.4M+ active users across Pakistan with 99.96% uptime.',
                'Optimized PostgreSQL queries and Node.js payment webhooks, cutting p95 response latency by 41%.',
              ],
            },
          ],
    educations:
      educations.length > 0
        ? educations
        : [
            {
              id: 'res_edu_default',
              school: 'Lahore University of Management Sciences (LUMS)',
              degree: 'BS in Computer Science',
              year: '2016 – 2020',
              grade: '3.82 / 4.00',
            },
          ],
    skills:
      skills.length > 0
        ? skills
        : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'System Design'],
    projects,
    certifications,
    updated_at: new Date().toISOString(),
  };
}

export interface ATSScoreBreakdown {
  score: number;
  grade: 'Excellent' | 'Strong' | 'Fair' | 'Needs Polish';
  checks: {
    id: string;
    label: string;
    passed: boolean;
    points: number;
    tip: string;
  }[];
}

/**
 * Evaluates an ATS ResumeDocument across 7 structural & quantification criteria (0–100).
 */
export function calculateResumeATSScore(doc: ResumeDocument): ATSScoreBreakdown {
  const allBullets = doc.experiences.flatMap((e) => e.bullets);
  const quantifiedCount = allBullets.filter((b) => /\d+%|\d+x|PKR|\d+[kKmMbB]|\b\d{2,}\b/.test(b)).length;
  const actionVerbCount = allBullets.filter((b) =>
    /^(Architected|Built|Led|Engineered|Optimized|Scaled|Reduced|Designed|Delivered|Automated|Spearheaded|Implemented|Migrated)/i.test(
      b.trim()
    )
  ).length;

  const targetKeywords = doc.target_role
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2);
  const fullText = `${doc.personal.headline} ${doc.summary} ${doc.skills.join(' ')} ${allBullets.join(' ')}`.toLowerCase();
  const matchedTargetWords = targetKeywords.filter((w) => fullText.includes(w));

  const checks = [
    {
      id: 'contact',
      label: 'Complete Contact & Pakistan Location Header',
      passed: Boolean(doc.personal.fullName && doc.personal.email && doc.personal.phone && doc.personal.location),
      points: 15,
      tip: 'Include full name, email, +92 phone number, and city (e.g., Lahore / Karachi / Islamabad).',
    },
    {
      id: 'summary',
      label: 'Targeted Executive Summary (120+ chars)',
      passed: doc.summary.trim().length >= 120,
      points: 15,
      tip: 'Write a 2–3 sentence summary highlighting years of experience, core stack, and measurable domain impact.',
    },
    {
      id: 'experience',
      label: 'Structured Work Experience & Dates',
      passed: doc.experiences.length >= 1 && allBullets.length >= 3,
      points: 20,
      tip: 'Add at least 3 impact bullets across your recent roles with YYYY-MM date ranges.',
    },
    {
      id: 'quantified',
      label: 'Quantified Metrics (%, latency, users, or PKR volume)',
      passed: quantifiedCount >= 2,
      points: 20,
      tip: 'Quantify at least 2 bullets with concrete metrics (e.g., 42% faster builds, PKR 18B volume, 99.95% SLA).',
    },
    {
      id: 'verbs',
      label: 'Strong Engineering Action Verbs',
      passed: actionVerbCount >= 2,
      points: 10,
      tip: 'Lead bullets with strong verbs like Architected, Scaled, Optimized, or Engineered.',
    },
    {
      id: 'skills',
      label: 'ATS Technical Skills Matrix (6+ keywords)',
      passed: doc.skills.length >= 6,
      points: 10,
      tip: 'List at least 6 specific frameworks, languages, and cloud tools for parser matching.',
    },
    {
      id: 'alignment',
      label: 'Target Role Keyword Alignment & Education',
      passed:
        doc.educations.length >= 1 &&
        (targetKeywords.length === 0 || matchedTargetWords.length >= Math.min(2, targetKeywords.length)),
      points: 10,
      tip: 'Ensure your summary and skills explicitly mirror keywords from your Target Role.',
    },
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  const grade: ATSScoreBreakdown['grade'] =
    score >= 88 ? 'Excellent' : score >= 72 ? 'Strong' : score >= 52 ? 'Fair' : 'Needs Polish';

  return { score, grade, checks };
}

export interface SuggestedPKRRole {
  title: string;
  fitScore: number;
  monthlyMinPKR: number;
  monthlyMaxPKR: number;
  topHubs: string;
  matchingSkills: string[];
}

/**
 * Recommends high-fit Pakistani market tech roles with monthly PKR salary benchmarks.
 */
export function suggestPKRRoles(doc: ResumeDocument): SuggestedPKRRole[] {
  const lowerSkills = new Set(doc.skills.map((s) => s.toLowerCase()));
  const catalog: Array<{
    title: string;
    required: string[];
    monthlyMinPKR: number;
    monthlyMaxPKR: number;
    topHubs: string;
  }> = [
    {
      title: 'Senior Full-Stack Engineer (React / Node.js)',
      required: ['react', 'typescript', 'node.js', 'postgresql'],
      monthlyMinPKR: 420000,
      monthlyMaxPKR: 650000,
      topHubs: 'Lahore · Karachi · Remote PK',
    },
    {
      title: 'Staff Backend & FinTech Payments Engineer',
      required: ['node.js', 'postgresql', 'distributed systems', 'aws', 'docker'],
      monthlyMinPKR: 550000,
      monthlyMaxPKR: 820000,
      topHubs: 'Islamabad · Karachi · Remote PK',
    },
    {
      title: 'Principal Frontend & Design Systems Architect',
      required: ['react', 'typescript', 'next.js', 'graphql'],
      monthlyMinPKR: 500000,
      monthlyMaxPKR: 780000,
      topHubs: 'Karachi · Lahore · Hybrid',
    },
    {
      title: 'Applied AI & LLM Platform Engineer',
      required: ['python', 'typescript', 'postgresql', 'aws'],
      monthlyMinPKR: 450000,
      monthlyMaxPKR: 700000,
      topHubs: 'Lahore · Islamabad · Remote PK',
    },
  ];

  return catalog
    .map((item) => {
      const matchingSkills = item.required.filter((req) =>
        Array.from(lowerSkills).some((sk) => sk.includes(req) || req.includes(sk))
      );
      const ratio = matchingSkills.length / item.required.length;
      const fitScore = Math.min(98, Math.round(62 + ratio * 35));
      return {
        title: item.title,
        fitScore,
        monthlyMinPKR: item.monthlyMinPKR,
        monthlyMaxPKR: item.monthlyMaxPKR,
        topHubs: item.topHubs,
        matchingSkills,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

export interface RoadmapMilestone {
  horizon: '30 Days' | '60 Days' | '90 Days';
  focus: string;
  skillsToAcquire: string[];
  deliverable: string;
}

export function generateDefaultRoadmap(targetRole: string, currentSkills: string[]): RoadmapMilestone[] {
  return [
    {
      horizon: '30 Days',
      focus: `Core Architecture & Observability for ${targetRole}`,
      skillsToAcquire: ['OpenTelemetry Tracing', 'PostgreSQL Query Tuning', 'Strict TypeScript Patterns'].filter(
        (s) => !currentSkills.includes(s)
      ),
      deliverable: 'Publish a benchmarked RAAST/FinTech microservice repo with p95 latency metrics and node:test suite.',
    },
    {
      horizon: '60 Days',
      focus: 'Cloud Resilience, Security & Event-Driven Scale',
      skillsToAcquire: ['Apache Kafka / Queues', 'Docker Multi-Stage CI/CD', 'OWASP API Security'],
      deliverable: 'Ship an idempotent event-driven webhook processor with automated canary checks and load reports.',
    },
    {
      horizon: '90 Days',
      focus: 'Staff-Level Technical Leadership & AI Readiness',
      skillsToAcquire: ['System Design RFCs', 'Production LLM Structured Evals', 'Cross-Squad Mentorship'],
      deliverable: 'Author 2 architecture RFCs and complete mock Staff/Principal loops targeting PKR 600k–850k+ roles.',
    },
  ];
}
