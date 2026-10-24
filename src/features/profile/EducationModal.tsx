import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Education } from '../../types';
import { Trash2 } from 'lucide-react';

const eduSchema = z.object({
  school_name: z.string().min(2, 'School name is required'),
  degree: z.string().optional(),
  field_of_study: z.string().optional(),
  start_year: z.number().min(1960).max(2035),
  end_year: z.number().min(1960).max(2035).optional(),
  grade: z.string().optional(),
  activities: z.string().optional(),
  description: z.string().optional(),
});

type EduFormData = z.infer<typeof eduSchema>;

export interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  education?: Education | null;
  onSave: (edu: Omit<Education, 'id' | 'profile_id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  education,
  onSave,
  onDelete,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EduFormData>({
    resolver: zodResolver(eduSchema),
    defaultValues: {
      school_name: education?.school_name || '',
      degree: education?.degree || '',
      field_of_study: education?.field_of_study || '',
      start_year: education?.start_year || 2016,
      end_year: education?.end_year || 2020,
      grade: education?.grade || '',
      activities: education?.activities || '',
      description: education?.description || '',
    },
  });

  const onSubmit = (data: EduFormData) => {
    onSave({
      id: education?.id,
      school_name: data.school_name,
      degree: data.degree,
      field_of_study: data.field_of_study,
      start_year: data.start_year,
      end_year: data.end_year,
      grade: data.grade,
      activities: data.activities,
      description: data.description,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={education ? 'Edit Education' : 'Add Education'}
      description="Add your university, college, or academic degrees."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="School / University *"
          placeholder="e.g. LUMS, NUST, or FAST-NUCES"
          {...register('school_name')}
          error={errors.school_name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Degree"
            placeholder="e.g. Bachelor's Degree"
            {...register('degree')}
          />
          <Input
            label="Field of Study"
            placeholder="e.g. Computer Science"
            {...register('field_of_study')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Start Year *"
            type="number"
            {...register('start_year', { valueAsNumber: true })}
            error={errors.start_year?.message}
          />
          <Input
            label="End Year"
            type="number"
            {...register('end_year', { valueAsNumber: true })}
          />
          <Input
            label="Grade / GPA"
            placeholder="e.g. 3.9 GPA"
            {...register('grade')}
          />
        </div>

        <Input
          label="Activities & Societies"
          placeholder="e.g. Debate Club, ACM Chapter, Varsity Athletics"
          {...register('activities')}
        />

        <div>
          <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Highlights, coursework, thesis, or awards..."
            {...register('description')}
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {education && onDelete ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onDelete(education.id);
                onClose();
              }}
            >
              Delete Education
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
