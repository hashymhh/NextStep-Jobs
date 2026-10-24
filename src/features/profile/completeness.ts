import { Profile } from '../../types';

export interface CompletenessItem {
  key: string;
  label: string;
  weight: number;
  completed: boolean;
  actionText: string;
}

export function calculateProfileCompleteness(profile: Profile): {
  score: number;
  items: CompletenessItem[];
  missingCount: number;
} {
  const items: CompletenessItem[] = [
    {
      key: 'avatar',
      label: 'Add a profile photo',
      weight: 15,
      completed: Boolean(profile.avatar_url && !profile.avatar_url.includes('placeholder')),
      actionText: 'Upload Photo',
    },
    {
      key: 'headline',
      label: 'Add your professional headline',
      weight: 10,
      completed: Boolean(profile.headline && profile.headline.trim().length >= 5),
      actionText: 'Edit Headline',
    },
    {
      key: 'location',
      label: 'Add your location',
      weight: 5,
      completed: Boolean(profile.location && profile.location.trim().length >= 2),
      actionText: 'Set Location',
    },
    {
      key: 'about',
      label: 'Write an About summary',
      weight: 15,
      completed: Boolean(profile.about && profile.about.trim().length >= 20),
      actionText: 'Add Summary',
    },
    {
      key: 'experience',
      label: 'Add your work experience',
      weight: 20,
      completed: Boolean(profile.experiences && profile.experiences.length > 0),
      actionText: 'Add Position',
    },
    {
      key: 'education',
      label: 'Add your education history',
      weight: 10,
      completed: Boolean(profile.educations && profile.educations.length > 0),
      actionText: 'Add School',
    },
    {
      key: 'skills',
      label: 'Add at least 3 core skills',
      weight: 15,
      completed: Boolean(profile.skills && profile.skills.length >= 3),
      actionText: 'Add Skills',
    },
    {
      key: 'project_or_cert',
      label: 'Add a project or certification',
      weight: 10,
      completed: Boolean(
        (profile.projects && profile.projects.length > 0) ||
        (profile.certifications && profile.certifications.length > 0)
      ),
      actionText: 'Add Credentials',
    },
  ];

  const score = items.reduce((acc, curr) => (curr.completed ? acc + curr.weight : acc), 0);
  const missingCount = items.filter((i) => !i.completed).length;

  return {
    score: Math.min(100, score),
    items,
    missingCount,
  };
}
