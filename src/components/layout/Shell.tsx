import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { DemoModeBanner } from './DemoModeBanner';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MobileTabBar } from './MobileTabBar';
import { useAdminStore } from '../../lib/adminStore';
import { Megaphone, X, ArrowRight } from 'lucide-react';

export interface ShellProps {
  children?: React.ReactNode;
  leftRail?: React.ReactNode;
  rightRail?: React.ReactNode;
  hideLeftRail?: boolean;
  hideRightRail?: boolean;
  fullWidth?: boolean;
}

export const Shell: React.FC<ShellProps> = ({
  children,
  leftRail,
  rightRail,
  hideLeftRail = false,
  hideRightRail = false,
  fullWidth = false,
}) => {
  const { activeAnnouncements } = useAdminStore();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const topAnnouncement = activeAnnouncements.find((a) => !dismissedIds.includes(a.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F2EE] dark:bg-[#0D1117] text-[#191919] dark:text-white/90 transition-colors">
      {/* Top Demo Banner */}
      <div className="no-print">
        <DemoModeBanner />
      </div>

      {/* Sticky 52px Navbar */}
      <div className="no-print sticky top-0 z-40">
        <Navbar />
      </div>

      {/* Global Platform Announcement Bar (Admin Engine) */}
      {topAnnouncement && (
        <div className="no-print border-b border-[#E0DFDC] dark:border-[#38434F] bg-white dark:bg-[#161B22]">
          <div className="max-w-[1128px] mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Megaphone className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB] shrink-0" />
              <p className="truncate text-gray-800 dark:text-gray-200">
                <strong className="font-bold text-gray-900 dark:text-white mr-1.5">
                  {topAnnouncement.title}:
                </strong>
                {topAnnouncement.message}
              </p>
              {topAnnouncement.link_url && (
                <Link
                  to={topAnnouncement.link_url}
                  className="inline-flex items-center gap-1 font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline shrink-0"
                >
                  <span>{topAnnouncement.link_label || 'Learn more'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setDismissedIds((prev) => [...prev, topAnnouncement.id])}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main
        className={`flex-1 w-full mx-auto px-4 py-5 pb-20 md:pb-10 ${
          fullWidth ? 'max-w-[1280px]' : 'max-w-[1128px]'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-center items-start gap-6">
          {/* Left Column */}
          {!hideLeftRail && (
            <div className="no-print w-full md:w-[225px] flex-shrink-0">
              {leftRail || <LeftSidebar />}
            </div>
          )}

          {/* Center Column */}
          <div
            className={`w-full min-w-0 ${
              !hideLeftRail && !hideRightRail
                ? 'md:max-w-[555px] flex-1'
                : !hideLeftRail || !hideRightRail
                ? 'md:flex-1'
                : 'w-full'
            }`}
          >
            {children}
          </div>

          {/* Right Column */}
          {!hideRightRail && (
            <div className="no-print hidden lg:block w-[300px] flex-shrink-0">
              {rightRail || <RightSidebar />}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <div className="no-print">
        <MobileTabBar />
      </div>
    </div>
  );
};
