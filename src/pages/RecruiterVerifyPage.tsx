import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/clerk/useAuth';
import { useAdminStore } from '../lib/adminStore';
import { DEMO_COMPANIES } from '../lib/seed/demoData';
import { formatDateTimePKT } from '../lib/locale/pakistan';
import { ShieldCheck, Building, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const RecruiterVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { verifications, submitVerificationRequest } = useAdminStore();

  const [entityType, setEntityType] = useState<'recruiter' | 'company'>('recruiter');
  const [companyName, setCompanyName] = useState(DEMO_COMPANIES[0]?.name || 'Systems Limited');
  const [workEmail, setWorkEmail] = useState(
    profile?.email?.includes('@') ? profile.email : 'talent@systemsltd.com'
  );
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const myRequests = verifications.filter(
    (v) =>
      v.requester_id === profile?.id ||
      v.requester_handle === profile?.handle
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim()) {
      setFormError('Please enter your company or organization name.');
      return;
    }
    if (!workEmail.trim() || !workEmail.includes('@')) {
      setFormError('Please enter a valid corporate work email address.');
      return;
    }
    if (!registrationNumber.trim()) {
      setFormError('Please provide your SECP, NTN, or PSEB registration number.');
      return;
    }
    if (evidenceNote.trim().length < 15) {
      setFormError('Please include a brief verification note (at least 15 characters).');
      return;
    }

    const requesterName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : 'Hamza Tariq';

    submitVerificationRequest({
      entity_type: entityType,
      requester_id: profile?.id || 'usr_candidate_john',
      requester_name: requesterName,
      requester_handle: profile?.handle || 'hamzatariq',
      company_name: companyName.trim(),
      work_email: workEmail.trim(),
      registration_number: registrationNumber.trim(),
      evidence_note: evidenceNote.trim(),
    });

    setRegistrationNumber('');
    setEvidenceNote('');
    toast.success('Verification application submitted to NextStep Pakistan Authority Queue.');
  };

  return (
    <Shell hideRightRail>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0A66C2] dark:text-[#71B7FB]" />
              <span>Recruiter &amp; Organization Verification</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Submit SECP, FBR NTN, or PSEB Software Export Board credentials for verified hiring access.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/recruiter')}
          >
            Recruiter Hub
          </Button>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Verification Category
              </label>
              <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 gap-1">
                <button
                  type="button"
                  onClick={() => setEntityType('recruiter')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    entityType === 'recruiter'
                      ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Corporate Recruiter Badge
                </button>
                <button
                  type="button"
                  onClick={() => setEntityType('company')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    entityType === 'company'
                      ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Organization Page Claim
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="verify-company-name"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >
                  Organization Name (Pakistan)
                </label>
                <input
                  id="verify-company-name"
                  list="pk-companies-list"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Systems Limited, SadaPay, Arbisoft"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white focus:outline-none focus:border-[#0A66C2]"
                />
                <datalist id="pk-companies-list">
                  {DEMO_COMPANIES.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="verify-work-email"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >
                  Corporate Domain Email
                </label>
                <input
                  id="verify-work-email"
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="name@company.pk"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white focus:outline-none focus:border-[#0A66C2]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="verify-reg-number"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                SECP Incorporation / NTN / PSEB Certificate Number
              </label>
              <input
                id="verify-reg-number"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. PSEB-R-2026-4819 or SECP-0094812"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white focus:outline-none focus:border-[#0A66C2]"
              />
            </div>

            <div>
              <label
                htmlFor="verify-evidence"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                Hiring Authority &amp; Verification Note
              </label>
              <textarea
                id="verify-evidence"
                rows={3}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Describe your talent acquisition role, active engineering hiring plans in Lahore/Karachi/Islamabad, and corporate website reference..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white focus:outline-none focus:border-[#0A66C2]"
              />
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-[#CC1016] dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" variant="primary" size="md">
                Submit for Admin Verification
              </Button>
            </div>
          </form>
        </Card>

        {/* Submitted Requests History */}
        <Card padding="md">
          <h2 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
            Verification Queue Status ({myRequests.length || verifications.length})
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(myRequests.length > 0 ? myRequests : verifications.slice(0, 4)).map((req) => (
              <div
                key={req.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>{req.company_name}</span>
                    <span className="font-normal text-gray-500">
                      · {req.requester_name} (@{req.requester_handle})
                    </span>
                  </p>
                  <p className="text-gray-500 tabular-nums">
                    {req.registration_number || 'PSEB Registered'} · {req.work_email} · Submitted{' '}
                    {formatDateTimePKT(req.created_at)}
                  </p>
                </div>

                <div className="shrink-0">
                  {req.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approved
                    </span>
                  ) : req.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#CC1016] dark:text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                      Declined
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Admin Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
};
