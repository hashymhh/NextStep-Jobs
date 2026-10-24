import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Profile } from '../../types';
import { Mail, Phone, Globe, Github, Twitter, Copy, Check, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  isOwner?: boolean;
  onEditIntro?: () => void;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  profile,
  isOwner = false,
  onEditIntro,
}) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/in/${profile.handle}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Profile URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${profile.first_name} ${profile.last_name}`}
      description="Contact Information"
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Profile Link */}
        <div className="flex items-start gap-3">
          <LinkIcon className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-white">Your Profile</p>
            <p className="text-gray-500 text-xs truncate">{profileUrl}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs shrink-0"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyLink}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Email</p>
            <a
              href={`mailto:${profile.email}`}
              className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline"
            >
              {profile.email}
            </a>
          </div>
        </div>

        {/* Phone */}
        {profile.phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Phone</p>
              <p className="text-gray-700 dark:text-gray-300">{profile.phone}</p>
            </div>
          </div>
        )}

        {/* Website */}
        {profile.website && (
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 dark:text-white">Website</p>
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline flex items-center gap-1 truncate"
              >
                <span>{profile.website}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* GitHub */}
        {profile.github_url && (
          <div className="flex items-start gap-3">
            <Github className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 dark:text-white">GitHub</p>
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline flex items-center gap-1 truncate"
              >
                <span>{profile.github_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Twitter */}
        {profile.twitter_url && (
          <div className="flex items-start gap-3">
            <Twitter className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 dark:text-white">X / Twitter</p>
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#0A66C2] dark:text-[#71B7FB] hover:underline flex items-center gap-1 truncate"
              >
                <span>{profile.twitter_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {isOwner && onEditIntro && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onEditIntro();
              }}
            >
              Edit Contact Info
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
