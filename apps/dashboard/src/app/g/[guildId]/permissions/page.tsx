import { Gauge } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function PermissionsPage() {
  return (
    <FeaturePlaceholder
      icon={Gauge}
      title="Permissions"
      description="Dashboard permissions, fully separate from Discord permissions."
      complexity="Advanced"
      capabilities={[
        'Granular capability model',
        'Custom dashboard roles',
        'Per-team-member assignment',
        'Manage automod, logs, members & more',
        'Least-privilege by default',
        'Full audit trail of changes',
      ]}
    />
  );
}
