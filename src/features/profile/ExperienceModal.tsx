import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Experience } from '../../types';
import { Trash2 } from 'lucide-react';

const expSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  company_name: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  work_mode: z.enum(['remote', 'hybrid', 'onsite']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_current: z.boolean(),
  description: z.string().optional(),
});

type ExpFormData = z.infer<typeof expSchema>;

export interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: Experience | null;
  onSave: (exp: Omit<Experience, 'id' | 'profile_id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  experience,
  onSave,
  onDelete,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpFormData>({
    resolver: zodResolver(expSchema),
    defaultValues: {
      title: experience?.title || '',
      company_name: experience?.company_name || '',
      location: experience?.location || '',
      work_mode: experience?.work_mode || 'hybrid',
      start_date: experience?.start_date || '2022-01-01',
      end_date: experience?.end_date || '',
      is_current: experience ? experience.is_current : true,
      description: experience?.description || '',
    },
  });

  const isCurrent = watch('is_current');

  const onSubmit = (data: ExpFormData) => {
    onSave({
      id: experience?.id,
      title: data.title,
      company_name: data.company_name,
      location: data.location,
      work_mode: data.work_mode,
      start_date: data.start_date,
      end_date: data.is_current ? undefined : data.end_date,
      is_current: data.is_current,
      description: data.description,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={experience ? 'Edit Experience' : 'Add Experience'}
      description="Highlight your career history, accomplishments, and tech stack."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title *"
          placeholder="e.g. Senior Full-Stack Engineer"
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label="Company Name *"
          placeholder="e.g. Systems Limited or SadaPay"
          {...register('company_name')}
          error={errors.company_name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Location"
            placeholder="e.g. Lahore, Punjab, Pakistan"
            {...register('location')}
          />

          <div>
            <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
              Workplace Type
            </label>
            <select
              {...register('work_mode')}
              className="w-full text-sm rounded-md border border-[#E0DFDC] dark:border-[#38434F] py-2 px-3 bg-white dark:bg-[#1B1F23]"
            >
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>

        {/* Current Role Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-[#0A66C2] rounded"
            {...register('is_current')}
          />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            I am currently working in this role
          </span>
        </label>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start Date *"
            type="date"
            {...register('start_date')}
            error={errors.start_date?.message}
          />

          {!isCurrent && (
            <Input
              label="End Date"
              type="date"
              {...register('end_date')}
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe your responsibilities, team impact, and tools used..."
            {...register('description')}
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {experience && onDelete ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onDelete(experience.id);
                onClose();
              }}
            >
              Delete Experience
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
