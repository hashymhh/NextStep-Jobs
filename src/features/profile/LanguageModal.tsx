import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Language } from '../../types';
import { Trash2 } from 'lucide-react';

const langSchema = z.object({
  name: z.string().min(2, 'Language name is required'),
  proficiency: z.enum([
    'native_bilingual',
    'full_professional',
    'professional_working',
    'limited_working',
    'elementary',
  ]),
});

type LangFormData = z.infer<typeof langSchema>;

export interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language | null;
  onSave: (lang: Omit<Language, 'id' | 'profile_id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  language,
  onSave,
  onDelete,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LangFormData>({
    resolver: zodResolver(langSchema),
    defaultValues: {
      name: language?.name || '',
      proficiency: language?.proficiency || 'full_professional',
    },
  });

  const onSubmit = (data: LangFormData) => {
    onSave({
      id: language?.id,
      name: data.name,
      proficiency: data.proficiency,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language ? 'Edit Language' : 'Add Language'}
      description="Select languages you speak and your proficiency level."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Language *"
          placeholder="e.g. English, Spanish, Mandarin"
          {...register('name')}
          error={errors.name?.message}
        />

        <div>
          <label className="text-xs font-semibold text-[#191919] dark:text-gray-200 block mb-1">
            Proficiency *
          </label>
          <select
            {...register('proficiency')}
            className="w-full text-sm rounded-md border border-[#E0DFDC] dark:border-[#38434F] py-2 px-3 bg-white dark:bg-[#1B1F23]"
          >
            <option value="native_bilingual">Native or bilingual proficiency</option>
            <option value="full_professional">Full professional proficiency</option>
            <option value="professional_working">Professional working proficiency</option>
            <option value="limited_working">Limited working proficiency</option>
            <option value="elementary">Elementary proficiency</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {language && onDelete ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onDelete(language.id);
                onClose();
              }}
            >
              Delete
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
