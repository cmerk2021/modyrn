import { ListChecks } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function CasesPage() {
  return (
    <FeaturePlaceholder
      icon={ListChecks}
      title="Moderation Cases"
      description="Every moderation action creates a searchable, auditable case."
      complexity="Simple"
      capabilities={[
        'Unified case timeline with filtering',
        'Warnings, timeouts, kicks, bans & soft bans',
        'Evidence, reason history & moderator notes',
        'Appeals workflow',
        'Search, filter and export',
        'Revert and resolve actions',
      ]}
    />
  );
}
