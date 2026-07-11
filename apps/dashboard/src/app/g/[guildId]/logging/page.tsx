import { FileText } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function LoggingPage() {
  return (
    <FeaturePlaceholder
      icon={FileText}
      title="Logging"
      description="Enable and route every event type independently."
      complexity="Simple"
      capabilities={[
        'Message edits, deletes & bulk deletes',
        'Role, nickname & member changes',
        'Voice, thread & forum activity',
        'Joins, leaves & boosts',
        'Automod & audit log events',
        'Per-event channel and webhook routing',
      ]}
    />
  );
}
