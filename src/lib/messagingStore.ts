import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, Profile, ChatAttachment } from '../types';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES, DEMO_PROFILES } from './seed/demoData';
import {
  getTotalUnreadCount,
  partitionConversations,
  markThreadMessagesRead,
  buildMessage,
} from '../features/messaging/messagingUtils';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { useAuth } from './clerk/useAuth';

const CONV_STORAGE_KEY = 'nextstep_v2_pk_conversations';
const MSG_STORAGE_KEY = 'nextstep_v2_pk_messages';
const SYNC_EVENT = 'nextstep_v2_pk_messaging_sync';

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(CONV_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEMO_CONVERSATIONS;
}

function loadMessages(): Record<string, Message[]> {
  try {
    const saved = localStorage.getItem(MSG_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEMO_MESSAGES;
}

export function useMessaging() {
  const { profile } = useAuth();
  const currentUserId = profile?.id || 'usr_candidate_john';

  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>(loadMessages);
  const [typingByConv, setTypingByConv] = useState<Record<string, string | null>>({});
  const [dockOpenConvId, setDockOpenConvId] = useState<string | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Sync across tabs (BroadcastChannel + storage + Supabase Realtime when configured)
  useEffect(() => {
    const refreshFromStorage = () => {
      setConversations(loadConversations());
      setMessagesByConv(loadMessages());
    };

    window.addEventListener(SYNC_EVENT, refreshFromStorage);
    window.addEventListener('storage', refreshFromStorage);

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nextstep_pk_realtime_chat');
      broadcastRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'SYNC') {
          refreshFromStorage();
        } else if (ev.data?.type === 'TYPING') {
          const { convId, userName } = ev.data;
          setTypingByConv((prev) => ({ ...prev, [convId]: userName }));
        }
      };
    }

    // Optional Supabase Realtime subscription if configured
    let supabaseCleanup: (() => void) | undefined;
    if (isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const channel = supabase
          .channel('nextstep_pk_messages')
          .on('broadcast', { event: 'new_message' }, () => {
            refreshFromStorage();
          })
          .subscribe();
        supabaseCleanup = () => {
          supabase.removeChannel(channel);
        };
      }
    }

    return () => {
      window.removeEventListener(SYNC_EVENT, refreshFromStorage);
      window.removeEventListener('storage', refreshFromStorage);
      broadcastRef.current?.close();
      supabaseCleanup?.();
    };
  }, []);

  const persistAll = useCallback(
    (nextConvs: Conversation[], nextMsgs: Record<string, Message[]>) => {
      setConversations(nextConvs);
      setMessagesByConv(nextMsgs);
      localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(nextConvs));
      localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(nextMsgs));
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
      broadcastRef.current?.postMessage({ type: 'SYNC' });
    },
    []
  );

  const markConversationRead = useCallback(
    (convId: string) => {
      const currentMsgs = loadMessages();
      const currentConvs = loadConversations();
      const thread = currentMsgs[convId] || [];
      const hasUnread = thread.some(
        (m) => m.sender_id !== currentUserId && !m.read_by.includes(currentUserId)
      );
      if (!hasUnread && currentConvs.find((c) => c.id === convId)?.unread_count === 0) {
        return;
      }

      const updatedThread = markThreadMessagesRead(thread, currentUserId);
      const nextMsgs = { ...currentMsgs, [convId]: updatedThread };
      const nextConvs = currentConvs.map((c) =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      );
      persistAll(nextConvs, nextMsgs);
    },
    [currentUserId, persistAll]
  );

  const sendMessage = useCallback(
    (
      convId: string,
      body: string,
      attachments?: ChatAttachment[],
      simulateReply = true
    ) => {
      if (!body.trim() && (!attachments || attachments.length === 0)) return;

      const currentConvs = loadConversations();
      const currentMsgs = loadMessages();
      const newMsg = buildMessage({
        conversationId: convId,
        senderId: currentUserId,
        sender: profile || undefined,
        body,
        attachments,
      });

      const updatedThread = [...(currentMsgs[convId] || []), newMsg];
      const nextMsgs = { ...currentMsgs, [convId]: updatedThread };
      const nextConvs = currentConvs
        .map((c) =>
          c.id === convId
            ? {
                ...c,
                last_message: newMsg,
                unread_count: 0,
                updated_at: newMsg.created_at,
              }
            : c
        )
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      persistAll(nextConvs, nextMsgs);

      // Simulate realtime partner typing + read receipt + contextual Pakistani tech response
      const targetConv = nextConvs.find((c) => c.id === convId);
      const partner = targetConv?.participants.find((p) => p.id !== currentUserId);

      if (simulateReply && partner && !targetConv?.is_request) {
        setTimeout(() => {
          // Mark user's message as read by partner (Read Receipt!)
          const latestMsgs = loadMessages();
          const latestConvs = loadConversations();
          const threadWithReceipt = (latestMsgs[convId] || []).map((m) =>
            m.id === newMsg.id && !m.read_by.includes(partner.id)
              ? { ...m, read_by: [...m.read_by, partner.id] }
              : m
          );
          persistAll(latestConvs, { ...latestMsgs, [convId]: threadWithReceipt });
          setTypingByConv((prev) => ({ ...prev, [convId]: `${partner.first_name} is typing...` }));
        }, 700);

        setTimeout(() => {
          setTypingByConv((prev) => ({ ...prev, [convId]: null }));
          const latestMsgs = loadMessages();
          const latestConvs = loadConversations();
          const replyText =
            partner.role === 'recruiter'
              ? `JazakAllah ${profile?.first_name || 'Hamza'}! That sounds great — I have noted this on our shortlist and will share the calendar invite in PKT shortly.`
              : `Awesome, thanks for sharing! Let’s sync up at 4:00 PM PKT to go over the details.`;

          const replyMsg = buildMessage({
            conversationId: convId,
            senderId: partner.id,
            sender: partner,
            body: replyText,
          });
          // Mark immediately read if user has thread open, or keep unread if closed
          replyMsg.read_by = [partner.id, currentUserId];

          const nextThread = [...(latestMsgs[convId] || []), replyMsg];
          const updatedConvs = latestConvs.map((c) =>
            c.id === convId ? { ...c, last_message: replyMsg, updated_at: replyMsg.created_at } : c
          );
          persistAll(updatedConvs, { ...latestMsgs, [convId]: nextThread });
        }, 2100);
      }
    },
    [currentUserId, persistAll, profile]
  );

  const acceptMessageRequest = useCallback(
    (convId: string) => {
      const currentConvs = loadConversations();
      const currentMsgs = loadMessages();
      const nextConvs = currentConvs.map((c) =>
        c.id === convId
          ? { ...c, is_request: false, request_status: 'accepted' as const, unread_count: 0 }
          : c
      );
      const nextMsgs = {
        ...currentMsgs,
        [convId]: markThreadMessagesRead(currentMsgs[convId] || [], currentUserId),
      };
      persistAll(nextConvs, nextMsgs);
    },
    [currentUserId, persistAll]
  );

  const declineMessageRequest = useCallback(
    (convId: string) => {
      const currentConvs = loadConversations();
      const currentMsgs = loadMessages();
      const nextConvs = currentConvs.map((c) =>
        c.id === convId ? { ...c, request_status: 'declined' as const, unread_count: 0 } : c
      );
      persistAll(nextConvs, currentMsgs);
    },
    [persistAll]
  );

  const startOrOpenConversation = useCallback(
    (targetProfile: Profile, initialMessage?: string): string => {
      const currentConvs = loadConversations();
      const currentMsgs = loadMessages();
      const existing = currentConvs.find(
        (c) =>
          c.participant_ids.includes(currentUserId) &&
          c.participant_ids.includes(targetProfile.id)
      );

      if (existing) {
        if (initialMessage?.trim()) {
          sendMessage(existing.id, initialMessage, undefined, false);
        }
        setDockOpenConvId(existing.id);
        return existing.id;
      }

      const currentFullProfile =
        profile || DEMO_PROFILES.find((p) => p.id === currentUserId) || DEMO_PROFILES[0];
      const newConvId = `conv_${targetProfile.handle}_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        participant_ids: [currentUserId, targetProfile.id],
        participants: [currentFullProfile, targetProfile],
        is_request: false,
        request_status: 'accepted',
        unread_count: 0,
        updated_at: new Date().toISOString(),
      };

      const initialThread: Message[] = initialMessage?.trim()
        ? [
            buildMessage({
              conversationId: newConvId,
              senderId: currentUserId,
              sender: currentFullProfile,
              body: initialMessage,
            }),
          ]
        : [];

      persistAll([newConv, ...currentConvs], { ...currentMsgs, [newConvId]: initialThread });
      setDockOpenConvId(newConvId);
      return newConvId;
    },
    [currentUserId, persistAll, profile, sendMessage]
  );

  const { focused, requests } = partitionConversations(conversations);
  const totalUnreadCount = getTotalUnreadCount(conversations, messagesByConv, currentUserId);

  return {
    conversations,
    focusedConversations: focused,
    messageRequests: requests,
    messagesByConv,
    typingByConv,
    totalUnreadCount,
    dockOpenConvId,
    setDockOpenConvId,
    markConversationRead,
    sendMessage,
    acceptMessageRequest,
    declineMessageRequest,
    startOrOpenConversation,
  };
}
