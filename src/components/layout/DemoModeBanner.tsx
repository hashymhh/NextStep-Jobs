import React, { useState } from 'react';
import { useAuth } from '../../lib/clerk/useAuth';
import { Sparkles, UserCheck, ChevronDown, Check, X } from 'lucide-react';
import { DEMO_PROFILES } from '../../lib/seed/demoData';

export const DemoModeBanner: React.FC = () => {
  const { isDemoMode, profile, switchPersona } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="bg-[#0A66C2] text-white text-xs py-1.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-[1128px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-bold bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            Demo Mode Active
          </span>
          <span className="hidden sm:inline text-white/90">
            Running offline with 30 simulated profiles, 10 companies, 60 posts, and 40 jobs.
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          <span className="text-white/80 hidden md:inline">Current Persona:</span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 bg-white text-[#0A66C2] font-semibold px-2.5 py-1 rounded-full text-xs shadow-xs hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {profile?.first_name} {profile?.last_name} ({profile?.role})
              </span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-40 max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Switch Test Persona
                  </div>
                  {DEMO_PROFILES.slice(0, 5).map((p) => {
                    const isSelected = profile?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0A66C2] dark:text-[#71B7FB] font-semibold' : ''
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-semibold">{p.first_name} {p.last_name}</div>
                          <div className="text-[10px] text-gray-500 capitalize">{p.role} {p.verified ? '• Verified' : ''}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="text-white/70 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
