import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Certification } from '../../types';
import { Trash2 } from 'lucide-react';

const certSchema = z.object({
  name: z.string().min(2, 'Certification name is required'),
  issuing_org: z.string().min(2, 'Issuing organization is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiration_date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type CertFormData = z.infer<typeof certSchema>;

export interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification?: Certification | null;
  onSave: (cert: Omit<Certification, 'id' | 'profile_id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

export const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  certification,
  onSave,
  onDelete,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertFormData>({
    resolver: zodResolver(certSchema),
    defaultValues: {
      name: certification?.name || '',
      issuing_org: certification?.issuing_org || '',
      issue_date: certification?.issue_date || '2023-01-01',
      expiration_date: certification?.expiration_date || '',
      credential_id: certification?.credential_id || '',
      credential_url: certification?.credential_url || '',
    },
  });

  const onSubmit = (data: CertFormData) => {
    onSave({
      id: certification?.id,
      name: data.name,
      issuing_org: data.issuing_org,
      issue_date: data.issue_date,
      expiration_date: data.expiration_date || undefined,
      credential_id: data.credential_id || undefined,
      credential_url: data.credential_url || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={certification ? 'Edit License / Certification' : 'Add License or Certification'}
      description="Showcase your verified technical certifications and credentials."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name *"
          placeholder="e.g. AWS Certified Solutions Architect"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Issuing Organization *"
          placeholder="e.g. Amazon Web Services or Google Cloud"
          {...register('issuing_org')}
          error={errors.issuing_org?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Issue Date *"
            type="date"
            {...register('issue_date')}
            error={errors.issue_date?.message}
          />
          <Input
            label="Expiration Date"
            type="date"
            {...register('expiration_date')}
          />
        </div>

        <Input
          label="Credential ID"
          placeholder="e.g. AWS-SEC-92048"
          {...register('credential_id')}
        />

        <Input
          label="Credential URL"
          placeholder="https://credential-provider.com/verify/..."
          {...register('credential_url')}
          error={errors.credential_url?.message}
        />

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {certification && onDelete ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onDelete(certification.id);
                onClose();
              }}
            >
              Delete Certification
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="tertiary" type="button" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
