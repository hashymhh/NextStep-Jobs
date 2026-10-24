import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Post } from '../../types';
import { useAuth } from '../../lib/clerk/useAuth';
import { Repeat } from 'lucide-react';
import { toast } from 'sonner';

export interface QuoteRepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPost: Post;
  onQuoteCreated: (newPost: Post) => void;
}

export const QuoteRepostModal: React.FC<QuoteRepostModalProps> = ({
  isOpen,
  onClose,
  originalPost,
  onQuoteCreated,
}) => {
  const { profile } = useAuth();
  const [thoughts, setThoughts] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const quotePost: Post = {
      id: `post_quote_${Date.now()}`,
      author_id: profile.id,
      author: profile,
      body: thoughts.trim(),
      kind: 'text',
      visibility: 'public',
      repost_of: originalPost.id,
      repost_original: originalPost,
      repost_comment: thoughts.trim(),
      hashtags: ['repost', 'career'],
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onQuoteCreated(quotePost);
    toast.success('Reposted to your network');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repost with your thoughts"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <Avatar
            name={`${profile?.first_name} ${profile?.last_name}`}
            src={profile?.avatar_url}
            size="md"
          />
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-500">Posting to Anyone</p>
          </div>
        </div>

        {/* Commentary input */}
        <textarea
          rows={3}
          placeholder="What do you think about this? Add your perspective..."
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
          className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
        />

        {/* Embedded Original Post Card */}
        <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar
              name={`${originalPost.author?.first_name} ${originalPost.author?.last_name}`}
              src={originalPost.author?.avatar_url}
              size="xs"
            />
            <div className="truncate">
              <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                {originalPost.author?.first_name} {originalPost.author?.last_name}
              </span>
              <span className="text-[10px] text-gray-400 ml-1.5">• 1st</span>
              <p className="text-[10px] text-gray-500 truncate">
                {originalPost.author?.headline}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
            {originalPost.body}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" type="button" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={<Repeat className="w-4 h-4" />}
            disabled={!thoughts.trim()}
          >
            Post Thoughts
          </Button>
        </div>
      </form>
    </Modal>
  );
};
