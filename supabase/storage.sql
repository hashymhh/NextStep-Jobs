-- ============================================================================
-- NEXTSTEP: SUPABASE STORAGE BUCKETS & POLICIES
-- Buckets: avatars, banners, post-media, resumes, company-assets, chat-files
-- ============================================================================

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']),
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('company-assets', 'company-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('chat-files', 'chat-files', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 1. Avatars & Banners Policies (Public read, authenticated upload)
CREATE POLICY "Public Read Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Upload Avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Users Update Own Avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Public Read Banners" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated Users Upload Banners" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.jwt() ->> 'sub' IS NOT NULL);

-- 2. Post Media Policies (Public read, author upload)
CREATE POLICY "Public Read Post Media" ON storage.objects
FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated Users Upload Post Media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.jwt() ->> 'sub' IS NOT NULL);

-- 3. Resumes Policies (Private: Owner read/write, recruiters with applications)
CREATE POLICY "Owner Read Resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub') OR
    public.is_admin() OR
    public.is_verified_recruiter()
  )
);

CREATE POLICY "Owner Upload Resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

CREATE POLICY "Owner Delete Resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

-- 4. Company Assets Policies
CREATE POLICY "Public Read Company Assets" ON storage.objects
FOR SELECT USING (bucket_id = 'company-assets');

CREATE POLICY "Recruiters Upload Company Assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-assets' AND (public.is_verified_recruiter() OR public.is_admin())
);

-- 5. Chat Files Policies
CREATE POLICY "Chat Members Read Chat Files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files' AND auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Chat Members Upload Chat Files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.jwt() ->> 'sub' IS NOT NULL);
