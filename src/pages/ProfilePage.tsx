import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DEMO_PROFILES } from '../lib/seed/demoData';
import { useAuth } from '../lib/clerk/useAuth';
import { useMessaging } from '../lib/messagingStore';
import { useRecruiterStore } from '../lib/recruiterStore';
import { calculateProfileCompleteness } from '../features/profile/completeness';
import { MediaUploadModal } from '../features/profile/MediaUploadModal';
import { EditIntroModal } from '../features/profile/EditIntroModal';
import { OpenToWorkModal } from '../features/profile/OpenToWorkModal';
import { EditAboutModal } from '../features/profile/EditAboutModal';
import { ExperienceModal } from '../features/profile/ExperienceModal';
import { EducationModal } from '../features/profile/EducationModal';
import { CertificationModal } from '../features/profile/CertificationModal';
import { ProjectModal } from '../features/profile/ProjectModal';
import { LanguageModal } from '../features/profile/LanguageModal';
import { SkillModal } from '../features/profile/SkillModal';
import { ContactInfoModal } from '../features/profile/ContactInfoModal';
import { ProfileViewsModal } from '../features/profile/ProfileViewsModal';
import {
  Profile,
  Experience,
  Education,
  Certification,
  Project,
  Language,
  Skill,
  OpenToWorkDetails,
} from '../types';
import {
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  Edit3,
  Plus,
  Share2,
  CheckCircle,
  ThumbsUp,
  Camera,
  ExternalLink,
  Award,
  Code2,
  Languages,
  Eye,
  Check,
  UserPlus,
  UserCheck,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Globe,
  Bookmark,
  Briefcase,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { profile: currentAuthProfile, updateProfile, isVerifiedRecruiter, isAdmin } = useAuth();
  const { startOrOpenConversation } = useMessaging();
  const { talentPool, saveToTalentPool, removeFromTalentPool } = useRecruiterStore();

  const normalizedHandle = (handle || '').toLowerCase().replace(/-/g, '');
  const resolveTargetProfile = () =>
    DEMO_PROFILES.find(
      (p) =>
        p.handle.toLowerCase() === (handle || '').toLowerCase() ||
        p.handle.toLowerCase().replace(/-/g, '') === normalizedHandle
    ) ||
    (currentAuthProfile &&
    (currentAuthProfile.handle.toLowerCase() === (handle || '').toLowerCase() ||
      currentAuthProfile.handle.toLowerCase().replace(/-/g, '') === normalizedHandle)
      ? currentAuthProfile
      : null) ||
    currentAuthProfile ||
    DEMO_PROFILES[0];

  const [profile, setProfile] = useState<Profile>(resolveTargetProfile);

  useEffect(() => {
    setProfile(resolveTargetProfile());
  }, [handle, currentAuthProfile?.id]);

  const isActualOwner = currentAuthProfile?.id === profile.id;
  const [isPreviewPublic, setIsPreviewPublic] = useState(false);
  const isOwner = isActualOwner && !isPreviewPublic;

  // Connection and follow state for visitor viewing
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isFollowing, setIsFollowing] = useState(false);

  // Modals state
  const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; type: 'avatar' | 'banner' }>({
    isOpen: false,
    type: 'avatar',
  });
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isOpenToWorkOpen, setIsOpenToWorkOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isViewsOpen, setIsViewsOpen] = useState(false);

  // Sub-sections edit modals
  const [editingExp, setEditingExp] = useState<{ isOpen: boolean; exp?: Experience | null }>({
    isOpen: false,
  });
  const [editingEdu, setEditingEdu] = useState<{ isOpen: boolean; edu?: Education | null }>({
    isOpen: false,
  });
  const [editingCert, setEditingCert] = useState<{ isOpen: boolean; cert?: Certification | null }>({
    isOpen: false,
  });
  const [editingProj, setEditingProj] = useState<{ isOpen: boolean; proj?: Project | null }>({
    isOpen: false,
  });
  const [editingLang, setEditingLang] = useState<{ isOpen: boolean; lang?: Language | null }>({
    isOpen: false,
  });
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  // Completeness score
  const completeness = calculateProfileCompleteness(profile);

  // Handlers for profile updates
  const handleUpdate = (updates: Partial<Profile>) => {
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);
    if (isActualOwner) {
      updateProfile(updates);
    }
    toast.success('Profile updated');
  };

  // Sub-section mutation handlers
  const handleSaveExperience = (expData: Omit<Experience, 'id' | 'profile_id'> & { id?: string }) => {
    const currentList = profile.experiences || [];
    let updatedList: Experience[];

    if (expData.id) {
      updatedList = currentList.map((item) =>
        item.id === expData.id ? { ...item, ...expData, id: expData.id, profile_id: profile.id } : item
      );
    } else {
      const newEntry: Experience = {
        id: `exp_${Date.now()}`,
        profile_id: profile.id,
        ...expData,
      };
      updatedList = [newEntry, ...currentList];
    }

    handleUpdate({ experiences: updatedList });
  };

  const handleDeleteExperience = (expId: string) => {
    const updatedList = (profile.experiences || []).filter((e) => e.id !== expId);
    handleUpdate({ experiences: updatedList });
    toast.info('Experience removed');
  };

  const handleSaveEducation = (eduData: Omit<Education, 'id' | 'profile_id'> & { id?: string }) => {
    const currentList = profile.educations || [];
    let updatedList: Education[];

    if (eduData.id) {
      updatedList = currentList.map((item) =>
        item.id === eduData.id ? { ...item, ...eduData, id: eduData.id, profile_id: profile.id } : item
      );
    } else {
      const newEntry: Education = {
        id: `edu_${Date.now()}`,
        profile_id: profile.id,
        ...eduData,
      };
      updatedList = [newEntry, ...currentList];
    }

    handleUpdate({ educations: updatedList });
  };

  const handleDeleteEducation = (eduId: string) => {
    const updatedList = (profile.educations || []).filter((e) => e.id !== eduId);
    handleUpdate({ educations: updatedList });
    toast.info('Education removed');
  };

  const handleSaveCertification = (certData: Omit<Certification, 'id' | 'profile_id'> & { id?: string }) => {
    const currentList = profile.certifications || [];
    let updatedList: Certification[];

    if (certData.id) {
      updatedList = currentList.map((item) =>
        item.id === certData.id ? { ...item, ...certData, id: certData.id, profile_id: profile.id } : item
      );
    } else {
      const newEntry: Certification = {
        id: `cert_${Date.now()}`,
        profile_id: profile.id,
        ...certData,
      };
      updatedList = [newEntry, ...currentList];
    }

    handleUpdate({ certifications: updatedList });
  };

  const handleDeleteCertification = (certId: string) => {
    const updatedList = (profile.certifications || []).filter((c) => c.id !== certId);
    handleUpdate({ certifications: updatedList });
    toast.info('Certification removed');
  };

  const handleSaveProject = (projData: Omit<Project, 'id' | 'profile_id'> & { id?: string }) => {
    const currentList = profile.projects || [];
    let updatedList: Project[];

    if (projData.id) {
      updatedList = currentList.map((item) =>
        item.id === projData.id ? { ...item, ...projData, id: projData.id, profile_id: profile.id } : item
      );
    } else {
      const newEntry: Project = {
        id: `proj_${Date.now()}`,
        profile_id: profile.id,
        ...projData,
      };
      updatedList = [newEntry, ...currentList];
    }

    handleUpdate({ projects: updatedList });
  };

  const handleDeleteProject = (projId: string) => {
    const updatedList = (profile.projects || []).filter((p) => p.id !== projId);
    handleUpdate({ projects: updatedList });
    toast.info('Project removed');
  };

  const handleSaveLanguage = (langData: Omit<Language, 'id' | 'profile_id'> & { id?: string }) => {
    const currentList = profile.languages || [];
    let updatedList: Language[];

    if (langData.id) {
      updatedList = currentList.map((item) =>
        item.id === langData.id ? { ...item, ...langData, id: langData.id, profile_id: profile.id } : item
      );
    } else {
      const newEntry: Language = {
        id: `lang_${Date.now()}`,
        profile_id: profile.id,
        ...langData,
      };
      updatedList = [newEntry, ...currentList];
    }

    handleUpdate({ languages: updatedList });
  };

  const handleDeleteLanguage = (langId: string) => {
    const updatedList = (profile.languages || []).filter((l) => l.id !== langId);
    handleUpdate({ languages: updatedList });
    toast.info('Language removed');
  };

  const handleAddSkill = (skillName: string, category: string = 'General') => {
    const currentSkills = profile.skills || [];
    if (currentSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      toast.info('Skill already on your profile');
      return;
    }
    const newSkill: Skill = {
      id: `sk_${Date.now()}`,
      name: skillName,
      category,
      endorsements_count: 0,
      is_endorsed_by_viewer: false,
    };
    handleUpdate({ skills: [...currentSkills, newSkill] });
    toast.success(`Added ${skillName}`);
  };

  const handleDeleteSkill = (skillId: string) => {
    const updatedSkills = (profile.skills || []).filter((s) => s.id !== skillId);
    handleUpdate({ skills: updatedSkills });
    toast.info('Skill removed');
  };

  const handleToggleEndorsement = (skillId: string) => {
    const updatedSkills = (profile.skills || []).map((s) => {
      if (s.id === skillId) {
        const endorsed = !s.is_endorsed_by_viewer;
        return {
          ...s,
          is_endorsed_by_viewer: endorsed,
          endorsements_count: endorsed ? s.endorsements_count + 1 : Math.max(0, s.endorsements_count - 1),
        };
      }
      return s;
    });
    handleUpdate({ skills: updatedSkills });
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/in/${profile.handle}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile URL copied to clipboard');
  };

  return (
    <Shell hideLeftRail>
      <div className="space-y-4">
        {/* Public Preview Alert banner if toggled */}
        {isActualOwner && isPreviewPublic && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Previewing your profile as viewed by the public and recruiters.
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsPreviewPublic(false)}
            >
              Exit Public View
            </Button>
          </div>
        )}

        {/* 1. Header Card */}
        <Card padding="none" className="overflow-hidden">
          {/* Banner */}
          <div
            className="h-36 sm:h-52 w-full bg-cover bg-center bg-[#0A66C2]/20 relative"
            style={{
              backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
            }}
          >
            {isOwner && (
              <button
                onClick={() => setMediaModal({ isOpen: true, type: 'banner' })}
                title="Edit banner image"
                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-black/70 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white cursor-pointer shadow-md transition-all"
              >
                <Camera className="w-4 h-4 text-[#0A66C2]" />
              </button>
            )}
          </div>

          {/* Details below banner */}
          <div className="px-6 pb-6 relative">
            {/* Avatar overlapping banner */}
            <div className="-mt-16 sm:-mt-24 mb-3 flex items-end justify-between">
              <div className="relative group">
                <Avatar
                  name={`${profile.first_name} ${profile.last_name}`}
                  src={profile.avatar_url}
                  size="2xl"
                  verified={profile.verified}
                  openToWork={profile.open_to_work}
                  openToHiring={profile.open_to_hiring}
                  className="ring-4 ring-white dark:ring-[#1B1F23] shadow-md"
                />
                {isOwner && (
                  <button
                    onClick={() => setMediaModal({ isOpen: true, type: 'avatar' })}
                    title="Change profile photo"
                    className="absolute bottom-1 right-1 p-2 bg-white dark:bg-gray-800 text-[#0A66C2] rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsIntroOpen(true)}
                  aria-label="Edit intro"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer"
                >
                  <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </div>

            {/* Name, Headline & Metadata */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.first_name} {profile.last_name}
                </h1>
                {profile.verified && (
                  <Badge variant="primary" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Verified
                  </Badge>
                )}
              </div>

              <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-snug max-w-2xl">
                {profile.headline}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {profile.location || 'Location not specified'}
                </span>
                <span>•</span>
                <button
                  onClick={() => setIsContactOpen(true)}
                  className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  Contact info
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsViewsOpen(true)}
                  className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                >
                  {profile.connections_count} connections
                </button>
              </div>
            </div>

            {/* Open to Work Card */}
            {profile.open_to_work && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#057642] dark:text-[#34A853]" />
                  <div>
                    <p className="text-xs font-bold text-[#057642] dark:text-[#34A853]">
                      Open to work
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {profile.open_to_work_details?.roles?.join(', ') || 'Software Engineer roles'}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setIsOpenToWorkOpen(true)}
                    className="text-xs text-[#057642] dark:text-[#34A853] font-semibold hover:underline cursor-pointer"
                  >
                    Edit preferences
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-2">
              {isOwner ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsOpenToWorkOpen(true)}
                  >
                    Open to
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsIntroOpen(true)}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setIsPreviewPublic(!isPreviewPublic)}
                  >
                    View as public
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={handleShareProfile}
                  >
                    Share link
                  </Button>
                  {(isVerifiedRecruiter || isAdmin) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Briefcase className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/recruiter')}
                    >
                      Recruiter Suite
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Shield className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/admin')}
                    >
                      Admin Console
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {connectionStatus === 'connected' ? (
                    <Button variant="secondary" size="sm" leftIcon={<UserCheck className="w-4 h-4" />}>
                      Connected
                    </Button>
                  ) : connectionStatus === 'pending' ? (
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => setConnectionStatus('none')}
                    >
                      Pending (Withdraw)
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      onClick={() => {
                        setConnectionStatus('pending');
                        toast.success('Connection request sent');
                      }}
                    >
                      Connect
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    onClick={() => {
                      startOrOpenConversation(profile);
                      navigate('/messaging');
                    }}
                  >
                    Message
                  </Button>

                  {(isVerifiedRecruiter || isAdmin) && (() => {
                    const savedEntry = talentPool.find((item) => item.candidate_id === profile.id);
                    return (
                      <Button
                        variant={savedEntry ? 'tertiary' : 'secondary'}
                        size="sm"
                        leftIcon={<Bookmark className="w-3.5 h-3.5" />}
                        onClick={() => {
                          if (savedEntry) {
                            removeFromTalentPool(profile.id);
                            toast.info(`Removed ${profile.first_name} from Talent Pool`);
                          } else {
                            saveToTalentPool({
                              candidate_id: profile.id,
                              pool_name: 'Shortlisted',
                              note: `Saved directly from @${profile.handle} profile`,
                              saved_by: currentAuthProfile
                                ? `${currentAuthProfile.first_name} ${currentAuthProfile.last_name}`
                                : 'Recruiter',
                            });
                            toast.success(`Saved ${profile.first_name} to Recruiter Talent Pool`);
                          }
                        }}
                      >
                        {savedEntry ? `In Pool (${savedEntry.pool_name})` : 'Save to Talent Pool'}
                      </Button>
                    );
                  })()}

                  {isAdmin && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      leftIcon={<Shield className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/admin?tab=users')}
                    >
                      Govern User
                    </Button>
                  )}

                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      setIsFollowing(!isFollowing);
                      toast.info(isFollowing ? 'Unfollowed' : 'Following');
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>

                  <Button
                    variant="tertiary"
                    size="sm"
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={handleShareProfile}
                  >
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* 2. Interactive Profile Completeness Meter (Owner Only) */}
        {isOwner && (
          <Card padding="md" className="border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0A66C2]" />
                Profile Strength • {completeness.score >= 90 ? 'All-Star' : completeness.score >= 60 ? 'Intermediate' : 'Beginner'}
              </span>
              <span className="text-xs font-bold text-[#0A66C2]">
                {completeness.score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-[#0A66C2] h-full rounded-full transition-all duration-500"
                style={{ width: `${completeness.score}%` }}
              />
            </div>

            {/* Checklist recommendations */}
            {completeness.missingCount > 0 ? (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 font-medium">
                  Complete these sections to boost profile discovery by recruiters:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {completeness.items.filter((i) => !i.completed).map((item) => (
                    <div
                      key={item.key}
                      className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-850"
                    >
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {item.label} (+{item.weight}%)
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => {
                          if (item.key === 'avatar') setMediaModal({ isOpen: true, type: 'avatar' });
                          else if (item.key === 'about') setIsAboutOpen(true);
                          else if (item.key === 'experience') setEditingExp({ isOpen: true });
                          else if (item.key === 'education') setEditingEdu({ isOpen: true });
                          else if (item.key === 'skills') setIsSkillOpen(true);
                          else if (item.key === 'project_or_cert') setEditingProj({ isOpen: true });
                          else setIsIntroOpen(true);
                        }}
                      >
                        {item.actionText}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Outstanding! Your profile is 100% complete.
              </p>
            )}
          </Card>
        )}

        {/* 3. About Section Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              About
            </h2>
            {isOwner && (
              <button
                onClick={() => setIsAboutOpen(true)}
                title="Edit About"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {profile.about ||
              'No summary provided yet. Add an about section to highlight your key achievements and passion.'}
          </p>
        </Card>

        {/* 4. Experience Section Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Experience
            </h2>
            {isOwner && (
              <button
                onClick={() => setEditingExp({ isOpen: true })}
                title="Add experience"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(profile.experiences && profile.experiences.length > 0) ? (
              profile.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-none last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded bg-blue-100 dark:bg-blue-950/60 text-[#0A66C2] flex items-center justify-center shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {exp.company_name} • <span className="capitalize">{exp.work_mode}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date} {exp.location ? `• ${exp.location}` : ''}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 pt-2 leading-relaxed whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setEditingExp({ isOpen: true, exp })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No experience records added yet.</p>
            )}
          </div>
        </Card>

        {/* 5. Education Section Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Education
            </h2>
            {isOwner && (
              <button
                onClick={() => setEditingEdu({ isOpen: true })}
                title="Add education"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(profile.educations && profile.educations.length > 0) ? (
              profile.educations.map((edu) => (
                <div
                  key={edu.id}
                  className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-none last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        {edu.school_name}
                      </h3>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {edu.start_year} – {edu.end_year || 'Present'} {edu.grade ? `• Grade: ${edu.grade}` : ''}
                      </p>
                      {edu.activities && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 pt-1">
                          Activities: {edu.activities}
                        </p>
                      )}
                      {edu.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 pt-1 leading-relaxed">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setEditingEdu({ isOpen: true, edu })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No education records added yet.</p>
            )}
          </div>
        </Card>

        {/* 6. Skills & Endorsements Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Skills &amp; Endorsements
            </h2>
            {isOwner && (
              <button
                onClick={() => setIsSkillOpen(true)}
                title="Add skill"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(profile.skills && profile.skills.length > 0) ? (
              profile.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-none"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {skill.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {skill.endorsements_count} endorsements
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isOwner ? (
                      <Button
                        variant={skill.is_endorsed_by_viewer ? 'primary' : 'secondary'}
                        size="sm"
                        className="h-8 text-xs"
                        leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}
                        onClick={() => handleToggleEndorsement(skill.id)}
                      >
                        {skill.is_endorsed_by_viewer ? 'Endorsed' : 'Endorse'}
                      </Button>
                    ) : (
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-xs text-gray-400 hover:text-red-600 cursor-pointer p-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No skills added yet.</p>
            )}
          </div>
        </Card>

        {/* 7. Licenses & Certifications Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Licenses &amp; Certifications
            </h2>
            {isOwner && (
              <button
                onClick={() => setEditingCert({ isOpen: true })}
                title="Add certification"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(profile.certifications && profile.certifications.length > 0) ? (
              profile.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-none last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {cert.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {cert.issuing_org}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Issued {cert.issue_date} {cert.credential_id ? `• Credential ID: ${cert.credential_id}` : ''}
                      </p>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#0A66C2] dark:text-[#71B7FB] hover:underline mt-1"
                        >
                          <span>Show credential</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setEditingCert({ isOpen: true, cert })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No certifications added yet.</p>
            )}
          </div>
        </Card>

        {/* 8. Projects Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Projects
            </h2>
            {isOwner && (
              <button
                onClick={() => setEditingProj({ isOpen: true })}
                title="Add project"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(profile.projects && profile.projects.length > 0) ? (
              profile.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-none last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {proj.title}
                        </h4>
                        {proj.url && (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-[#0A66C2]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 pt-1 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                      {proj.skills && proj.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setEditingProj({ isOpen: true, proj })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No projects listed yet.</p>
            )}
          </div>
        </Card>

        {/* 9. Languages Card */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Languages
            </h2>
            {isOwner && (
              <button
                onClick={() => setEditingLang({ isOpen: true })}
                title="Add language"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(profile.languages && profile.languages.length > 0) ? (
              profile.languages.map((lang) => (
                <div key={lang.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {lang.name}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {lang.proficiency.replace('_', ' ')}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setEditingLang({ isOpen: true, lang })}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No languages added yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Media Upload Modal */}
      {mediaModal.isOpen && (
        <MediaUploadModal
          isOpen={mediaModal.isOpen}
          onClose={() => setMediaModal({ ...mediaModal, isOpen: false })}
          type={mediaModal.type}
          currentUrl={mediaModal.type === 'avatar' ? profile.avatar_url : profile.banner_url}
          onSave={(url) => {
            if (mediaModal.type === 'avatar') handleUpdate({ avatar_url: url });
            else handleUpdate({ banner_url: url });
          }}
        />
      )}

      {/* Edit Intro Modal */}
      {isIntroOpen && (
        <EditIntroModal
          isOpen={isIntroOpen}
          onClose={() => setIsIntroOpen(false)}
          profile={profile}
          onSave={handleUpdate}
        />
      )}

      {/* Open to Work Modal */}
      {isOpenToWorkOpen && (
        <OpenToWorkModal
          isOpen={isOpenToWorkOpen}
          onClose={() => setIsOpenToWorkOpen(false)}
          profile={profile}
          onSave={(open_to_work, open_to_work_details) =>
            handleUpdate({ open_to_work, open_to_work_details })
          }
        />
      )}

      {/* Edit About Modal */}
      {isAboutOpen && (
        <EditAboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          initialAbout={profile.about}
          onSave={(about) => handleUpdate({ about })}
        />
      )}

      {/* Experience Modal */}
      {editingExp.isOpen && (
        <ExperienceModal
          isOpen={editingExp.isOpen}
          onClose={() => setEditingExp({ isOpen: false, exp: null })}
          experience={editingExp.exp}
          onSave={handleSaveExperience}
          onDelete={handleDeleteExperience}
        />
      )}

      {/* Education Modal */}
      {editingEdu.isOpen && (
        <EducationModal
          isOpen={editingEdu.isOpen}
          onClose={() => setEditingEdu({ isOpen: false, edu: null })}
          education={editingEdu.edu}
          onSave={handleSaveEducation}
          onDelete={handleDeleteEducation}
        />
      )}

      {/* Certification Modal */}
      {editingCert.isOpen && (
        <CertificationModal
          isOpen={editingCert.isOpen}
          onClose={() => setEditingCert({ isOpen: false, cert: null })}
          certification={editingCert.cert}
          onSave={handleSaveCertification}
          onDelete={handleDeleteCertification}
        />
      )}

      {/* Project Modal */}
      {editingProj.isOpen && (
        <ProjectModal
          isOpen={editingProj.isOpen}
          onClose={() => setEditingProj({ isOpen: false, proj: null })}
          project={editingProj.proj}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />
      )}

      {/* Language Modal */}
      {editingLang.isOpen && (
        <LanguageModal
          isOpen={editingLang.isOpen}
          onClose={() => setEditingLang({ isOpen: false, lang: null })}
          language={editingLang.lang}
          onSave={handleSaveLanguage}
          onDelete={handleDeleteLanguage}
        />
      )}

      {/* Skill Modal */}
      {isSkillOpen && (
        <SkillModal
          isOpen={isSkillOpen}
          onClose={() => setIsSkillOpen(false)}
          existingSkillNames={(profile.skills || []).map((s) => s.name)}
          onAddSkill={handleAddSkill}
        />
      )}

      {/* Contact Info Modal */}
      {isContactOpen && (
        <ContactInfoModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          profile={profile}
          isOwner={isOwner}
          onEditIntro={() => setIsIntroOpen(true)}
        />
      )}

      {/* Profile Views Modal */}
      {isViewsOpen && (
        <ProfileViewsModal
          isOpen={isViewsOpen}
          onClose={() => setIsViewsOpen(false)}
          viewsCount={profile.profile_views_count}
        />
      )}
    </Shell>
  );
};
