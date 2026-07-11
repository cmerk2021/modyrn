import { Wrench } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function UtilityPage() {
  return (
    <FeaturePlaceholder
      icon={Wrench}
      title="Utility"
      description="Community quality-of-life modules, all configured from the dashboard."
      complexity="Simple"
      capabilities={[
        'Reaction, button & select-menu roles',
        'Welcome & leave messages',
        'Starboard & suggestions',
        'Sticky messages & temp voice channels',
        'Reminders, polls & scheduled messages',
        'Server statistics channels',
      ]}
    />
  );
}
