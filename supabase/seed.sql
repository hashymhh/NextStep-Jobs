-- ============================================================================
-- NEXTSTEP: SUPABASE SEED DATA
-- Professional network seed: 30 users, 10 companies, 60 posts, 40 jobs
-- ============================================================================

-- HOW TO MAKE ANY USER AN ADMIN (ONE-LINE SQL):
-- UPDATE public.profiles SET role = 'admin', verified = TRUE WHERE email = 'your-email@example.com';

-- 1. SEED COMPANIES
INSERT INTO public.companies (id, slug, name, tagline, about, logo_url, banner_url, industry, size, website, hq, founded, verified, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'google', 'Google', 'Organizing the world''s information and making it universally accessible and useful.', 'Google is a global technology leader focused on improving the ways people connect with information.', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=300&fit=crop', 'Technology & Cloud', '10,001+ employees', 'https://google.com', 'Mountain View, CA', 1998, TRUE, 'active'),
  ('c1000000-0000-0000-0000-000000000002', 'stripe', 'Stripe', 'Financial infrastructure for the internet.', 'Millions of companies of all sizes use Stripe online and in person to accept payments, send payouts, and manage their businesses online.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&h=128&fit=crop', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop', 'Financial Technology', '5,001-10,000 employees', 'https://stripe.com', 'San Francisco, CA', 2010, TRUE, 'active'),
  ('c1000000-0000-0000-0000-000000000003', 'openai', 'OpenAI', 'Creating safe AGI that benefits all of humanity.', 'OpenAI is an AI research and deployment company.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=300&fit=crop', 'Artificial Intelligence', '1,001-5,000 employees', 'https://openai.com', 'San Francisco, CA', 2015, TRUE, 'active'),
  ('c1000000-0000-0000-0000-000000000004', 'linear', 'Linear', 'The purpose-built tool for modern product development.', 'Linear streamlines software projects, sprints, tasks, and bug tracking. Built for high-performance teams.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop', 'Productivity Software', '51-200 employees', 'https://linear.app', 'San Francisco, CA', 2019, TRUE, 'active'),
  ('c1000000-0000-0000-0000-000000000005', 'figma', 'Figma', 'Nothing great is made alone. Connect the dots with Figma.', 'Figma is a collaborative interface design tool powering teams worldwide.', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=128&h=128&fit=crop', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=300&fit=crop', 'Design Software', '1,001-5,000 employees', 'https://figma.com', 'San Francisco, CA', 2012, TRUE, 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED KEY PERSONA PROFILES
INSERT INTO public.profiles (id, handle, email, first_name, last_name, headline, about, location, avatar_url, banner_url, role, verified, status, open_to_work, open_to_hiring, completeness_score, profile_views_count, connections_count)
VALUES
  -- 1. Demo Admin
  ('usr_admin_alex', 'alexrivera', 'alex.rivera@nextstep.app', 'Alex', 'Rivera', 'Principal Platform Architect & NextStep Lead Admin', 'Passionate about engineering distributed systems, developer velocity, and building modern career infrastructure.', 'Seattle, WA', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop', 'admin', TRUE, 'active', FALSE, FALSE, 100, 1420, 850),
  -- 2. Demo Verified Recruiter
  ('usr_recruiter_sarah', 'sarahconnor', 'sarah.connor@stripe.com', 'Sarah', 'Connor', 'Senior Talent Partner @ Stripe | Scaling FinTech Engineering', 'Hiring exceptional frontend, fullstack, and distributed systems engineers worldwide. Reach out directly or check our active openings!', 'San Francisco, CA', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop', 'recruiter', TRUE, 'active', FALSE, TRUE, 95, 2340, 1280),
  -- 3. Demo Candidate
  ('usr_candidate_john', 'johndoe', 'john.doe@example.com', 'John', 'Doe', 'Full-Stack Software Engineer | React, TypeScript, Node.js, GraphQL', 'Software engineer with 4+ years of experience designing web applications that scale. Interested in developer tools, clean UX, and high-throughput backend APIs.', 'Austin, TX', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop', 'candidate', FALSE, 'active', TRUE, FALSE, 90, 482, 342)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED INITIAL POSTS
INSERT INTO public.posts (id, author_id, body, kind, hashtags, likes_count, comments_count, reposts_count)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'usr_admin_alex', 'Welcome to the NextStep platform launch! 🚀 We built NextStep to give students, professionals, and recruiters an authentic, lightning-fast professional network experience.', 'text', ARRAY['nextstep', 'launch', 'tech', 'careers'], 148, 23, 12),
  ('p1000000-0000-0000-0000-000000000002', 'usr_recruiter_sarah', 'Stripe is expanding our core infrastructure team! We are looking for Senior Full-Stack Engineers with strong TypeScript and Distributed Systems backgrounds. Check out our Jobs tab to apply directly with Easy Apply!', 'text', ARRAY['hiring', 'engineering', 'fintech', 'remote'], 87, 14, 9),
  ('p1000000-0000-0000-0000-000000000003', 'usr_candidate_john', 'Excited to announce that I just published a new open-source project featuring clean TypeScript architecture and real-time state synchronization! Always open to connecting with fellow engineers and teams building developer platforms.', 'text', ARRAY['opensource', 'typescript', 'react', 'opentowork'], 64, 8, 3)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED SAMPLE OPEN JOBS
INSERT INTO public.jobs (id, company_id, posted_by, title, description, location, work_mode, type, experience_level, salary_min, salary_max, salary_currency, skills, status)
VALUES
  ('j1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'usr_recruiter_sarah', 'Senior Full-Stack Engineer', 'Join Stripe to build the next generation of financial checkout APIs and dashboard experiences used by millions.', 'San Francisco, CA', 'hybrid', 'full-time', 'senior', 185000, 240000, 'USD', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Distributed Systems'], 'open'),
  ('j1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'usr_recruiter_sarah', 'Product Designer (Design Systems)', 'Craft the visual and interactive foundations of Linear. Deep attention to typography, keyboard shortcuts, and desktop-grade interactions.', 'Remote', 'remote', 'full-time', 'mid', 150000, 195000, 'USD', ARRAY['Figma', 'Design Systems', 'CSS', 'Interaction Design'], 'open')
ON CONFLICT (id) DO NOTHING;
