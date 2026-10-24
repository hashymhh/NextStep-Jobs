-- ============================================================================
-- NEXTSTEP: ROW LEVEL SECURITY & AUTHORIZATION RULES
-- Authentication via Clerk integration: auth.jwt() ->> 'sub'
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SECURITY HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Check if current authenticated user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub')
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a verified recruiter
CREATE OR REPLACE FUNCTION public.is_verified_recruiter()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub')
      AND role = 'recruiter'
      AND verified = TRUE
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a member of the given company
CREATE OR REPLACE FUNCTION public.is_company_member(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = company_uuid
      AND profile_id = (auth.jwt() ->> 'sub')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Public read active profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (status != 'banned' OR public.is_admin());

-- Users can insert their own profile on registration
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  id = (auth.jwt() ->> 'sub') AND
  role = 'candidate' AND
  verified = FALSE AND
  status = 'active'
);

-- Users can update non-privileged columns of their own profile
CREATE POLICY "Users can update non-privileged profile data"
ON public.profiles FOR UPDATE
USING (id = (auth.jwt() ->> 'sub') OR public.is_admin())
WITH CHECK (
  public.is_admin() OR (
    id = (auth.jwt() ->> 'sub') AND
    role = (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')) AND
    verified = (SELECT verified FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')) AND
    status = (SELECT status FROM public.profiles WHERE id = (auth.jwt() ->> 'sub'))
  )
);

-- ----------------------------------------------------------------------------
-- 2. EXPERIENCE / EDUCATION / SKILLS / PROJECTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Experience viewable by everyone" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "Experience manageable by owner" ON public.experiences FOR ALL
USING (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin())
WITH CHECK (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Education viewable by everyone" ON public.educations FOR SELECT USING (true);
CREATE POLICY "Education manageable by owner" ON public.educations FOR ALL
USING (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin())
WITH CHECK (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Skills viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Skills insertable by authenticated users" ON public.skills FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Profile skills viewable by everyone" ON public.profile_skills FOR SELECT USING (true);
CREATE POLICY "Profile skills manageable by owner" ON public.profile_skills FOR ALL
USING (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin())
WITH CHECK (profile_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Endorsements viewable by everyone" ON public.skill_endorsements FOR SELECT USING (true);
CREATE POLICY "Endorsements insertable by authenticated users" ON public.skill_endorsements FOR INSERT
WITH CHECK (endorser_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Endorsements removable by endorser" ON public.skill_endorsements FOR DELETE
USING (endorser_id = (auth.jwt() ->> 'sub') OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. CONNECTIONS & FOLLOWS
-- ----------------------------------------------------------------------------
CREATE POLICY "Connections viewable by involved parties" ON public.connections FOR SELECT
USING (requester_id = (auth.jwt() ->> 'sub') OR addressee_id = (auth.jwt() ->> 'sub') OR status = 'accepted');

CREATE POLICY "Send connection requests" ON public.connections FOR INSERT
WITH CHECK (requester_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Respond or withdraw connections" ON public.connections FOR UPDATE
USING (requester_id = (auth.jwt() ->> 'sub') OR addressee_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Remove connection" ON public.connections FOR DELETE
USING (requester_id = (auth.jwt() ->> 'sub') OR addressee_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Follows are viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Manage own follows" ON public.follows FOR ALL
USING (follower_id = (auth.jwt() ->> 'sub'))
WITH CHECK (follower_id = (auth.jwt() ->> 'sub'));

-- ----------------------------------------------------------------------------
-- 4. POSTS & INTERACTIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "Public posts viewable by everyone" ON public.posts FOR SELECT
USING (deleted_at IS NULL AND (visibility = 'public' OR author_id = (auth.jwt() ->> 'sub')));

CREATE POLICY "Create posts" ON public.posts FOR INSERT
WITH CHECK (author_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Update own posts" ON public.posts FOR UPDATE
USING (author_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Delete own posts (soft delete)" ON public.posts FOR DELETE
USING (author_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Reactions viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Manage own reaction" ON public.reactions FOR ALL
USING (user_id = (auth.jwt() ->> 'sub'))
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Create comment" ON public.comments FOR INSERT WITH CHECK (author_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Edit or delete own comment" ON public.comments FOR ALL
USING (author_id = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Manage saved posts" ON public.saved_posts FOR ALL
USING (user_id = (auth.jwt() ->> 'sub'))
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- ----------------------------------------------------------------------------
-- 5. JOBS & RECRUITER RIGHTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Published jobs viewable by all" ON public.jobs FOR SELECT
USING (status = 'open' OR posted_by = (auth.jwt() ->> 'sub') OR public.is_admin());

-- Only verified recruiters or admins can create or publish jobs
CREATE POLICY "Verified recruiters can create jobs" ON public.jobs FOR INSERT
WITH CHECK (
  (public.is_verified_recruiter() AND posted_by = (auth.jwt() ->> 'sub')) OR
  public.is_admin()
);

CREATE POLICY "Verified recruiters can edit their company jobs" ON public.jobs FOR UPDATE
USING (posted_by = (auth.jwt() ->> 'sub') OR public.is_admin());

CREATE POLICY "Verified recruiters can delete their jobs" ON public.jobs FOR DELETE
USING (posted_by = (auth.jwt() ->> 'sub') OR public.is_admin());

-- Applications
CREATE POLICY "Applicants can see their own applications" ON public.applications FOR SELECT
USING (
  applicant_id = (auth.jwt() ->> 'sub') OR
  EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND posted_by = (auth.jwt() ->> 'sub')) OR
  public.is_admin()
);

CREATE POLICY "Job seekers can submit applications" ON public.applications FOR INSERT
WITH CHECK (applicant_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Recruiters and admins can update applicant statuses" ON public.applications FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND posted_by = (auth.jwt() ->> 'sub')) OR
  applicant_id = (auth.jwt() ->> 'sub') OR
  public.is_admin()
);

-- ----------------------------------------------------------------------------
-- 6. MESSAGING & CONVERSATIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "View conversations if member" ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conversations.id AND profile_id = (auth.jwt() ->> 'sub')
  ) OR public.is_admin()
);

CREATE POLICY "View messages if member" ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id AND profile_id = (auth.jwt() ->> 'sub')
  ) OR public.is_admin()
);

CREATE POLICY "Send message if member" ON public.messages FOR INSERT
WITH CHECK (
  sender_id = (auth.jwt() ->> 'sub') AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id AND profile_id = (auth.jwt() ->> 'sub')
  )
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users read their own notifications" ON public.notifications FOR SELECT
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users update their own notifications" ON public.notifications FOR UPDATE
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Only admins view audit logs" ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "System logs audit entries" ON public.audit_logs FOR INSERT
WITH CHECK (actor_id = (auth.jwt() ->> 'sub') OR public.is_admin());
