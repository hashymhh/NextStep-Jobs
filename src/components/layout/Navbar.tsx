import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/clerk/useAuth';
import { useTheme } from '../../lib/theme/ThemeContext';
import { Avatar } from '../ui/Avatar';
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  Grid,
  Moon,
  Sun,
  Laptop,
  LogOut,
  User,
  Shield,
  Building,
  CheckCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { DEMO_PROFILES, DEMO_COMPANIES, DEMO_JOBS, DEMO_POSTS } from '../../lib/seed/demoData';
import { useNotifications } from '../../lib/notificationsStore';
import { useNetwork } from '../../lib/networkStore';
import { useMessaging } from '../../lib/messagingStore';

export const Navbar: React.FC = () => {
  const { profile, isAdmin, isVerifiedRecruiter, signOut, switchPersona, isDemoMode } = useAuth();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { incomingRequests } = useNetwork();
  const { totalUnreadCount } = useMessaging();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [typeaheadTab, setTypeaheadTab] = useState<'all' | 'people' | 'jobs' | 'posts' | 'companies'>('all');
  const [meDropdownOpen, setMeDropdownOpen] = useState(false);
  const [forBusinessOpen, setForBusinessOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const meRef = useRef<HTMLDivElement>(null);
  const businessRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (meRef.current && !meRef.current.contains(e.target as Node)) {
        setMeDropdownOpen(false);
      }
      if (businessRef.current && !businessRef.current.contains(e.target as Node)) {
        setForBusinessOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToSearch = (tab = typeaheadTab) => {
    if (!searchQuery.trim()) return;
    const typeParam = tab !== 'all' ? `&type=${tab}` : '';
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}${typeParam}`);
    setSearchFocused(false);
  };

  // Filtered search typeahead
  const filteredUsers = searchQuery.trim()
    ? DEMO_PROFILES.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.headline?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const filteredJobs = searchQuery.trim()
    ? DEMO_JOBS.filter(
        (j) =>
          j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const filteredCompanies = searchQuery.trim()
    ? DEMO_COMPANIES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.industry.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 2)
    : [];

  const filteredPosts = searchQuery.trim()
    ? DEMO_POSTS.filter(
        (p) =>
          p.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.hashtags.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 2)
    : [];

  const hasSearchResults =
    filteredUsers.length > 0 ||
    filteredJobs.length > 0 ||
    filteredCompanies.length > 0 ||
    filteredPosts.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#1B1F23] border-b border-[#E0DFDC] dark:border-[#38434F] transition-colors">
      <div className="max-w-[1128px] mx-auto px-4 h-[52px] flex items-center justify-between">
        {/* Left: Brand Logo & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Link
            to="/"
            className="flex items-center gap-2 group flex-shrink-0"
            title="NextStep Home"
          >
            {/* "N" Logo Tile */}
            <div className="w-8 h-8 rounded-[4px] bg-[#0A66C2] flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-[#004182] transition-colors">
              N
            </div>
            <span className="hidden sm:inline font-bold text-lg text-[#0A66C2] dark:text-[#71B7FB] tracking-tight">
              NextStep
            </span>
          </Link>

          {/* Search Box with Typeahead */}
          <div ref={searchRef} className="relative flex-1">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search jobs, people, companies, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    navigateToSearch();
                  }
                }}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-1.5 rounded-[4px] bg-[#EDF3F8] dark:bg-[#22272B] text-[#191919] dark:text-white placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] transition-all"
              />
            </div>

            {/* Typeahead Dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                {/* Typeahead Tabs Bar */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto text-[11px]">
                  {(['all', 'people', 'jobs', 'posts', 'companies'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTypeaheadTab(tab)}
                      className={`px-2.5 py-0.5 rounded-full capitalize font-semibold cursor-pointer transition-colors shrink-0 ${
                        typeaheadTab === tab
                          ? 'bg-[#0A66C2] text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {hasSearchResults ? (
                  <div className="py-2 text-left">
                    {/* People section */}
                    {(typeaheadTab === 'all' || typeaheadTab === 'people') && filteredUsers.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center justify-between">
                          <span>People</span>
                          <span
                            onClick={() => navigateToSearch('people')}
                            className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                          >
                            All people
                          </span>
                        </div>
                        {filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              navigate(`/in/${u.handle}`);
                              setSearchFocused(false);
                            }}
                            className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Avatar name={`${u.first_name} ${u.last_name}`} src={u.avatar_url} size="xs" />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {u.first_name} {u.last_name}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">{u.headline}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Jobs section */}
                    {(typeaheadTab === 'all' || typeaheadTab === 'jobs') && filteredJobs.length > 0 && (
                      <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center justify-between">
                          <span>Jobs</span>
                          <span
                            onClick={() => navigateToSearch('jobs')}
                            className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                          >
                            All jobs
                          </span>
                        </div>
                        {filteredJobs.map((j) => (
                          <div
                            key={j.id}
                            onClick={() => {
                              navigate(`/jobs?id=${j.id}`);
                              setSearchFocused(false);
                            }}
                            className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Briefcase className="w-4 h-4 text-[#0A66C2] shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {j.title}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">{j.company?.name} • {j.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Companies section */}
                    {(typeaheadTab === 'all' || typeaheadTab === 'companies') && filteredCompanies.length > 0 && (
                      <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center justify-between">
                          <span>Companies</span>
                          <span
                            onClick={() => navigateToSearch('companies')}
                            className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                          >
                            All companies
                          </span>
                        </div>
                        {filteredCompanies.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              navigate(`/company/${c.slug}`);
                              setSearchFocused(false);
                            }}
                            className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Building className="w-4 h-4 text-purple-600 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">{c.industry} • {c.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Posts section */}
                    {(typeaheadTab === 'all' || typeaheadTab === 'posts') && filteredPosts.length > 0 && (
                      <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center justify-between">
                          <span>Posts</span>
                          <span
                            onClick={() => navigateToSearch('posts')}
                            className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                          >
                            All posts
                          </span>
                        </div>
                        {filteredPosts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              navigate(`/?post=${p.id}`);
                              setSearchFocused(false);
                            }}
                            className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs text-gray-900 dark:text-white truncate line-clamp-1">
                                {p.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom "See all results" bar */}
                    <div
                      onClick={() => navigateToSearch()}
                      className="mt-2 border-t border-gray-200 dark:border-gray-700 p-2.5 bg-gray-50 dark:bg-gray-850 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#0A66C2] dark:text-[#71B7FB] font-semibold text-xs flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>See all results for &ldquo;{searchQuery}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">
                    <p>No results for &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={() => navigateToSearch()}
                      className="mt-2 text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer block mx-auto"
                    >
                      Search NextStep anyway &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Primary Navigation Items */}
        <nav className="flex items-center h-full">
          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center h-full">
            {/* Home */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[70px] lg:min-w-[80px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Home</span>
            </NavLink>

            {/* My Network */}
            <NavLink
              to="/network"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[70px] lg:min-w-[80px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <div className="relative">
                <Users className="w-5 h-5 mb-0.5" />
                {incomingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#CC1016] text-white text-[9px] font-bold px-1 rounded-full leading-tight">
                    {incomingRequests.length}
                  </span>
                )}
              </div>
              <span className="text-[11px]">My Network</span>
            </NavLink>

            {/* Jobs */}
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[70px] lg:min-w-[80px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <Briefcase className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Jobs</span>
            </NavLink>

            {/* Messaging */}
            <NavLink
              to="/messaging"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[66px] lg:min-w-[76px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5 mb-0.5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#CC1016] text-white text-[9px] font-bold px-1 rounded-full leading-tight tabular-nums">
                    {totalUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-[11px]">Messaging</span>
            </NavLink>

            {/* Notifications */}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[66px] lg:min-w-[76px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <div className="relative">
                <Bell className="w-5 h-5 mb-0.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#CC1016] text-white text-[9px] font-bold px-1 rounded-full leading-tight tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[11px]">Notifications</span>
            </NavLink>

            {/* ATS Resume Builder */}
            <NavLink
              to="/resume-builder"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[66px] lg:min-w-[76px] h-[52px] text-xs transition-colors ${
                  isActive
                    ? 'text-[#191919] dark:text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#191919] dark:after:bg-white'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white'
                }`
              }
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Resume AI</span>
            </NavLink>
          </div>

          {/* Mobile Direct Message Icon */}
          <NavLink
            to="/messaging"
            aria-label="Messaging"
            className="md:hidden flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 relative mr-1"
          >
            <MessageSquare className="w-5 h-5" />
            {totalUnreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#CC1016] text-white text-[8px] font-bold px-1 rounded-full tabular-nums">
                {totalUnreadCount}
              </span>
            )}
          </NavLink>

          {/* Separator */}
          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Me Dropdown */}
          <div ref={meRef} className="relative">
            <button
              onClick={() => setMeDropdownOpen(!meDropdownOpen)}
              className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] h-[52px] text-xs text-[#666666] dark:text-gray-400 hover:text-[#191919] dark:hover:text-white cursor-pointer select-none"
            >
              <Avatar
                name={`${profile?.first_name || 'Me'} ${profile?.last_name || ''}`}
                src={profile?.avatar_url}
                size="xs"
              />
              <span className="flex items-center text-[10px] mt-0.5 font-medium">
                Me
              </span>
            </button>

            {/* Me Dropdown Menu */}
            {meDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1B1F23] rounded-lg shadow-xl border border-[#E0DFDC] dark:border-[#38434F] py-2 z-50 text-left">
                {/* User Summary Header */}
                <div className="px-4 py-3 border-b border-[#E0DFDC] dark:border-[#38434F]">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${profile?.first_name || 'Me'} ${profile?.last_name || ''}`}
                      src={profile?.avatar_url}
                      size="sm"
                    />
                    <div className="truncate">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{profile?.headline}</p>
                    </div>
                  </div>

                  <Link
                    to={`/in/${profile?.handle || 'me'}`}
                    onClick={() => setMeDropdownOpen(false)}
                    className="mt-3 block text-center text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] border border-[#0A66C2] dark:border-[#71B7FB] py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Persona Switcher in Demo Mode */}
                {isDemoMode && (
                  <div className="px-4 py-2 border-b border-[#E0DFDC] dark:border-[#38434F]">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                      Quick Persona Switch
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          switchPersona('usr_candidate_john');
                          setMeDropdownOpen(false);
                        }}
                        className="w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Candidate (Hamza Tariq)</span>
                        {profile?.role === 'candidate' && <CheckCircle className="w-3.5 h-3.5 text-[#0A66C2]" />}
                      </button>
                      <button
                        onClick={() => {
                          switchPersona('usr_recruiter_sarah');
                          setMeDropdownOpen(false);
                        }}
                        className="w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Recruiter (Ayesha Siddiqui)</span>
                        {profile?.role === 'recruiter' && <CheckCircle className="w-3.5 h-3.5 text-[#0A66C2]" />}
                      </button>
                      <button
                        onClick={() => {
                          switchPersona('usr_admin_alex');
                          setMeDropdownOpen(false);
                        }}
                        className="w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Admin (Bilal Sheikh)</span>
                        {profile?.role === 'admin' && <CheckCircle className="w-3.5 h-3.5 text-[#0A66C2]" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Theme Selector */}
                <div className="px-4 py-2 border-b border-[#E0DFDC] dark:border-[#38434F]">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-1.5 rounded text-xs transition-colors cursor-pointer ${
                        theme === 'light'
                          ? 'bg-[#0A66C2] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Sun className="w-4 h-4 mb-1" />
                      <span className="text-[10px]">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-1.5 rounded text-xs transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#0A66C2] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Moon className="w-4 h-4 mb-1" />
                      <span className="text-[10px]">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center p-1.5 rounded text-xs transition-colors cursor-pointer ${
                        theme === 'system'
                          ? 'bg-[#0A66C2] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Laptop className="w-4 h-4 mb-1" />
                      <span className="text-[10px]">Auto</span>
                    </button>
                  </div>
                </div>

                {/* Role / Portals Links */}
                <div className="py-1">
                  <Link
                    to="/resume-builder"
                    onClick={() => setMeDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <FileText className="w-4 h-4" />
                    ATS Resume Builder &amp; AI
                  </Link>
                  <Link
                    to="/recruiter"
                    onClick={() => setMeDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Briefcase className="w-4 h-4 text-[#0A66C2]" />
                    Recruiter Hiring Suite
                  </Link>
                  <Link
                    to="/recruiter/verify"
                    onClick={() => setMeDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Building className="w-4 h-4 text-emerald-600" />
                    SECP &amp; Employer Verification
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setMeDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Shield className="w-4 h-4 text-[#0A66C2]" />
                    Admin Authority Console
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMeDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User className="w-4 h-4" />
                    Account &amp; Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMeDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#CC1016] dark:text-[#E02424] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Work & Portals Launcher (Recruiter Suite + Admin Console) */}
          <div
            ref={businessRef}
            className="relative flex items-center ml-1 sm:ml-2 border-l border-gray-200 dark:border-gray-700 pl-1 sm:pl-2"
          >
            <button
              type="button"
              aria-expanded={forBusinessOpen}
              aria-label="Open Recruiter and Admin Portals menu"
              onClick={() => setForBusinessOpen(!forBusinessOpen)}
              className="flex flex-col items-center justify-center px-2 py-1 text-center text-xs text-[#666666] dark:text-gray-400 hover:text-[#0A66C2] dark:hover:text-[#71B7FB] group cursor-pointer whitespace-nowrap"
            >
              <Grid className="w-5 h-5 mb-0.5 text-gray-500 group-hover:text-[#0A66C2]" />
              <span className="hidden sm:inline text-[11px] font-medium leading-tight">
                Portals
              </span>
            </button>

            {forBusinessOpen && (
              <div className="absolute right-0 top-[50px] w-80 bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                <div className="p-3.5 border-b border-[#E0DFDC] dark:border-[#38434F] bg-gray-50/80 dark:bg-[#161B22]">
                  <p className="font-bold text-gray-900 dark:text-white">
                    NextStep Workspaces &amp; Authority
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Direct access to every Recruiter Suite &amp; Admin Console section.
                  </p>
                </div>

                <div className="p-3 border-b border-[#E0DFDC] dark:border-[#38434F] space-y-1">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>Recruiter Hiring Suite</span>
                    </span>
                    {isDemoMode && !isVerifiedRecruiter && (
                      <button
                        type="button"
                        onClick={() => {
                          switchPersona('usr_recruiter_sarah');
                          setForBusinessOpen(false);
                          navigate('/recruiter');
                        }}
                        className="text-[11px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                      >
                        Enter as Recruiter &rarr;
                      </button>
                    )}
                  </div>
                  {[
                    { label: 'Overview & Hiring Funnel', to: '/recruiter?tab=overview' },
                    { label: 'Post a PKR Job Requisition', to: '/recruiter?tab=requisitions&action=new-job' },
                    { label: 'Applicant Kanban & Scorecards', to: '/recruiter?tab=pipeline' },
                    { label: 'PKT Interviews & PKR Offers', to: '/recruiter?tab=interviews' },
                    { label: 'Pakistan Talent Search & Pools', to: '/recruiter?tab=talent' },
                    { label: 'Employer Brand Manager', to: '/recruiter?tab=company' },
                    { label: 'SECP / PSEB Verification', to: '/recruiter/verify' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setForBusinessOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0A66C2]"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </Link>
                  ))}
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>Admin Authority Console</span>
                    </span>
                    {isDemoMode && !isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          switchPersona('usr_admin_alex');
                          setForBusinessOpen(false);
                          navigate('/admin');
                        }}
                        className="text-[11px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                      >
                        Enter as Admin &rarr;
                      </button>
                    )}
                  </div>
                  {[
                    { label: 'Executive Analytics', to: '/admin?tab=overview' },
                    { label: 'Authorizations & RBAC Matrix', to: '/admin?tab=authorizations' },
                    { label: 'User & Role Governance', to: '/admin?tab=users' },
                    { label: 'Organizations Registry', to: '/admin?tab=companies' },
                    { label: 'Verifications & Feed Moderation', to: '/admin?tab=moderation' },
                    { label: 'System Policies & Audit Chain', to: '/admin?tab=audit' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setForBusinessOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0A66C2]"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
