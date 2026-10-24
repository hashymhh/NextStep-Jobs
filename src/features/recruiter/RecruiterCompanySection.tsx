import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Company, VerificationRequest } from '../../types';
import { formatDateTimePKT } from '../../lib/locale/pakistan';
import { Building, CheckCircle, Clock, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RecruiterCompanySectionProps {
  mode: 'company' | 'verification';
  companies: Company[];
  affiliatedCompanyId: string;
  onSelectAffiliatedCompany: (companyId: string) => void;
  onSaveCompanyDetails: (companyId: string, updates: Partial<Company>) => void;
  verifications: VerificationRequest[];
  recruiterName: string;
  recruiterId: string;
  recruiterHandle: string;
  recruiterEmail: string;
  isVerifiedRecruiter: boolean;
  onSubmitVerification: (
    req: Omit<VerificationRequest, 'id' | 'status' | 'created_at'>
  ) => void;
}

export const RecruiterCompanySection: React.FC<RecruiterCompanySectionProps> = ({
  mode,
  companies,
  affiliatedCompanyId,
  onSelectAffiliatedCompany,
  onSaveCompanyDetails,
  verifications,
  recruiterName,
  recruiterId,
  recruiterHandle,
  recruiterEmail,
  isVerifiedRecruiter,
  onSubmitVerification,
}) => {
  const activeCompany =
    companies.find((c) => c.id === affiliatedCompanyId) || companies[0];

  const [tagline, setTagline] = useState(activeCompany?.tagline || '');
  const [about, setAbout] = useState(activeCompany?.about || '');
  const [hq, setHq] = useState(activeCompany?.hq || 'Lahore, Punjab, Pakistan');
  const [size, setSize] = useState(activeCompany?.size || '1,001–5,000 employees');
  const [website, setWebsite] = useState(activeCompany?.website || '');
  const [specialtiesText, setSpecialtiesText] = useState(
    (activeCompany?.specialties || []).join(', ')
  );

  useEffect(() => {
    if (!activeCompany) return;
    setTagline(activeCompany.tagline || '');
    setAbout(activeCompany.about || '');
    setHq(activeCompany.hq || 'Lahore, Punjab, Pakistan');
    setSize(activeCompany.size || '1,001–5,000 employees');
    setWebsite(activeCompany.website || '');
    setSpecialtiesText((activeCompany.specialties || []).join(', '));
  }, [activeCompany]);

  // Verification filing state
  const [verType, setVerType] = useState<'recruiter' | 'company'>('company');
  const [verRegNumber, setVerRegNumber] = useState('');
  const [verNote, setVerNote] = useState('');
  const [verErr, setVerErr] = useState<string | null>(null);

  const handleSaveEmployer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    const specialties = specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSaveCompanyDetails(activeCompany.id, {
      tagline: tagline.trim(),
      about: about.trim(),
      hq: hq.trim(),
      size,
      website: website.trim() || undefined,
      specialties,
    });
    toast.success(`Updated employer profile for ${activeCompany.name}`);
  };

  const handleFileVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setVerErr(null);
    if (!verRegNumber.trim()) {
      setVerErr('Please enter your SECP, NTN, or PSEB registration number.');
      return;
    }
    if (verNote.trim().length < 12) {
      setVerErr('Please provide a brief corporate authorization note.');
      return;
    }
    onSubmitVerification({
      entity_type: verType,
      requester_id: recruiterId,
      requester_name: recruiterName,
      requester_handle: recruiterHandle,
      company_name: activeCompany?.name || 'Systems Limited',
      work_email: recruiterEmail,
      registration_number: verRegNumber.trim(),
      evidence_note: verNote.trim(),
    });
    setVerRegNumber('');
    setVerNote('');
    toast.success('Submitted SECP / PSEB credential filing to Admin Authority Queue');
  };

  if (mode === 'company') {
    return (
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
              <span>Employer Brand &amp; Organization Page Manager</span>
            </h2>
            <p className="text-xs text-gray-500">
              Changes synchronize immediately with your public company page on NextStep Pakistan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select affiliated employer"
              value={activeCompany?.id || ''}
              onChange={(e) => onSelectAffiliatedCompany(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {activeCompany && (
              <Link
                to={`/company/${activeCompany.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline whitespace-nowrap"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveEmployer} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="emp-tagline" className="block font-semibold mb-1">
                Employer Tagline
              </label>
              <input
                id="emp-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
              />
            </div>

            <div>
              <label htmlFor="emp-hq" className="block font-semibold mb-1">
                Pakistan Headquarters
              </label>
              <input
                id="emp-hq"
                type="text"
                value={hq}
                onChange={(e) => setHq(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
              />
            </div>

            <div>
              <label htmlFor="emp-size" className="block font-semibold mb-1">
                Workforce Size
              </label>
              <select
                id="emp-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
              >
                <option value="11–50 employees">11–50 employees</option>
                <option value="51–200 employees">51–200 employees</option>
                <option value="201–500 employees">201–500 employees</option>
                <option value="501–1,000 employees">501–1,000 employees</option>
                <option value="1,001–5,000 employees">1,001–5,000 employees</option>
                <option value="5,001+ employees">5,001+ employees</option>
              </select>
            </div>

            <div>
              <label htmlFor="emp-web" className="block font-semibold mb-1">
                Official Website
              </label>
              <input
                id="emp-web"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="emp-spec" className="block font-semibold mb-1">
              Engineering Specialties (comma-separated)
            </label>
            <input
              id="emp-spec"
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>

          <div>
            <label htmlFor="emp-about" className="block font-semibold mb-1">
              Company Overview &amp; Engineering Culture
            </label>
            <textarea
              id="emp-about"
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" size="sm">
              Publish Employer Profile Updates
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <Card padding="lg" className="lg:col-span-5 space-y-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              SECP / NTN / PSEB Credential Standing
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isVerifiedRecruiter
                ? `Active Verified Corporate Recruiter (${recruiterEmail}). Native Easy Apply & direct outreach unlocked.`
                : 'Submit corporate credentials for Admin Authority verification.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleFileVerification} className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs" noValidate>
          <p className="font-bold text-gray-900 dark:text-white">
            File Additional Organization Claim or Renewal
          </p>
          <div>
            <label htmlFor="rec-ver-type" className="block font-semibold mb-1">
              Filing Type
            </label>
            <select
              id="rec-ver-type"
              value={verType}
              onChange={(e) => setVerType(e.target.value as 'recruiter' | 'company')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            >
              <option value="company">Organization Page SECP Claim ({activeCompany?.name})</option>
              <option value="recruiter">Corporate Recruiter Renewal</option>
            </select>
          </div>
          <div>
            <label htmlFor="rec-ver-reg" className="block font-semibold mb-1">
              SECP / NTN / PSEB Certificate ID
            </label>
            <input
              id="rec-ver-reg"
              type="text"
              value={verRegNumber}
              onChange={(e) => setVerRegNumber(e.target.value)}
              placeholder="e.g. PSEB-EXP-2026-9912"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          <div>
            <label htmlFor="rec-ver-note" className="block font-semibold mb-1">
              Authorization Evidence Note
            </label>
            <textarea
              id="rec-ver-note"
              rows={3}
              value={verNote}
              onChange={(e) => setVerNote(e.target.value)}
              placeholder="Corporate HR authorization details..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
            />
          </div>
          {verErr && (
            <p role="alert" className="text-xs font-medium text-[#CC1016]">
              {verErr}
            </p>
          )}
          <Button type="submit" variant="primary" size="sm" className="w-full justify-center">
            Submit Filing to Authority Console
          </Button>
        </form>
      </Card>

      <Card padding="lg" className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Recent Verification Ledger ({verifications.length})
          </h3>
          <Link
            to="/recruiter/verify"
            className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline"
          >
            Open Dedicated Verification Portal &rarr;
          </Link>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          {verifications.map((req) => (
            <div
              key={req.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {req.company_name} ·{' '}
                  <span className="font-normal text-gray-500">
                    {req.requester_name} ({req.entity_type})
                  </span>
                </p>
                <p className="text-gray-500 tabular-nums mt-0.5">
                  {req.registration_number || 'PSEB'} · {formatDateTimePKT(req.created_at)}
                </p>
              </div>
              <div className="shrink-0">
                {req.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approved
                  </span>
                ) : req.status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#CC1016]">
                    <XCircle className="w-3.5 h-3.5" />
                    Declined
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Review
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
