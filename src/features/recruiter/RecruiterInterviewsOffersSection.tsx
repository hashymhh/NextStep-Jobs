import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Application, InterviewRecord, OfferRecord } from '../../types';
import {
  computeAnnualPackagePKR,
  sortInterviewsChronologically,
  validateInterviewInput,
} from './recruiterUtils';
import { formatCurrencyPKR, formatDateTimePKT } from '../../lib/locale/pakistan';
import { Calendar, CheckCircle, DollarSign, ExternalLink, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RecruiterInterviewsOffersSectionProps {
  interviews: InterviewRecord[];
  offers: OfferRecord[];
  applications: Application[];
  recruiterName: string;
  onScheduleInterview: (input: Omit<InterviewRecord, 'id' | 'status' | 'created_at'>) => void;
  onUpdateInterviewStatus: (id: string, status: InterviewRecord['status']) => void;
  onUpdateOfferStatus: (id: string, status: OfferRecord['status'], applicationId: string) => void;
}

export const RecruiterInterviewsOffersSection: React.FC<
  RecruiterInterviewsOffersSectionProps
> = ({
  interviews,
  offers,
  applications,
  recruiterName,
  onScheduleInterview,
  onUpdateInterviewStatus,
  onUpdateOfferStatus,
}) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [scheduledAt, setScheduledAt] = useState('2026-10-31T14:00');
  const [round, setRound] = useState<InterviewRecord['round']>('technical');
  const [mode, setMode] = useState<InterviewRecord['mode']>('video');
  const [panelist, setPanelist] = useState(recruiterName);
  const [linkOrRoom, setLinkOrRoom] = useState('https://meet.nextstep.pk/pk-loop');
  const [formErr, setFormErr] = useState<string | null>(null);

  const sortedInterviews = sortInterviewsChronologically(interviews);

  const handleQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const err = validateInterviewInput({
      scheduled_at: scheduledAt,
      panelist,
      location_or_link: linkOrRoom,
    });
    if (err) {
      setFormErr(err);
      return;
    }
    const app = applications.find((a) => a.id === selectedAppId) || applications[0];
    if (!app) {
      setFormErr('No active candidate application available to schedule.');
      return;
    }
    const candName = app.applicant
      ? `${app.applicant.first_name} ${app.applicant.last_name}`
      : 'Hamza Tariq';

    onScheduleInterview({
      application_id: app.id,
      job_id: app.job_id,
      job_title: app.job?.title || 'Senior Software Engineer',
      candidate_id: app.applicant_id,
      candidate_name: candName,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: 60,
      mode,
      round,
      panelist: panelist.trim(),
      location_or_link: linkOrRoom.trim(),
    });
    setShowScheduleForm(false);
    toast.success(`Scheduled ${round.replace('_', ' ')} interview with ${candName} (PKT)`);
  };

  return (
    <div className="space-y-5">
      {/* PKT Interviews Schedule */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
              <span>PKT Interview Loops ({interviews.length})</span>
            </h2>
            <p className="text-xs text-gray-500">
              All technical, system design, and executive interviews synchronized to Asia/Karachi (PKT).
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowScheduleForm(!showScheduleForm)}
          >
            {showScheduleForm ? 'Close Form' : 'Schedule PKT Interview'}
          </Button>
        </div>

        {showScheduleForm && (
          <form
            onSubmit={handleQuickSchedule}
            className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#12161A] border border-gray-200 dark:border-gray-800 space-y-3 text-xs"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="quick-int-app" className="block font-semibold mb-1">
                  Candidate Application
                </label>
                <select
                  id="quick-int-app"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                >
                  {applications.map((a) => {
                    const nm = a.applicant
                      ? `${a.applicant.first_name} ${a.applicant.last_name}`
                      : a.applicant_id;
                    return (
                      <option key={a.id} value={a.id}>
                        {nm} — {a.job?.title || 'Role'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="quick-int-dt" className="block font-semibold mb-1">
                  Date &amp; Time (PKT)
                </label>
                <input
                  id="quick-int-dt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="quick-int-round" className="block font-semibold mb-1">
                  Round &amp; Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    id="quick-int-round"
                    value={round}
                    onChange={(e) => setRound(e.target.value as InterviewRecord['round'])}
                    className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  >
                    <option value="screening">Screening</option>
                    <option value="technical">Technical</option>
                    <option value="system_design">System Design</option>
                    <option value="executive">Executive</option>
                  </select>
                  <select
                    aria-label="Interview mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as InterviewRecord['mode'])}
                    className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  >
                    <option value="video">Video</option>
                    <option value="onsite">On-site</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="quick-int-panel" className="block font-semibold mb-1">
                  Panelist(s)
                </label>
                <input
                  id="quick-int-panel"
                  type="text"
                  value={panelist}
                  onChange={(e) => setPanelist(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="quick-int-link" className="block font-semibold mb-1">
                  Meeting URL or Campus Address
                </label>
                <div className="flex gap-2">
                  <input
                    id="quick-int-link"
                    type="text"
                    value={linkOrRoom}
                    onChange={(e) => setLinkOrRoom(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Confirm Slot
                  </Button>
                </div>
              </div>
            </div>
            {formErr && (
              <p role="alert" className="text-xs font-medium text-[#CC1016]">
                {formErr}
              </p>
            )}
          </form>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedInterviews.map((intItem) => (
            <div
              key={intItem.id}
              className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white">
                  {intItem.candidate_name} ·{' '}
                  <span className="font-normal text-gray-500">{intItem.job_title}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-300 tabular-nums">
                  {formatDateTimePKT(intItem.scheduled_at)} ({intItem.duration_minutes} mins) ·{' '}
                  <span className="capitalize">{intItem.round.replace('_', ' ')}</span> ·{' '}
                  <span className="capitalize">{intItem.mode}</span> · Panel: {intItem.panelist}
                </p>
                <p className="text-gray-500 truncate flex items-center gap-1">
                  <span>Venue/Link: {intItem.location_or_link}</span>
                  {intItem.location_or_link.startsWith('http') && (
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {intItem.status === 'scheduled' ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      onClick={() => {
                        onUpdateInterviewStatus(intItem.id, 'completed');
                        toast.success(`Marked interview with ${intItem.candidate_name} completed`);
                      }}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-[#CC1016]" />}
                      onClick={() => {
                        onUpdateInterviewStatus(intItem.id, 'cancelled');
                        toast.info('Interview cancelled');
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <span
                    className={`font-semibold capitalize ${
                      intItem.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-400 line-through'
                    }`}
                  >
                    {intItem.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PKR Compensation Offer Desk */}
      <Card padding="md" className="space-y-4">
        <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>PKR Offer Letters Desk ({offers.length})</span>
          </h2>
          <p className="text-xs text-gray-500">
            Track monthly PKR base packages, signing bonuses, and candidate offer acceptance.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {offers.map((offer) => {
            const annualTotal = computeAnnualPackagePKR(offer);
            return (
              <div
                key={offer.id}
                className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 tabular-nums">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {offer.candidate_name} ·{' '}
                    <span className="font-normal text-gray-500">{offer.job_title}</span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold">
                    {formatCurrencyPKR(offer.base_monthly_pkr)} / month · Signing Bonus:{' '}
                    {formatCurrencyPKR(offer.signing_bonus_pkr)} · Total Year-1:{' '}
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {formatCurrencyPKR(annualTotal)}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    Joining Date: {offer.joining_date} · Mode:{' '}
                    <span className="capitalize">{offer.work_mode}</span>
                    {offer.equity_notes ? ` · ${offer.equity_notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {offer.status === 'sent' || offer.status === 'draft' ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onUpdateOfferStatus(offer.id, 'accepted', offer.application_id);
                          toast.success(
                            `${offer.candidate_name} marked Accepted & moved to Hired!`
                          );
                        }}
                      >
                        Mark Accepted (Hire)
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onUpdateOfferStatus(offer.id, 'declined', offer.application_id);
                          toast.info(`Offer for ${offer.candidate_name} marked declined`);
                        }}
                      >
                        Mark Declined
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`font-bold capitalize ${
                        offer.status === 'accepted'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#CC1016]'
                      }`}
                    >
                      Offer {offer.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
