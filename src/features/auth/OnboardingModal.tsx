import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/clerk/useAuth';
import { UserRole } from '../../types';
import { Briefcase, UserCheck, Sparkles, Plus, X, Check } from 'lucide-react';

const onboardingSchema = z.object({
  role: z.enum(['candidate', 'recruiter']),
  headline: z.string().min(3, 'Headline must be at least 3 characters').max(120),
  location: z.string().min(2, 'Please enter a valid city or region'),
  skills: z.array(z.string()).min(1, 'Please select at least 1 primary skill'),
  open_to_work: z.boolean(),
  open_to_hiring: z.boolean(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Next.js',
  'Python',
  'PostgreSQL',
  'Tailwind CSS',
  'AWS',
  'Docker',
  'GraphQL',
  'Figma',
  'Product Management',
  'Distributed Systems',
];

export const OnboardingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customSkill, setCustomSkill] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: profile?.role === 'recruiter' ? 'recruiter' : 'candidate',
      headline: profile?.headline || 'Software Engineer looking for high-impact opportunities in Pakistan',
      location: profile?.location || 'Lahore, Punjab, Pakistan',
      skills: ['React', 'TypeScript', 'Node.js'],
      open_to_work: true,
      open_to_hiring: false,
    },
  });

  const selectedRole = watch('role');
  const selectedSkills = watch('skills') || [];

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setValue(
        'skills',
        selectedSkills.filter((s) => s !== skill),
        { shouldValidate: true }
      );
    } else {
      setValue('skills', [...selectedSkills, skill], { shouldValidate: true });
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setValue('skills', [...selectedSkills, trimmed], { shouldValidate: true });
      setCustomSkill('');
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    completeOnboarding({
      role: data.role as UserRole,
      headline: data.headline,
      location: data.location,
      skills: data.skills,
      open_to_work: data.open_to_work,
      open_to_hiring: data.open_to_hiring,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to NextStep!"
      description={`Step ${step} of 3: Set up your professional identity`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1: Select Role */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              How do you plan to use NextStep primarily?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Candidate Box */}
              <div
                onClick={() => {
                  setValue('role', 'candidate');
                  setValue('open_to_work', true);
                  setValue('open_to_hiring', false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'candidate'
                    ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#0A66C2] dark:text-[#71B7FB] flex items-center justify-center mb-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  Job Seeker / Candidate
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Discover career opportunities, build ATS resumes, and connect with top recruiters.
                </p>
              </div>

              {/* Recruiter Box */}
              <div
                onClick={() => {
                  setValue('role', 'recruiter');
                  setValue('open_to_work', false);
                  setValue('open_to_hiring', true);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'recruiter'
                    ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  Recruiter / Hiring Manager
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Post jobs, manage candidate pipelines, and source top verified talent.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Headline & Location */}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label="Professional Headline"
              hint="e.g. Senior Software Engineer | React, Node.js"
              {...register('headline')}
              error={errors.headline?.message}
            />

            <Input
              label="Location (City, Province, Pakistan)"
              hint="e.g. Lahore, Karachi, Islamabad, or Remote (Pakistan)"
              {...register('location')}
              error={errors.location?.message}
            />

            <div className="pt-2">
              {selectedRole === 'candidate' ? (
                <label className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#057642] rounded focus:ring-0"
                    {...register('open_to_work')}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#057642] dark:text-[#34A853]">
                      Show #OpenToWork badge on profile
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Let recruiters know you are actively looking for roles.
                    </p>
                  </div>
                </label>
              ) : (
                <label className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 rounded focus:ring-0"
                    {...register('open_to_hiring')}
                  />
                  <div>
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      Show #Hiring badge on profile
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Promote that your team has open positions.
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Next: Add Skills
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Skills & Expertise */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-900 dark:text-white block mb-1">
                Select Your Core Skills
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Skills power job matching and profile recommendations.
              </p>

              {/* Suggested Skills pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#0A66C2] text-white dark:bg-[#71B7FB] dark:text-gray-900'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {skill}
                    </button>
                  );
                })}
              </div>

              {/* Custom skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. Kubernetes, Rust)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomSkill}
                >
                  Add
                </Button>
              </div>

              {errors.skills && (
                <p className="text-xs text-[#CC1016] mt-1">{errors.skills.message}</p>
              )}
            </div>

            {/* Selected skills summary */}
            {selectedSkills.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Selected Skills ({selectedSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(s)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="submit"
                leftIcon={<Sparkles className="w-4 h-4 text-yellow-300" />}
              >
                Complete Onboarding
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
