import React, { useState, useMemo } from 'react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/clerk/useAuth';
import { DEMO_POSTS, DEMO_COMPANIES } from '../lib/seed/demoData';
import { Post, PostKind, ReactionType, Company } from '../types';
import { PostCard, PostCardSkeleton } from '../features/feed/PostCard';
import { CreatePostModal } from '../features/feed/CreatePostModal';
import { EditPostModal } from '../features/feed/EditPostModal';
import { QuotePostModal } from '../features/feed/QuotePostModal';
import { ReportPostModal } from '../features/feed/ReportPostModal';
import { sortPosts, filterPosts } from '../features/feed/feedUtils';
import { useAdminStore } from '../lib/adminStore';
import { usePostsStore } from '../lib/postsStore';
import {
  Image,
  Video,
  BarChart2,
  FileText,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_TAGS = [
  'pakistantech',
  'lahorejobs',
  'engineering',
  'careers',
  'ai',
  'hiring',
  'remote',
  'nextstep',
];

export const HomePage: React.FC = () => {
  const { profile } = useAuth();
  const { submitContentReport } = useAdminStore();
  const { activePosts: posts, saveAllPosts: setPosts } = usePostsStore();
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialKind, setCreateInitialKind] = useState<PostKind>('text');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotingPost, setQuotingPost] = useState<Post | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  // Filtered & Sorted Posts
  const visiblePosts = useMemo(() => {
    let result = posts;
    if (activeTag) {
      result = filterPosts(result, activeTag);
    } else if (searchQuery.trim()) {
      result = filterPosts(result, searchQuery);
    }
    return sortPosts(result, sortBy);
  }, [posts, activeTag, searchQuery, sortBy]);

  const primaryCompany: Company | undefined = DEMO_COMPANIES[0];

  const handleOpenCreateModal = (kind: PostKind = 'text') => {
    setCreateInitialKind(kind);
    setCreateModalOpen(true);
  };

  const handleCreatePost = (
    newPostData: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'reposts_count' | 'created_at' | 'updated_at'>
  ) => {
    if (!profile) return;

    const newPost: Post = {
      ...newPostData,
      id: `post_${Date.now()}`,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPosts([newPost, ...posts]);
    setCreateModalOpen(false);
    toast.success('Your post was published to your network!');
  };

  const handleToggleReaction = (postId: string, reaction: ReactionType = 'like') => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasReacted = post.viewer_reaction === reaction;
          return {
            ...post,
            viewer_reaction: hasReacted ? undefined : reaction,
            likes_count: hasReacted
              ? Math.max(0, post.likes_count - 1)
              : post.viewer_reaction
              ? post.likes_count
              : post.likes_count + 1,
          };
        }
        return post;
      })
    );
  };

  const handleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newState = !p.viewer_has_saved;
          toast.success(newState ? 'Post saved to your items' : 'Post removed from saved items');
          return { ...p, viewer_has_saved: newState };
        }
        return p;
      })
    );
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditModalOpen(true);
  };

  const handleSaveEditedPost = (
    postId: string,
    newBody: string,
    visibility: 'public' | 'connections',
    hashtags: string[]
  ) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              body: newBody,
              visibility,
              hashtags,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
    setEditModalOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success('Post deleted successfully');
  };

  const handleInstantRepost = (origPost: Post) => {
    if (!profile) return;
    const repostItem: Post = {
      id: `post_repost_${Date.now()}`,
      author_id: profile.id,
      author: profile,
      body: `Reposted from ${origPost.author?.first_name || 'Member'} ${origPost.author?.last_name || ''}`,
      kind: 'text',
      visibility: 'public',
      hashtags: origPost.hashtags || [],
      repost_of: origPost.id,
      repost_original: origPost,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Increment reposts_count on original
    setPosts((prev) => [
      repostItem,
      ...prev.map((p) => (p.id === origPost.id ? { ...p, reposts_count: p.reposts_count + 1 } : p)),
    ]);
  };

  const handleOpenQuote = (post: Post) => {
    setQuotingPost(post);
    setQuoteModalOpen(true);
  };

  const handleQuotePostSubmit = (
    originalPostId: string,
    thoughts: string,
    hashtags: string[]
  ) => {
    if (!profile || !quotingPost) return;
    const quotePostItem: Post = {
      id: `post_quote_${Date.now()}`,
      author_id: profile.id,
      author: profile,
      body: thoughts,
      kind: 'text',
      visibility: 'public',
      hashtags: hashtags.length > 0 ? hashtags : quotingPost.hashtags || [],
      repost_of: originalPostId,
      repost_original: quotingPost,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPosts((prev) => [
      quotePostItem,
      ...prev.map((p) => (p.id === originalPostId ? { ...p, reposts_count: p.reposts_count + 1 } : p)),
    ]);
    setQuoteModalOpen(false);
  };

  const handleOpenReport = (postId: string) => {
    setReportingPostId(postId);
    setReportModalOpen(true);
  };

  const handleReportPostSubmit = (postId: string, reason: string, details?: string) => {
    const target = posts.find((p) => p.id === postId);
    submitContentReport({
      target_type: 'post',
      target_id: postId,
      target_preview: target ? target.body.slice(0, 120) : `Post ${postId}`,
      author_name: target?.author
        ? `${target.author.first_name} ${target.author.last_name}`
        : target?.company?.name || 'Member',
      reporter_id: profile?.id || 'usr_candidate_john',
      reporter_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Hamza Tariq',
      reason,
      details,
    });
    setReportModalOpen(false);
    setReportingPostId(null);
    toast.success('Report submitted to NextStep Pakistan Trust & Safety queue');
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId && p.poll) {
          if (p.poll.user_voted_option_id === optionId) return p;

          const previousVotedId = p.poll.user_voted_option_id;
          const updatedOptions = p.poll.options.map((opt) => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            if (opt.id === previousVotedId) {
              return { ...opt, votes: Math.max(0, opt.votes - 1) };
            }
            return opt;
          });

          return {
            ...p,
            poll: {
              ...p.poll,
              options: updatedOptions,
              user_voted_option_id: optionId,
              total_votes: previousVotedId ? p.poll.total_votes : p.poll.total_votes + 1,
            },
          };
        }
        return p;
      })
    );
    toast.success('Your vote has been cast');
  };

  const handleAddComment = (postId: string, text: string, parentId?: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: p.comments_count + 1,
          };
        }
        return p;
      })
    );
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setIsLoadingMore(false);
      setHasMore(false);
      toast.info("You're all caught up with the latest updates!");
    }, 800);
  };

  if (!profile) return null;

  return (
    <Shell>
      <div className="space-y-3 pb-8">
        {/* Post Creation Box */}
        <Card padding="md" className="shadow-xs">
          <div className="flex items-center gap-3">
            <Avatar
              name={`${profile.first_name || 'Me'} ${profile.last_name || ''}`}
              src={profile.avatar_url}
              size="md"
              openToWork={profile.open_to_work}
              openToHiring={profile.open_to_hiring}
            />
            <button
              onClick={() => handleOpenCreateModal('text')}
              className="flex-1 text-left py-2.5 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer"
            >
              Start a post, share ideas or questions...
            </button>
          </div>

          {/* Quick Media / Attachment Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => handleOpenCreateModal('image')}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <Image className="w-4 h-4 text-[#378FE9]" />
              <span className="hidden sm:inline">Media</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('video')}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4 text-[#5F9B41]" />
              <span className="hidden sm:inline">Video</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('poll')}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-[#C37D16]" />
              <span className="hidden sm:inline">Create poll</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('article')}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#E06847]" />
              <span className="hidden sm:inline">Write article</span>
            </button>
          </div>
        </Card>

        {/* Hashtags Filter Rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTag === null
                ? 'bg-[#0A66C2] text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            All Updates
          </button>
          {POPULAR_TAGS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-[#0A66C2] text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>#{tag}</span>
                {isActive && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Feed Sorter & Count Bar */}
        <div className="flex items-center justify-between py-1">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs text-gray-500 font-medium">Sort by:</span>
            <div className="inline-flex rounded-md shadow-2xs">
              <button
                type="button"
                onClick={() => setSortBy('top')}
                className={`px-2 py-0.5 text-xs font-bold rounded-l-md border border-gray-300 dark:border-gray-700 cursor-pointer ${
                  sortBy === 'top'
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-2 py-0.5 text-xs font-bold rounded-r-md border-y border-r border-gray-300 dark:border-gray-700 cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                Recent
              </button>
            </div>
          </div>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
        </div>

        {/* Posts Stream */}
        {visiblePosts.length === 0 ? (
          <Card padding="lg" className="text-center py-10 space-y-3">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto text-[#0A66C2]">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No posts found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no updates matching #{activeTag || searchQuery}. Try clearing your filter or
              be the first to share an update with this tag!
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActiveTag(null);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={profile}
                onToggleReaction={handleToggleReaction}
                onSavePost={handleSavePost}
                onEditPost={handleOpenEdit}
                onDeletePost={handleDeletePost}
                onQuotePost={handleOpenQuote}
                onReportPost={handleOpenReport}
                onInstantRepost={handleInstantRepost}
                onVotePoll={handleVotePoll}
                onAddComment={handleAddComment}
                onFilterHashtag={(tag) => setActiveTag(tag)}
              />
            ))}

            {/* Loading Skeleton Simulation */}
            {isLoadingMore && (
              <div className="space-y-3 pt-2">
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoadingMore && (
              <div className="text-center pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="rounded-full px-6"
                  onClick={handleLoadMore}
                >
                  Load more posts
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <CreatePostModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          author={profile}
          company={primaryCompany}
          initialKind={createInitialKind}
          onCreatePost={handleCreatePost}
        />

        {editingPost && (
          <EditPostModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingPost(null);
            }}
            post={editingPost}
            onSave={handleSaveEditedPost}
          />
        )}

        {quotingPost && (
          <QuotePostModal
            isOpen={quoteModalOpen}
            onClose={() => {
              setQuoteModalOpen(false);
              setQuotingPost(null);
            }}
            originalPost={quotingPost}
            author={profile}
            onQuotePost={handleQuotePostSubmit}
          />
        )}

        {reportingPostId && (
          <ReportPostModal
            isOpen={reportModalOpen}
            onClose={() => {
              setReportModalOpen(false);
              setReportingPostId(null);
            }}
            postId={reportingPostId}
            onReport={handleReportPostSubmit}
          />
        )}
      </div>
    </Shell>
  );
};
