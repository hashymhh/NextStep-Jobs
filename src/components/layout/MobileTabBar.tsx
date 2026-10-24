import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, PlusSquare, Briefcase, Bell } from 'lucide-react';
import { useNotifications } from '../../lib/notificationsStore';
import { useNetwork } from '../../lib/networkStore';

export interface MobileTabBarProps {
  onOpenCreatePost?: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ onOpenCreatePost }) => {
  const { unreadCount } = useNotifications();
  const { incomingRequests } = useNetwork();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-[#1B1F23] border-t border-[#E0DFDC] dark:border-[#38434F] z-40 flex items-center justify-around px-2 shadow-lg">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0A66C2] dark:text-[#71B7FB] font-bold'
              : 'text-[#666666] dark:text-gray-400'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/network"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] relative ${
            isActive
              ? 'text-[#0A66C2] dark:text-[#71B7FB] font-bold'
              : 'text-[#666666] dark:text-gray-400'
          }`
        }
      >
        <div className="relative">
          <Users className="w-5 h-5 mb-0.5" />
          {incomingRequests.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#CC1016] text-white text-[8px] font-bold px-1 rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </div>
        <span>Network</span>
      </NavLink>

      <button
        onClick={onOpenCreatePost}
        className="flex flex-col items-center justify-center py-1 flex-1 text-[10px] text-[#666666] dark:text-gray-400 hover:text-[#0A66C2]"
      >
        <PlusSquare className="w-5 h-5 mb-0.5 text-[#0A66C2] dark:text-[#71B7FB]" />
        <span>Post</span>
      </button>

      <NavLink
        to="/jobs"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] ${
            isActive
              ? 'text-[#0A66C2] dark:text-[#71B7FB] font-bold'
              : 'text-[#666666] dark:text-gray-400'
          }`
        }
      >
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span>Jobs</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 flex-1 text-[10px] relative ${
            isActive
              ? 'text-[#0A66C2] dark:text-[#71B7FB] font-bold'
              : 'text-[#666666] dark:text-gray-400'
          }`
        }
      >
        <div className="relative">
          <Bell className="w-5 h-5 mb-0.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#CC1016] text-white text-[8px] font-bold px-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <span>Notifications</span>
      </NavLink>
    </nav>
  );
};
