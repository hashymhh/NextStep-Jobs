import React, { useState, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Upload, Image as ImageIcon, ZoomIn, ZoomOut, Check, Sparkles } from 'lucide-react';

export interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'avatar' | 'banner';
  currentUrl?: string;
  onSave: (url: string) => void;
}

const makeSvgAvatar = (initials: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="120" fill="${bg}"/><circle cx="120" cy="92" r="38" fill="rgba(255,255,255,0.22)"/><path d="M52 212c14-38 42-56 68-56s54 18 68 56" fill="rgba(255,255,255,0.22)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="68">${initials}</text></svg>`
  )}`;

const PRESET_AVATARS = [
  makeSvgAvatar('HT', '#0A66C2'),
  makeSvgAvatar('AS', '#057642'),
  makeSvgAvatar('BS', '#0F172A'),
  makeSvgAvatar('ZK', '#1D4ED8'),
  makeSvgAvatar('FA', '#047857'),
  makeSvgAvatar('MR', '#334155'),
];

const PRESET_BANNERS = [
  '/src/assets/images/pk_tech_campus_banner_1792823334083.jpg',
  '/src/assets/images/karachi_fintech_skyline_1792823335295.jpg',
  '/src/assets/images/islamabad_innovation_hub_1792823336979.jpg',
];

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  currentUrl,
  onSave,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || '');
  const [zoom, setZoom] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (selectedUrl) {
      onSave(selectedUrl);
      onClose();
    }
  };

  const presets = type === 'avatar' ? PRESET_AVATARS : PRESET_BANNERS;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'avatar' ? 'Change Profile Photo' : 'Edit Background Banner'}
      description="Upload a custom photo or pick a high-definition preset."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Preview Frame */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          {type === 'avatar' ? (
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md relative bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Avatar preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
          ) : (
            <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-white dark:border-gray-800 shadow-md relative bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Banner preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
          )}

          {/* Zoom Slider */}
          {selectedUrl && (
            <div className="flex items-center gap-3 mt-4 w-full max-w-xs">
              <ZoomOut className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                aria-label="Zoom level"
                min="0.8"
                max="2.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#0A66C2]"
              />
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Custom Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="secondary"
            className="w-full text-xs h-9"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image From Computer
          </Button>
        </div>

        {/* Presets Gallery */}
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Or choose from presets
          </p>
          <div className={`grid gap-2 ${type === 'avatar' ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3'}`}>
            {presets.map((preset, idx) => {
              const isSelected = selectedUrl === preset;
              return (
                <button
                  type="button"
                  key={idx}
                  aria-label={`Select preset ${idx + 1}`}
                  onClick={() => {
                    setSelectedUrl(preset);
                    setZoom(1);
                  }}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected ? 'border-[#0A66C2] scale-105 shadow-sm' : 'border-transparent hover:border-gray-300'
                  } ${type === 'avatar' ? 'h-14 w-14 rounded-full mx-auto' : 'h-16 w-full'}`}
                >
                  <img
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#0A66C2]/40 flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            disabled={!selectedUrl}
          >
            Apply Photo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
