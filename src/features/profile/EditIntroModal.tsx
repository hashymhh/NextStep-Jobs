import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Profile } from '../../types';

const introSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  headline: z.string().min(3, 'Headline must be at least 3 characters').max(160),
  location: z.string().min(2, 'Location is required'),
  phone: z.string().optional(),
  website: z.string().url('Must be a valid URL (e.g. https://example.com)').or(z.literal('')).optional(),
  github_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  twitter_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type IntroFormData = z.infer<typeof introSchema>;

export interface EditIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (updates: Partial<Profile>) => void;
}

export const EditIntroModal: React.FC<EditIntroModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntroFormData>({
    resolver: zodResolver(introSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline || '',
      location: profile.location || '',
      phone: profile.phone || '',
      website: profile.website || '',
      github_url: profile.github_url || '',
      twitter_url: profile.twitter_url || '',
    },
  });

  const onSubmit = (data: IntroFormData) => {
    onSave({
      first_name: data.first_name,
      last_name: data.last_name,
      headline: data.headline,
      location: data.location,
      phone: data.phone,
      website: data.website,
      github_url: data.github_url,
      twitter_url: data.twitter_url,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Introduction"
      description="Tell other professionals who you are and where you are located."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name *"
            {...register('first_name')}
            error={errors.first_name?.message}
          />
          <Input
            label="Last Name *"
            {...register('last_name')}
            error={errors.last_name?.message}
          />
        </div>

        <Input
          label="Headline *"
          hint="Appear right below your name across searches and feed posts"
          {...register('headline')}
          error={errors.headline?.message}
        />

        <Input
          label="Location (City, Province, Country) *"
          placeholder="e.g. Lahore, Punjab, Pakistan or Karachi, Sindh, Pakistan"
          {...register('location')}
          error={errors.location?.message}
        />

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Contact Information
          </h4>
          <div className="space-y-3">
            <Input
              label="Phone Number"
              placeholder="+92 300 1234567"
              {...register('phone')}
            />
            <Input
              label="Portfolio / Personal Website"
              placeholder="https://yourportfolio.com"
              {...register('website')}
              error={errors.website?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="GitHub URL"
                placeholder="https://github.com/username"
                {...register('github_url')}
                error={errors.github_url?.message}
              />
              <Input
                label="X / Twitter URL"
                placeholder="https://x.com/username"
                {...register('twitter_url')}
                error={errors.twitter_url?.message}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" type="button" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
