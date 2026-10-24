import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Post } from '../../types';
import { extractHashtags } from './feedUtils';
import { Globe, Users } from 'lucide-react';
import { toast } from 'sonner';

export interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onSave: (postId: string, newBody: string, visibility: 'public' | 'connections', hashtags: string[]) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onSave,
}) => {
  const [body, setBody] = useState(post.body);
  const [visibility, setVisibility] = useState<'public' | 'connections'>(post.visibility);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    const tags = extractHashtags(body.trim());
    onSave(post.id, body.trim(), visibility, tags);
    toast.success('Post updated');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Post"
      description="Make changes to your post text or visibility settings."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visibility toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 rounded-full px-2.5 py-1 bg-gray-50 dark:bg-gray-800">
            {visibility === 'public' ? <Globe className="w-3.5 h-3.5 text-gray-500" /> : <Users className="w-3.5 h-3.5 text-gray-500" />}
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="bg-transparent border-none text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="public">Anyone (Public)</option>
              <option value="connections">Connections only</option>
            </select>
          </div>
        </div>

        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
