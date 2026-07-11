import { Settings } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function SettingsPage() {
  return (
    <FeaturePlaceholder
      icon={Settings}
      title="Settings"
      description="Guild-wide platform configuration, including complexity mode."
      complexity="Simple"
      capabilities={[
        'Progressive complexity: Simple / Advanced / Expert',
        'Default moderation log channel',
        'Timezone & locale',
        'DM-on-action behavior',
        'Module toggles',
        'Danger zone: disconnect & reset',
      ]}
    />
  );
}
