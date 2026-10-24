import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Post, Profile, ReactionType, Comment } from '../../types';
import { calculatePollPercentages } from './feedUtils';
import {
  ThumbsUp,
  MessageCircle,
  Repeat,
  Send,
  Bookmark,
  MoreHorizontal,
  Edit3,
  Trash2,
  AlertTriangle,
  Share2,
  Check,
  Globe,
  Users,
  FileText,
  Play,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import { DEMO_PROFILES } from '../../lib/seed/demoData';
import { formatRelativePKT } from '../../lib/locale/pakistan';
import { toast } from 'sonner';

export interface PostCardProps {
  post: Post;
  currentUser: Profile;
  onToggleReaction: (postId: string, reaction: ReactionType) => void;
  onSavePost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onQuotePost: (post: Post) => void;
  onReportPost: (postId: string) => void;
  onInstantRepost: (post: Post) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onAddComment: (postId: string, text: string, parentId?: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onFilterHashtag?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onToggleReaction,
  onSavePost,
  onEditPost,
  onDeletePost,
  onQuotePost,
  onReportPost,
  onInstantRepost,
  onVotePoll,
  onAddComment,
  onDeleteComment,
  onFilterHashtag,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [hoverReactionTray, setHoverReactionTray] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Local comments array for interactivity
  const [commentsList, setCommentsList] = useState<Comment[]>([
    {
      id: `c_${post.id}_1`,
      post_id: post.id,
      author_id: 'usr_recruiter_sarah',
      author: DEMO_PROFILES[1],
      body: 'MashaAllah, great breakdown! Exactly what engineering squads across Pakistan need right now.',
      likes_count: 6,
      viewer_has_liked: false,
      replies: [
        {
          id: `r_${post.id}_1`,
          post_id: post.id,
          author_id: currentUser.id,
          author: currentUser,
          parent_id: `c_${post.id}_1`,
          body: 'Thank you Ayesha, really appreciate your feedback!',
          likes_count: 2,
          created_at: '10m ago · PKT',
        },
      ],
      created_at: '1h ago · PKT',
    },
  ]);

  const author = post.author || post.company;
  const isAuthor =
    post.author_id === currentUser.id ||
    (post.company_id && currentUser.role === 'recruiter');

  const timeAgo = post.created_at ? formatRelativePKT(post.created_at) : 'Just now · PKT';

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      post_id: post.id,
      author_id: currentUser.id,
      author: currentUser,
      body: commentInput.trim(),
      likes_count: 0,
      created_at: 'Just now',
    };

    setCommentsList([newComment, ...commentsList]);
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
    setShowComments(true);
    toast.success('Comment posted');
  };

  const handleReplySubmit = (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    const newReply: Comment = {
      id: `r_${Date.now()}`,
      post_id: post.id,
      author_id: currentUser.id,
      author: currentUser,
      parent_id: parentCommentId,
      body: replyInput.trim(),
      likes_count: 0,
      created_at: 'Just now',
    };

    setCommentsList((prev) =>
      prev.map((c) =>
        c.id === parentCommentId
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      )
    );

    onAddComment(post.id, replyInput.trim(), parentCommentId);
    setReplyInput('');
    setReplyingToCommentId(null);
    toast.success('Reply posted');
  };

  const handleToggleCommentLike = (commentId: string) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const liked = !c.viewer_has_liked;
          return {
            ...c,
            viewer_has_liked: liked,
            likes_count: liked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
          };
        }
        return c;
      })
    );
  };

  const pollPercentages = post.poll
    ? calculatePollPercentages(post.poll.options, post.poll.total_votes)
    : {};

  return (
    <Card padding="none" className="overflow-hidden shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      {/* Post Top Header */}
      <div className="p-4 pb-2 flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            name={
              'first_name' in (author || {})
                ? `${(author as Profile).first_name} ${(author as Profile).last_name}`
                : (author as any)?.name || 'Member'
            }
            src={
              'avatar_url' in (author || {})
                ? (author as Profile).avatar_url
                : (author as any)?.logo_url
            }
            size="md"
            verified={author?.verified}
            openToWork={'open_to_work' in (author || {}) ? (author as Profile).open_to_work : false}
            openToHiring={'open_to_hiring' in (author || {}) ? (author as Profile).open_to_hiring : false}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-[#191919] dark:text-white hover:underline cursor-pointer truncate">
                {'first_name' in (author || {})
                  ? `${(author as Profile).first_name} ${(author as Profile).last_name}`
                  : (author as any)?.name || 'Member'}
              </span>
              {author?.verified && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-[#0A66C2] dark:text-[#71B7FB] px-1.5 py-0.2 rounded-full font-semibold">
                  Verified
                </span>
              )}
              <span className="text-xs text-gray-400">• 1st</span>
            </div>

            <p className="text-xs text-[#666666] dark:text-gray-400 line-clamp-1">
              {'headline' in (author || {})
                ? (author as Profile).headline
                : (author as any)?.tagline}
            </p>

            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
              <span>{timeAgo}</span>
              <span>•</span>
              {post.visibility === 'public' ? (
                <span title="Public to anyone" className="inline-flex items-center">
                  <Globe className="w-3 h-3 text-gray-400" />
                </span>
              ) : (
                <span title="Connections only" className="inline-flex items-center">
                  <Users className="w-3 h-3 text-gray-400" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-Dot Options Menu */}
        <div className="relative">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSavePost(post.id)}
              title={post.viewer_has_saved ? 'Remove saved' : 'Save post'}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bookmark
                className={`w-4 h-4 ${post.viewer_has_saved ? 'fill-[#0A66C2] text-[#0A66C2]' : ''}`}
              />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#1B1F23] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-40 text-left text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSavePost(post.id);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                  <span>{post.viewer_has_saved ? 'Unsave post' : 'Save post'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                    toast.success('Link copied to clipboard');
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copy link to post</span>
                </button>

                {isAuthor ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditPost(post);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit post</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeletePost(post.id);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete post</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onReportPost(post.id);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report post</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Text Body with Highlighted Hashtags */}
      <div className="px-4 py-2 text-xs sm:text-sm text-[#191919] dark:text-gray-100 whitespace-pre-line leading-relaxed">
        {post.body.split(/(\s+)/).map((word, index) => {
          if (word.startsWith('#') && word.length > 1) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onFilterHashtag?.(word.slice(1))}
                className="text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
              >
                {word}
              </button>
            );
          }
          if (word.startsWith('@') && word.length > 1) {
            return (
              <span key={index} className="text-[#0A66C2] dark:text-[#71B7FB] font-semibold">
                {word}
              </span>
            );
          }
          return word;
        })}
      </div>

      {/* Embedded Quoted Post (if this is a Repost with Thoughts) */}
      {post.repost_original && (
        <div className="mx-4 my-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              name={`${post.repost_original.author?.first_name || 'Member'} ${post.repost_original.author?.last_name || ''}`}
              src={post.repost_original.author?.avatar_url}
              size="xs"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {post.repost_original.author?.first_name} {post.repost_original.author?.last_name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{post.repost_original.author?.headline}</p>
            </div>
          </div>
          <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line line-clamp-3">
            {post.repost_original.body}
          </p>
        </div>
      )}

      {/* Post Media: Images */}
      {post.media?.urls && post.media.urls.length > 0 && (
        <div className="mt-2">
          {post.media.urls.length === 1 ? (
            <div className="max-h-[460px] overflow-hidden bg-black/5 dark:bg-black/30">
              <img
                src={post.media.urls[0]}
                alt="Post attachment"
                className="w-full h-auto object-cover max-h-[460px]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 max-h-[400px] overflow-hidden bg-black/5">
              {post.media.urls.slice(0, 4).map((url, i) => (
                <div key={i} className="h-44 overflow-hidden relative">
                  <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Media: Document */}
      {post.media?.documentTitle && (
        <div className="mx-4 my-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-600 rounded">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {post.media.documentTitle}
              </p>
              <p className="text-[10px] text-gray-500">PDF Document • 4 pages</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={() => toast.info(`Previewing ${post.media?.documentTitle || 'PDF Document'}`)}
          >
            Preview PDF
          </Button>
        </div>
      )}

      {/* Post Media: Poll */}
      {post.poll && (
        <div className="mx-4 my-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
          <p className="text-xs font-bold text-gray-900 dark:text-white">
            {post.poll.question}
          </p>
          <div className="space-y-1.5">
            {post.poll.options.map((opt) => {
              const pct = pollPercentages[opt.id] || 0;
              const isVoted = post.poll?.user_voted_option_id === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => onVotePoll(post.id, opt.id)}
                  className={`p-2 rounded-md border text-xs cursor-pointer relative overflow-hidden flex justify-between items-center transition-colors ${
                    isVoted
                      ? 'border-[#0A66C2] bg-blue-50/40 dark:bg-blue-950/20 font-bold'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isVoted && <Check className="w-3.5 h-3.5 text-[#0A66C2]" />}
                    {opt.text}
                  </span>
                  <span className="relative z-10 font-bold text-gray-600 dark:text-gray-300">
                    {pct}%
                  </span>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#0A66C2]/15 dark:bg-[#71B7FB]/25 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400">
            {post.poll.total_votes.toLocaleString()} votes • Poll open
          </p>
        </div>
      )}

      {/* Engagement Counters */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] text-[#666666] dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-[9px]">
              👍
            </span>
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">
              👏
            </span>
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">
              💡
            </span>
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {post.likes_count}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:text-[#0A66C2] hover:underline cursor-pointer"
          >
            {commentsList.length} comments
          </button>
          <span>•</span>
          <span>{post.reposts_count} reposts</span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="px-2 py-1 flex items-center justify-around relative">
        {/* Like Button with Hover Tray */}
        <div
          className="relative"
          onMouseEnter={() => setHoverReactionTray(true)}
          onMouseLeave={() => setHoverReactionTray(false)}
        >
          {/* Reaction Tray */}
          {hoverReactionTray && (
            <div className="absolute -top-11 left-0 bg-white dark:bg-[#1B1F23] shadow-xl rounded-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 flex items-center gap-2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'like');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Like"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'celebrate');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Celebrate"
              >
                👏
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'support');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Support"
              >
                🤝
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'love');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Love"
              >
                ❤️
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'insightful');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Insightful"
              >
                💡
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleReaction(post.id, 'funny');
                  setHoverReactionTray(false);
                }}
                className="text-lg hover:scale-130 transition-transform cursor-pointer"
                title="Funny"
              >
                😄
              </button>
            </div>
          )}

          <button
            onClick={() => onToggleReaction(post.id, 'like')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition-colors cursor-pointer ${
              post.viewer_reaction
                ? 'text-[#0A66C2] dark:text-[#71B7FB]'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 ${post.viewer_reaction ? 'fill-current' : ''}`}
            />
            <span>{post.viewer_reaction ? post.viewer_reaction.toUpperCase() : 'Like'}</span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Repost Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRepostMenu(!showRepostMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <Repeat className="w-4 h-4" />
            <span>Repost</span>
          </button>

          {showRepostMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowRepostMenu(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#1B1F23] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-40 text-left text-xs">
                <button
                  onClick={() => {
                    setShowRepostMenu(false);
                    onInstantRepost(post);
                    toast.success('Reposted instantly to your feed');
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Repeat className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Repost instantly</p>
                    <p className="text-[10px] text-gray-400">Share immediately with your network</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRepostMenu(false);
                    onQuotePost(post);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Repost with thoughts</p>
                    <p className="text-[10px] text-gray-400">Add commentary or quote</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Send / Share Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            toast.success('Post link copied to clipboard');
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>

      {/* Nested Comments Section */}
      {showComments && (
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#14171A] space-y-3">
          {/* Add Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-start gap-2.5">
            <Avatar
              name={`${currentUser.first_name} ${currentUser.last_name}`}
              src={currentUser.avatar_url}
              size="sm"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 rounded-full text-xs px-3"
                disabled={!commentInput.trim()}
              >
                Post
              </Button>
            </div>
          </form>

          {/* Comments Feed */}
          <div className="space-y-3 pt-2">
            {commentsList.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar
                  name={`${c.author?.first_name} ${c.author?.last_name}`}
                  src={c.author?.avatar_url}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="p-3 bg-white dark:bg-[#1B1F23] rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {c.author?.first_name} {c.author?.last_name}
                        </span>
                        <p className="text-[10px] text-gray-400 line-clamp-1">
                          {c.author?.headline}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400">{c.created_at}</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line">
                      {c.body}
                    </p>
                  </div>

                  {/* Comment Actions (Like, Reply) */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1 pl-2">
                    <button
                      onClick={() => handleToggleCommentLike(c.id)}
                      className={`font-semibold hover:underline cursor-pointer ${
                        c.viewer_has_liked ? 'text-[#0A66C2] dark:text-[#71B7FB]' : ''
                      }`}
                    >
                      Like ({c.likes_count})
                    </button>
                    <span>•</span>
                    <button
                      onClick={() =>
                        setReplyingToCommentId(
                          replyingToCommentId === c.id ? null : c.id
                        )
                      }
                      className="font-semibold hover:underline cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Reply Input Box */}
                  {replyingToCommentId === c.id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, c.id)}
                      className="flex items-center gap-2 mt-2 pl-2"
                    >
                      <input
                        type="text"
                        placeholder={`Reply to ${c.author?.first_name}...`}
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 text-xs px-2.5 rounded-full"
                        disabled={!replyInput.trim()}
                      >
                        Reply
                      </Button>
                    </form>
                  )}

                  {/* Nested Replies Stream */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-800">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar
                            name={`${reply.author?.first_name} ${reply.author?.last_name}`}
                            src={reply.author?.avatar_url}
                            size="xs"
                          />
                          <div className="p-2.5 bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-gray-800 flex-1">
                            <span className="font-bold text-[11px] text-gray-900 dark:text-white">
                              {reply.author?.first_name} {reply.author?.last_name}
                            </span>
                            <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                              {reply.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <Card padding="none" className="overflow-hidden animate-pulse">
      <div className="p-4 pb-2 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="w-1/3 h-3.5 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="w-1/2 h-2.5 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="w-1/4 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-44 bg-gray-100 dark:bg-gray-800/60 mx-4 my-2 rounded-lg" />
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-around">
        <div className="w-14 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-14 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-14 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-14 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </Card>
  );
};
