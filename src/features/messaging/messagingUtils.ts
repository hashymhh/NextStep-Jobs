import { Conversation, Message, Profile, ChatAttachment } from '../../types';

/**
 * Computes total unread messages across accepted/focused conversations for a user.
 */
export function getTotalUnreadCount(
  conversations: Conversation[],
  messagesByConv: Record<string, Message[]>,
  userId: string
): number {
  return conversations.reduce((sum, conv) => {
    if (conv.request_status === 'declined') return sum;
    const thread = messagesByConv[conv.id] || [];
    const unreadInThread = thread.filter(
      (m) => m.sender_id !== userId && !m.read_by.includes(userId)
    ).length;
    return sum + unreadInThread;
  }, 0);
}

/**
 * Splits conversations into Focused (active) and Message Requests (pending non-connection DMs).
 */
export function partitionConversations(conversations: Conversation[]) {
  const focused = conversations.filter((c) => !c.is_request && c.request_status !== 'declined');
  const requests = conversations.filter((c) => c.is_request && c.request_status === 'pending');
  return { focused, requests };
}

/**
 * Filters conversations by partner name, handle, headline, or last message body.
 */
export function filterConversations(
  conversations: Conversation[],
  messagesByConv: Record<string, Message[]>,
  currentUserId: string,
  query: string
): Conversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return conversations;

  return conversations.filter((conv) => {
    const partner = conv.participants.find((p) => p.id !== currentUserId) || conv.participants[0];
    const fullName = `${partner?.first_name || ''} ${partner?.last_name || ''}`.toLowerCase();
    const headline = (partner?.headline || '').toLowerCase();
    const handle = (partner?.handle || '').toLowerCase();
    const thread = messagesByConv[conv.id] || [];
    const lastText = (thread[thread.length - 1]?.body || '').toLowerCase();

    return (
      fullName.includes(q) ||
      headline.includes(q) ||
      handle.includes(q) ||
      lastText.includes(q)
    );
  });
}

/**
 * Marks all messages in a conversation as read by `userId`.
 */
export function markThreadMessagesRead(
  messages: Message[],
  userId: string
): Message[] {
  return messages.map((m) =>
    m.read_by.includes(userId) ? m : { ...m, read_by: [...m.read_by, userId] }
  );
}

/**
 * Creates a new message object with attachments and sender read receipt.
 */
export function buildMessage(params: {
  conversationId: string;
  senderId: string;
  sender?: Profile;
  body: string;
  attachments?: ChatAttachment[];
}): Message {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    sender: params.sender,
    body: params.body.trim(),
    attachments: params.attachments && params.attachments.length > 0 ? params.attachments : undefined,
    read_by: [params.senderId],
    created_at: new Date().toISOString(),
  };
}
