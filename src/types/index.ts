export type UserRole = 'candidate' | 'recruiter' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface OpenToWorkDetails {
  roles: string[];
  locations: string[];
  jobTypes: string[];
  visibility: 'all_members' | 'recruiters_only';
}

export interface ProfileSettings {
  theme: 'light' | 'dark' | 'system';
  profileVisibility: 'public' | 'connections' | 'private';
  whoCanMessage: 'anyone' | 'connections';
  whoCanSeeConnections: 'anyone' | 'connections' | 'only_me';
  emailNotifications: boolean;
  jobAlerts: boolean;
  locale?: string;
  currency?: string;
  timezone?: string;
  blockedUsers?: string[];
}

export interface Profile {
  id: string;
  handle: string;
  email: string;
  first_name: string;
  last_name: string;
  headline?: string;
  about?: string;
  location?: string;
  phone?: string;
  website?: string;
  github_url?: string;
  twitter_url?: string;
  avatar_url?: string;
  banner_url?: string;
  role: UserRole;
  verified: boolean;
  status: UserStatus;
  open_to_work: boolean;
  open_to_hiring: boolean;
  open_to_work_details?: OpenToWorkDetails;
  completeness_score: number;
  profile_views_count: number;
  connections_count: number;
  followers_count: number;
  following_count: number;
  experiences?: Experience[];
  educations?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
  settings: ProfileSettings;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  profile_id: string;
  title: string;
  company_name: string;
  company_id?: string;
  location?: string;
  work_mode?: 'remote' | 'hybrid' | 'onsite';
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  profile_id: string;
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_year: number;
  end_year?: number;
  grade?: string;
  activities?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  endorsements_count: number;
  is_endorsed_by_viewer?: boolean;
}

export interface Project {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  skills?: string[];
}

export interface Certification {
  id: string;
  profile_id: string;
  name: string;
  issuing_org: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Language {
  id: string;
  profile_id: string;
  name: string;
  proficiency: 'elementary' | 'limited_working' | 'professional_working' | 'full_professional' | 'native_bilingual';
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  partner?: Profile;
}

export type ReactionType = 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny';

export interface ReactionCountMap {
  like: number;
  celebrate: number;
  support: number;
  love: number;
  insightful: number;
  funny: number;
}

export type PostKind = 'text' | 'image' | 'video' | 'document' | 'poll' | 'article';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  total_votes: number;
  user_voted_option_id?: string;
  ends_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author?: Profile;
  company_id?: string;
  company?: Company;
  body: string;
  kind: PostKind;
  media?: {
    urls: string[];
    thumbnail?: string;
    aspectRatio?: string;
    documentUrl?: string;
    documentTitle?: string;
  };
  poll?: PollData;
  visibility: 'public' | 'connections';
  repost_of?: string;
  repost_original?: Post;
  repost_comment?: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  viewer_reaction?: ReactionType;
  viewer_has_saved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author?: Profile;
  parent_id?: string;
  body: string;
  likes_count: number;
  viewer_has_liked?: boolean;
  replies?: Comment[];
  created_at: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  about?: string;
  logo_url?: string;
  banner_url?: string;
  industry: string;
  size: string;
  website?: string;
  hq?: string;
  founded?: number;
  specialties?: string[];
  verified: boolean;
  followers_count: number;
  is_following?: boolean;
  status: 'active' | 'suspended';
  created_at: string;
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'director' | 'executive';

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'text' | 'yes_no' | 'number';
  required: boolean;
  ideal_answer?: string;
}

export interface Job {
  id: string;
  company_id?: string;
  company?: Company;
  posted_by: string;
  title: string;
  description: string;
  location: string;
  work_mode: WorkMode;
  type: JobType;
  experience_level: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: 'monthly' | 'yearly';
  skills: string[];
  screening_questions?: ScreeningQuestion[];
  apply_url?: string;
  source_name?: string;
  is_external?: boolean;
  featured?: boolean;
  status: 'draft' | 'pending_review' | 'open' | 'paused' | 'closed';
  applicants_count: number;
  views_count: number;
  viewer_has_saved?: boolean;
  viewer_has_applied?: boolean;
  match_score?: number;
  created_at: string;
  expires_at?: string;
}

export type ApplicationStatus =
  | 'applied'
  | 'in_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  job_id: string;
  job?: Job;
  applicant_id: string;
  applicant?: Profile;
  resume_id?: string;
  resume_name?: string;
  resume_url?: string;
  phone?: string;
  email?: string;
  cover_note?: string;
  answers?: Record<string, string>;
  status: ApplicationStatus;
  status_timeline: {
    status: ApplicationStatus;
    timestamp: string;
    note?: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface JobAlertRule {
  id: string;
  keyword: string;
  location: string;
  work_mode: 'all' | WorkMode;
  min_salary_pkr?: number;
  frequency: 'daily' | 'instant' | 'weekly';
  enabled: boolean;
  created_at: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: 'image' | 'pdf';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  body: string;
  attachments?: ChatAttachment[];
  read_by: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  participants: Profile[];
  is_request?: boolean;
  request_status?: 'pending' | 'accepted' | 'declined';
  requested_by?: string;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

export type NotificationType =
  | 'reaction'
  | 'comment'
  | 'reply'
  | 'repost'
  | 'mention'
  | 'connection_request'
  | 'connection_accepted'
  | 'message'
  | 'profile_view'
  | 'application_status'
  | 'job_alert'
  | 'verification_result'
  | 'system_announcement';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id?: string;
  actor?: Profile;
  type: NotificationType;
  title: string;
  body: string;
  entity_type?: 'post' | 'job' | 'profile' | 'application';
  entity_id?: string;
  read: boolean;
  created_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  readers_count?: number;
  is_announcement?: boolean;
}

export interface VerificationRequest {
  id: string;
  entity_type: 'recruiter' | 'company';
  requester_id: string;
  requester_name: string;
  requester_handle: string;
  company_name: string;
  work_email: string;
  registration_number?: string; // SECP / NTN / PSEB registration
  evidence_note: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ContentReport {
  id: string;
  target_type: 'post' | 'job' | 'user';
  target_id: string;
  target_preview: string;
  author_name: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved_removed' | 'dismissed';
  created_at: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning';
  link_url?: string;
  link_label?: string;
  active: boolean;
  created_by: string;
  created_at: string;
}

export interface FeatureFlags {
  enable_easy_apply: boolean;
  enable_external_jsearch: boolean;
  enable_realtime_chat: boolean;
  enable_resume_ai: boolean;
  enable_open_to_work_badges: boolean;
}

export interface AuditLogEntry {
  id: string;
  index: number;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: 'user' | 'company' | 'job' | 'post' | 'system' | 'verification';
  target_id: string;
  summary: string;
  timestamp: string;
  prev_hash: string;
  hash: string;
}

export type ResumeTemplateId = 'classic' | 'modern' | 'compact';

export interface ResumeDocument {
  id: string;
  title: string;
  template: ResumeTemplateId;
  target_role: string;
  personal: {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
  };
  summary: string;
  experiences: {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
  educations: {
    id: string;
    school: string;
    degree: string;
    year: string;
    grade: string;
  }[];
  skills: string[];
  projects: {
    id: string;
    name: string;
    link: string;
    description: string;
  }[];
  certifications: string[];
  updated_at: string;
}

export type AdminTier =
  | 'super_admin'
  | 'trust_safety_admin'
  | 'recruiter_ops_admin'
  | 'content_moderator';

export type AdminPermissionScope =
  | 'users:moderate'
  | 'roles:assign'
  | 'verifications:review'
  | 'companies:govern'
  | 'posts:moderate'
  | 'jobs:moderate'
  | 'announcements:manage'
  | 'flags:manage'
  | 'security:policies'
  | 'audit:export';

export interface AdminOperatorGrant {
  user_id: string;
  tier: AdminTier;
  custom_granted: AdminPermissionScope[];
  custom_revoked: AdminPermissionScope[];
  updated_by: string;
  updated_at: string;
}

export interface SystemPolicies {
  require_secp_for_jobs: boolean;
  require_salary_range_pkr: boolean;
  auto_quarantine_flagged_posts: boolean;
  allow_new_registrations: boolean;
  maintenance_read_only: boolean;
  max_daily_outreach_per_recruiter: number;
  session_timeout_minutes: number;
}

export interface CandidateEvaluation {
  application_id: string;
  technical_score: number;
  system_design_score: number;
  communication_score: number;
  recommendation: 'strong_hire' | 'hire' | 'lean_no' | 'no_hire';
  notes: {
    id: string;
    author: string;
    text: string;
    created_at: string;
  }[];
  updated_at: string;
}

export interface InterviewRecord {
  id: string;
  application_id: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: 'video' | 'onsite' | 'phone';
  round: 'screening' | 'technical' | 'system_design' | 'executive';
  panelist: string;
  location_or_link: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface OfferRecord {
  id: string;
  application_id: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  base_monthly_pkr: number;
  signing_bonus_pkr: number;
  equity_notes?: string;
  joining_date: string;
  work_mode: WorkMode;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  created_at: string;
}

export type TalentPoolCategory =
  | 'Shortlisted'
  | 'Frontend Guild'
  | 'Backend & Cloud'
  | 'Leadership';

export interface TalentPoolItem {
  id: string;
  candidate_id: string;
  pool_name: TalentPoolCategory;
  note?: string;
  saved_by: string;
  created_at: string;
}

