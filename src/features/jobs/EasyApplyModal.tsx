import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Job, Profile } from '../../types';
import { useResumeStore } from '../../lib/resumeStore';
import { formatSalaryRangePKR } from '../../lib/locale/pakistan';
import { FileText, Upload, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export interface EasyApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  applicant: Profile;
  onSubmitApplication: (payload: {
    phone: string;
    email: string;
    resumeName: string;
    coverNote?: string;
    answers?: Record<string, string>;
  }) => void;
}

export const EasyApplyModal: React.FC<EasyApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  applicant,
  onSubmitApplication,
}) => {
  const { resumes } = useResumeStore();
  const hasQuestions = Boolean(job.screening_questions && job.screening_questions.length > 0);
  const totalSteps = hasQuestions ? 3 : 2;

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(applicant.email || 'hamza.tariq@nextstep.pk');
  const [phone, setPhone] = useState(applicant.phone || '+92 300 4128910');
  const [selectedResumeName, setSelectedResumeName] = useState(
    resumes[0] ? `${resumes[0].title.replace(/\s+/g, '_')}.pdf` : `${applicant.first_name}_${applicant.last_name}_ATS_Resume.pdf`
  );
  const [coverNote, setCoverNote] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedResumeName(file.name);
    toast.success(`Selected ${file.name}`);
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!phone.trim() || phone.trim().length < 7) {
        setErrorMsg('Please enter a valid Pakistan (+92) or mobile phone number.');
        return;
      }
      if (!selectedResumeName.trim()) {
        setErrorMsg('Please select or upload a resume PDF.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2 && hasQuestions) {
      for (const q of job.screening_questions || []) {
        if (q.required && !answers[q.id]?.trim()) {
          setErrorMsg(`Please answer required screening question: "${q.question}"`);
          return;
        }
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (hasQuestions) {
      for (const q of job.screening_questions || []) {
        if (q.required && !answers[q.id]?.trim()) {
          setErrorMsg(`Please answer required screening question: "${q.question}"`);
          return;
        }
      }
    }

    onSubmitApplication({
      phone: phone.trim(),
      email: email.trim(),
      resumeName: selectedResumeName,
      coverNote: coverNote.trim() || undefined,
      answers,
    });
    onClose();
  };

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply to ${job.company?.name || 'Organization'}`}
      description={`${job.title} · ${formatSalaryRangePKR(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}`}
      maxWidth="md"
    >
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        {/* Progress Indicator */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 tabular-nums">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A66C2] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Contact Info & Resume Selection */}
        {step === 1 && (
          <div className="space-y-3.5">
            <Input
              label="Email address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hamza.tariq@nextstep.pk"
            />
            <Input
              label="Mobile phone number (Pakistan +92) *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 4128910"
            />

            <div>
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 block mb-1.5">
                Resume / CV *
              </label>
              <div className="space-y-2">
                {resumes.map((r) => {
                  const pdfName = `${r.title.replace(/\s+/g, '_')}.pdf`;
                  const isChosen = selectedResumeName === pdfName;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedResumeName(pdfName)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isChosen
                          ? 'border-[#0A66C2] bg-blue-50/60 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#0A66C2] shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {pdfName}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            NextStep ATS Builder · Template: {r.template}
                          </p>
                        </div>
                      </div>
                      {isChosen && <CheckCircle2 className="w-4 h-4 text-[#0A66C2] shrink-0" />}
                    </button>
                  );
                })}

                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-gray-300 dark:border-gray-700 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload custom PDF / DOCX</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 (if hasQuestions): Screening Questions */}
        {step === 2 && hasQuestions && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Recruiter Screening Questions
            </h4>
            {(job.screening_questions || []).map((q) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                  {q.question} {q.required && <span className="text-red-500">*</span>}
                </label>
                {q.type === 'yes_no' ? (
                  <div className="flex items-center gap-4 text-xs">
                    {(['yes', 'no'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="text-[#0A66C2]"
                        />
                        <span className="capitalize font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : q.type === 'number' ? (
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 4"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full text-xs sm:text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] tabular-nums"
                  />
                ) : (
                  <textarea
                    rows={2}
                    placeholder="Your response..."
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* FINAL STEP: Cover Note & Review */}
        {step === totalSteps && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">
                {applicant.first_name} {applicant.last_name}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {email} · {phone}
              </p>
              <p className="text-[#0A66C2] dark:text-[#71B7FB] font-medium">
                Attached CV: {selectedResumeName}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 block mb-1">
                Optional Note to Hiring Team ({job.company?.name})
              </label>
              <textarea
                rows={3}
                placeholder="Highlight relevant RAAST, cloud, or product experience..."
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
              />
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
          {step > 1 ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          ) : (
            <Button type="button" variant="tertiary" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="sm">
              Submit Application
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
