import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Profile, Company, Post, PostKind, PollData } from '../../types';
import { extractHashtags } from './feedUtils';
import {
  Globe,
  Users,
  Image,
  Video,
  FileText,
  BarChart2,
  FileCode,
  X,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: Profile;
  company?: Company;
  initialKind?: PostKind;
  onCreatePost: (post: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'reposts_count' | 'created_at' | 'updated_at'>) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  author,
  company,
  initialKind = 'text',
  onCreatePost,
}) => {
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [postAsCompany, setPostAsCompany] = useState(false);
  const [body, setBody] = useState('');

  // Media attachments
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationDays, setPollDurationDays] = useState(3);

  // Article state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCover, setArticleCover] = useState('');

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (customImageUrl.trim() && imageUrls.length < 4) {
      setImageUrls([...imageUrls, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleInsertHashtag = (tag: string) => {
    setBody((prev) => (prev ? `${prev} #${tag}` : `#${tag}`));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && kind === 'text') {
      toast.error('Please enter post text');
      return;
    }

    if (kind === 'poll') {
      if (!pollQuestion.trim()) {
        toast.error('Please specify a poll question');
        return;
      }
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        toast.error('Polls require at least 2 non-empty options');
        return;
      }
    }

    let pollData: PollData | undefined = undefined;
    if (kind === 'poll') {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      pollData = {
        question: pollQuestion.trim(),
        options: validOptions.map((opt, i) => ({
          id: `opt_${i + 1}`,
          text: opt.trim(),
          votes: 0,
        })),
        total_votes: 0,
        ends_at: new Date(Date.now() + 3600 * 1000 * 24 * pollDurationDays).toISOString(),
      };
    }

    let mediaData: any = undefined;
    if (kind === 'image' && imageUrls.length > 0) {
      mediaData = { urls: imageUrls };
    } else if (kind === 'video' && videoUrl.trim()) {
      mediaData = { urls: [videoUrl.trim()] };
    } else if (kind === 'document' && documentTitle.trim()) {
      mediaData = {
        documentTitle: documentTitle.trim(),
        documentUrl: documentUrl.trim() || '#document',
      };
    }

    let finalBody = body.trim();
    if (kind === 'article' && articleTitle.trim()) {
      finalBody = `## ${articleTitle.trim()}\n\n${finalBody}`;
    }

    const tags = extractHashtags(finalBody);

    onCreatePost({
      author_id: postAsCompany && company ? company.id : author.id,
      author: postAsCompany ? undefined : author,
      company_id: postAsCompany && company ? company.id : undefined,
      company: postAsCompany && company ? company : undefined,
      body: finalBody || (kind === 'poll' ? pollQuestion : 'Shared an update'),
      kind,
      media: mediaData,
      poll: pollData,
      visibility,
      hashtags: tags,
    });

    toast.success('Post published to feed!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a post"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Author & Visibility Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={
                postAsCompany && company
                  ? company.name
                  : `${author.first_name} ${author.last_name}`
              }
              src={postAsCompany && company ? company.logo_url : author.avatar_url}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {postAsCompany && company
                    ? company.name
                    : `${author.first_name} ${author.last_name}`}
                </span>
                {company && (
                  <button
                    type="button"
                    onClick={() => setPostAsCompany(!postAsCompany)}
                    className="text-[11px] text-[#0A66C2] dark:text-[#71B7FB] font-semibold hover:underline cursor-pointer"
                  >
                    Switch to {postAsCompany ? 'Personal' : company.name}
                  </button>
                )}
              </div>

              {/* Visibility pill dropdown */}
              <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold border border-gray-300 dark:border-gray-700 rounded-full px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
                {visibility === 'public' ? (
                  <Globe className="w-3 h-3 text-gray-500" />
                ) : (
                  <Users className="w-3 h-3 text-gray-500" />
                )}
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
          </div>

          {/* Post Kind Badge */}
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40 dark:text-[#71B7FB]">
            {kind}
          </span>
        </div>

        {/* Article Mode Headline */}
        {kind === 'article' && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800">
            <input
              type="text"
              placeholder="Article Headline..."
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              className="w-full text-base font-bold bg-transparent border-b border-gray-300 dark:border-gray-700 pb-1 focus:outline-none focus:border-[#0A66C2]"
            />
            <input
              type="text"
              placeholder="Cover Image URL (optional)..."
              value={articleCover}
              onChange={(e) => setArticleCover(e.target.value)}
              className="w-full text-xs bg-transparent border-none text-gray-500 focus:outline-none"
            />
          </div>
        )}

        {/* Main Textarea */}
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === 'poll'
              ? 'Introduce your poll or background context...'
              : 'What do you want to talk about? (Tip: Use #hashtags and @mentions)'
          }
          className="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] resize-y"
        />

        {/* Multi-Image Attachment Tray */}
        {kind === 'image' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image URL (Unsplash, CDN, or web)..."
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddImage}
                disabled={imageUrls.length >= 4}
              >
                Add Image
              </Button>
            </div>

            {/* Quick Demo Image Presets */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span>Quick Presets:</span>
              <button
                type="button"
                onClick={() =>
                  setImageUrls([
                    ...imageUrls,
                    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
                  ])
                }
                className="text-[#0A66C2] hover:underline cursor-pointer"
              >
                + FinTech Chart
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() =>
                  setImageUrls([
                    ...imageUrls,
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
                  ])
                }
                className="text-[#0A66C2] hover:underline cursor-pointer"
              >
                + AI Architecture
              </button>
            </div>

            {/* Image Grid Preview */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative h-20 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 group">
                    <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Mode Input */}
        {kind === 'video' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              Video URL (MP4 / Web Video)
            </label>
            <input
              type="text"
              placeholder="https://example.com/demo.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            />
          </div>
        )}

        {/* Document Mode Input */}
        {kind === 'document' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              Document Title &amp; Link (PDF / Slide deck)
            </label>
            <input
              type="text"
              placeholder="e.g. NextStep Engineering Architecture Whitepaper.pdf"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            />
            <input
              type="text"
              placeholder="Document URL (https://...)"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            />
          </div>
        )}

        {/* Poll Mode Inputs */}
        {kind === 'poll' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Your question *
              </label>
              <input
                type="text"
                placeholder="e.g. What is your preferred state management in React 19?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Options (at least 2)
              </label>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    className="flex-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 4 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7"
                  leftIcon={<Plus className="w-3 h-3" />}
                  onClick={handleAddPollOption}
                >
                  Add Option
                </Button>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-gray-500">Poll duration:</span>
              <select
                value={pollDurationDays}
                onChange={(e) => setPollDurationDays(parseInt(e.target.value, 10))}
                className="p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Hashtag suggestions bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-gray-400 font-semibold">Suggested:</span>
          {['tech', 'careers', 'nextstep', 'softwareengineering', 'react'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleInsertHashtag(t)}
              className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40 dark:text-[#71B7FB] hover:bg-blue-100 cursor-pointer"
            >
              #{t}
            </button>
          ))}
        </div>

        {/* Media Formats Bar & Submit Action */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 gap-2">
          {/* Format switches */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setKind('image')}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                kind === 'image' ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40' : 'text-gray-500'
              }`}
              title="Add Image"
            >
              <Image className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setKind('video')}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                kind === 'video' ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40' : 'text-gray-500'
              }`}
              title="Add Video"
            >
              <Video className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setKind('poll')}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                kind === 'poll' ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40' : 'text-gray-500'
              }`}
              title="Create Poll"
            >
              <BarChart2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setKind('document')}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                kind === 'document' ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40' : 'text-gray-500'
              }`}
              title="Add Document"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setKind('article')}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                kind === 'article' ? 'bg-blue-50 text-[#0A66C2] dark:bg-blue-950/40' : 'text-gray-500'
              }`}
              title="Write Article"
            >
              <FileCode className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Post
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
