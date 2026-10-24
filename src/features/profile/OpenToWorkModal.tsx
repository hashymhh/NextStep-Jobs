import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Profile, OpenToWorkDetails } from '../../types';
import { Sparkles, Users, Lock, Plus, X } from 'lucide-react';

export interface OpenToWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (openToWork: boolean, details?: OpenToWorkDetails) => void;
}

const COMMON_ROLES = [
  'Senior Full-Stack Engineer',
  'Frontend Architect',
  'Software Engineer',
  'Staff Engineer',
  'Product Designer',
  'Engineering Manager',
];

export const OpenToWorkModal: React.FC<OpenToWorkModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(profile.open_to_work);
  const [roles, setRoles] = useState<string[]>(
    profile.open_to_work_details?.roles || ['Senior Full-Stack Engineer', 'Frontend Architect']
  );
  const [locations, setLocations] = useState<string[]>(
    profile.open_to_work_details?.locations || ['Lahore, Pakistan', 'Karachi, Pakistan', 'Islamabad, Pakistan', 'Remote']
  );
  const [jobTypes, setJobTypes] = useState<string[]>(
    profile.open_to_work_details?.jobTypes || ['Full-time', 'Contract']
  );
  const [visibility, setVisibility] = useState<'all_members' | 'recruiters_only'>(
    profile.open_to_work_details?.visibility || 'all_members'
  );
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customLocationInput, setCustomLocationInput] = useState('');

  const toggleJobType = (t: string) => {
    setJobTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoleInput.trim() && !roles.includes(customRoleInput.trim())) {
      setRoles([...roles, customRoleInput.trim()]);
      setCustomRoleInput('');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (customLocationInput.trim() && !locations.includes(customLocationInput.trim())) {
      setLocations([...locations, customLocationInput.trim()]);
      setCustomLocationInput('');
    }
  };

  const handleSave = () => {
    onSave(enabled, {
      roles,
      locations,
      jobTypes,
      visibility,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Job Preferences (#OpenToWork)"
      description="Let recruiters and your network know you are open to opportunities."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Main Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#057642] dark:text-[#34A853]" />
            <div>
              <p className="text-xs font-bold text-[#057642] dark:text-[#34A853]">
                Open to new job opportunities
              </p>
              <p className="text-[11px] text-gray-500">
                Turn on to let verified recruiters and hiring managers find you.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#057642]"></div>
          </label>
        </div>

        {enabled && (
          <div className="space-y-4">
            {/* Target Job Titles */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                Job Titles
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => setRoles(roles.filter((item) => item !== r))}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add job title (e.g. Distributed Systems Engineer)..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
                />
                <Button variant="secondary" size="sm" onClick={handleAddRole}>
                  Add
                </Button>
              </div>
            </div>

            {/* Target Locations */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                Target Locations
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {locations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => setLocations(locations.filter((item) => item !== loc))}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add location (e.g. Lahore, Karachi, Islamabad, or Remote)..."
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
                />
                <Button variant="secondary" size="sm" onClick={handleAddLocation}>
                  Add
                </Button>
              </div>
            </div>

            {/* Job Types */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1.5">
                Job Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => {
                  const isSelected = jobTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleJobType(t)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#057642] bg-green-50 text-[#057642] dark:bg-green-950/40 dark:text-[#34A853]'
                          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Selector */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">
                Choose who can see you are open
              </label>

              {/* All Members */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'all_members'
                    ? 'border-[#057642] bg-green-50/50 dark:bg-green-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'all_members'}
                  onChange={() => setVisibility('all_members')}
                  className="mt-0.5 text-[#057642] focus:ring-0"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#057642]" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      All NextStep members (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Adds the green #OpenToWork photo frame to your profile so recruiters and peers can refer you.
                  </p>
                </div>
              </label>

              {/* Recruiters Only */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'recruiters_only'
                    ? 'border-[#057642] bg-green-50/50 dark:bg-green-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'recruiters_only'}
                  onChange={() => setVisibility('recruiters_only')}
                  className="mt-0.5 text-[#057642] focus:ring-0"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Recruiters only
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Only people using NextStep Recruiter will see this. No photo frame is added to your avatar.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </Modal>
  );
};
