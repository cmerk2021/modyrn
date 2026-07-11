import { Users } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function MembersPage() {
  return (
    <FeaturePlaceholder
      icon={Users}
      title="Member Explorer"
      description="Fast search, filtering and bulk moderation with rich member profiles."
      complexity="Simple"
      capabilities={[
        'Instant search and advanced filtering',
        'Roles, permissions, join date & account age',
        'Full case, warning and timeout history',
        'Moderator notes and recent activity',
        'Warn, timeout, kick, ban, quarantine & DM',
        'Bulk actions across selected members',
      ]}
    />
  );
}
