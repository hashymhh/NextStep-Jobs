import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Plus, Check, Search } from 'lucide-react';

export interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAddSkill: (skillName: string, category?: string) => void;
}

const POPULAR_SKILLS = [
  { name: 'React', category: 'Frontend' },
  { name: 'TypeScript', category: 'Languages' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Python', category: 'Languages' },
  { name: 'PostgreSQL', category: 'Databases' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'GraphQL', category: 'API' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Figma', category: 'Design' },
  { name: 'System Architecture', category: 'Engineering' },
  { name: 'Microservices', category: 'Engineering' },
  { name: 'Redis', category: 'Databases' },
  { name: 'CI/CD Pipelines', category: 'DevOps' },
  { name: 'REST APIs', category: 'API' },
  { name: 'Jest / Testing', category: 'Testing' },
];

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  existingSkillNames,
  onAddSkill,
}) => {
  const [search, setSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const filtered = POPULAR_SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (name: string, category?: string) => {
    onAddSkill(name, category);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkill.trim()) {
      onAddSkill(customSkill.trim(), 'Other');
      setCustomSkill('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Skills"
      description="Showcase your technical capabilities and receive peer endorsements."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills (e.g. React, PostgreSQL)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>

        {/* Skill Pills */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Suggested Tech Skills
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
            {filtered.map((skill) => {
              const alreadyHas = existingSkillNames.some(
                (n) => n.toLowerCase() === skill.name.toLowerCase()
              );
              return (
                <button
                  key={skill.name}
                  type="button"
                  disabled={alreadyHas}
                  onClick={() => handleAdd(skill.name, skill.category)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                    alreadyHas
                      ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40 dark:text-[#71B7FB] opacity-60'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {alreadyHas ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>{skill.name}</span>
                  <span className="text-[10px] text-gray-400">({skill.category})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Skill Input */}
        <form onSubmit={handleAddCustom} className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
            Custom Skill
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter unique skill..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={!customSkill.trim()}>
              Add Skill
            </Button>
          </div>
        </form>

        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
