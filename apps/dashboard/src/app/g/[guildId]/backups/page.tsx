import { DatabaseBackup } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function BackupsPage() {
  return (
    <FeaturePlaceholder
      icon={DatabaseBackup}
      title="Backups"
      description="Schedule, download and restore logical backups of your configuration."
      complexity="Expert"
      capabilities={[
        'On-demand backups',
        'Scheduled automatic backups',
        'Download & restore',
        'Retention policies',
        'Encrypted at rest',
        'Backup history & status',
      ]}
    />
  );
}
