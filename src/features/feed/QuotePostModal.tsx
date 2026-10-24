import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Post, Profile } from '../../types';
import { extractHashtags } from './feedUtils';
import { Repeat } from 'lucide-react';
import { toast } from 'sonner';

export interface QuotePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPost: Post;
  author: Profile;
  onQuotePost: (originalPostId: string, thoughts: string, hashtags: string[]) => void;
}

export const QuotePostModal: React.FC<QuotePostModalProps> = ({
  isOpen,
  onClose,
  originalPost,
  author,
  onQuotePost,
}) => {
  const [thoughts, setThoughts] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughts.trim()) {
      toast.error('Please add your thoughts before reposting');
      return;
    }
    const tags = extractHashtags(thoughts.trim());
    onQuotePost(originalPost.id, thoughts.trim(), tags);
    toast.success('Reposted with your thoughts!');
    onClose();
  };

  const origAuthor = originalPost.author;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repost with your thoughts"
      description="Add your commentary before sharing with your network."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Active user header */}
        <div className="flex items-center gap-3">
          <Avatar
            name={`${author.first_name} ${author.last_name}`}
            src={author.avatar_url}
            size="md"
          />
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              {author.first_name} {author.last_name}
            </p>
            <p className="text-xs text-gray-500">Posting publicly</p>
          </div>
        </div>

        {/* User's Thoughts Input */}
        <textarea
          rows={3}
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
          placeholder="What do you think about this?"
          className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
        />

        {/* Original Post Preview Box */}
        <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar
              name={`${origAuthor?.first_name} ${origAuthor?.last_name}`}
              src={origAuthor?.avatar_url}
              size="xs"
            />
            <div className="truncate">
              <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                {origAuthor?.first_name} {origAuthor?.last_name}
              </span>
              <p className="text-[10px] text-gray-500 truncate">{origAuthor?.headline}</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
            {originalPost.body}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!thoughts.trim()}
            leftIcon={<Repeat className="w-3.5 h-3.5" />}
          >
            Repost
          </Button>
        </div>
      </form>
    </Modal>
  );
};
