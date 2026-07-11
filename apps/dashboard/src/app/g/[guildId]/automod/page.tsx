import { ShieldCheck } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function AutomodPage() {
  return (
    <FeaturePlaceholder
      icon={ShieldCheck}
      title="Automod"
      description="Presets for beginners; a visual IF / AND / THEN rule builder for experts."
      complexity="Simple"
      capabilities={[
        'Spam, mentions, caps, emoji & invite detection',
        'Word, regex, nickname & username filters',
        'Whitelist / blacklist link modes',
        'Visual rule builder with nested conditions',
        'Priorities, exemptions and simulation',
        'Raid detection & join screening',
      ]}
    />
  );
}
