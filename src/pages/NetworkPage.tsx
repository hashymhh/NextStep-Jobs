import React, { useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useNetwork } from '../lib/networkStore';
import { useAuth } from '../lib/clerk/useAuth';
import {
  Users,
  UserPlus,
  Check,
  X,
  UserCheck,
  Shield,
  Clock,
  Send,
  MessageSquare,
  Search,
  UserMinus,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDatePKT } from '../lib/locale/pakistan';
import { toast } from 'sonner';

export const NetworkPage: React.FC = () => {
  const { profile } = useAuth();
  const {
    incomingRequests,
    outgoingRequests,
    acceptedConnections,
    recommendedPeople,
    accept,
    decline,
    withdraw,
    connect,
    remove,
    dismissRecommendation,
    getMutualInfo,
  } = useNetwork();

  const [activeTab, setActiveTab] = useState<'grow' | 'connections' | 'sent'>('grow');
  const [connectionsSearch, setConnectionsSearch] = useState('');

  const filteredConnections = acceptedConnections.filter((conn) => {
    if (!connectionsSearch.trim()) return true;
    const partner = conn.partner;
    if (!partner) return false;
    const fullName = `${partner.first_name} ${partner.last_name}`.toLowerCase();
    const headline = (partner.headline || '').toLowerCase();
    const q = connectionsSearch.toLowerCase();
    return fullName.includes(q) || headline.includes(q);
  });

  const handleAccept = (connId: string, name: string) => {
    accept(connId);
    toast.success(`Connected with ${name}`);
  };

  const handleDecline = (connId: string, name: string) => {
    decline(connId);
    toast.info(`Invitation from ${name} ignored`);
  };

  const handleWithdraw = (connId: string, name: string) => {
    withdraw(connId);
    toast.info(`Invitation to ${name} withdrawn`);
  };

  const handleConnect = (person: any) => {
    connect(person);
    toast.success(`Invitation sent to ${person.first_name} ${person.last_name}`);
  };

  const handleRemove = (connId: string, name: string) => {
    remove(connId);
    toast.info(`Removed ${name} from your connections`);
  };

  return (
    <Shell
      leftRail={
        <div className="space-y-3">
          <Card padding="md">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
              Manage my network
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setActiveTab('connections')}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-md transition-colors cursor-pointer text-left ${
                  activeTab === 'connections'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0A66C2] dark:text-[#71B7FB] font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-gray-500" />
                  Connections
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {acceptedConnections.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('grow')}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-md transition-colors cursor-pointer text-left ${
                  activeTab === 'grow'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0A66C2] dark:text-[#71B7FB] font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-gray-500" />
                  Pending Invitations
                </span>
                {incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#0A66C2] text-white">
                    {incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('sent')}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-md transition-colors cursor-pointer text-left ${
                  activeTab === 'sent'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0A66C2] dark:text-[#71B7FB] font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-gray-500" />
                  Sent Invitations
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {outgoingRequests.length}
                </span>
              </button>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between py-2 px-2.5 text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    Following &amp; followers
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile?.following_count || 128}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-2.5 text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-gray-500" />
                    Pages &amp; Groups
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">14</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tab Bar for Network view */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 pt-2">
            <button
              onClick={() => setActiveTab('grow')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'grow'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Grow Network {incomingRequests.length > 0 && `(${incomingRequests.length})`}
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'connections'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Connections ({acceptedConnections.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sent'
                  ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#71B7FB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sent Requests ({outgoingRequests.length})
            </button>
          </div>
        </Card>

        {/* TAB 1: GROW NETWORK (Pending Incoming + Recommendations) */}
        {activeTab === 'grow' && (
          <>
            {/* Incoming Invitations Box */}
            {incomingRequests.length > 0 && (
              <Card padding="md">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#0A66C2]" />
                    <h3 className="font-bold text-sm text-[#191919] dark:text-white">
                      Invitations Received ({incomingRequests.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Pending response</span>
                </div>

                <div className="space-y-3">
                  {incomingRequests.map((inv) => {
                    const mutual = getMutualInfo(inv.partner?.id || '');
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/60 last:border-none last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={`${inv.partner?.first_name} ${inv.partner?.last_name}`}
                            src={inv.partner?.avatar_url}
                            size="md"
                            openToWork={inv.partner?.open_to_work}
                            openToHiring={inv.partner?.open_to_hiring}
                          />
                          <div className="truncate">
                            <Link
                              to={`/in/${inv.partner?.handle}`}
                              className="font-bold text-xs sm:text-sm text-[#191919] dark:text-white hover:underline truncate block"
                            >
                              {inv.partner?.first_name} {inv.partner?.last_name}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {inv.partner?.headline}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#0A66C2]" />
                              {mutual.displayText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() =>
                              handleDecline(
                                inv.id,
                                `${inv.partner?.first_name} ${inv.partner?.last_name}`
                              )
                            }
                          >
                            Ignore
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleAccept(
                                inv.id,
                                `${inv.partner?.first_name} ${inv.partner?.last_name}`
                              )
                            }
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* People You May Know Grid */}
            <Card padding="md">
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0A66C2]" />
                  <h3 className="font-bold text-sm text-[#191919] dark:text-white">
                    People you may know based on your role &amp; skills
                  </h3>
                </div>
                <span className="text-xs text-[#0A66C2] font-semibold">
                  {recommendedPeople.length} recommendations
                </span>
              </div>

              {recommendedPeople.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  You’ve reviewed all current recommendations! Check back later.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendedPeople.slice(0, 9).map((person) => {
                    const mutual = getMutualInfo(person.id);

                    return (
                      <div
                        key={person.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700/80 p-3.5 flex flex-col items-center text-center relative overflow-hidden bg-white dark:bg-[#1B1F23] hover:shadow-sm transition-shadow group"
                      >
                        {/* Dismiss button */}
                        <button
                          onClick={() => dismissRecommendation(person.id)}
                          title="Dismiss recommendation"
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center z-20 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Top decorative gradient banner */}
                        <div className="h-14 w-full bg-gradient-to-r from-blue-500/20 via-sky-400/20 to-indigo-500/20 absolute top-0 left-0" />

                        {/* Avatar */}
                        <div className="mt-5 mb-2 relative z-10">
                          <Avatar
                            name={`${person.first_name} ${person.last_name}`}
                            src={person.avatar_url}
                            size="lg"
                            openToWork={person.open_to_work}
                            openToHiring={person.open_to_hiring}
                          />
                        </div>

                        {/* Name & Headline */}
                        <Link
                          to={`/in/${person.handle}`}
                          className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline line-clamp-1"
                        >
                          {person.first_name} {person.last_name}
                        </Link>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 min-h-[32px] px-1">
                          {person.headline}
                        </p>

                        {/* Mutual Connection Badge */}
                        <div className="mt-2 mb-3 px-2 py-1 bg-gray-50 dark:bg-gray-800/80 rounded text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1.5 w-full justify-center">
                          <Users className="w-3 h-3 text-[#0A66C2] shrink-0" />
                          <span className="truncate">{mutual.displayText}</span>
                        </div>

                        {/* Connect Action */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-auto text-xs h-8"
                          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                          onClick={() => handleConnect(person)}
                        >
                          Connect
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* TAB 2: MY CONNECTIONS */}
        {activeTab === 'connections' && (
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#191919] dark:text-white">
                  {acceptedConnections.length} Connections
                </h3>
                <p className="text-xs text-gray-500">
                  People in your professional network
                </p>
              </div>

              {/* Search Connections Input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or title..."
                  value={connectionsSearch}
                  onChange={(e) => setConnectionsSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>
            </div>

            {filteredConnections.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {connectionsSearch
                  ? `No connections match "${connectionsSearch}"`
                  : 'You have not connected with anyone yet. Check out "Grow Network" to connect!'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredConnections.map((conn) => {
                  const partner = conn.partner;
                  if (!partner) return null;
                  return (
                    <div
                      key={conn.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={`${partner.first_name} ${partner.last_name}`}
                          src={partner.avatar_url}
                          size="md"
                          openToWork={partner.open_to_work}
                          openToHiring={partner.open_to_hiring}
                        />
                        <div className="truncate">
                          <Link
                            to={`/in/${partner.handle}`}
                            className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline truncate block"
                          >
                            {partner.first_name} {partner.last_name}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">{partner.headline}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Connected {formatDatePKT(conn.created_at)} (PKT)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link to="/messaging">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                          >
                            Message
                          </Button>
                        </Link>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() =>
                            handleRemove(conn.id, `${partner.first_name} ${partner.last_name}`)
                          }
                          title="Remove connection"
                        >
                          <UserMinus className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: SENT INVITATIONS (WITHDRAW OPTION) */}
        {activeTab === 'sent' && (
          <Card padding="md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#0A66C2]" />
                <h3 className="font-bold text-sm text-[#191919] dark:text-white">
                  Sent Invitations ({outgoingRequests.length})
                </h3>
              </div>
              <span className="text-xs text-gray-500">Awaiting recipient approval</span>
            </div>

            {outgoingRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                You have no pending sent invitations.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {outgoingRequests.map((req) => {
                  const partner = req.partner;
                  return (
                    <div
                      key={req.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={`${partner?.first_name} ${partner?.last_name}`}
                          src={partner?.avatar_url}
                          size="md"
                        />
                        <div className="truncate">
                          <Link
                            to={`/in/${partner?.handle}`}
                            className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:underline truncate block"
                          >
                            {partner?.first_name} {partner?.last_name}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">{partner?.headline}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Sent {formatDatePKT(req.created_at)} (PKT)
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() =>
                          handleWithdraw(
                            req.id,
                            `${partner?.first_name} ${partner?.last_name}`
                          )
                        }
                      >
                        Withdraw
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </Shell>
  );
};
