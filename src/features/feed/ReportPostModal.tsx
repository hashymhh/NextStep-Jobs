import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onReport: (postId: string, reason: string, details?: string) => void;
}

const REPORT_REASONS = [
  'Spam or misleading promotions',
  'Harassment or hate speech',
  'Misinformation or harmful claims',
  'Inappropriate or adult content',
  'Intellectual property violation',
  'Suspicious activity or fraud',
];

export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  isOpen,
  onClose,
  postId,
  onReport,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReport(postId, selectedReason, details.trim());
    setSubmitted(true);
    toast.success('Report submitted to Trust & Safety team');
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report this post"
      description="Help us maintain a safe, authentic professional community on NextStep."
      maxWidth="sm"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Thank you for helping keep NextStep safe
          </h3>
          <p className="text-xs text-gray-500">
            Our platform moderators will review this post according to our Professional Community Policies.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              Why are you reporting this post?
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-[#0A66C2] bg-blue-50/50 dark:bg-blue-950/20 font-semibold'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-[#0A66C2] focus:ring-0"
                  />
                  <span className="text-gray-800 dark:text-gray-200">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Additional Details (optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context for the review team..."
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="tertiary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
