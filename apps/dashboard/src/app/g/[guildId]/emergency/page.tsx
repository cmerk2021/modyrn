import { AlertTriangle } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function EmergencyPage() {
  return (
    <FeaturePlaceholder
      icon={AlertTriangle}
      title="Emergency Center"
      description="One-click, high-impact safety actions when every second counts."
      complexity="Expert"
      capabilities={[
        'Raid mode & chat freeze',
        'Server and channel lockdown',
        'Slowmode controls',
        'Invite restrictions',
        'Mass quarantine, kick & ban',
        'Emergency announcements & logging',
      ]}
    />
  );
}
