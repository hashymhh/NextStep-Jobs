import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAbout?: string;
  onSave: (about: string) => void;
}

export const EditAboutModal: React.FC<EditAboutModalProps> = ({
  isOpen,
  onClose,
  initialAbout = '',
  onSave,
}) => {
  const [about, setAbout] = useState(initialAbout);
  const MAX_CHARS = 2600;

  const handleSave = () => {
    onSave(about.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit About"
      description="You can write about your years of experience, industry, or skills. People also talk about their achievements or previous job experiences."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <textarea
            rows={8}
            maxLength={MAX_CHARS}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Write a brief overview of your professional career..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
          />
          <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
            <span>Tip: Keep it focused on your top achievements and technologies.</span>
            <span>
              {about.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
