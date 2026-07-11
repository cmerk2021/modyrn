import { RefreshCw } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function UpdatesPage() {
  return (
    <FeaturePlaceholder
      icon={RefreshCw}
      title="Updates"
      description="See what's new and keep your Modyrn instance up to date."
      complexity="Expert"
      capabilities={[
        'Current version & changelog',
        'Update availability checks',
        'Release notes',
        'One-click update guidance',
        'Version history',
        'Maintenance notifications',
      ]}
    />
  );
}
