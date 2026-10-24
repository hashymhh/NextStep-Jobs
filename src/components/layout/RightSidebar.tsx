import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { DEMO_NEWS, DEMO_COMPANIES } from '../../lib/seed/demoData';
import { Info, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const RightSidebar: React.FC = () => {
  const [followedCompanyIds, setFollowedCompanyIds] = useState<Set<string>>(new Set());

  const toggleFollowCompany = (companyId: string, companyName: string) => {
    setFollowedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
        toast.info(`Unfollowed ${companyName}`);
      } else {
        next.add(companyId);
        toast.success(`You are now following ${companyName}`);
      }
      return next;
    });
  };

  return (
    <aside className="w-full flex flex-col gap-2">
      {/* NextStep News Rail */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-[#191919] dark:text-white">
            NextStep News
          </h3>
          <span title="Curated stories from Dev.to and Hacker News" className="text-gray-400">
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>

        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2">
          Top stories &amp; career updates
        </p>

        <ul className="space-y-3">
          {DEMO_NEWS.slice(0, 5).map((item) => (
            <li key={item.id} className="group">
              <a
                href={item.url.startsWith('#') ? undefined : item.url}
                target={item.url.startsWith('#') ? undefined : '_blank'}
                rel="noreferrer"
                className="block text-left"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-gray-400 font-bold text-xs mt-0.5">•</span>
                  <div>
                    <h4 className="text-xs font-semibold text-[#191919] dark:text-gray-200 group-hover:text-[#0A66C2] dark:group-hover:text-[#71B7FB] group-hover:underline leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[#666666] dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span>{item.published_at}</span>
                      {item.readers_count && (
                        <span>• {item.readers_count.toLocaleString()} readers</span>
                      )}
                    </p>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {/* Recommended Companies to Follow */}
      <Card padding="md">
        <h3 className="font-bold text-sm text-[#191919] dark:text-white mb-3">
          Companies you may know
        </h3>

        <div className="space-y-3">
          {DEMO_COMPANIES.slice(0, 3).map((comp) => {
            const isFollowing = followedCompanyIds.has(comp.id);
            return (
              <div key={comp.id} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={comp.name}
                    src={comp.logo_url}
                    size="sm"
                    className="rounded-md"
                  />
                  <div className="truncate">
                    <Link
                      to={`/company/${comp.slug}`}
                      className="text-xs font-bold text-[#191919] dark:text-white hover:underline truncate block"
                    >
                      {comp.name}
                    </Link>
                    <p className="text-[10px] text-gray-500 truncate">{comp.industry}</p>
                  </div>
                </div>

                <Button
                  variant={isFollowing ? 'tertiary' : 'secondary'}
                  size="sm"
                  className="h-7 text-xs px-2.5 shrink-0"
                  onClick={() => toggleFollowCompany(comp.id, comp.name)}
                  leftIcon={isFollowing ? undefined : <Plus className="w-3 h-3" />}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* LinkedIn Standard Footer Links */}
      <footer className="text-center py-2 px-3 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          <Link to="/about" className="hover:text-[#0A66C2] hover:underline">
            About
          </Link>
          <Link to="/accessibility" className="hover:text-[#0A66C2] hover:underline">
            Accessibility
          </Link>
          <Link to="/help" className="hover:text-[#0A66C2] hover:underline">
            Help Center
          </Link>
          <Link to="/privacy" className="hover:text-[#0A66C2] hover:underline">
            Privacy &amp; Terms
          </Link>
          <Link to="/ad-choices" className="hover:text-[#0A66C2] hover:underline">
            Ad Choices
          </Link>
          <Link to="/advertising" className="hover:text-[#0A66C2] hover:underline">
            Advertising
          </Link>
        </div>
        <p className="pt-2 text-gray-400 text-[10px]">
          <span className="font-bold text-[#0A66C2]">NextStep</span> Corporation © 2026. All rights reserved.
        </p>
      </footer>
    </aside>
  );
};
