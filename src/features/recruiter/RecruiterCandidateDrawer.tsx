import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import {
  Application,
  ApplicationStatus,
  CandidateEvaluation,
  InterviewRecord,
  WorkMode,
} from '../../types';
import {
  computeAnnualPackagePKR,
  computeEvaluationAverage,
  validateInterviewInput,
  validateOfferInput,
} from './recruiterUtils';
import { formatCurrencyPKR, formatDateTimePKT } from '../../lib/locale/pakistan';
import { Calendar, CheckCircle, DollarSign, FileText, MessageSquare, Star, X } from 'lucide-react';
import { toast } from 'sonner';

interface RecruiterCandidateDrawerProps {
  application: Application;
  evaluation?: CandidateEvaluation;
  recruiterName: string;
  onClose: () => void;
  onMoveStage: (appId: string, stage: ApplicationStatus) => void;
  onMessageCandidate: () => void;
  onSaveScorecard: (scores: {
    technical_score: number;
    system_design_score: number;
    communication_score: number;
    recommendation: CandidateEvaluation['recommendation'];
  }) => void;
  onAddNote: (noteText: string) => void;
  onScheduleInterview: (
    payload: Omit<InterviewRecord, 'id' | 'status' | 'created_at'>
  ) => void;
  onCreateOffer: (payload: {
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
  }) => void;
}

export const RecruiterCandidateDrawer: React.FC<RecruiterCandidateDrawerProps> = ({
  application,
  evaluation,
  recruiterName,
  onClose,
  onMoveStage,
  onMessageCandidate,
  onSaveScorecard,
  onAddNote,
  onScheduleInterview,
  onCreateOffer,
}) => {
  const [subTab, setSubTab] = useState<'dossier' | 'scorecard' | 'interview' | 'offer'>('dossier');

  // Scorecard state
  const [techScore, setTechScore] = useState(evaluation?.technical_score || 4);
  const [sysScore, setSysScore] = useState(evaluation?.system_design_score || 4);
  const [commScore, setCommScore] = useState(evaluation?.communication_score || 4);
  const [recommendation, setRecommendation] = useState<CandidateEvaluation['recommendation']>(
    evaluation?.recommendation || 'hire'
  );
  const [noteInput, setNoteInput] = useState('');

  // Interview form state
  const [intDate, setIntDate] = useState('2026-10-30T11:00');
  const [intDuration, setIntDuration] = useState(60);
  const [intMode, setIntMode] = useState<InterviewRecord['mode']>('video');
  const [intRound, setIntRound] = useState<InterviewRecord['round']>('technical');
  const [intPanelist, setIntPanelist] = useState(recruiterName);
  const [intLink, setIntLink] = useState('https://meet.nextstep.pk/loop-pakistan');
  const [intNotes, setIntNotes] = useState('');
  const [intError, setIntError] = useState<string | null>(null);

  // Offer form state
  const [baseMonthly, setBaseMonthly] = useState(
    String(application.job?.salary_max || 550000)
  );
  const [signingBonus, setSigningBonus] = useState('200000');
  const [joiningDate, setJoiningDate] = useState('2026-11-20');
  const [offerWorkMode, setOfferWorkMode] = useState<WorkMode>(
    application.job?.work_mode || 'hybrid'
  );
  const [equityNotes, setEquityNotes] = useState(
    'OPD/IPD family medical + annual performance bonus + provident fund'
  );
  const [offerError, setOfferError] = useState<string | null>(null);

  const candName = application.applicant
    ? `${application.applicant.first_name} ${application.applicant.last_name}`
    : 'Hamza Tariq';

  const avgScore = computeEvaluationAverage({
    application_id: application.id,
    technical_score: techScore,
    system_design_score: sysScore,
    communication_score: commScore,
    recommendation,
    notes: evaluation?.notes || [],
    updated_at: '',
  });

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveScorecard({
      technical_score: techScore,
      system_design_score: sysScore,
      communication_score: commScore,
      recommendation,
    });
    toast.success(`Saved evaluation scorecard (${avgScore}/5) for ${candName}`);
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
    toast.success('Added recruiter evaluation note');
  };

  const handleSubmitInterview = (e: React.FormEvent) => {
    e.preventDefault();
    setIntError(null);
    const err = validateInterviewInput({
      scheduled_at: intDate,
      panelist: intPanelist,
      location_or_link: intLink,
    });
    if (err) {
      setIntError(err);
      return;
    }

    onScheduleInterview({
      application_id: application.id,
      job_id: application.job_id,
      job_title: application.job?.title || 'Engineering Requisition',
      candidate_id: application.applicant_id,
      candidate_name: candName,
      scheduled_at: new Date(intDate).toISOString(),
      duration_minutes: intDuration,
      mode: intMode,
      round: intRound,
      panelist: intPanelist.trim(),
      location_or_link: intLink.trim(),
      notes: intNotes.trim() || undefined,
    });
    onMoveStage(application.id, 'interview');
    toast.success(`Scheduled PKT interview with ${candName}`);
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError(null);
    const monthly = Number(baseMonthly);
    const bonus = Number(signingBonus);
    const err = validateOfferInput({
      base_monthly_pkr: monthly,
      signing_bonus_pkr: bonus,
      joining_date: joiningDate,
    });
    if (err) {
      setOfferError(err);
      return;
    }

    onCreateOffer({
      application_id: application.id,
      job_id: application.job_id,
      job_title: application.job?.title || 'Engineering Requisition',
      candidate_id: application.applicant_id,
      candidate_name: candName,
      base_monthly_pkr: monthly,
      signing_bonus_pkr: bonus,
      equity_notes: equityNotes.trim() || undefined,
      joining_date: joiningDate,
      work_mode: offerWorkMode,
    });
    onMoveStage(application.id, 'offer');
    toast.success(`Issued PKR offer letter to ${candName}`);
  };

  const annualizedPreview = computeAnnualPackagePKR({
    base_monthly_pkr: Number(baseMonthly) || 0,
    signing_bonus_pkr: Number(signingBonus) || 0,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Candidate evaluation for ${candName}`}
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
    >
      <Card
        padding="none"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#1B1F23]"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={candName}
              src={application.applicant?.avatar_url}
              size="md"
              verified={application.applicant?.verified}
              openToWork={application.applicant?.open_to_work}
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {candName}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {application.applicant?.headline || 'Software Engineer'} · Applied for{' '}
                <strong className="text-gray-900 dark:text-white">
                  {application.job?.title || 'Role'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={onMessageCandidate}
            >
              Message
            </Button>
            <button
              type="button"
              aria-label="Close candidate evaluation drawer"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="px-4 sm:px-5 pt-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1 overflow-x-auto bg-gray-50/70 dark:bg-[#161B22]">
          {(
            [
              { id: 'dossier', label: 'CV & Screening', icon: FileText },
              { id: 'scorecard', label: `Scorecard (${avgScore}/5)`, icon: Star },
              { id: 'interview', label: 'Schedule PKT Interview', icon: Calendar },
              { id: 'offer', label: 'Issue PKR Offer', icon: DollarSign },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                  active
                    ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {subTab === 'dossier' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#12161A] border border-gray-200 dark:border-gray-800 tabular-nums">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {application.email || application.applicant?.email || 'hamza@nextstep.pk'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone (Pakistan)</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {application.phone || application.applicant?.phone || '+92 300 4192831'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted ATS Resume</p>
                  <p className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] truncate">
                    {application.resume_name || `${candName.replace(/\s+/g, '_')}_CV_2026.pdf`}
                  </p>
                </div>
              </div>

              {application.cover_note && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    Candidate Cover Note
                  </h3>
                  <p className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {application.cover_note}
                  </p>
                </div>
              )}

              {application.answers && Object.keys(application.answers).length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">
                    Screening Responses
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(application.answers).map(([qId, ans]) => {
                      const qText =
                        application.job?.screening_questions?.find((sq) => sq.id === qId)
                          ?.question || qId;
                      return (
                        <div
                          key={qId}
                          className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <p className="text-gray-500">{qText}</p>
                          <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                            {ans}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">
                  Pipeline Stage Audit Timeline (PKT)
                </h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg px-3">
                  {application.status_timeline.map((step, i) => (
                    <div key={i} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold capitalize text-gray-900 dark:text-white">
                          {step.status.replace('_', ' ')}
                        </span>
                        {step.note && (
                          <span className="text-gray-500"> · {step.note}</span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-gray-500">
                        {formatDateTimePKT(step.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subTab === 'scorecard' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveScore} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
                  {[
                    {
                      id: 'score-tech',
                      label: 'Technical Depth (1–5)',
                      val: techScore,
                      setter: setTechScore,
                    },
                    {
                      id: 'score-sys',
                      label: 'System Design (1–5)',
                      val: sysScore,
                      setter: setSysScore,
                    },
                    {
                      id: 'score-comm',
                      label: 'Communication (1–5)',
                      val: commScore,
                      setter: setCommScore,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <label htmlFor={item.id} className="block font-semibold mb-1.5">
                        {item.label}
                      </label>
                      <select
                        id={item.id}
                        value={item.val}
                        onChange={(e) => item.setter(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="flex-1">
                    <label htmlFor="score-rec" className="block font-semibold mb-1">
                      Hiring Recommendation
                    </label>
                    <select
                      id="score-rec"
                      value={recommendation}
                      onChange={(e) =>
                        setRecommendation(
                          e.target.value as CandidateEvaluation['recommendation']
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                    >
                      <option value="strong_hire">Strong Hire</option>
                      <option value="hire">Hire</option>
                      <option value="lean_no">Lean No Hire</option>
                      <option value="no_hire">No Hire</option>
                    </select>
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    Save Scorecard ({avgScore}/5)
                  </Button>
                </div>
              </form>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <form onSubmit={handleSubmitNote} className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Add private recruiter note"
                    placeholder="Add structured interview feedback or salary expectation note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Add Note
                  </Button>
                </form>

                <div className="space-y-2">
                  {(evaluation?.notes || []).map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#12161A] border border-gray-200 dark:border-gray-800"
                    >
                      <p className="text-gray-800 dark:text-gray-200">{n.text}</p>
                      <p className="text-[11px] text-gray-500 mt-1 tabular-nums">
                        {n.author} · {formatDateTimePKT(n.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subTab === 'interview' && (
            <form onSubmit={handleSubmitInterview} className="space-y-3" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="int-dt" className="block font-semibold mb-1">
                    Date &amp; Time (PKT)
                  </label>
                  <input
                    id="int-dt"
                    type="datetime-local"
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="int-round" className="block font-semibold mb-1">
                    Interview Round
                  </label>
                  <select
                    id="int-round"
                    value={intRound}
                    onChange={(e) =>
                      setIntRound(e.target.value as InterviewRecord['round'])
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  >
                    <option value="screening">Recruiter Screening</option>
                    <option value="technical">Technical Coding</option>
                    <option value="system_design">System Architecture</option>
                    <option value="executive">Executive / Culture Fit</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="int-mode" className="block font-semibold mb-1">
                    Format
                  </label>
                  <select
                    id="int-mode"
                    value={intMode}
                    onChange={(e) => setIntMode(e.target.value as InterviewRecord['mode'])}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  >
                    <option value="video">Video Call</option>
                    <option value="onsite">On-site Campus (Pakistan)</option>
                    <option value="phone">Phone Call (+92)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="int-dur" className="block font-semibold mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    id="int-dur"
                    value={intDuration}
                    onChange={(e) => setIntDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] tabular-nums"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="int-panel" className="block font-semibold mb-1">
                    Hiring Panelist(s)
                  </label>
                  <input
                    id="int-panel"
                    type="text"
                    value={intPanelist}
                    onChange={(e) => setIntPanelist(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
                <div>
                  <label htmlFor="int-link" className="block font-semibold mb-1">
                    Meeting Link or Campus Room
                  </label>
                  <input
                    id="int-link"
                    type="text"
                    value={intLink}
                    onChange={(e) => setIntLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="int-notes" className="block font-semibold mb-1">
                  Agenda / Focus Areas
                </label>
                <input
                  id="int-notes"
                  type="text"
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  placeholder="e.g. TypeScript distributed systems & live React architecture exercise"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>

              {intError && (
                <p role="alert" className="text-xs font-medium text-[#CC1016]">
                  {intError}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Confirm PKT Interview &amp; Advance Stage
                </Button>
              </div>
            </form>
          )}

          {subTab === 'offer' && (
            <form onSubmit={handleSubmitOffer} className="space-y-3" noValidate>
              <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between tabular-nums">
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    Total Year-1 Compensation Package
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    12 × Monthly Base PKR + Signing Bonus
                  </p>
                </div>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  {formatCurrencyPKR(annualizedPreview)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
                <div>
                  <label htmlFor="off-base" className="block font-semibold mb-1">
                    Monthly Base Salary (PKR)
                  </label>
                  <input
                    id="off-base"
                    type="number"
                    min={50000}
                    step={10000}
                    value={baseMonthly}
                    onChange={(e) => setBaseMonthly(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
                <div>
                  <label htmlFor="off-bonus" className="block font-semibold mb-1">
                    Signing Bonus (PKR)
                  </label>
                  <input
                    id="off-bonus"
                    type="number"
                    min={0}
                    step={25000}
                    value={signingBonus}
                    onChange={(e) => setSigningBonus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
                <div>
                  <label htmlFor="off-join" className="block font-semibold mb-1">
                    Target Joining Date
                  </label>
                  <input
                    id="off-join"
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
                <div>
                  <label htmlFor="off-mode" className="block font-semibold mb-1">
                    Workplace Arrangement
                  </label>
                  <select
                    id="off-mode"
                    value={offerWorkMode}
                    onChange={(e) => setOfferWorkMode(e.target.value as WorkMode)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="off-perks" className="block font-semibold mb-1">
                  Benefits, Provident Fund &amp; Equity Terms
                </label>
                <input
                  id="off-perks"
                  type="text"
                  value={equityNotes}
                  onChange={(e) => setEquityNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>

              {offerError && (
                <p role="alert" className="text-xs font-medium text-[#CC1016]">
                  {offerError}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Issue PKR Offer Letter &amp; Move to Offer
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Stage Bar */}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161B22] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="drawer-stage-select" className="font-semibold text-gray-600 dark:text-gray-300">
              Pipeline Stage:
            </label>
            <select
              id="drawer-stage-select"
              value={application.status}
              onChange={(e) =>
                onMoveStage(application.id, e.target.value as ApplicationStatus)
              }
              className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] font-semibold capitalize"
            >
              <option value="applied">Applied</option>
              <option value="in_review">In Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
