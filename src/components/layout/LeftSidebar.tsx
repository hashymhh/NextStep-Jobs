import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/clerk/useAuth';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Bookmark, Briefcase, FileText, MapPin, Shield } from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const { profile, isAdmin, isVerifiedRecruiter } = useAuth();

  if (!profile) return null;

  return (
    <aside className="w-full flex flex-col gap-2">
      {/* Mini Profile Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Banner */}
        <div
          className="h-14 w-full bg-cover bg-center bg-[#0A66C2]/20 relative"
          style={{
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        {/* Avatar + Info */}
        <div className="px-3 pb-4 text-center relative">
          <div className="-mt-8 mb-2 flex justify-center">
            <Link to={`/in/${profile.handle}`}>
              <Avatar
                name={`${profile.first_name} ${profile.last_name}`}
                src={profile.avatar_url}
                size="lg"
                verified={profile.verified}
                openToWork={profile.open_to_work}
                openToHiring={profile.open_to_hiring}
                className="shadow-sm hover:opacity-95 transition-opacity"
              />
            </Link>
          </div>

          <Link
            to={`/in/${profile.handle}`}
            className="font-bold text-sm text-[#191919] dark:text-white hover:underline block leading-tight"
          >
            {profile.first_name} {profile.last_name}
          </Link>

          <p className="text-[11px] text-[#666666] dark:text-gray-400 mt-1 line-clamp-2 px-1">
            {profile.headline || 'NextStep Pakistan Professional'}
          </p>

          {profile.location && (
            <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="truncate">{profile.location}</span>
            </p>
          )}
        </div>

        {/* Analytics stats */}
        <div className="border-t border-[#E0DFDC] dark:border-[#38434F] py-2">
          <Link
            to={`/in/${profile.handle}`}
            className="flex items-center justify-between px-3 py-1.5 text-xs text-[#666666] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-[11px]">Profile viewers</span>
            <span className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] tabular-nums">
              {profile.profile_views_count}
            </span>
          </Link>

          <Link
            to="/network"
            className="flex items-center justify-between px-3 py-1.5 text-xs text-[#666666] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-[11px]">Connections</span>
            <span className="font-semibold text-[#0A66C2] dark:text-[#71B7FB] tabular-nums">
              {profile.connections_count}
            </span>
          </Link>
        </div>

        {/* Saved Jobs & Resume Builder Shortcuts */}
        <div className="border-t border-[#E0DFDC] dark:border-[#38434F] p-2.5 space-y-1.5">
          <Link
            to="/jobs?tab=saved"
            className="flex items-center gap-2 px-1.5 py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0A66C2] dark:hover:text-[#71B7FB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-gray-500" />
            <span>Saved jobs &amp; applications</span>
          </Link>
          <Link
            to="/resume-builder"
            className="flex items-center gap-2 px-1.5 py-1 rounded text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:bg-blue-50/70 dark:hover:bg-blue-950/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ATS Resume Builder</span>
          </Link>
          <Link
            to="/recruiter"
            className="flex items-center justify-between px-1.5 py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0A66C2] dark:hover:text-[#71B7FB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-gray-500" />
              <span>Recruiter Suite</span>
            </span>
            {isVerifiedRecruiter && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Active</span>
            )}
          </Link>
          <Link
            to="/admin"
            className="flex items-center justify-between px-1.5 py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0A66C2] dark:hover:text-[#71B7FB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>Admin Console</span>
            </span>
            {isAdmin && (
              <span className="text-[10px] text-[#0A66C2] dark:text-[#71B7FB]">Root</span>
            )}
          </Link>
        </div>
      </Card>

      {/* Quick Links Card */}
      <Card padding="sm" className="hidden md:block text-xs">
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 px-1">
          Pakistan Tech Hubs
        </p>
        <div className="space-y-1">
          <Link
            to="/company/systems-limited"
            className="flex items-center gap-2 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <span className="text-[#0A66C2] font-bold">•</span>
            <span className="truncate">Systems Limited</span>
          </Link>
          <Link
            to="/company/sadapay"
            className="flex items-center gap-2 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <span className="text-emerald-600 font-bold">•</span>
            <span className="truncate">SadaPay Engineering</span>
          </Link>
          <Link
            to="/search?q=pakistantech&type=posts"
            className="flex items-center gap-2 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <span className="text-gray-400 font-bold">#</span>
            <span className="truncate">pakistantech</span>
          </Link>
          <Link
            to="/jobs"
            className="flex items-center gap-2 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <span className="text-gray-400 font-bold">#</span>
            <span className="truncate">lahorejobs &amp; remote</span>
          </Link>
        </div>
      </Card>
    </aside>
  );
};
