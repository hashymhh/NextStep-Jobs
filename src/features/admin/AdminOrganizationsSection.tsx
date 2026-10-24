import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Company, Job } from '../../types';
import { Building, CheckCircle, Edit3, ExternalLink, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

interface AdminOrganizationsSectionProps {
  companies: Company[];
  jobs: Job[];
  canGovernCompanies: boolean;
  onUpdateCompany: (companyId: string, updates: Partial<Company>, summary: string) => void;
  onCreateCompany: (input: {
    name: string;
    industry: string;
    size: string;
    hq: string;
    tagline?: string;
    website?: string;
    verified?: boolean;
  }) => void;
}

export const AdminOrganizationsSection: React.FC<AdminOrganizationsSectionProps> = ({
  companies,
  jobs,
  canGovernCompanies,
  onUpdateCompany,
  onCreateCompany,
}) => {
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Information Technology & Services');
  const [newSize, setNewSize] = useState('201–500 employees');
  const [newHq, setNewHq] = useState('Lahore, Punjab, Pakistan');
  const [newTagline, setNewTagline] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newVerified, setNewVerified] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline edit state
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [editTagline, setEditTagline] = useState('');
  const [editHq, setEditHq] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (filterVerified === 'verified' && !c.verified) return false;
      if (filterVerified === 'unverified' && c.verified) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${c.name} ${c.industry} ${c.hq || ''} ${c.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [companies, filterVerified, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!canGovernCompanies) {
      toast.error('Missing required scope: companies:govern');
      return;
    }
    if (!newName.trim()) {
      setCreateError('Organization legal or brand name is required.');
      return;
    }
    onCreateCompany({
      name: newName.trim(),
      industry: newIndustry.trim() || 'Technology',
      size: newSize,
      hq: newHq.trim() || 'Karachi, Sindh, Pakistan',
      tagline: newTagline.trim() || undefined,
      website: newWebsite.trim() || undefined,
      verified: newVerified,
    });
    setNewName('');
    setNewTagline('');
    setNewWebsite('');
    setShowCreateForm(false);
    toast.success(`Registered organization "${newName.trim()}" on NextStep Pakistan`);
  };

  const openEditor = (comp: Company) => {
    setEditingComp(comp);
    setEditTagline(comp.tagline || '');
    setEditHq(comp.hq || 'Lahore, Pakistan');
    setEditIndustry(comp.industry);
    setEditWebsite(comp.website || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp || !canGovernCompanies) return;
    onUpdateCompany(
      editingComp.id,
      {
        tagline: editTagline.trim(),
        hq: editHq.trim(),
        industry: editIndustry.trim(),
        website: editWebsite.trim() || undefined,
      },
      `Edited organization profile metadata for ${editingComp.name}`
    );
    setEditingComp(null);
    toast.success(`Updated ${editingComp.name}`);
  };

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Search organizations"
                placeholder="Search Pakistani employers by name, city, or sector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
              />
            </div>

            <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 gap-1">
              {(['all', 'verified', 'unverified'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterVerified(f)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    filterVerified === f
                      ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={!canGovernCompanies}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Close Form' : 'Register Organization'}
          </Button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreate}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3"
            noValidate
          >
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">
              Register New Pakistani Employer Entity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label htmlFor="org-name" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. PakWheels Engineering"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div>
                <label htmlFor="org-hq" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Headquarters (Pakistan)
                </label>
                <input
                  id="org-hq"
                  type="text"
                  value={newHq}
                  onChange={(e) => setNewHq(e.target.value)}
                  placeholder="Lahore, Punjab, Pakistan"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div>
                <label htmlFor="org-size" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Workforce Size
                </label>
                <select
                  id="org-size"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
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
                <label htmlFor="org-industry" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Industry Sector
                </label>
                <input
                  id="org-industry"
                  type="text"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div>
                <label htmlFor="org-website" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Corporate Website
                </label>
                <input
                  id="org-website"
                  type="url"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="https://company.pk"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div>
                <label htmlFor="org-tagline" className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  id="org-tagline"
                  type="text"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  placeholder="Building digital commerce for Pakistan"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVerified}
                  onChange={(e) => setNewVerified(e.target.checked)}
                />
                <span>Grant immediate SECP &amp; PSEB Verified Organization status</span>
              </label>
              <Button type="submit" variant="primary" size="sm">
                Create Organization Page
              </Button>
            </div>
            {createError && (
              <p role="alert" className="text-xs font-medium text-[#CC1016]">
                {createError}
              </p>
            )}
          </form>
        )}
      </Card>

      {/* Edit Organization Modal */}
      {editingComp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${editingComp.name}`}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <Card padding="lg" className="max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Govern Organization: {editingComp.name}
              </h3>
              <button
                type="button"
                aria-label="Close organization editor"
                onClick={() => setEditingComp(null)}
                className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="edit-org-tagline" className="block font-semibold mb-1">
                  Tagline
                </label>
                <input
                  id="edit-org-tagline"
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-org-hq" className="block font-semibold mb-1">
                    Headquarters
                  </label>
                  <input
                    id="edit-org-hq"
                    type="text"
                    value={editHq}
                    onChange={(e) => setEditHq(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-org-industry" className="block font-semibold mb-1">
                    Industry
                  </label>
                  <input
                    id="edit-org-industry"
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-org-web" className="block font-semibold mb-1">
                  Corporate Website
                </label>
                <input
                  id="edit-org-web"
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingComp(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Governance Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Organizations Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                <th className="py-3 px-4 font-semibold">Organization</th>
                <th className="py-3 px-3 font-semibold">HQ &amp; Workforce</th>
                <th className="py-3 px-3 font-semibold text-right">Open Roles</th>
                <th className="py-3 px-3 font-semibold">SECP / PSEB</th>
                <th className="py-3 px-3 font-semibold">Standing</th>
                <th className="py-3 px-4 font-semibold text-right">Governance Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((comp) => {
                const openRolesCount = jobs.filter(
                  (j) =>
                    j.status === 'open' &&
                    (j.company_id === comp.id || j.company?.slug === comp.slug)
                ).length;

                return (
                  <tr
                    key={comp.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-[#0A66C2]/10 text-[#0A66C2] dark:text-[#71B7FB] flex items-center justify-center font-bold shrink-0">
                          {comp.name[0]}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/company/${comp.slug}`}
                            className="font-bold text-gray-900 dark:text-white hover:text-[#0A66C2] inline-flex items-center gap-1"
                          >
                            <span>{comp.name}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Link>
                          <p className="text-[11px] text-gray-500 truncate max-w-[260px]">
                            {comp.industry}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      <p className="truncate max-w-[200px]">{comp.hq || 'Pakistan'}</p>
                      <p className="text-[11px] text-gray-500 tabular-nums">{comp.size}</p>
                    </td>

                    <td className="py-3 px-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                      {openRolesCount}
                    </td>

                    <td className="py-3 px-3">
                      {comp.verified ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-gray-500">Unverified</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {comp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="font-semibold text-[#CC1016]">Suspended</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="tertiary"
                          size="sm"
                          disabled={!canGovernCompanies}
                          aria-label={`Edit ${comp.name}`}
                          onClick={() => openEditor(comp)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!canGovernCompanies}
                          onClick={() => {
                            onUpdateCompany(
                              comp.id,
                              { verified: !comp.verified },
                              `${!comp.verified ? 'Granted' : 'Revoked'} SECP/PSEB verification on ${comp.name}`
                            );
                            toast.success(
                              !comp.verified
                                ? `Verified ${comp.name}`
                                : `Revoked verification from ${comp.name}`
                            );
                          }}
                        >
                          {comp.verified ? 'Revoke Badge' : 'Verify SECP'}
                        </Button>

                        <Button
                          variant={comp.status === 'active' ? 'danger' : 'primary'}
                          size="sm"
                          disabled={!canGovernCompanies}
                          onClick={() => {
                            const nextStatus = comp.status === 'active' ? 'suspended' : 'active';
                            onUpdateCompany(
                              comp.id,
                              { status: nextStatus },
                              `Set organization ${comp.name} status = ${nextStatus}`
                            );
                            toast.info(`${comp.name} marked ${nextStatus}`);
                          }}
                        >
                          {comp.status === 'active' ? 'Suspend' : 'Reinstate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    <Building className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                    No organizations match your current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
