import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Job, Profile, TalentPoolCategory, TalentPoolItem } from '../../types';
import { formatSalaryRangePKR } from '../../lib/locale/pakistan';
import { Bookmark, MapPin, MessageSquare, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const POOL_CATEGORIES: TalentPoolCategory[] = [
  'Shortlisted',
  'Frontend Guild',
  'Backend & Cloud',
  'Leadership',
];

interface RecruiterTalentPoolSectionProps {
  candidates: Profile[];
  talentPool: TalentPoolItem[];
  openJobs: Job[];
  recruiterName: string;
  onSaveToPool: (params: {
    candidate_id: string;
    pool_name: TalentPoolCategory;
    note?: string;
    saved_by: string;
  }) => void;
  onRemoveFromPool: (candidateId: string) => void;
  onSendOutreach: (candidate: Profile, messageBody: string) => void;
}

export const RecruiterTalentPoolSection: React.FC<RecruiterTalentPoolSectionProps> = ({
  candidates,
  talentPool,
  openJobs,
  recruiterName,
  onSaveToPool,
  onRemoveFromPool,
  onSendOutreach,
}) => {
  const [viewMode, setViewMode] = useState<'directory' | 'pools'>('directory');
  const [activePoolFilter, setActivePoolFilter] = useState<'all' | TalentPoolCategory>('all');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [onlyOpenToWork, setOnlyOpenToWork] = useState(false);

  // Outreach composer modal
  const [outreachCandidate, setOutreachCandidate] = useState<Profile | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(openJobs[0]?.id || '');
  const [outreachText, setOutreachText] = useState('');

  const filteredDirectory = useMemo(() => {
    return candidates.filter((p) => {
      if (p.role === 'admin') return false;
      if (onlyOpenToWork && !p.open_to_work) return false;
      if (city !== 'all' && !(p.location || '').toLowerCase().includes(city.toLowerCase())) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [
          p.first_name,
          p.last_name,
          p.headline,
          p.location,
          ...(p.skills || []).map((s) => s.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [candidates, city, onlyOpenToWork, query]);

  const savedEntriesWithProfile = useMemo(() => {
    return talentPool
      .filter((item) => activePoolFilter === 'all' || item.pool_name === activePoolFilter)
      .map((item) => ({
        item,
        candidate: candidates.find((c) => c.id === item.candidate_id),
      }))
      .filter((x): x is { item: TalentPoolItem; candidate: Profile } => Boolean(x.candidate));
  }, [activePoolFilter, candidates, talentPool]);

  const openOutreachComposer = (cand: Profile) => {
    const defaultJob = openJobs[0];
    setOutreachCandidate(cand);
    setSelectedJobId(defaultJob?.id || '');
    const compRange = defaultJob
      ? formatSalaryRangePKR(
          defaultJob.salary_min,
          defaultJob.salary_max,
          defaultJob.salary_currency,
          defaultJob.salary_period
        )
      : 'competitive monthly PKR compensation';
    setOutreachText(
      `Assalam-o-Alaikum ${cand.first_name}, your background in ${(cand.skills || [])
        .slice(0, 2)
        .map((s) => s.name)
        .join(' & ') || 'software engineering'} stood out to our hiring team. We are hiring for ${
        defaultJob?.title || 'Senior Software Engineer'
      } (${compRange}). Open to a quick 15-minute chat this week (PKT)?`
    );
  };

  const handleJobTemplateChange = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = openJobs.find((j) => j.id === jobId);
    if (!job || !outreachCandidate) return;
    const compRange = formatSalaryRangePKR(
      job.salary_min,
      job.salary_max,
      job.salary_currency,
      job.salary_period
    );
    setOutreachText(
      `Assalam-o-Alaikum ${outreachCandidate.first_name}, reaching out regarding our ${job.title} opening at ${job.company?.name || 'our Pakistan engineering hub'} (${compRange}, ${job.work_mode}). Would love to connect this week (PKT)!`
    );
  };

  const handleSendOutreachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outreachCandidate || !outreachText.trim()) return;
    onSendOutreach(outreachCandidate, outreachText.trim());
    setOutreachCandidate(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-gray-200/80 dark:bg-gray-800 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('directory')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              viewMode === 'directory'
                ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Pakistan Talent Directory ({filteredDirectory.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pools')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              viewMode === 'pools'
                ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Saved Talent Pools ({talentPool.length})
          </button>
        </div>
      </div>

      {viewMode === 'directory' ? (
        <>
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-center">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search Pakistani engineering candidates"
                  placeholder="Search by skill, title, or name (e.g. React, Go, Lahore)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>

              <select
                aria-label="Filter talent by city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
              >
                <option value="all">All Pakistan Hubs</option>
                <option value="lahore">Lahore</option>
                <option value="karachi">Karachi</option>
                <option value="islamabad">Islamabad</option>
                <option value="rawalpindi">Rawalpindi</option>
              </select>

              <label className="inline-flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyOpenToWork}
                  onChange={(e) => setOnlyOpenToWork(e.target.checked)}
                />
                <span>Open to Work only</span>
              </label>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDirectory.map((cand) => {
              const fullName = `${cand.first_name} ${cand.last_name}`;
              const poolEntry = talentPool.find((t) => t.candidate_id === cand.id);

              return (
                <Card key={cand.id} padding="md" className="flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={fullName}
                      src={cand.avatar_url}
                      size="md"
                      verified={cand.verified}
                      openToWork={cand.open_to_work}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/in/${cand.handle}`}
                          className="font-bold text-sm text-gray-900 dark:text-white hover:text-[#0A66C2] truncate"
                        >
                          {fullName}
                        </Link>
                        {cand.open_to_work && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                            Open to Work
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">
                        {cand.headline}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{cand.location || 'Pakistan'}</span>
                      </p>
                      {cand.skills && cand.skills.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-1.5 truncate">
                          {cand.skills
                            .slice(0, 5)
                            .map((s) => s.name)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <select
                        aria-label={`Assign ${fullName} to talent pool`}
                        value={poolEntry?.pool_name || ''}
                        onChange={(e) => {
                          const val = e.target.value as TalentPoolCategory | '';
                          if (!val) {
                            onRemoveFromPool(cand.id);
                            toast.info(`Removed ${fullName} from talent pool`);
                          } else {
                            onSaveToPool({
                              candidate_id: cand.id,
                              pool_name: val,
                              saved_by: recruiterName,
                            });
                            toast.success(`Saved ${fullName} to "${val}" pool`);
                          }
                        }}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                      >
                        <option value="">Save to Pool...</option>
                        {POOL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => openOutreachComposer(cand)}
                    >
                      Recruiter Outreach
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...POOL_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActivePoolFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activePoolFilter === cat
                    ? 'bg-[#0A66C2] text-white'
                    : 'bg-white dark:bg-[#1B1F23] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                }`}
              >
                {cat === 'all' ? `All Pools (${talentPool.length})` : cat}
              </button>
            ))}
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {savedEntriesWithProfile.map(({ item, candidate }) => {
                const fullName = `${candidate.first_name} ${candidate.last_name}`;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={fullName} src={candidate.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/in/${candidate.handle}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-[#0A66C2]"
                        >
                          {fullName}
                        </Link>
                        <span className="text-gray-500"> · Pool: </span>
                        <strong className="text-[#0A66C2] dark:text-[#71B7FB]">
                          {item.pool_name}
                        </strong>
                        <p className="text-gray-500 truncate mt-0.5">
                          {candidate.headline} · {candidate.location}
                        </p>
                        {item.note && (
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        onClick={() => openOutreachComposer(candidate)}
                      >
                        Send InMail
                      </Button>
                      <button
                        type="button"
                        aria-label={`Remove ${fullName} from talent pool`}
                        onClick={() => {
                          onRemoveFromPool(candidate.id);
                          toast.info(`Removed ${fullName} from pool`);
                        }}
                        className="p-2 rounded text-gray-400 hover:text-[#CC1016] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {savedEntriesWithProfile.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-500">
                  No candidates saved in this talent pool yet. Use the Talent Directory to shortlist profiles.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Outreach Modal */}
      {outreachCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Send recruiter outreach to ${outreachCandidate.first_name}`}
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
        >
          <Card padding="lg" className="max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Direct Recruiter Outreach: {outreachCandidate.first_name}{' '}
                {outreachCandidate.last_name}
              </h3>
              <button
                type="button"
                aria-label="Close outreach modal"
                onClick={() => setOutreachCandidate(null)}
                className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOutreachSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="outreach-job-select" className="block font-semibold mb-1">
                  Link Open PKR Requisition Template
                </label>
                <select
                  id="outreach-job-select"
                  value={selectedJobId}
                  onChange={(e) => handleJobTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                >
                  {openJobs.slice(0, 15).map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.company?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="outreach-body" className="block font-semibold mb-1">
                  Personalized Message (Delivers to Candidate Messaging Inbox)
                </label>
                <textarea
                  id="outreach-body"
                  rows={4}
                  value={outreachText}
                  onChange={(e) => setOutreachText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOutreachCandidate(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Send Outreach &amp; Open Chat
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
