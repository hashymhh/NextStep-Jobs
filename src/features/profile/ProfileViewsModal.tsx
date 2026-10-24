import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { TrendingUp, Users, Search, Building } from 'lucide-react';
import { DEMO_PROFILES } from '../../lib/seed/demoData';

export interface ProfileViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewsCount: number;
}

export const ProfileViewsModal: React.FC<ProfileViewsModalProps> = ({
  isOpen,
  onClose,
  viewsCount,
}) => {
  const viewers = DEMO_PROFILES.slice(1, 4);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Analytics (Past 90 Days)"
      description="See who has visited your profile and where search traffic comes from."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Top Metric Highlight */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-[#0A66C2] dark:text-[#71B7FB]">
              {viewsCount}
            </span>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Total profile views in the last 90 days
            </p>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            +24% vs last period
          </div>
        </div>

        {/* Weekly Traffic Bars */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Weekly Traffic Trend
          </h4>
          <div className="flex items-end gap-2 h-24 p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800">
            {[45, 62, 38, 79, 94, 88, 120, 105, viewsCount % 130 + 30].map((v, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full bg-[#0A66C2] dark:bg-[#71B7FB] rounded-t-xs transition-all"
                  style={{ height: `${Math.min(100, (v / 140) * 100)}%` }}
                />
                <span className="text-[9px] text-gray-400">W{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Viewer Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white mb-2">
              <Building className="w-3.5 h-3.5 text-[#0A66C2]" />
              Top Companies Viewing
            </div>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 tabular-nums">
              <li className="flex justify-between"><span>Systems Limited</span><span className="font-semibold">32%</span></li>
              <li className="flex justify-between"><span>SadaPay</span><span className="font-semibold">24%</span></li>
              <li className="flex justify-between"><span>Arbisoft</span><span className="font-semibold">18%</span></li>
              <li className="flex justify-between"><span>Careem Pakistan</span><span className="font-semibold">14%</span></li>
            </ul>
          </div>

          <div className="p-3 bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white mb-2">
              <Search className="w-3.5 h-3.5 text-purple-600" />
              Viewer Job Titles
            </div>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex justify-between"><span>Technical Recruiter</span><span className="font-semibold">44%</span></li>
              <li className="flex justify-between"><span>Engineering Manager</span><span className="font-semibold">28%</span></li>
              <li className="flex justify-between"><span>Staff Software Engineer</span><span className="font-semibold">16%</span></li>
              <li className="flex justify-between"><span>Founder / VP</span><span className="font-semibold">12%</span></li>
            </ul>
          </div>
        </div>

        {/* Recent Viewers List */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Recent Identified Viewers
          </h4>
          <div className="space-y-2">
            {viewers.map((v) => (
              <div
                key={v.id}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={`${v.first_name} ${v.last_name}`} src={v.avatar_url} size="sm" />
                  <div className="truncate">
                    <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {v.first_name} {v.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{v.headline}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">2d ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Analytics
          </Button>
        </div>
      </div>
    </Modal>
  );
};
