import { BarChart3 } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function AnalyticsPage() {
  return (
    <FeaturePlaceholder
      icon={BarChart3}
      title="Analytics"
      description="Understand growth, activity and moderation trends over time."
      complexity="Expert"
      capabilities={[
        'Member growth, joins & leaves',
        'Moderator activity & punishments',
        'Automod event trends',
        'Message volume & top channels',
        'Server health over time',
        'Exportable reports',
      ]}
    />
  );
}
