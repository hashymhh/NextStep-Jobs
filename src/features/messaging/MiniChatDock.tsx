import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../lib/clerk/useAuth';
import { useMessaging } from '../../lib/messagingStore';
import { Avatar } from '../../components/ui/Avatar';
import { formatTimePKT } from '../../lib/locale/pakistan';
import {
  ChevronUp,
  ChevronDown,
  Send,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const MiniChatDock: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const currentUserId = profile?.id || 'usr_candidate_john';

  const {
    focusedConversations,
    messagesByConv,
    totalUnreadCount,
    dockOpenConvId,
    setDockOpenConvId,
    sendMessage,
    markConversationRead,
  } = useMessaging();

  const [listExpanded, setListExpanded] = useState(false);
  const [miniDraft, setMiniDraft] = useState('');

  // Hide dock when already on the full /messaging screen or Resume Builder print preview
  if (location.pathname.startsWith('/messaging') || location.pathname.startsWith('/resume-builder')) {
    return null;
  }

  const activeDockConv = dockOpenConvId
    ? focusedConversations.find((c) => c.id === dockOpenConvId) || null
    : null;
  const activePartner = activeDockConv
    ? activeDockConv.participants.find((p) => p.id !== currentUserId) || activeDockConv.participants[0]
    : null;
  const activeThread = activeDockConv ? (messagesByConv[activeDockConv.id] || []).slice(-6) : [];

  const handleMiniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDockConv || !miniDraft.trim()) return;
    sendMessage(activeDockConv.id, miniDraft.trim());
    setMiniDraft('');
  };

  return (
    <div className="no-print hidden lg:flex items-end gap-3 fixed bottom-0 right-44 z-30">
      {/* Open 1:1 Mini Thread Window */}
      {activeDockConv && activePartner && (
        <div className="w-72 bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-t-xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-[#191919] dark:bg-[#242B33] text-white flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                name={`${activePartner.first_name} ${activePartner.last_name}`}
                src={activePartner.avatar_url}
                size="xs"
              />
              <span className="text-xs font-bold truncate">
                {activePartner.first_name} {activePartner.last_name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/messaging"
                title="Open full messaging"
                className="p-1 text-gray-300 hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                aria-label="Close mini chat"
                onClick={() => setDockOpenConvId(null)}
                className="p-1 text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2 h-56 overflow-y-auto bg-[#FAF9F7] dark:bg-[#12161A] text-xs">
            {activeThread.map((m) => {
              const isMine = m.sender_id === currentUserId;
              return (
                <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-2.5 py-1.5 rounded-xl max-w-[85%] ${
                      isMine
                        ? 'bg-[#0A66C2] text-white'
                        : 'bg-white dark:bg-[#1B1F23] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {m.body || 'Shared attachment'}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 tabular-nums">
                    {formatTimePKT(m.created_at, false)}
                  </span>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleMiniSubmit}
            className="p-2 bg-white dark:bg-[#1B1F23] border-t border-gray-200 dark:border-gray-800 flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="Write a quick message..."
              value={miniDraft}
              onChange={(e) => setMiniDraft(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
            />
            <button
              type="submit"
              aria-label="Send quick message"
              disabled={!miniDraft.trim()}
              className="p-1.5 rounded-full bg-[#0A66C2] text-white disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Collapsible Messaging Dock List */}
      <div className="w-68 bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-t-xl shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setListExpanded(!listExpanded)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Avatar
              name={`${profile?.first_name || 'Hamza'} ${profile?.last_name || 'Tariq'}`}
              src={profile?.avatar_url}
              size="xs"
            />
            <span className="font-bold text-xs text-gray-900 dark:text-white">Messaging</span>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#CC1016] text-white text-[10px] font-bold tabular-nums">
                {totalUnreadCount}
              </span>
            )}
          </div>
          {listExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {listExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-800 max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {focusedConversations.slice(0, 5).map((conv) => {
              const partner =
                conv.participants.find((p) => p.id !== currentUserId) || conv.participants[0];
              const thread = messagesByConv[conv.id] || [];
              const last = thread[thread.length - 1];
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setDockOpenConvId(conv.id);
                    markConversationRead(conv.id);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Avatar
                    name={`${partner?.first_name || ''} ${partner?.last_name || ''}`}
                    src={partner?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {partner?.first_name} {partner?.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {last?.body || 'Open chat'}
                    </p>
                  </div>
                </button>
              );
            })}
            <Link
              to="/messaging"
              className="block text-center py-2 text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
            >
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Open Full Inbox
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
