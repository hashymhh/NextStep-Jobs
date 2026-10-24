import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Project } from '../../types';
import { Trash2, Plus, X } from 'lucide-react';

const projSchema = z.object({
  title: z.string().min(2, 'Project title is required'),
  description: z.string().optional(),
  url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type ProjFormData = z.infer<typeof projSchema>;

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (proj: Omit<Project, 'id' | 'profile_id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onDelete,
}) => {
  const [skills, setSkills] = useState<string[]>(project?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjFormData>({
    resolver: zodResolver(projSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      url: project?.url || '',
    },
  });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const onSubmit = (data: ProjFormData) => {
    onSave({
      id: project?.id,
      title: data.title,
      description: data.description,
      url: data.url || undefined,
      skills,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'Add Project'}
      description="Showcase software repositories, open-source work, or published products."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Project Name *"
          placeholder="e.g. Distributed Task Queue"
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label="Project URL"
          placeholder="https://github.com/yourname/project"
          {...register('url')}
          error={errors.url?.message}
        />

        <div>
          <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="What does this project do? What technical challenges did you solve?"
            {...register('description')}
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
          />
        </div>

        {/* Skills Associated */}
        <div>
          <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
            Technologies &amp; Skills Used
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700"
              >
                {s}
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((item) => item !== s))}
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
              placeholder="Add technology (e.g. Docker, Redis)..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
            />
            <Button variant="secondary" size="sm" onClick={handleAddSkill}>
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {project && onDelete ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onDelete(project.id);
                onClose();
              }}
            >
              Delete Project
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="tertiary" type="button" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
