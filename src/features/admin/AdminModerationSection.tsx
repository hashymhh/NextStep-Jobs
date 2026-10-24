import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ContentReport, Post } from '../../types';
import { formatDateTimePKT } from '../../lib/locale/pakistan';
import { AlertTriangle, CheckCircle, EyeOff, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AdminModerationSectionProps {
  reports: ContentReport[];
  allPosts: Post[];
  removedPostIds: string[];
  canModeratePosts: boolean;
  onResolveReport: (
    report: ContentReport,
    resolution: 'resolved_removed' | 'dismissed'
  ) => void;
  onRemovePost: (post: Post) => void;
  onRestorePost: (post: Post) => void;
}

export const AdminModerationSection: React.FC<AdminModerationSectionProps> = ({
  reports,
  allPosts,
  removedPostIds,
  canModeratePosts,
  onResolveReport,
  onRemovePost,
  onRestorePost,
}) => {
  const [subView, setSubView] = useState<'reports' | 'feed'>('reports');
  const [feedQuery, setFeedQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'live' | 'quarantined'>('all');

  const filteredPosts = useMemo(() => {
    return allPosts.filter((p) => {
      const isRemoved = removedPostIds.includes(p.id);
      if (feedFilter === 'live' && isRemoved) return false;
      if (feedFilter === 'quarantined' && !isRemoved) return false;
      if (feedQuery.trim()) {
        const q = feedQuery.toLowerCase();
        const author = `${p.author?.first_name || ''} ${p.author?.last_name || ''}`.toLowerCase();
        const hay = `${p.body} ${author} ${p.hashtags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allPosts, feedFilter, feedQuery, removedPostIds]);

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-gray-200/80 dark:bg-gray-800 gap-1">
          <button
            type="button"
            onClick={() => setSubView('reports')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              subView === 'reports'
                ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Trust &amp; Safety Reports ({pendingReportsCount} pending)
          </button>
          <button
            type="button"
            onClick={() => setSubView('feed')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              subView === 'feed'
                ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Community Feed Posts ({allPosts.length} total · {removedPostIds.length} quarantined)
          </button>
        </div>
      </div>

      {subView === 'reports' ? (
        <div className="space-y-3">
          {reports.map((rep) => (
            <Card key={rep.id} padding="md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-xs min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-gray-900 dark:text-white capitalize">
                      {rep.target_type} Report: {rep.reason}
                    </span>
                    <span className="text-gray-500">· Author: {rep.author_name}</span>
                    <span className="text-gray-500 tabular-nums">
                      · Reported by {rep.reporter_name} on {formatDateTimePKT(rep.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#12161A] p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 mt-1">
                    &ldquo;{rep.target_preview}&rdquo;
                  </p>
                  {rep.details && <p className="text-gray-500">Context: {rep.details}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rep.status === 'pending' ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!canModeratePosts}
                        onClick={() => {
                          onResolveReport(rep, 'resolved_removed');
                          toast.success('Enforced content removal and logged audit decision.');
                        }}
                      >
                        Remove Target &amp; Resolve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canModeratePosts}
                        onClick={() => {
                          onResolveReport(rep, 'dismissed');
                          toast.info('Report dismissed.');
                        }}
                      >
                        Dismiss
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {rep.status === 'resolved_removed' ? 'Resolved (Target Removed)' : 'Dismissed'}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="Search community feed posts"
                  placeholder="Search posts by body text, author, or #hashtag..."
                  value={feedQuery}
                  onChange={(e) => setFeedQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                />
              </div>

              <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 gap-1">
                {(['all', 'live', 'quarantined'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFeedFilter(mode)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      feedFilter === mode
                        ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                    <th className="py-3 px-4 font-semibold">Author</th>
                    <th className="py-3 px-3 font-semibold">Post Excerpt</th>
                    <th className="py-3 px-3 font-semibold text-right">Engagement</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredPosts.slice(0, 35).map((post) => {
                    const isRemoved = removedPostIds.includes(post.id);
                    const authorName = post.author
                      ? `${post.author.first_name} ${post.author.last_name}`
                      : post.company?.name || 'Member';

                    return (
                      <tr key={post.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-gray-900 dark:text-white">{authorName}</p>
                          <p className="text-[11px] text-gray-500 tabular-nums">
                            {formatDateTimePKT(post.created_at)}
                          </p>
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <p className="line-clamp-2 text-gray-700 dark:text-gray-300">
                            {post.body}
                          </p>
                          {post.hashtags.length > 0 && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {post.hashtags.map((h) => `#${h}`).join(' · ')}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {post.likes_count} likes · {post.comments_count} comments
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isRemoved ? (
                            <span className="font-semibold text-[#CC1016]">Quarantined</span>
                          ) : (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Live on Feed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isRemoved ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={!canModeratePosts}
                              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                              onClick={() => {
                                onRestorePost(post);
                                toast.success('Restored post to community feed.');
                              }}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={!canModeratePosts}
                              leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                              onClick={() => {
                                onRemovePost(post);
                                toast.info('Post quarantined from community feed.');
                              }}
                            >
                              Quarantine
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
