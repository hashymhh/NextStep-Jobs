import React, { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Comment, Profile } from '../../types';
import { useAuth } from '../../lib/clerk/useAuth';
import { ThumbsUp, MessageSquare, Reply, CornerDownRight, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (body: string, parentId?: string) => void;
  onToggleCommentLike: (commentId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onToggleCommentLike,
}) => {
  const { profile } = useAuth();
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(commentInput.trim());
    setCommentInput('');
  };

  const handlePostReply = (parentId: string) => {
    if (!replyInput.trim()) return;
    onAddComment(replyInput.trim(), parentId);
    setReplyInput('');
    setReplyingToId(null);
  };

  // Group comments into root and replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-4">
      {/* Top Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-2.5 items-start">
        <Avatar
          name={`${profile?.first_name} ${profile?.last_name}`}
          src={profile?.avatar_url}
          size="sm"
        />
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Add a comment, celebrate an achievement..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
          />
          {commentInput.trim() && (
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-7 text-xs">
                Comment
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {rootComments.map((comment) => {
          const author = comment.author;
          const replies = getReplies(comment.id);
          const timeAgo = comment.created_at
            ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
            : 'recently';

          return (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Avatar
                  name={`${author?.first_name || 'Member'} ${author?.last_name || ''}`}
                  src={author?.avatar_url}
                  size="sm"
                />

                <div className="flex-1">
                  {/* Comment Bubble */}
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/in/${author?.handle || 'member'}`}
                        className="font-bold text-xs text-gray-900 dark:text-white hover:underline"
                      >
                        {author?.first_name} {author?.last_name}
                      </Link>
                      <span className="text-[10px] text-gray-400">{timeAgo}</span>
                    </div>

                    <p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
                      {author?.headline}
                    </p>

                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                      {comment.body}
                    </p>
                  </div>

                  {/* Reaction / Reply bar below comment */}
                  <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-gray-500">
                    <button
                      onClick={() => onToggleCommentLike(comment.id)}
                      className={`font-semibold hover:underline cursor-pointer flex items-center gap-1 ${
                        comment.viewer_has_liked ? 'text-[#0A66C2] dark:text-[#71B7FB]' : ''
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{comment.likes_count > 0 ? comment.likes_count : 'Like'}</span>
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                      className="font-semibold hover:underline cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Inline Reply Input if Active */}
                  {replyingToId === comment.id && (
                    <div className="flex items-center gap-2 mt-2 pt-1">
                      <CornerDownRight className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder={`Reply to ${author?.first_name}...`}
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePostReply(comment.id);
                        }}
                        className="flex-1 text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!replyInput.trim()}
                        onClick={() => handlePostReply(comment.id)}
                      >
                        Reply
                      </Button>
                    </div>
                  )}

                  {/* Nested Replies Stream */}
                  {replies.length > 0 && (
                    <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar
                            name={`${reply.author?.first_name} ${reply.author?.last_name}`}
                            src={reply.author?.avatar_url}
                            size="xs"
                          />
                          <div className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-850 rounded-xl text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-gray-900 dark:text-white">
                                {reply.author?.first_name} {reply.author?.last_name}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) : ''}
                              </span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 mt-0.5 leading-snug">
                              {reply.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
