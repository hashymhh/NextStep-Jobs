import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/clerk/useAuth';
import { useMessaging } from '../lib/messagingStore';
import { filterConversations } from '../features/messaging/messagingUtils';
import { DEMO_PROFILES } from '../lib/seed/demoData';
import { ChatAttachment, Profile } from '../types';
import { formatTimePKT, formatRelativePKT } from '../lib/locale/pakistan';
import {
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Smile,
  CheckCheck,
  Check,
  Plus,
  X,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const QUICK_EMOJIS = ['👍', '👏', '🤝', '🚀', '✨', '💡', '🎉', '🙏', '✅', '🔥', '🇵🇰', '💼'];

export const MessagingPage: React.FC = () => {
  const { profile } = useAuth();
  const currentUserId = profile?.id || 'usr_candidate_john';

  const {
    focusedConversations,
    messageRequests,
    messagesByConv,
    typingByConv,
    markConversationRead,
    sendMessage,
    acceptMessageRequest,
    declineMessageRequest,
    startOrOpenConversation,
  } = useMessaging();

  const [activeTab, setActiveTab] = useState<'focused' | 'requests'>('focused');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string>(() => {
    return focusedConversations[0]?.id || messageRequests[0]?.id || '';
  });

  const [draftBody, setDraftBody] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const rawList = activeTab === 'focused' ? focusedConversations : messageRequests;
  const visibleConversations = filterConversations(
    rawList,
    messagesByConv,
    currentUserId,
    searchQuery
  );

  // Keep selected conversation valid when switching tabs
  useEffect(() => {
    if (visibleConversations.length > 0 && !visibleConversations.some((c) => c.id === selectedConvId)) {
      setSelectedConvId(visibleConversations[0].id);
    }
  }, [activeTab, visibleConversations, selectedConvId]);

  const activeConv =
    visibleConversations.find((c) => c.id === selectedConvId) ||
    focusedConversations.find((c) => c.id === selectedConvId) ||
    messageRequests.find((c) => c.id === selectedConvId) ||
    null;

  const activeThread = activeConv ? messagesByConv[activeConv.id] || [] : [];
  const activePartner = activeConv
    ? activeConv.participants.find((p) => p.id !== currentUserId) || activeConv.participants[0]
    : null;
  const typingStatus = activeConv ? typingByConv[activeConv.id] : null;

  // Mark active conversation read when opened
  useEffect(() => {
    if (activeConv && !activeConv.is_request) {
      markConversationRead(activeConv.id);
    }
  }, [activeConv, markConversationRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread.length, typingStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      if (!isPdf && !isImage) {
        toast.error('Only Images (PNG/JPG/WebP) and PDF documents are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: ChatAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name: file.name,
          url: typeof reader.result === 'string' ? reader.result : '#',
          size: file.size,
          type: isPdf ? 'pdf' : 'image',
        };
        setPendingAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAttachSampleResume = () => {
    const samplePdf: ChatAttachment = {
      id: `att_cv_${Date.now()}`,
      name: `${profile?.first_name || 'Hamza'}_${profile?.last_name || 'Tariq'}_ATS_Resume_PK.pdf`,
      url: '#resume-pdf',
      size: 194500,
      type: 'pdf',
    };
    setPendingAttachments((prev) => [...prev, samplePdf]);
    toast.success('Attached your NextStep ATS Resume PDF');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!draftBody.trim() && pendingAttachments.length === 0) return;

    sendMessage(activeConv.id, draftBody, pendingAttachments);
    setDraftBody('');
    setPendingAttachments([]);
    setEmojiOpen(false);
  };

  const handleStartConversation = (person: Profile) => {
    const convId = startOrOpenConversation(person);
    setActiveTab('focused');
    setSelectedConvId(convId);
    setNewChatModalOpen(false);
    toast.success(`Opened chat with ${person.first_name} ${person.last_name}`);
  };

  const availableContacts = DEMO_PROFILES.filter(
    (p) =>
      p.id !== currentUserId &&
      (`${p.first_name} ${p.last_name}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
        (p.headline || '').toLowerCase().includes(contactSearch.toLowerCase()))
  );

  return (
    <Shell hideLeftRail hideRightRail fullWidth>
      <Card padding="none" className="overflow-hidden border border-[#E0DFDC] dark:border-[#38434F] min-h-[680px] flex flex-col md:flex-row">
        {/* LEFT PANE: Conversations & Message Requests */}
        <div className="w-full md:w-[350px] lg:w-[370px] border-b md:border-b-0 md:border-r border-[#E0DFDC] dark:border-[#38434F] flex flex-col bg-white dark:bg-[#1B1F23]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E0DFDC] dark:border-[#38434F] flex items-center justify-between">
            <div>
              <h1 className="font-bold text-base text-gray-900 dark:text-white">Messaging</h1>
              <p className="text-[11px] text-gray-500">Realtime sync · PKT (UTC+5)</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setNewChatModalOpen(true)}
            >
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Search messages"
                placeholder="Search conversations or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-md bg-[#EDF3F8] dark:bg-[#22272B] text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
          </div>

          {/* Tabs: Focused vs Requests */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('focused')}
              className={`py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'focused'
                  ? 'border-[#057642] text-[#057642] dark:border-[#34A853] dark:text-[#34A853]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Focused ({focusedConversations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'border-[#057642] text-[#057642] dark:border-[#34A853] dark:text-[#34A853]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Requests</span>
              {messageRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0A66C2] text-white text-[10px] tabular-nums">
                  {messageRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 max-h-[300px] md:max-h-[540px]">
            {visibleConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <MessageSquare className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                {activeTab === 'requests'
                  ? 'No pending message requests.'
                  : 'No conversations match your filter.'}
              </div>
            ) : (
              visibleConversations.map((conv) => {
                const partner =
                  conv.participants.find((p) => p.id !== currentUserId) || conv.participants[0];
                const thread = messagesByConv[conv.id] || [];
                const lastMsg = thread[thread.length - 1] || conv.last_message;
                const unreadInConv = thread.filter(
                  (m) => m.sender_id !== currentUserId && !m.read_by.includes(currentUserId)
                ).length;
                const isSelected = activeConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF3F8] dark:bg-[#242B33]'
                        : unreadInConv > 0
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <Avatar
                      name={`${partner?.first_name || ''} ${partner?.last_name || ''}`}
                      src={partner?.avatar_url}
                      size="md"
                      verified={partner?.verified}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {partner?.first_name} {partner?.last_name}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0 tabular-nums">
                          {lastMsg ? formatRelativePKT(lastMsg.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{partner?.headline}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-xs truncate ${
                            unreadInConv > 0
                              ? 'font-bold text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {typingByConv[conv.id] ? (
                            <span className="text-[#057642] dark:text-[#34A853] font-semibold">
                              {typingByConv[conv.id]}
                            </span>
                          ) : lastMsg ? (
                            `${lastMsg.sender_id === currentUserId ? 'You: ' : ''}${
                              lastMsg.body || 'Shared an attachment'
                            }`
                          ) : (
                            'Start the conversation'
                          )}
                        </p>
                        {unreadInConv > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#0A66C2] text-white text-[10px] font-bold shrink-0 tabular-nums">
                            {unreadInConv}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active 1:1 Thread */}
        <div className="flex-1 flex flex-col bg-[#FAF9F7] dark:bg-[#12161A]">
          {activeConv && activePartner ? (
            <>
              {/* Thread Header */}
              <div className="px-5 py-3 bg-white dark:bg-[#1B1F23] border-b border-[#E0DFDC] dark:border-[#38434F] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link to={`/in/${activePartner.handle}`}>
                    <Avatar
                      name={`${activePartner.first_name} ${activePartner.last_name}`}
                      src={activePartner.avatar_url}
                      size="md"
                      verified={activePartner.verified}
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/in/${activePartner.handle}`}
                        className="font-bold text-sm text-gray-900 dark:text-white hover:underline truncate"
                      >
                        {activePartner.first_name} {activePartner.last_name}
                      </Link>
                      {activePartner.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0A66C2] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{activePartner.headline}</p>
                  </div>
                </div>

                <Link to={`/in/${activePartner.handle}`}>
                  <Button variant="tertiary" size="sm" className="text-xs">
                    View Profile
                  </Button>
                </Link>
              </div>

              {/* Message Request Banner (if pending) */}
              {activeConv.is_request && activeConv.request_status === 'pending' && (
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white">
                      Message Request from {activePartner.first_name} {activePartner.last_name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                      Accepting lets {activePartner.first_name} see read receipts and moves this chat to your Focused inbox.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => {
                        declineMessageRequest(activeConv.id);
                        toast.info('Message request declined');
                      }}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        acceptMessageRequest(activeConv.id);
                        setActiveTab('focused');
                        toast.success(`Accepted request from ${activePartner.first_name}`);
                      }}
                    >
                      Accept Request
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[430px] md:max-h-[480px]">
                {activeThread.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  const seenByPartner = isMine && msg.read_by.some((uid) => uid !== currentUserId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <Avatar
                          name={`${activePartner.first_name} ${activePartner.last_name}`}
                          src={activePartner.avatar_url}
                          size="sm"
                        />
                      )}

                      <div className={`max-w-[78%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMine
                              ? 'bg-[#0A66C2] text-white rounded-br-xs'
                              : 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-gray-100 border border-[#E0DFDC] dark:border-[#38434F] rounded-bl-xs'
                          }`}
                        >
                          {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att) =>
                                att.type === 'image' ? (
                                  <img
                                    key={att.id}
                                    src={att.url}
                                    alt={att.name}
                                    className="rounded-lg max-h-52 w-auto object-cover border border-white/20"
                                  />
                                ) : (
                                  <div
                                    key={att.id}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                                      isMine
                                        ? 'bg-white/15 border-white/25 text-white'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <FileText className="w-5 h-5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold truncate">{att.name}</p>
                                      <p className="text-[10px] opacity-80 tabular-nums">
                                        PDF · {Math.max(1, Math.round(att.size / 1024))} KB
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div
                          className={`flex items-center gap-1.5 text-[10px] text-gray-400 px-1 tabular-nums ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{formatTimePKT(msg.created_at)}</span>
                          {isMine && (
                            <span className="inline-flex items-center gap-0.5 text-[#0A66C2] dark:text-[#71B7FB] font-medium">
                              {seenByPartner ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Seen</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-400">Sent</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {typingStatus && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                    <Avatar
                      name={`${activePartner.first_name} ${activePartner.last_name}`}
                      src={activePartner.avatar_url}
                      size="xs"
                    />
                    <span className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1B1F23] border border-gray-200 dark:border-gray-700 text-[11px] font-medium">
                      {typingStatus}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="p-3.5 bg-white dark:bg-[#1B1F23] border-t border-[#E0DFDC] dark:border-[#38434F] space-y-2.5"
              >
                {/* Pending attachments preview */}
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-gray-800 dark:text-gray-200"
                      >
                        {att.type === 'image' ? (
                          <ImageIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className="max-w-[180px] truncate font-medium">{att.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${att.name}`}
                          onClick={() =>
                            setPendingAttachments((prev) => prev.filter((x) => x.id !== att.id))
                          }
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  aria-label="Write a message"
                  disabled={Boolean(activeConv.is_request && activeConv.request_status === 'pending')}
                  placeholder={
                    activeConv.is_request && activeConv.request_status === 'pending'
                      ? 'Accept the message request above to reply...'
                      : `Write a message to ${activePartner.first_name}...`
                  }
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg bg-[#F4F2EE] dark:bg-[#22272B] text-gray-900 dark:text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2] disabled:opacity-60"
                />

                <div className="flex items-center justify-between gap-2 relative">
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach image or PDF"
                      aria-label="Attach image or PDF"
                      className="p-2 rounded-full text-gray-500 hover:text-[#0A66C2] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleAttachSampleResume}
                      title="Attach ATS Resume PDF"
                      className="px-2.5 py-1 rounded text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>Attach CV</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiOpen(!emojiOpen)}
                        title="Insert emoji"
                        aria-label="Insert emoji"
                        className="p-2 rounded-full text-gray-500 hover:text-[#0A66C2] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {emojiOpen && (
                        <div className="absolute bottom-11 left-0 bg-white dark:bg-[#1B1F23] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 grid grid-cols-6 gap-1 z-30 w-52">
                          {QUICK_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => {
                                setDraftBody((prev) => prev + em);
                                setEmojiOpen(false);
                              }}
                              className="p-1.5 text-base hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      Boolean(activeConv.is_request && activeConv.request_status === 'pending') ||
                      (!draftBody.trim() && pendingAttachments.length === 0)
                    }
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                Select a conversation
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Choose a thread on the left or start a new 1:1 message with recruiters and engineers across Pakistan.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* New Chat Modal */}
      <Modal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        title="Start a New Conversation"
        description="Connect directly with engineers, hiring managers, and recruiters across Pakistan."
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or role (e.g., Ayesha, Zainab, Saad)..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {availableContacts.slice(0, 12).map((person) => (
              <div
                key={person.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={`${person.first_name} ${person.last_name}`}
                    src={person.avatar_url}
                    size="sm"
                    verified={person.verified}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{person.headline}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => handleStartConversation(person)}
                >
                  Message
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Shell>
  );
};
